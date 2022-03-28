import { httpResponse } from "../interfaces/http";
import { httpError } from "../lib/http-error";
import { appendLog } from "../lib/log";
import { mysqlQuery } from "../lib/mysql";
import {
  randomAllocation,
  createPterodactylServer,
  listAllPterodactylUsers,
  createPterodactylUser,
} from "../lib/pterodactyl";
import { changePassword } from "../lib/users";
import { createVps } from "../lib/qemu";
import { login } from "../session";

function httpResolve(app: any) {
  app.post("/@me/changepassword", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    var newPassword = req.body.newPassword;

    login(token, ["SKIP_VPSS", "SKIP_SERVERS"])
      .then(async (user: any) => {
        if (user.permissions.can_change_password == false) {
          httpError(
            "user.me.changepassword",
            req,
            res,
            "NO_PERMISSIONS",
            "Change password"
          );
          return;
        }

        if (
          newPassword == null ||
          newPassword == "" ||
          newPassword.length < 8
        ) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 401,
                sysCode: "PASSWORD_NOT_MEETING_REQ",
                displayText:
                  "The provided password does not meet the requirements.",
                displayHeader: "Change password",
                event: "user.changepassword",
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
          `user.changepassword|authorized`,
          null,
          `user.${user.id}`,
          user.username,
          `user.${user.id}`,
          user.username,
          false
        );

        await changePassword(user, newPassword);

        let httpResponse: httpResponse = {
          messages: [
            {
              code: 200,
              sysCode: "PASSWORD_CHANGED",
              displayText:
                "Your password has been changed, please sign in again.",
              displayHeader: "Change password",
              event: "user.changepassword",
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
        httpError("user.me.changepassword", req, res, e, "Change password");
        return;
      });
  });
}

export { httpResolve };
