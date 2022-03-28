import { httpResponse } from "../interfaces/http";
import { appendLog } from "../lib/log";
import { login } from "../session";
import { config } from "../config";
import { httpError } from "../lib/http-error";
import { data_strip } from "../lib/datastrip";

function httpResolve(app: any) {
  app.get("/@me", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    var options = req.query.options;
    if (options) options = JSON.parse(options);

    var requires_data_strip = req.headers["x-data-strip"] || false;

    login(token, options)
      .then(async (user: any) => {
        if (requires_data_strip == false) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 200,
                sysCode: "ME",
                displayText: null,
                displayHeader: null,
                event: "user.me",
                isError: false,
              },
            ],
            data: user,
            success: true,
          };
          res.json(httpResponse);
          return;
        } else {
          var stripped_data: any = await data_strip(
            user,
            "user",
            req.headers["x-check-hash-latest"]
          );
          let httpResponse: httpResponse = {
            messages: [],
            data: stripped_data,
            success: true,
          };
          res.json(httpResponse);
          return;
        }
      })
      .catch((e) => {
        httpError("user.me", req, res, e, "Session");
      });
  });
}

export { httpResolve };
