const fs = require("fs");
var parseString = require("xml2js").parseString;
var xml2js = require("xml2js");
var builder = new xml2js.Builder();
const { exec } = require("child_process");

function get_network_speed_kbps(net_name) {
  return new Promise((res) => {
    var config_file_path = `/etc/libvirt/qemu/networks/${net_name}.xml`;
    var config_file = fs.readFileSync(config_file_path, "utf-8");

    parseString(config_file, function (err, result) {
      var current_network_speed =
        result.network.bandwidth[0].inbound[0]["$"].average;
      res(current_network_speed);
    });
  });
}

function get_network_config(net_name) {
  return new Promise((res) => {
    var config_file_path = `/etc/libvirt/qemu/networks/${net_name}.xml`;
    var config_file = fs.readFileSync(config_file_path, "utf-8");

    parseString(config_file, async function (err, result) {
      res(result.network.ip);
    });
  });
}

function set_network_speed_kbps(net_name, new_kbps) {
  return new Promise((res) => {
    var config_file_path = `/etc/libvirt/qemu/networks/${net_name}.xml`;
    var config_file = fs.readFileSync(config_file_path, "utf-8");

    parseString(config_file, async function (err, result) {
      result.network.bandwidth[0].inbound[0]["$"].average = new_kbps;
      result.network.bandwidth[0].inbound[0]["$"].peak =
        new_kbps + Math.round((new_kbps / 100) * 10);
      result.network.bandwidth[0].inbound[0]["$"].burst =
        new_kbps + Math.round((new_kbps / 100) * 25);

      result.network.bandwidth[0].outbound[0]["$"].average = new_kbps;
      result.network.bandwidth[0].outbound[0]["$"].peak =
        new_kbps + Math.round((new_kbps / 100) * 10);
      result.network.bandwidth[0].outbound[0]["$"].burst =
        new_kbps + Math.round((new_kbps / 100) * 25);

      var xml_out = builder.buildObject(result);

      fs.writeFileSync(config_file_path, xml_out);

      res();
    });
  });
}

function reload_network(net_name) {
  return new Promise(async (res) => {
    try {
      await run_cmd(`virsh net-destroy ${net_name}`);
    } catch (e) {}
    await sleep(150);
    await run_cmd(
      `virsh net-define /etc/libvirt/qemu/networks/${net_name}.xml`
    );
    await sleep(150);
    try {
      await run_cmd(`virsh net-start ${net_name}`);
    } catch (e) {}
    await sleep(150);
    try {
      await run_cmd(`virsh net-start ${net_name}`, false);
    } catch (e) {}
    await sleep(150);
    res();
  });
}

// async function run() {
//   console.log(await set_network_speed_kbps("net-1", 28000));
// }

module.exports.set_network_speed_kbps = set_network_speed_kbps;
module.exports.get_network_config = get_network_config;
module.exports.reload_network = reload_network;

function sleep(timeout) {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, timeout);
  });
}

function run_cmd(cmd, log_error = true) {
  return new Promise((res) => {
    exec(cmd, (error, stdout, stderr) => {
      if (stderr && log_error == true) console.log(stderr);
      res();
    });
  });
}
