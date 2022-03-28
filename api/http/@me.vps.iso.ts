import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { setVpsPowerState } from "../lib/qemu";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";
const fetch = require("node-fetch");
const redis = require("redis");
const client = redis.createClient();

function redisCache(key) {
  return new Promise((res) => {
    client.get(key, (err, data) => {
      if (err) console.log(err);
      res(data);
    });
  });
}

function httpResolve(app: any) {
  app.get("/@me/vps/:uuid/iso", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    login(token, ["SKIP_SERVERS"])
      .then(async (user: any) => {
        var targetVps = user.vps.find((vps) => vps.uuid == req.params.uuid);

        if (!targetVps) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 404,
                sysCode: "VPS.NOTFOUND",
                displayText: "The selected VPS could not be found.",
                displayHeader: "VPS ISO",
                event: "user.me.vps.iso",
                isError: true,
              },
            ],
            data: null,
            success: false,
          };
          res.json(httpResponse);
          return;
        }

        var resp = await fetch(
          `http://${targetVps.node}:12645/qemu/vmconfig/${targetVps.name}.xml`
        );
        var reqData = await resp.json();

        try {
          var cdRom = reqData.domain.devices[0].disk.find((disk) => {
            return disk["$"].device == "cdrom";
          });
        } catch (e) {
          httpError("user.me.vps.iso", req, res, e, "VPS ISO");
          return;
        }

        var mountedIso = cdRom.source[0]["$"].file;

        fetch(`http://${targetVps.node}:12645/qemu/isos`).then((resp) => {
          resp.json().then(async (data) => {
            let httpResponse: httpResponse = {
              messages: [],
              data: {
                mounted: mountedIso,
                availible: data,
              },
              success: true,
            };
            res.json(httpResponse);
            return;
          });
        });
      })
      .catch((e) => {
        httpError("admin.users", req, res, e, "VPS ISO");
        return;
      });
  });

  app.post("/@me/vps/:uuid/iso", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    var isoName = req.body.iso;

    login(token, ["SKIP_SERVERS"])
      .then(async (user: any) => {
        var targetVps = user.vps.find((vps) => vps.uuid == req.params.uuid);

        if (!targetVps) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 404,
                sysCode: "VPS.NOTFOUND",
                displayText: "The selected VPS could not be found.",
                displayHeader: "VPS ISO",
                event: "user.me.vps.iso",
                isError: true,
              },
            ],
            data: null,
            success: false,
          };
          res.json(httpResponse);
          return;
        }

        var resp = await fetch(
          `http://${targetVps.node}:12645/qemu/vmconfig/${targetVps.name}.xml`
        );
        var reqData = await resp.json();

        try {
          var cdRom = reqData.domain.devices[0].disk.find((disk) => {
            return disk["$"].device == "cdrom";
          });
        } catch (e) {
          httpError("user.me.vps.iso", req, res, e, "VPS ISO");
        }
        var mountedIso = cdRom.source[0]["$"].file;

        fetch(`http://${targetVps.node}:12645/qemu/isos`).then((resp) => {
          resp.json().then((data) => {
            var targetIso = data.find((iso) => iso == isoName);

            if (!targetIso) {
              let httpResponse: httpResponse = {
                messages: [
                  {
                    code: 404,
                    sysCode: "ISO.NOTFOUND",
                    displayText:
                      "The selected ISO could not be found and mounted.",
                    displayHeader: "VPS ISO",
                    event: "user.me.vps.iso.mount",
                    isError: true,
                  },
                ],
                data: null,
                success: false,
              };
              res.json(httpResponse);
              return;
            }

            fetch(
              `http://${targetVps.node}:12645/qemu/vmconfig/${targetVps.name}.xml`
            ).then((resp) => {
              resp.json().then((data) => {
                var cdrom = data.domain.devices[0].disk.find((disk) => {
                  return disk["$"].device == "cdrom";
                });
                var cdromIndex = data.domain.devices[0].disk.indexOf(cdrom);
                data.domain.devices[0].disk[cdromIndex].source[0]["$"][
                  "file"
                ] = `/iso/${targetIso}`;

                fetch(
                  `http://${targetVps.node}:12645/qemu/vmconfig/${targetVps.name}.xml`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                  }
                ).then(async (resp) => {
                  let httpResponse: httpResponse = {
                    messages: [
                      {
                        code: 200,
                        sysCode: "ISO.MOUNT",
                        displayText: "The selected ISO has been mounted.",
                        displayHeader: "VPS ISO",
                        event: "user.me.vps.iso.mount",
                        isError: false,
                      },
                    ],
                    data: null,
                    success: true,
                  };
                  await appendLog(
                    `user.me.vps.mountediso|authorized`,
                    {
                      iso: isoName,
                    },
                    `vps.${targetVps.id}`,
                    targetVps.name,
                    `user.me.${user.id}`,
                    user.username,
                    true
                  );
                  res.json(httpResponse);
                  return;
                });
              });
            });
          });
        });
      })
      .catch((e) => {
        httpError("user.me.vps.iso", req, res, e, "VPS ISO");
        return;
      });
  });
}

export { httpResolve };
