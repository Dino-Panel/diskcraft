const qemu_net = require("./qemu-network");
var fs = require("fs");
const { exec } = require("child_process");
var parseString = require("xml2js").parseString;
var xml2js = require("xml2js");
var builder = new xml2js.Builder();
var qemuVmBase = require("./qemu-vm-base");

var qemu_vm_config_folder = "/etc/libvirt/qemu/";
var qemu_networks_config_folder = "/etc/libvirt/qemu/networks/";
var qemu_iso_installable = "/iso/";
var qemu_checkInterval = 1000; // in ms

function setup_cloud_init(config) {
  return new Promise(async (res) => {
    var network_config = await qemu_net.get_network_config(
      config.network.interface_network
    );

    var gateway4 = network_config[0]["$"].address;
    var gateway6 = network_config[1]["$"].address;

    var cloud_config_file = `#cloud-config
    config_drive: true
    hostname: ${config.name}
    
    chpasswd:
      list: |
        root:${config.cloudinit_password}
        diskosadmin:D!sk0$Host!n9
      expire: False
    
    write_files:
      - path: /etc/ssh/sshd_config
        content: |
          PermitRootLogin yes
          PasswordAuthentication yes
          ChallengeResponseAuthentication no
          UsePAM yes
          X11Forwarding yes
          PrintMotd no
          AcceptEnv LANG LC_*
          Subsystem sftp  /usr/lib/openssh/sftp-server
      - path: /etc/netplan/50-cloud-init.yaml
        content: |
          network:
              ethernets:
                  enp1s0:
                      addresses:
                        - ${config.network.ipv4_address}/30
                        - ${config.network.ipv6_address}/128
                      gateway6: ${gateway6}
                      gateway4: ${gateway4}
                      nameservers:
                          addresses: [8.8.8.8, 8.8.4.4]
                      match:
                          macaddress: ${config.network.interface_mac_addr}
                      set-name: enp1s0
              version: 2
    
    bootcmd:
      - netplan apply
      - dhclient
      - ip link set dev enp1s0 up
      - ip address add ${config.network.ipv4_address}/30 dev enp1s0
      - ip route add default via ${gateway4}
      - cloud-init --debug single --name phone_home
    
    network:
      ethernets:
        enp1s0:
          addresses:
            - ${config.network.ipv4_address}/30
            - ${config.network.ipv6_address}/128
          gateway6: ${gateway6}
          gateway4: ${gateway4}
          nameservers:
            addresses: [8.8.8.8, 8.8.4.4]
          match:
            macaddress: ${config.network.interface_mac_addr}
          set-name: enp1s0
      version: 2
    
    phone_home:
      url: https://panel.diskos.net/api/finish-vps-install/${config.name}
      post: all
      tries: 150
    
    final_message: "The system is finally up, after $UPTIME seconds"
    ssh_pwauth: True
    disable_root: false
    package_update: true
    package_upgrade: true
    packages:
      - qemu-guest-agent
      - net-tools
      - zsh
      - tmux
      - nmap
      - curl
      - wget
      - git
      - htop
      - iperf
      - fail2ban
      - vim
      - ifupdown
    `;

    fs.writeFileSync(
      `/var/cloudinit/configs/${config.name}.txt`,
      cloud_config_file
    );

    await run_cmd(
      `cloud-localds /var/cloudinit/configs/${config.name}.img /var/cloudinit/configs/${config.name}.txt`
    );

    console.log(`[${config.name}] cloud-init setup completed`);
    res();
  });
}

function setup_libvirt_network(config) {
  return new Promise(async (res) => {
    await qemu_net.set_network_speed_kbps(
      config.network.interface_network,
      config.network.net_io_speed || 28000
    );
    await sleep(250);
    await clear_libvirt_network(
      config.network.interface_network,
      config.network.interface_hypervisor
    );
    await sleep(500);
    await qemu_net.reload_network(config.network.interface_network);
    await sleep(250);
    console.log(`[${config.name}] network setup completed`);
    res();
  });
}

function setup_diskdrive(config) {
  return new Promise(async (res) => {
    await run_cmd(
      `qemu-img convert -f qcow2 -O qcow2 /var/cloudinit/images/ubuntu_live_server_2104.img /var/lib/libvirt/images/${config.name}.qcow2`
    );
    await run_cmd(
      `qemu-img resize /var/lib/libvirt/images/${config.name}.qcow2 ${config.diskSize}G`
    );

    console.log(`[${config.name}] disk setup completed`);
    res();
  });
}

function setup_cleanup(config) {
  return new Promise(async (res) => {
    //await run_cmd(`rm /var/cloudinit/configs/${config.name}.txt`);
    console.log(`[${config.name}] cleanup completed`);
    res();
  });
}

function setup_novnc(config) {
  return new Promise(async (res) => {
    await run_cmd(
      `pm2 start --name "VNC-${config.name}" /var/www/noVNC/utils/launch.sh -- --vnc ${config.vncServer}:${config.vncPort} --listen ${config.noVncPort}`
    );
    console.log(`[${config.name}] novnc setup completed`);
    res();
  });
}

function setup_virtual_machine(config) {
  return new Promise(async (res) => {
    var machineJson = qemuVmBase(config);

    var xml = builder.buildObject(machineJson);
    fs.writeFileSync(`${qemu_vm_config_folder}${config.name}.xml`, xml);
    await run_cmd(`virsh define /etc/libvirt/qemu/${config.name}.xml`);
    await run_cmd(`virsh define /etc/libvirt/qemu/${config.name}.xml`);
    console.log(`[${config.name}] virtual machine setup completed`);
    res();
  });
}

module.exports.setup_cloud_init = setup_cloud_init;
module.exports.setup_libvirt_network = setup_libvirt_network;
module.exports.setup_diskdrive = setup_diskdrive;
module.exports.setup_novnc = setup_novnc;
module.exports.setup_virtual_machine = setup_virtual_machine;
module.exports.setup_cleanup = setup_cleanup;

function clear_libvirt_network(name, net_interface) {
  return new Promise(async (res) => {
    await run_cmd(`rm /var/lib/libvirt/dnsmasq/${net_interface}.*`);
    await sleep(250);
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
