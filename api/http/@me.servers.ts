import { httpResponse } from "../interfaces/http";
import { httpError } from "../lib/http-error";
import { appendLog } from "../lib/log";
import { login } from "../session";

function httpResolve(app: any) {
  app.get("/@me/servers", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    login(token, ["SKIP_VPSS"])
      .then(async (user: any) => {
        let httpResponse: httpResponse = {
          messages: [
            {
              code: 200,
              sysCode: "ME.SERVERS",
              displayText: null,
              displayHeader: null,
              event: "user.me.servers",
              isError: false,
            },
          ],
          data: user.servers,
          success: true,
        };
        res.json(httpResponse);
        return;
      })
      .catch((e) => {
        httpError("user.me.servers", req, res, e, "Servers");
      });
  });
}

export { httpResolve };
