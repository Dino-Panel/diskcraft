var fs = require("fs");
const { exec } = require("child_process");
var parseString = require("xml2js").parseString;
var xml2js = require("xml2js");
var builder = new xml2js.Builder();
const iptables = require("./iptables");
const qemu_net = require("./qemu-network");
const sock = require("./sock");

var qemuDetected = true;

var qemu_create = require("./qemu-create-functions");

//only parameters that need to be touched - aka don't fucking change anything else
var qemu_vm_config_folder = "/etc/libvirt/qemu/";
var qemu_networks_config_folder = "/etc/libvirt/qemu/networks/";
var qemu_iso_installable = "/iso/";
var qemu_checkInterval = 1000; // in ms

//storage items
var prevDomainsParsed = [];
var cpuStats = [];

var prev_cpuStats = [];

setInterval(() => {
  if (prev_cpuStats != cpuStats) {
    sock.write_to_all(
      JSON.stringify({
        data_identifier: `qemu0`,
        data: cpuStats,
      })
    );
  }
  prev_cpuStats = cpuStats;
  runVirshDomstats();
}, qemu_checkInterval);

function getQemuStatistics() {
  return cpuStats;
}

function runVirshDomstats() {
  if (qemuDetected == true) {
    const ls = exec("virsh domstats", function (error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log("Error code: " + error.code);
        if (error.code == 127) {
          qemuDetected = false;
        }
        console.log("Signal received: " + error.signal);
      }
      if (stderr == "") {
        virshDomstatResultParser(stdout);
      } else {
        if (stderr == "/bin/sh: 1: virsh: not found") {
          qemuDetected = false;
        }
        console.log("Child Process STDERR: " + stderr);
      }
    });
  } else {
    cpuStats = [];
    prevDomainsParsed = [];
  }
}

function virshDomstatResultParser(stdout) {
  var domains = stdout.split("Domain:");
  var domainsParsed = [];
  for (domain in domains) {
    if (domain != 0) {
      var diskWriteTotal = 0;
      var diskReadTotal = 0;
      var cpuTimes = [];
      var cpuTimeSum = 0;
      var netInTotal = 0;
      var netOutTotal = 0;

      var domainInfo = domains[domain].split(" ").join("");
      var infoStrings = domainInfo.split("\n");
      var name = infoStrings[0];

      //disk
      var disks = infoStrings.filter((v) => v.includes("block"));
      var writeBytes = disks.filter((v) => v.includes("wr.bytes"));
      var readBytes = disks.filter((v) => v.includes("rd.bytes"));

      for (writeByte of writeBytes) {
        diskWriteTotal = diskWriteTotal + parseInt(writeByte.split("=")[1]);
      }
      for (readByte of readBytes) {
        diskReadTotal = diskReadTotal + parseInt(readByte.split("=")[1]);
      }

      //network
      var nets = infoStrings.filter((v) => v.includes("net."));
      var netIns = nets.filter((v) => v.includes("tx.bytes"));
      var netOuts = nets.filter((v) => v.includes("rx.bytes"));
      for (netIn of netIns) {
        netInTotal = netInTotal + parseInt(netIn.split("=")[1]);
      }
      for (netOut of netOuts) {
        netOutTotal = netOutTotal + parseInt(netOut.split("=")[1]);
      }
      

      //cpu
      var cpus = infoStrings.filter((v) => v.includes("vcpu"));
      var cpuTimesRaw = cpus.filter((v) => v.includes("time="));
      for (cpuTime in cpuTimesRaw) {
        cpuTimes.push(
          cpuTimesRaw[cpuTime].replace(`vcpu.${cpuTime}.time=`, "")
        );
        cpuTimeSum =
          cpuTimeSum +
          parseInt(cpuTimesRaw[cpuTime].replace(`vcpu.${cpuTime}.time=`, ""));
      }
      domainsParsed.push({
        name: name,
        cpu_time: cpuTimeSum,
        coreCount: cpuTimesRaw.length,
        netIn: netInTotal,
        netOut: netOutTotal,
        diskWrite: diskWriteTotal,
        diskRead: diskReadTotal,
      });
    }
  }
  var cpuArr = [];
  for (var domain of prevDomainsParsed) {
    var currentDomain = domainsParsed.find((d) => d.name == domain.name);
    if (currentDomain && domain) {
      var cpu_time_calc = currentDomain.cpu_time - domain.cpu_time;
      //console.log(domain.coreCount);
      var cpu = cpu_time_calc / (qemu_checkInterval * 10000 * domain.coreCount);

      var netIn = currentDomain.netIn - domain.netIn;
      var netOut = currentDomain.netOut - domain.netOut;

      var diskRead = currentDomain.diskRead - domain.diskRead;
      var diskWrite = currentDomain.diskWrite - domain.diskWrite;

      cpu = cpu - 2;
      if (cpu > 100) cpu = 100;
      if (cpu < 0) cpu = 0;
      cpuArr.push({
        name: currentDomain.name.split("'").join(""),
        cpu: cpu || 0,
        netIn: netIn,
        netOut: netOut,
        diskRead: diskRead,
        diskWrite: diskWrite,
      });
    }
  }
  cpuStats = cpuArr;
  prevDomainsParsed = domainsParsed;
}

