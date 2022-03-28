import { httpResponse } from "../interfaces/http";
import { appendLog } from "../lib/log";
import { auth, login } from "../session";

function httpResolve(app: any) {
  app.post("/auth", async function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    if (
      username == null ||
      username == "" ||
      password == null ||
      password == ""
    ) {
      let httpResponse: httpResponse = {
        messages: [
          {
            code: 401,
            sysCode: "LOGIN_USERNAME_PASSWORD_INVALID",
            displayText: "Invalid username/password",
            displayHeader: "Login",
            event: "user.login",
            isError: true,
          },
        ],
        data: null,
        success: false,
      };
      res.json(httpResponse);
      return;
    }

    auth(username, password)
      .then((jwt) => {
        login(jwt, ["SKIP_VPSS", "SKIP_SERVERS"]).then(async (user: any) => {
          if (user.activated == false) {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 401,
                  sysCode: "LOGIN",
                  displayText:
                    "Account not activated, please check your email.",
                  displayHeader: "Login",
                  event: "user.login",
                  isError: true,
                },
              ],
              data: null,
              success: false,
            };
            res.json(httpResponse);
            return;
          }

          if (username != "bot_user") {
            await appendLog(
              `user.login|authorized`,
              null,
              `user.${user.id}`,
              user.username,
              `user.${user.id}`,
              user.username,
              true
            );
          }

          let httpResponse: httpResponse = {
            messages: [
              {
                code: 200,
                sysCode: "LOGIN",
                displayText: "Successfully logged in",
                displayHeader: "Login",
                event: "user.login",
                isError: false,
              },
            ],
            data: {
              jwt: jwt,
            },
            success: true,
          };
          res.json(httpResponse);
          return;
        });
      })
      .catch(() => {
        let httpResponse: httpResponse = {
          messages: [
            {
              code: 401,
              sysCode: "LOGIN_USERNAME_PASSWORD_INVALID",
              displayText: "Invalid username/password",
              displayHeader: "Login",
              event: "user.login",
              isError: true,
            },
          ],
          data: null,
          success: false,
        };
        res.json(httpResponse);
        return;
      });
  });
}

export { httpResolve };
