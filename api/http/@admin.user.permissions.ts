import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { disalbePterodactylServerRenewal } from "../lib/pterodactyl";
import { stopVpsRenewal } from "../lib/qemu";
import { listAllUsers, setPermissions } from "../lib/users";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";

function httpResolve(app: any) {
  app.post("/@admin/user/:userid/permissions", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const userId = req.params.userid;
    const newPermissions = req.body;

    if (
      newPermissions.can_add_credit == null ||
      newPermissions.can_change_password == null ||
      newPermissions.can_deploy == null ||
      newPermissions.can_enable_pterodactyl == null
    ) {
      httpError(
        "admin.user.permissions",
        req,
        res,
        "INVALID_REQUEST_BODY",
        "Permissions"
      );
      return;
    }

    login(token, ["SKIP_SERVERS", "SKIP_VPSS"])
      .then(async (user: any) => {
        const executor = user;
        if (user.admin == false) {
          httpError(
            "admin.user.permissions",
            req,
            res,
            "NO_PERMISSIONS",
            "Permissions"
          );
          await appendLog(
            `admin.users|unauthorized`,
            newPermissions,
            `user.${user.id}`,
            user.username,
            `user.${executor.id}`,
            executor.username,
            true
          );
          return;
        }
        var users: any = await listAllUsers(["SKIP_SERVERS", "SKIP_VPSS"]);

        var user = users.find((usr) => usr.id == userId);

        await appendLog(
          `admin.user.permissions|authorized`,
          newPermissions,
          `user.${user.id}`,
          user.username,
          `user.${user.id}`,
          user.username,
          false
        );

        if (!user) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 404,
                sysCode: "NOT_FOUND",
                displayHeader: "Change permissions",
                displayText: "User not found.",
                event: `admin.user.permissions`,
                isError: true,
              },
            ],
            data: null,
            success: false,
          };
          res.json(httpResponse);
          return;
        }

        await setPermissions(user, newPermissions);
        let httpResponse: httpResponse = {
          messages: [
            {
              code: 200,
              sysCode: "CHANGE_PERMISSIONS",
              displayHeader: "Change permissions",
              displayText: "Changes have been saved.",
              event: `admin.user.permissions`,
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
        httpError("admin.user.permissions", req, res, e, "Permissions");
        return;
      });
  });
}

export { httpResolve };
