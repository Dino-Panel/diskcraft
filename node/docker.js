const dockerstats = require("dockerstats");
var cache = {
  servers: [],
  stats: [],
};

async function refresh() {
  cache.stats = await dockerstats.dockerContainerStats();
  cache.servers = await dockerstats.dockerContainers();
  refresh();
}
module.exports = function () {
  return cache;
};

refresh();
