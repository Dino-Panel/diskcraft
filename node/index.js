const express = require("express");
const app = express();
const port = 12645;
app.use(express.json());

const dockerStatistics = require("./docker");
const qemu = require("./qemu");
const iptables = require("./iptables");

app.get("/status", async (req, res) => {
  res.json({
    uptime: process.uptime(),
    version: "1.0.0.4",
    copyright: "Diskos 2021",
  });
  console.log(`status`);
});

//IPTABLES IP FORWARDING - GET + POST
app.get("/iptables/list", async (req, res) => {
  res.json(await iptables.list_forward_rules());
  console.log(`iptables/list`);
});

app.get("/iptables/deleteip/:ip", async (req, res) => {
  res.json(await iptables.delete_all_rules_assigned_to_ip(req.params.ip));
  console.log(`iptables/deleteip/${req.params.ip}`);
});

app.get("/iptables/delete/:public_port", async (req, res) => {
  if (req.params.public_port == (null || undefined)) {
    res.sendStatus(404);
  } else {
    res.json(await iptables.delete_forward_rule(req.params.public_port));
    console.log(`iptables/delete/${req.params.public_port}`);
  }
});

app.get("/iptables/create/:private_ip/:private_port", async (req, res) => {
  res.json(
    await iptables.create_forward_rule(
      req.params.private_ip,
      req.params.private_port,
      await iptables.find_free_port()
    )
  );
  console.log(
    `iptables/create/${req.params.private_ip}/${req.params.private_port}`
  );
});

//STATISTICS QEMU + DOCKER/PTERODACTYL (GET)
app.get("/docker/statistics", async (req, res) => {
  res.json(dockerStatistics());
  console.log(`docker/statistics`);
});

app.get("/qemu/statistics", async (req, res) => {
  res.json(qemu.qemuStats());
  console.log(`qemu/statistics`);
});

//QEMU SPECIFIC - GET
app.get("/qemu/vmconfig/all", async (req, res) => {
  res.json(await qemu.getQemuVmConfigs());
  console.log(`qemu/vmconfig/all`);
});

app.get("/qemu/vmconfig/:filename", async (req, res) => {
  res.json(await qemu.getQemuVm(req.params.filename));
  console.log(`qemu/vmconfig/${req.params.filename}`);
});

app.get("/qemu/isos", async (req, res) => {
  res.json(await qemu.getInstallableIsos());
  console.log(`qemu/isos`);
});

app.get("/qemu/vm/delete/:name", async (req, res) => {
  res.json(await qemu.deleteQemuVm(req.params.name));
  console.log(`qemu/vm/delete/${req.params.name}`);
});

app.get(
  "/qemu/vm/reinstall/:name/:cloudinit_image/:disk_size",
  async (req, res) => {
    console.log(
      `qemu/vm/reinstall/${req.params.name}/${req.params.cloudinit_image}`
    );
    res.json(
      await qemu.reinstallQemuVm(
        req.params.name,
        req.params.cloudinit_image,
        req.params.disk_size
      )
    );
  }
);

//QEMU SPECIFIC - POST
app.post("/qemu/vmconfig/:filename", async (req, res) => {
  res.json(await qemu.updateQemuVm(req.params.filename, req.body));
  console.log(`qemu/vmconfig/${req.params.filename}`);
});

app.post("/qemu/vm/create", async (req, res) => {
  await qemu.createQemuVm(req.body.config);
  res.json("OK");
  console.log(`qemu/vm/create`);
});

app.listen(port, () => {});
