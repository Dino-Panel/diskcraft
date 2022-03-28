module.exports = function (config) {
  return {
    domain: {
      $: { type: "kvm" },
      name: [config.name],
      memory: [{ _: config.ramGb * 1048576, $: { unit: "KiB" } }],
      currentMemory: [{ _: config.ramGb * 1048576, $: { unit: "KiB" } }],
      vcpu: [{ _: config.cpuCores, $: { placement: "static" } }],
      os: [
        {
          type: [{ _: "hvm", $: { arch: "x86_64", machine: "pc-q35-4.2" } }],
          bootmenu: [{ $: { enable: "yes" } }],
        },
      ],
      features: [
        {
          acpi: [""],
          apic: [""],
          hyperv: [
            {
              relaxed: [{ $: { state: "on" } }],
              vapic: [{ $: { state: "on" } }],
              spinlocks: [{ $: { state: "on", retries: "8191" } }],
            },
          ],
          vmport: [{ $: { state: "off" } }],
        },
      ],
      cpu: [{ $: { mode: "host-model", check: "partial" } }],
      clock: [
        {
          $: { offset: "localtime" },
          timer: [
            { $: { name: "rtc", tickpolicy: "catchup" } },
            { $: { name: "pit", tickpolicy: "delay" } },
            { $: { name: "hpet", present: "no" } },
            { $: { name: "hypervclock", present: "yes" } },
          ],
        },
      ],
      on_poweroff: ["destroy"],
      on_reboot: ["restart"],
      on_crash: ["destroy"],
      pm: [
        {
          "suspend-to-mem": [{ $: { enabled: "no" } }],
          "suspend-to-disk": [{ $: { enabled: "no" } }],
        },
      ],
      devices: [
        {
          emulator: ["/usr/bin/qemu-system-x86_64"],
          disk: [
            {
              $: { type: "file", device: "disk" },
              driver: [{ $: { name: "qemu", type: "qcow2" } }],
              source: [
                {
                  $: {
                    file: `/var/lib/libvirt/images/${config.name}.qcow2`,
                  },
                },
              ],
              target: [{ $: { dev: "sda", bus: "sata" } }],
              boot: [{ $: { order: "2" } }],
              address: [
                {
                  $: {
                    type: "drive",
                    controller: "0",
                    bus: "0",
                    target: "0",
                    unit: "0",
                  },
                },
              ],
            },
            {
              $: { type: "file", device: "cdrom" },
              driver: [{ $: { name: "qemu", type: "raw" } }],
              source: [
                { $: { file: `/var/cloudinit/configs/${config.name}.img` } },
              ],
              target: [{ $: { dev: "sdb", bus: "sata" } }],
              readonly: [""],
              boot: [{ $: { order: "1" } }],
              address: [
                {
                  $: {
                    type: "drive",
                    controller: "0",
                    bus: "0",
                    target: "0",
                    unit: "1",
                  },
                },
              ],
            },
          ],
          controller: [
            {
              $: { type: "usb", index: "0", model: "qemu-xhci", ports: "15" },
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x02",
                    slot: "0x00",
                    function: "0x0",
                  },
                },
              ],
            },
            {
              $: { type: "sata", index: "0" },
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x00",
                    slot: "0x1f",
                    function: "0x2",
                  },
                },
              ],
            },
            { $: { type: "pci", index: "0", model: "pcie-root" } },
            {
              $: { type: "pci", index: "1", model: "pcie-root-port" },
              model: [{ $: { name: "pcie-root-port" } }],
              target: [{ $: { chassis: "1", port: "0x10" } }],
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x00",
                    slot: "0x02",
                    function: "0x0",
                    multifunction: "on",
                  },
                },
              ],
            },
            {
              $: { type: "pci", index: "2", model: "pcie-root-port" },
              model: [{ $: { name: "pcie-root-port" } }],
              target: [{ $: { chassis: "2", port: "0x11" } }],
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x00",
                    slot: "0x02",
                    function: "0x1",
                  },
                },
              ],
            },
            {
              $: { type: "pci", index: "3", model: "pcie-root-port" },
              model: [{ $: { name: "pcie-root-port" } }],
              target: [{ $: { chassis: "3", port: "0x12" } }],
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x00",
                    slot: "0x02",
                    function: "0x2",
                  },
                },
              ],
            },
            {
              $: { type: "pci", index: "4", model: "pcie-root-port" },
              model: [{ $: { name: "pcie-root-port" } }],
              target: [{ $: { chassis: "4", port: "0x13" } }],
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x00",
                    slot: "0x02",
                    function: "0x3",
                  },
                },
              ],
            },
            {
              $: { type: "pci", index: "5", model: "pcie-root-port" },
              model: [{ $: { name: "pcie-root-port" } }],
              target: [{ $: { chassis: "5", port: "0x14" } }],
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x00",
                    slot: "0x02",
                    function: "0x4",
                  },
                },
              ],
            },
            {
              $: { type: "virtio-serial", index: "0" },
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x03",
                    slot: "0x00",
                    function: "0x0",
                  },
                },
              ],
            },
          ],
          interface: [
            {
              $: { type: "network" },
              mac: [{ $: { address: config.network.interface_mac_addr } }],
              source: [{ $: { network: config.network.interface_network } }],
              model: [{ $: { type: "virtio" } }],
              link: [{ $: { state: "up" } }],
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x01",
                    slot: "0x00",
                    function: "0x0",
                  },
                },
              ],
            },
          ],
          channel: [
            {
              $: { type: "spicevmc" },
              target: [{ $: { type: "virtio", name: "com.redhat.spice.0" } }],
              address: [
                {
                  $: {
                    type: "virtio-serial",
                    controller: "0",
                    bus: "0",
                    port: "1",
                  },
                },
              ],
            },
          ],
          input: [
            {
              $: { type: "tablet", bus: "usb" },
              address: [{ $: { type: "usb", bus: "0", port: "1" } }],
            },
            { $: { type: "mouse", bus: "ps2" } },
            { $: { type: "keyboard", bus: "ps2" } },
          ],
          graphics: [
            {
              $: { type: "spice", autoport: "yes" },
              listen: [{ $: { type: "address" } }],
              image: [{ $: { compression: "off" } }],
            },
            {
              $: {
                type: "vnc",
                port: config.vncPort,
                autoport: "no",
                listen: "0.0.0.0",
                passwd: config.vncPassword,
              },
              listen: [{ $: { type: "address", address: "0.0.0.0" } }],
            },
          ],
          sound: [
            {
              $: { model: "ich9" },
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x00",
                    slot: "0x1b",
                    function: "0x0",
                  },
                },
              ],
            },
          ],
          video: [
            {
              model: [
                {
                  $: {
                    type: "qxl",
                    ram: "65536",
                    vram: "65536",
                    vgamem: "16384",
                    heads: "1",
                    primary: "yes",
                  },
                },
              ],
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x00",
                    slot: "0x01",
                    function: "0x0",
                  },
                },
              ],
            },
          ],
          memballoon: [
            {
              $: { model: "virtio" },
              address: [
                {
                  $: {
                    type: "pci",
                    domain: "0x0000",
                    bus: "0x04",
                    slot: "0x00",
                    function: "0x0",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };
};
