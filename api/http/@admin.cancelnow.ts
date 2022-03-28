import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import {
  disalbePterodactylServerRenewal,
  setPterodactylServerExpiry,
} from "../lib/pterodactyl";
import { setVpsExpiryDate, stopVpsRenewal } from "../lib/qemu";
import { listAllUsers } from "../lib/users";
import { appendLog } from "../lib/log";
import { mysqlQuery } from "../lib/mysql";
import * as utc from "../lib/time";
import { httpError } from "../lib/http-error";

function httpResolve(app: any) {
  app.post("/@admin/cancelnow", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const service = req.body.service;
    const id = req.body.id;

    var params = [];

    if (service == "vps") params = ["SKIP_SERVERS"];
    if (service == "pterodactyl") params = ["SKIP_VPSS"];

    login(token, params)
      .then(async (user: any) => {
        if (user.admin == false) {
          httpError(
            "admin.server.cancelnow",
            req,
            res,
            "NO_PERMISSIONS",
            "Cancel"
          );
          await appendLog(
            `admin.cancelnow|unauthorized`,
            null,
            `user.${user.id}`,
            user.username,
            `user.${user.id}`,
            user.username,
            true
          );
          return;
        }
        if (service == "pterodactyl") {
          var server = user.servers.find((s) => s.identifier == id);

          if (!server) {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 404,
                  sysCode: "SERVICE.NOTFOUND",
                  displayText:
                    "The service on wich the server is hosted could not be found.",
                  displayHeader: "Service cancellation",
                  event: `admin.server.cancelnow`,
                  isError: true,
                },
              ],
              data: null,
              success: false,
            };
            res.json(httpResponse);
            return;
          }

          await setPterodactylServerExpiry(
            server,
            utc.parseSql(new Date(1970, 0, 1))
          );

          await appendLog(
            `admin.service.cancelnow|authorized`,
            null,
            `server.${server.id}`,
            server.name,
            `user.${user.id}`,
            user.username,
            true
          );

          let httpResponse: httpResponse = {
            messages: [
              {
                code: 200,
                sysCode: "SERVER.STOPRENEWAL",
                displayText: "A cancellation date has been set.",
                displayHeader: "Service cancellation",
                event: `user.server.${service}.cancel`,
                isError: false,
              },
            ],
            data: null,
            success: true,
          };
          res.json(httpResponse);
          return;
        }
        if (service == "vps") {
          var vps = user.vps.find((v) => v.id == id);
          if (!vps) {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 404,
                  sysCode: "SERVICE.NOTFOUND",
                  displayText:
                    "The service on wich the server is hosted could not be found.",
                  displayHeader: "Service cancellation",
                  event: `admin.server.cancelnow`,
                  isError: true,
                },
              ],
              data: null,
              success: false,
            };
            res.json(httpResponse);
            return;
          }

          setVpsExpiryDate(vps, utc.parseSql(new Date(1970, 0, 1)));
          await appendLog(
            `admin.service.cancelnow|authorized`,
            null,
            `vps.${vps.id}`,
            vps.name,
            `user.${user.id}`,
            user.username,
            true
          );

          let httpResponse: httpResponse = {
            messages: [
              {
                code: 200,
                sysCode: "SERVER.STOPRENEWAL",
                displayText: "A cancellation date has been set.",
                displayHeader: "Service cancellation",
                event: `user.server.${service}.cancel`,
                isError: false,
              },
            ],
            data: null,
            success: true,
          };
          res.json(httpResponse);
          return;
        }
      })
      .catch((e) => {
        httpError("admin.service.cancelnow", req, res, e, "Cancel");
        return;
      });
  });
}

export { httpResolve };
