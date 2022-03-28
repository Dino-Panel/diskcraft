import { httpResponse } from "../interfaces/http";
import { listAllUsers } from "../lib/users";
import * as activationEmail from "../email/activation";
import { mysqlQuery } from "../lib/mysql";
import { appendLog } from "../lib/log";
const { v4: uuidv4 } = require("uuid");

function httpResolve(app: any) {
  app.post("/activate", async function (req, res) {
    var code = req.body.code;

    var users: any = await listAllUsers();

    var user = users.find((user) => user.activation_code == code);

    if (!user) {
      let httpResponse: httpResponse = {
        messages: [
          {
            code: 401,
            sysCode: "ME.ACTIVATE",
            displayText: "The provided activation code is invalid.",
            displayHeader: "Account activation",
            event: "user.activate",
            isError: true,
          },
        ],
        data: {
          providedCode: code,
        },
        success: false,
      };
      res.json(httpResponse);
      return;
    }

    await mysqlQuery(
      `UPDATE users SET is_activated=1, activation_code = '' WHERE id = '${user.id}'`
    );

    await appendLog(
      `user.activate|authorized`,
      null,
      `user.${user.id}`,
      user.username,
      `user.${user.id}`,
      user.username,
      true
    );

    let httpResponse: httpResponse = {
      messages: [
        {
          code: 200,
          sysCode: "ME.ACTIVATE",
          displayText: "Your account has been activated.",
          displayHeader: "Account activation",
          event: "user.activate",
          isError: false,
        },
      ],
      data: null,
      success: true,
    };
    res.json(httpResponse);
    return;
  });
}

export { httpResolve };
