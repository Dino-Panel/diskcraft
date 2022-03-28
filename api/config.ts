const fs = require("fs");
const redis = require('redis');
const config_raw = fs.readFileSync("./config.json", "utf-8");
var config;
if (config_raw) {
  config = JSON.parse(config_raw);
} else {
  throw "Can't read config";
}

const client = redis.createClient({
  legacyMode: true
});

export { config };
