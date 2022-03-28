import { httpResponse } from "../interfaces/http";
import { createUser } from "../lib/users";
import * as activationEmail from "../email/activation";
import { httpError } from "../lib/http-error";
const { v4: uuidv4 } = require("uuid");

function httpResolve(app: any) {
  app.post("/register", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;

    var activationCode = uuidv4();

    createUser(username, email, password, first_name, last_name, activationCode)
      .then(() => {
        let httpResponse: httpResponse = {
          messages: [
            {
              code: 200,
              sysCode: "REGISTER",
              displayText: "Please check your email",
              displayHeader: "Registration",
              event: "user.me",
              isError: false,
            },
          ],
          data: null,
          success: true,
        };
        res.json(httpResponse);
        activationEmail.send(email, activationCode);
        return;
      })
      .catch((e) => {
        httpError("user.register", req, res, e, "Registration");
        return;
      });
  });
}

export { httpResolve };
