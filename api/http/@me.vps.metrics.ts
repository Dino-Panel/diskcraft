import { httpResponse } from "../interfaces/http";
import { httpError } from "../lib/http-error";
import { getVpsStatsLog } from "../lib/qemu";
import { login } from "../session";

function httpResolve(app: any) {
  app.get("/@me/vps/:uuid/metrics", function (req, res) {
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
                displayHeader: "VPS metrics",
                event: "user.me.vps.metrics",
                isError: true,
              },
            ],
            data: null,
            success: false,
          };
          res.json(httpResponse);
          return;
        }

        var logs: any = await getVpsStatsLog(targetVps.name);

        var logs_modif = [];

        if (req.query.type == "cpu") {
          for (var log of logs) {
            logs_modif.push({
              time: log.time,
              data: {
                cpu: log.data.cpu,
              },
            });
          }
        } else if (req.query.type == "network") {
          for (var log of logs) {
            logs_modif.push({
              time: log.time,
              data: {
                netIn: log.data.netIn,
                netOut: log.data.netOut,
              },
            });
          }
        } else if (req.query.type == "disk") {
          for (var log of logs) {
            logs_modif.push({
              time: log.time,
              data: {
                diskWrite: log.data.diskWrite,
                diskRead: log.data.diskRead,
              },
            });
          }
        } else {
          for (var log of logs) {
            logs_modif.push({
              time: log.time,
              data: {
                cpu: log.data.cpu,
                diskWrite: log.data.diskWrite,
                diskRead: log.data.diskRead,
                netIn: log.data.cpu,
                netOut: log.data.cpu,
              },
            });
          }
        }

        let httpResponse: httpResponse = {
          messages: [],
          data: logs_modif,
          success: true,
        };
        res.json(httpResponse);
        return;
      })
      .catch((e) => {
        httpError("user.me.vps.metrics", req, res, e, "VPS metrics");
        return;
      });
  });
}

export { httpResolve };
