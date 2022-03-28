import { mysqlQuery } from "./lib/mysql";
import { listAllUsers } from "./lib/users";
var bcrypt = require("bcrypt");
const jwtServer = require("jsonwebtoken");

let auth = (username, password) => {
  return new Promise(async (res, rej) => {
    if (username == null || username == "")
      return rej("Invalid username/password");
    var result: any = await mysqlQuery(
      `SELECT password_salt, password_hash, username FROM users WHERE username='${username}' OR email='${username}'`
    );
    if (result.length == 0) {
      rej("Invalid username/password");
      return;
    }
    if (result[0].is_activated == false) {
      rej("Account not activated, please check your email.");
      return;
    }
    bcrypt.hash(password, result[0].password_salt).then(async (hash) => {
      if (hash == result[0].password_hash) {
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
        res(jwt);
      } else {
        rej("Invalid username/password");
        return;
      }
    });
  });
};

let login = (jwt, options: any = []) => {
  return new Promise((res, rej) => {
    if (jwt == null || jwt == "") return rej("LOGIN_TOKEN_ERROR");
    jwtServer.verify(
      jwt,
      "4CcRWpVcUPFqw97A5n99antruvH9LvYour",
      async (err, decoded) => {
        if (!decoded) return rej("LOGIN_TOKEN_ERROR");
        var verification = Buffer.from(
          Buffer.from(decoded.data.verification, "base64").toString(),
          "base64"
        ).toString();

        var result: any = await mysqlQuery(
          `SELECT password_hash, id FROM users WHERE username = '${decoded.data.username}'`
        );
        if (!result[0]) return rej("LOGIN_TOKEN_ERROR");
        if (result[0].password_hash != verification) rej("LOGIN_TOKEN_ERROR");

        const users: any = await listAllUsers(options);

        var user = users.find(
          (user) =>
            user.username.toLowerCase() == decoded.data.username.toLowerCase()
        );

        res(user);
      }
    );
  });
};

export { auth, login };
