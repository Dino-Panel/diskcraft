import { httpResponse } from "../interfaces/http";
import { codeToUser, createAuthUrl } from "../lib/discord";
import { appendLog } from "../lib/log";
import { mysqlQuery } from "../lib/mysql";
import { listAllUsers } from "../lib/users";
import { auth, login } from "../session";

var bcrypt = require("bcrypt");
const jwtServer = require("jsonwebtoken");

function httpResolve(app: any) {
  app.get("/discordauthorize/:code", function (req, res) {
    var authCode = req.params.code;

    codeToUser(authCode)
      .then(async (userid) => {
        var allUsers: any = await listAllUsers(["SKIP_SERVERS", "SKIP_VPSS"]);
        var user = allUsers.find((u) => u.discord_id == userid);
        if (!user) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 401,
                sysCode: "DISCORD_LOGIN_NO_USER",
                displayText:
                  "No user was found connected to this Discord account.",
                displayHeader: "Discord Login",
                event: "discord.login",
                isError: true,
              },
            ],
            data: null,
            success: false,
          };
          res.json(httpResponse);
          return;
        }

        var result: any = await mysqlQuery(
          `SELECT password_salt, password_hash, username FROM users WHERE id='${user.id}'`
        );

        var jwt = await jwtServer.sign(
          {
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 48,
            data: {
              username: result[0].username,
              verification: Buffer.from(
                Buffer.from(result[0].password_hash).toString("base64")
              ).toString("base64"),
            },
          },
          "4CcRWpVcUPFqw97A5n99antruvH9LvYour"
        );

        let httpResponse: httpResponse = {
          messages: [
            {
              code: 200,
              sysCode: "DISCORD_LOGIN_OK",
              displayText: "Successfully logged in via Discord.",
              displayHeader: "Login",
              event: "discord.login",
              isError: false,
            },
          ],
          data: jwt,
          success: true,
        };
        res.json(httpResponse);
        return;
      })
      .catch((e) => {
        let httpResponse: httpResponse = {
          messages: [
            {
              code: 401,
              sysCode: "DISCORD_LOGIN_INVALID_TOKEN",
              displayText: "Token verification failed",
              displayHeader: "Discord Login",
              event: "discord.login",
              isError: true,
            },
          ],
          data: e,
          success: false,
        };
        res.json(httpResponse);
        return;
      });
  });
}

export { httpResolve };
