//iptables -I FORWARD -o virbr6 -d 10.0.6.2 -j ACCEPT

const { exec } = require("child_process");
const fs = require("fs");
var parseString = require("xml2js").parseString;

var networks_folder = `/etc/libvirt/qemu/networks/`;

function create_qemu_network(subnet_prefix_6) {
  return new Promise(async (res) => {
    var new_net_id = get_higest_net_name() + 1;
    var net_file_name = `net-${new_net_id}.xml`;
    var net_name = `net-${new_net_id}`;
    var net_full_path = `${networks_folder}${net_file_name}`;

    var file_structure = build_file_structure(
      new_net_id,
      new_net_id,
      subnet_prefix_6
    );

    fs.writeFileSync(net_full_path, file_structure);
    await run_cmd(`virsh net-define ${net_full_path}`);
    await run_cmd(`virsh net-start ${net_name}`);
    await sleep(1000);

    var net_config = read_config_file(net_name);

    parseString(net_config, async function (err, config) {
      var net_interface = config.network.bridge[0]["$"].name;

      await run_cmd(
        `iptables -I FORWARD -o ${net_interface} -d 10.0.${new_net_id}.2 -j ACCEPT`
      );

      res("OK");
    });
  });
}

function read_config_file(net_name) {
  return fs.readFileSync(`${networks_folder}/${net_name}.xml`, "utf-8");
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
      res();
    });
  });
}

function get_higest_net_name() {
  var files = fs.readdirSync(networks_folder);
  var net_files = files.filter((f) => f.includes("net-"));
  var net_numbers = net_files.map((f) =>
    f.replace("net-", "").replace(".xml", "")
  );
  return Math.max(...net_numbers);
}

function build_file_structure(net_number, ipv4_net, ipv6_net) {
  return `<network>
    <name>net-${net_number}</name>
    <forward dev='enp41s0' mode='nat'>
      <interface dev='enp41s0'/>
    </forward>
    <domain name='diskos.net'/>
    <bandwidth>
      <inbound average='28000' peak='30800' burst='35000'/>
      <outbound average='28000' peak='30800' burst='35000'/>
    </bandwidth>
    <ip address='10.0.${ipv4_net}.1' netmask='255.255.255.252'>
      <dhcp>
        <range start='10.0.${ipv4_net}.2' end='10.0.${ipv4_net}.2'/>
      </dhcp>
    </ip>
    <ip family='ipv6' address='${ipv6_net}::1' prefix='76'>
      <dhcp>
        <range start='${ipv6_net}::100' end='${ipv6_net}::100'/>
      </dhcp>
    </ip>
  </network>`;
}

async function run() {
  //   await create_qemu_network(`2a01:4f8:271:59ca:80d0`);
  //   await create_qemu_network(`2a01:4f8:271:59ca:80e0`);
  //   await create_qemu_network(`2a01:4f8:271:59ca:80f0`);
}
run();
