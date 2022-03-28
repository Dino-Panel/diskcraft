import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { setVpsPowerState } from "../lib/qemu";
import { appendLog } from "../lib/log";
import { mysqlQuery } from "../lib/mysql";
import { httpError } from "../lib/http-error";

function httpResolve(app: any) {
  app.post("/@me/reporterror", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    login(token, ["SKIP_SERVERS", "SKIP_VPSS"])
      .then(async (user: any) => {
        await mysqlQuery(
          `INSERT INTO web_error_log(user, request_url, error) VALUES (${user.id},'${req.body.url}','${req.body.errorData}')`
        );
      })
      .catch((e) => {
        httpError(
          "user.me.backgroundjobs.reporterror",
          req,
          res,
          e,
          "Error reporting"
        );
      });
  });
}

export { httpResolve };
