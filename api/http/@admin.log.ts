import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { disalbePterodactylServerRenewal } from "../lib/pterodactyl";
import { stopVpsRenewal } from "../lib/qemu";
import { listAllUsers } from "../lib/users";
import { appendLog } from "../lib/log";
import { mysqlQuery } from "../lib/mysql";
import { httpError } from "../lib/http-error";

function httpResolve(app: any) {
  app.get("/@admin/log", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    login(token, ["SKIP_SERVERS", "SKIP_VPSS"])
      .then(async (user: any) => {
        if (user.admin == false) {
          httpError("admin.log", req, res, "NO_PERMISSIONS", "Log");
          await appendLog(
            `admin.logs|unauthorized`,
            null,
            `user.${user.id}`,
            user.username,
            `user.${user.id}`,
            user.username,
            true
          );
          return;
        }

        let httpResponse: httpResponse = {
          messages: null,
          data: await mysqlQuery(
            `SELECT event, eventData, affectedObjects, affectedObjectsNamesAtExecution, executedBy, executedByNameAtExecution FROM log WHERE shown = 1`
          ),
          success: true,
        };
        res.json(httpResponse);
        await appendLog(
          `admin.logs|authorized`,
          null,
          `user.${user.id}`,
          user.username,
          `user.${user.id}`,
          user.username,
          false
        );
        return;
      })
      .catch((e) => {
        httpError("admin.log", req, res, e, "Log");
        return;
      });
  });
}

export { httpResolve };
