import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { setVpsPowerState } from "../lib/qemu";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";
import { mysqlQuery } from "../lib/mysql";

const fetch = require("node-fetch");

function httpResolve(app: any) {
  app.get("/@me/vps/:uuid/reinstall/:installer_image", function (req, res) {
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
                displayHeader: "VPS Reinstall",
                event: "user.me.vps.reinstall",
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
          `http://${targetVps.node}:12645/qemu/vm/reinstall/${targetVps.name}/${
            req.params.installer_image
          }/${targetVps.hardware.disk / 1024}`
        );

        await mysqlQuery(
          `UPDATE qemu_servers_2 SET installed='0' WHERE id = '${targetVps.id}'`
        );

        let httpResponse: httpResponse = {
          messages: [
            {
              code: 200,
              sysCode: "VPS.REINSTALL",
              displayText:
                "The reinstallation process has started, you cannot access your VPS while this process is active. This can take a few minutes.",
              displayHeader: "VPS Reinstall",
              event: "user.me.vps.reinstall",
              isError: false,
            },
          ],
          data: null,
          success: false,
        };
        res.json(httpResponse);
        return;
      })
      .catch((e) => {
        httpError("user.me.vps.reinstall", req, res, e, "VPS Reinstall");
        return;
      });
  });
}

export { httpResolve };
