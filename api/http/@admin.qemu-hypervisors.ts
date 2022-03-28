import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { disalbePterodactylServerRenewal } from "../lib/pterodactyl";
import { stopVpsRenewal } from "../lib/qemu";
import { listAllUsers } from "../lib/users";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";

function httpResolve(app: any) {
  app.get("/@admin/qemu-hypervisors", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    login(token, ["SKIP_SERVERS", "SKIP_VPSS"])
      .then(async (user: any) => {
        if (user.admin == false) {
          httpError(
            "admin.qemu.hypervisors",
            req,
            res,
            "NO_PERMISSIONS",
            "QEMU Hypervisors"
          );
          await appendLog(
            `admin.qemu.hypervisors|unauthorized`,
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
          data: await listAllUsers(["SKIP_SERVERS", "SKIP_VPSS"]),
          success: true,
        };
        res.json(httpResponse);
        await appendLog(
          `admin.users|authorized`,
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
        httpError("admin.users", req, res, e, "Users");
        return;
      });
  });
}

export { httpResolve };