function getQemuVmConfigs() {
  return new Promise((res) => {
    fs.readdir(qemu_vm_config_folder, (err, files) => {
      res(files);
    });
  });
}

function deleteQemuVm(name) {
  return new Promise(async (res, rej) => {
    await run_cmd(`rm -f /var/cloudinit/configs/${name}.*`);

    exec(`virsh undefine ${name}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        rej(error.message);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        rej(stderr);
        return;
      }
      console.log(stdout);

      exec(`pm2 delete VNC-${name}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          rej(error.message);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          rej(stderr);
          return;
        }

        exec(
          `rm /var/lib/libvirt/images/${name}.qcow2 -f`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`error: ${error.message}`);
              rej(error.message);
              return;
            }
            if (stderr) {
              console.error(`stderr: ${stderr}`);
              rej(stderr);
              return;
            }
            res("OK");
          }
        );
      });
    });
  });
}

function updateQemuVm(fileName, body) {
  return new Promise((res) => {
    var xml = builder.buildObject(body);
    fs.writeFile(`${qemu_vm_config_folder}${fileName}`, xml, function (err) {
      if (err) return res(err);
      exec(
        `virsh define ${qemu_vm_config_folder}${fileName}`,
        (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
          }
          res("OK");
        }
      );
    });
  });
}

function getQemuVm(fileName) {
  return new Promise((res) => {
    fs.readFile(`${qemu_vm_config_folder}${fileName}`, "utf8", (err, data) => {
      if (err) {
        res(err);
        return;
      }
      parseString(data, function (err, result) {
        res(result);
      });
    });
  });
}

function getInstallableIsos() {
  return new Promise((res) => {
    fs.readdir(qemu_iso_installable, (err, files) => {
      res(files);
    });
  });
}

function reinstallQemuVm(name, cloudinit_img, disk_size) {
  return new Promise(async (res) => {
    try {
      await run_cmd(`virsh destroy ${name}`);
    } catch (e) {}
    var vm_config = fs.readFileSync(`/etc/libvirt/qemu/${name}.xml`, "utf-8");
    await run_cmd(`virsh undefine ${name}`);
    vm_config = await xml2js.parseStringPromise(vm_config);

    var cdRom = vm_config.domain.devices[0].disk.find((disk) => {
      return disk["$"].device == "cdrom";
    });
    cdRom.source[0]["$"].file = `/var/cloudinit/configs/${name}.img`;

    var vm_xml = builder.buildObject(vm_config);

    fs.writeFileSync(`/etc/libvirt/qemu/${name}.xml`, vm_xml);
    await run_cmd(`virsh define /etc/libvirt/qemu/${name}.xml`);

    await run_cmd(`rm -f /var/lib/libvirt/images/${name}.*`);
    await run_cmd(`rm -f /var/cloudinit/configs/${name}.img`);
    console.log(`[${name}] Removed old Cloud-Init installer`);
    await run_cmd(
      `qemu-img convert -f qcow2 -O qcow2 /var/cloudinit/images/${cloudinit_img}.img /var/lib/libvirt/images/${name}.qcow2`
    );
    console.log(`[${name}] Created new drive image`);
    await run_cmd(
      `cloud-localds /var/cloudinit/configs/${name}.img /var/cloudinit/configs/${name}.txt`
    );
    console.log(`[${name}] Created new Cloud-Init installer`);
    await run_cmd(
      `qemu-img resize /var/lib/libvirt/images/${name}.qcow2 ${disk_size}G`
    );
    console.log(`[${name}] Formatted drive image`);

    await run_cmd(`virsh start ${name}`);
    res();
  });
}

function createQemuVm(config) {
  return new Promise(async (res, rej) => {
    var machine_promise = qemu_create.setup_virtual_machine(config);
    await machine_promise;
    finish_qemu_install(config);

    res();
  });
}

function finish_qemu_install(config) {
  return new Promise(async (res) => {
    var network_promise = qemu_create.setup_libvirt_network(config);
    var cloud_init_promise = qemu_create.setup_cloud_init(config);
    var disk_promise = qemu_create.setup_diskdrive(config);
    var novnc_promise = qemu_create.setup_novnc(config);

    await Promise.all([
      network_promise,
      cloud_init_promise,
      disk_promise,
      novnc_promise,
    ]);

    await run_cmd(`virsh start ${config.name}`);
    await qemu_create.setup_cleanup(config);
    res();
  });
}

function sleep(timeout) {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, timeout);
  });
}

function run_cmd(cmd) {
  return new Promise((res) => {
    exec(cmd, (error, stdout, stderr) => {
      if (stderr) console.log(stderr);
      res();
    });
  });
}

module.exports.qemuStats = getQemuStatistics;
module.exports.getQemuVmConfigs = getQemuVmConfigs;
module.exports.deleteQemuVm = deleteQemuVm;
module.exports.updateQemuVm = updateQemuVm;
module.exports.getQemuVm = getQemuVm;
module.exports.getInstallableIsos = getInstallableIsos;
module.exports.createQemuVm = createQemuVm;
module.exports.reinstallQemuVm = reinstallQemuVm;
