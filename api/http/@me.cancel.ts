import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { disalbePterodactylServerRenewal } from "../lib/pterodactyl";
import { stopVpsRenewal } from "../lib/qemu";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";

function httpResolve(app: any) {
  app.post("/@me/cancel", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    var service = req.body.service;
    var target = req.body.target;

    var loginParameters = [];
    if (service == "VPS") loginParameters = ["SKIP_SERVERS"];
    if (service == "Servers") loginParameters = ["SKIP_VPSS"];

    if (loginParameters == []) {
      let httpResponse: httpResponse = {
        messages: [
          {
            code: 404,
            sysCode: "SERVICE.NOTFOUND",
            displayText:
              "The service on wich the server is hosted could not be found.",
            displayHeader: "Service cancellation",
            event: `user.server.${service}.cancel`,
            isError: true,
          },
        ],
        data: null,
        success: false,
      };
      res.json(httpResponse);
      return;
    }

    login(token, loginParameters)
      .then(async (user: any) => {
        var targetIdentifier = req.body.target;

        if (service == "VPS") {
          var target = user.vps.find(
            (server) => server.uuid == targetIdentifier
          );

          if (target.is_share == true) {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 401,
                  sysCode: "SERVER.NOT.OWNER",
                  displayText: "You are not the owner of this object",
                  displayHeader: "Service cancellation",
                  event: `user.server.${service}.cancel`,
                  isError: true,
                },
              ],
              data: null,
              success: false,
            };
            res.json(httpResponse);
            return;
          }

          if (!target) {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 404,
                  sysCode: "SERVER.NOTFOUND",
                  displayText: "The selected server could not be found.",
                  displayHeader: "Service cancellation",
                  event: `user.server.${service}.cancel`,
                  isError: true,
                },
              ],
              data: null,
              success: false,
            };
            res.json(httpResponse);
            return;
          }

          await appendLog(
            `user.vps.cancel|authorized`,
            null,
            `vps.${target.id}`,
            target.name,
            `user.${user.id}`,
            user.username,
            false
          );

          try {
            await stopVpsRenewal(target);
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
          } catch (e) {
            httpError("user.me.cancelservice", req, res, e, "Cancel service");
            return;
          }
        }
        if (service == "Servers") {
          var target = user.servers.find(
            (server) => server.identifier == targetIdentifier
          );

          if (!target) {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 404,
                  sysCode: "SERVER.NOTFOUND",
                  displayText: "The selected server could not be found.",
                  displayHeader: "Service cancellation",
                  event: `user.server.${service}.cancel`,
                  isError: true,
                },
              ],
              data: null,
              success: false,
            };
            res.json(httpResponse);
            return;
          }

          await appendLog(
            `user.server.cancel|authorized`,
            null,
            `server.${target.id}`,
            target.name,
            `user.${user.id}`,
            user.username,
            true
          );

          try {
            await disalbePterodactylServerRenewal(target);
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
          } catch (e) {
            httpError("user.me.cancelservice", req, res, e, "Cancel service");
            return;
          }
        }
      })
      .catch((e) => {
        httpError("user.me.cancelservice", req, res, e, "Cancel service");
        return;
      });
  });
}

export { httpResolve };
