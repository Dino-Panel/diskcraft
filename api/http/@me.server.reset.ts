import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import {
  disalbePterodactylServerRenewal,
  reinstallPterodactylServer,
} from "../lib/pterodactyl";
import { stopVpsRenewal } from "../lib/qemu";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";

function httpResolve(app: any) {
  app.get("/@me/server/reset/:server_id", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    var server_id = req.params.server_id;

    login(token, ["SKIP_VPSS"])
      .then(async (user: any) => {
        var target = user.servers.find(
          (server) => server.identifier == server_id
        );

        if (!target) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 404,
                sysCode: "SERVER.NOTFOUND",
                displayText: "The selected server could not be found.",
                displayHeader: "Service cancellation",
                event: `user.server.${target.identifier}.reset`,
                isError: true,
              },
            ],
            data: null,
            success: false,
          };
          res.json(httpResponse);
          return;
        }

        await reinstallPterodactylServer(target);

        let httpResponse: httpResponse = {
          messages: [
            {
              code: 200,
              sysCode: "user.me.server.reset",
              displayText: "The installation process has started.",
              displayHeader: "Reset server",
              event: `user.server.${target.identifier}.reset`,
              isError: false,
            },
          ],
          data: null,
          success: true,
        };
        res.json(httpResponse);
        return;
      })
      .catch((e) => {
        httpError("user.me.server.reset", req, res, e, "Reset Server");
        return;
      });
  });
}

export { httpResolve };
