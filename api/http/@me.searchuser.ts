import { httpResponse } from "../interfaces/http";
import { appendLog } from "../lib/log";
import { login } from "../session";
import { config } from "../config";
import { httpError } from "../lib/http-error";
import { listAllUsers } from "../lib/users";
const redis = require("redis");
const client = redis.createClient();

function redisCache(key) {
  return new Promise((res) => {
    client.get(key, (err, data) => {
      if (err) console.log(err);
      res(data);
    });
  });
}

function httpResolve(app: any) {
  app.get("/@me/search/user/email/:query_data", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    var options = req.query.options;
    if (options) options = JSON.parse(options);

    login(token, options)
      .then(async (user: any) => {
        var email_query = req.params.query_data;
        var processed_results = [];

        if (email_query.length <= 2) res.json(processed_results);

        var users: any = await redisCache("users_cache");
        if (!users) {
          users = await listAllUsers(["SKIP_VPSS", "SKIP_SERVERS"]);
          client.setex("users_cache", 10, JSON.stringify(users));
        } else {
          users = JSON.parse(users);
        }

        var results = users.filter((usr) => usr.email.startsWith(email_query));

        if (results == null || results.length < 1) res.json(processed_results);

        for (var result of results) {
          processed_results.push({
            id: result.id,
            username: result.username,
            email: result.email,
            first_name: result.first_name,
            last_name: result.last_name,
          });
        }
        res.json(processed_results);
      })
      .catch((e) => {
        console.log(e);
        httpError("user.me", req, res, e, "Session");
      });
  });
}

export { httpResolve };
