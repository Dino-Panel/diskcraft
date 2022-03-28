import { config } from "../config";

var mysql = require("mysql");
var con = mysql.createConnection(config.mysql);

function mysqlQuery(query) {
  return new Promise((res, rej) => {
    con.query(query, function (err, result) {
      if (err) {
        console.log(err);
        rej(err);
      }
      res(result);
    });
  });
}

export { mysqlQuery };
