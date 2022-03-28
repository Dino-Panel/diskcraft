import { mysqlQuery } from "./mysql";
import { toBoolean } from "./common";
import { pterodactylServer } from "../interfaces/default";
import { listAllUsers, setUserCredit } from "./users";
import * as utc from "../lib/time";
const redis = require("redis");
const client = redis.createClient();
var fetch = require("node-fetch");
import { config } from "../config";
var cluster = require("cluster");

var isJobRunner;

process.on("message", function (msg) {
  if (msg.threadWorker) {
    if (msg.threadWorker == cluster.worker.id) {
      isJobRunner = true;
      // console.log(`${process.pid} is now the main worker!`);
    } else {
      isJobRunner = false;
    }
  }
});

if (config.capabilities.pterodactylServer == true) {
  //auto-cache
  if (isJobRunner == true) {
    setInterval(async () => {
      var dockerStatistics: any = await redisCache(
        `pterodactyl_docker_statistics`
      );
      if (!dockerStatistics) {
        dockerStatistics = {
          servers: [],
          stats: [],
        };
        const nodes: any = await listNodes();

        var nodePromises = [];
        for (var node of nodes) {
          var node: any = node;
          nodePromises.push(getDockerStats(node.attributes.fqdn));
        }
        var completedPromises = await Promise.all(nodePromises);
        for (var nodeDockerStats of completedPromises) {
          for (var stat of nodeDockerStats.stats) {
            dockerStatistics.stats.push(stat);
          }
          for (var server of nodeDockerStats.servers) {
            dockerStatistics.servers.push(server);
          }
        }
        client.setex(
          `pterodactyl_docker_statistics`,
          1,
          JSON.stringify(dockerStatistics)
        );
      }

      var dataArray: any = await redisCache(`pterodactyl_servers_list`);
      if (!dataArray) {
        dataArray = await getServersFromPterodactyl();
        client.setex(`pterodactyl_servers_list`, 1, JSON.stringify(dataArray));
      }
    }, 1000);
  }
}

function redisCache(key) {
  return new Promise((res) => {
    client.get(key, (err, data) => {
      if (err) console.log(err);
      res(data);
    });
  });
}

function listAllServers() {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;

  return new Promise(async (res, rej) => {
    var serverMeta: any = await mysqlQuery(
      `SELECT * FROM pterodactyl_servers `
    );

    var dockerStatistics: any = await redisCache(
      `pterodactyl_docker_statistics`
    );
    if (!dockerStatistics) {
      dockerStatistics = {
        servers: [],
        stats: [],
      };
      const nodes: any = await listNodes();

      var nodePromises = [];
      for (var node of nodes) {
        var node: any = node;
        nodePromises.push(getDockerStats(node.attributes.fqdn));
      }
      var completedPromises = await Promise.all(nodePromises);
      for (var nodeDockerStats of completedPromises) {
        for (var stat of nodeDockerStats.stats) {
          dockerStatistics.stats.push(stat);
        }
        for (var server of nodeDockerStats.servers) {
          dockerStatistics.servers.push(server);
        }
      }
      client.setex(
        `pterodactyl_docker_statistics`,
        1,
        JSON.stringify(dockerStatistics)
      );
    } else {
      dockerStatistics = JSON.parse(dockerStatistics);
    }

    var dataArray: any = await redisCache(`pterodactyl_servers_list`);
    if (!dataArray) {
      dataArray = await getServersFromPterodactyl();
      client.setex(`pterodactyl_servers_list`, 1, JSON.stringify(dataArray));
    } else {
      dataArray = JSON.parse(dataArray);
    }

    var servers: any = [];
    for (var i in dataArray) {
      var server: any = dataArray[i];

      var correspondingDatabaseEntry = serverMeta.find(
        (serverMeta) => serverMeta.pterodactyl_id == server.attributes.id
      );

      if (correspondingDatabaseEntry) {
        var containerInfoDocker = dockerStatistics.servers.find((srvr) => {
          return srvr.name == server.attributes.uuid;
        });

        var containerStatsDocker = {
          cpuPercent: 0,
          memPercent: 0,
        };

        if (containerInfoDocker != null) {
          var containerStatsDockerInfo = dockerStatistics.stats.find((srvr) => {
            return srvr.id == containerInfoDocker.id;
          });
          if (containerStatsDockerInfo) {
            containerStatsDocker = {
              cpuPercent: containerStatsDockerInfo.cpuPercent,
              memPercent: containerStatsDockerInfo.memPercent,
            };
          }
        }

        let serverObject: pterodactylServer = {
          id: server.attributes.id,
          identifier: server.attributes.identifier,
          name: server.attributes.name,
          owner: server.attributes.user,
          online: containerInfoDocker == null ? false : true,
          renew: toBoolean(correspondingDatabaseEntry.renew),
          suspended: toBoolean(correspondingDatabaseEntry.suspended),
          expiresAt: correspondingDatabaseEntry.expire_date,
          type: correspondingDatabaseEntry.type,
          price: correspondingDatabaseEntry.price,
          originalPrice: correspondingDatabaseEntry.price,
          limits: server.attributes.limits,
          statistics: containerStatsDocker,
          is_installed: toBoolean(server.attributes.container.installed),
          node_location:
            server.attributes.container.environment.P_SERVER_LOCATION,
        };

        servers.push(serverObject);
      }
    }
    res(servers);
  });
}

function getServersFromPterodactyl() {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;
  return new Promise((res) => {
    get(`${BASEURL}/api/application/servers`, APIKEY).then(
      async (data: any) => {
        var dataArray = data.data;
        if (data.meta && data.meta.pagination.total_pages > 1) {
          var i;
          for (i = 1; i < data.meta.pagination.total_pages; i++) {
            var page = i + 1;
            var pageData: any = await get(
              `${BASEURL}/api/application/servers?page=${page}`,
              APIKEY
            );

            for (i in pageData.data) {
              dataArray.push(pageData.data[i]);
            }
          }
        }
        res(dataArray);
      }
    );
  });
}

function listNodes() {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;
  return new Promise(async (res) => {
    var cache: any = await redisCache(`pterodactyl_nodes`);
    if (cache) {
      res(JSON.parse(cache));
    } else {
      try {
        var data: any = await get(`${BASEURL}/api/application/nodes`, APIKEY);
        client.setex(`pterodactyl_nodes`, 1, JSON.stringify(data.data));
        res(data.data);
      } catch (e) {
        res([]);
      }
    }
  });
}

async function randomAllocation(nodesListToUse = null) {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;
  var allNodes: any = await listNodes();
  //var publicNodes = allNodes.filter((node) => node.public == true);
  var nodes: any = [];
  if (nodesListToUse == null) {
    nodes = allNodes;
  } else {
    var nodesListFormatted = nodesListToUse.split(" ");
    nodes = allNodes.filter((n) =>
      nodesListFormatted.includes(n.attributes.fqdn)
    );
  }

  var allocation = null;

  for (var nodeData of nodes) {
    var otherPagesCount = 1;
    var freeAllocations = [];

    if (allocation == null) {
      var nodeAllocations: any = await get(
        `${BASEURL}/api/application/nodes/${nodeData.attributes.id}/allocations?page=1`,
        APIKEY
      );
      if (nodeAllocations.data) {
        freeAllocations = nodeAllocations.data.filter(
          (allocation) => allocation.attributes.assigned == false
        );

        if (nodeAllocations.data) {
          otherPagesCount = nodeAllocations.meta.pagination.total_pages;
        }

        var i = 0;

        for (i = 1; i < otherPagesCount; i++) {
          if (freeAllocations.length == 0) {
            var nodeAllocations: any = await get(
              `${BASEURL}/api/application/nodes/${i}/allocations?page=${i}`,
              APIKEY
            );

            if (nodeAllocations.data) {
              var nodeAllocationsFree = nodeAllocations.data.filter(
                (allocation) => allocation.attributes.assigned == false
              );
              for (allocation of nodeAllocationsFree) {
                freeAllocations.push(allocation);
              }
            }
          }
        }
      }
      if (freeAllocations.length > 0) {
        allocation =
          freeAllocations[Math.floor(Math.random() * freeAllocations.length)];
      }
    }
  }

  return allocation;
}

function disalbePterodactylServerRenewal(server: pterodactylServer) {
  return mysqlQuery(
    `UPDATE pterodactyl_servers SET renew=0 WHERE pterodactyl_id = '${server.id}'`
  );
}

function suspendPterodactylServer(server) {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;

  return new Promise(async (res) => {
    await post(
      `${BASEURL}/api/application/servers/${server.id}/suspend`,
      APIKEY
    );

    await mysqlQuery(
      `UPDATE pterodactyl_servers SET suspended=1 WHERE pterodactyl_id = '${server.id}'`
    );
    res(true);
  });
}

function reinstallPterodactylServer(server) {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;

  return new Promise(async (res) => {
    await post(
      `${BASEURL}/api/application/servers/${server.id}/reinstall`,
      APIKEY
    );
    res(true);
  });
}

function listAllPterodactylUsers() {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;

  return new Promise((res) => {
    get(`${BASEURL}/api/application/users`, APIKEY).then(async (data: any) => {
      let servers: object[] = [];

      var dataArray = data.data;
      if (data.meta && data.meta.pagination.total_pages > 1) {
        var i;
        for (i = 1; i < data.meta.pagination.total_pages; i++) {
          var page = i + 1;
          var pageData: any = await get(
            `${BASEURL}/api/application/users?page=${page}`,
            APIKEY
          );

          for (i in pageData.data) {
            dataArray.push(pageData.data[i]);
          }
        }
      }
      res(dataArray);
    });
  });
}

function createPterodactylServer(configContainer) {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;

  return new Promise(async (res) => {
    var server: any = await post(
      `${BASEURL}/api/application/servers/`,
      APIKEY,
      JSON.stringify(configContainer),
      true
    );
    var users: any = await listAllUsers(["SKIP_SERVERS", "SKIP_VPSS"]);

    var pterodactyl_user = server.attributes.user;
    var pterodactyl_id = server.attributes.id;
    var server_type = configContainer.type;
    var price = configContainer.price;
    var user = users.find((user) => user.pterodactyl_id == pterodactyl_user);

    var date = new Date();
    var nextMonth = new Date(date.setMonth(date.getMonth() + 1));

    await setUserCredit(user, user.balance - price);

    await mysqlQuery(
      `INSERT INTO pterodactyl_servers(server_user, price, pterodactyl_id, type, expire_date) VALUES (${
        user.id
      }, '${price}', '${pterodactyl_id}', '${server_type}', '${utc.parseSql(
        utc.getTime(nextMonth)
      )}')`
    );
    res(true);
  });
}

function setPterodactylServerExpiry(server: pterodactylServer, date: any) {
  return new Promise(async (res, rej) => {
    await mysqlQuery(
      `UPDATE pterodactyl_servers SET expire_date='${date}' WHERE pterodactyl_id = '${server.id}'`
    );
    res("OK");
  });
}

function createPterodactylUser(
  email: string,
  username: string,
  first_name: string,
  last_name: string
) {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;

  return post(
    `${BASEURL}/api/application/users`,
    APIKEY,
    JSON.stringify({
      email: email,
      username: username,
      first_name: first_name,
      last_name: last_name,
    })
  );
}

function deletePterodactylServer(server) {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;

  return new Promise(async (res) => {
    await deletept(
      `${BASEURL}/api/application/servers/${server.id}/force`,
      APIKEY
    );

    await mysqlQuery(
      `DELETE FROM pterodactyl_servers WHERE pterodactyl_id = '${server.id}'`
    );
    res(true);
  });
}

function unsuspendPterodactylServer(server) {
  const BASEURL = config.pterodactyl.server;
  const APIKEY = config.pterodactyl.key;

  return new Promise(async (res) => {
    await post(
      `${BASEURL}/api/application/servers/${server.id}/unsuspend`,
      APIKEY
    );
    await mysqlQuery(
      `UPDATE pterodactyl_servers SET suspended=0 WHERE pterodactyl_id = '${server.id}'`
    );
    res(true);
  });
}

export {
  listAllServers,
  disalbePterodactylServerRenewal,
  unsuspendPterodactylServer,
  suspendPterodactylServer,
  deletePterodactylServer,
  setPterodactylServerExpiry,
  listNodes,
  randomAllocation,
  createPterodactylServer,
  listAllPterodactylUsers,
  createPterodactylUser,
  reinstallPterodactylServer,
};

function sleep(timeout) {
  return new Promise((res) => {
    setTimeout(() => {
      res(true);
    }, timeout);
  });
}

function get(url, token) {
  return new Promise((res, rej) => {
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((resp) => {
        resp
          .json()
          .then((data) => {
            res(data);
          })
          .catch((err) => {
            rej(err);
          });
      })
      .catch((err) => {
        rej(err);
      });
  });
}

function post(url, token, data = null, getData = false) {
  return new Promise((res, rej) => {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: data,
    })
      .then((resp) => {
        if (getData == false) {
          res(true);
          return;
        }
        resp.json().then((data) => {
          res(data);
        });
      })
      .catch((err) => {
        rej(err);
      });
  });
}

function deletept(url, token) {
  return new Promise((res, rej) => {
    fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((resp) => {
        res(true);
      })
      .catch((err) => {
        rej(err);
      });
  });
}

function getDockerStats(SERVER) {
  return new Promise(async (resolve) => {
    var cached: any = await redisCache(`docker_stats_cache_${SERVER}`);
    if (cached) {
      resolve(JSON.parse(cached));
    } else {
      var completed = false;
      fetch(`http://${SERVER}:12645/docker/statistics`)
        .then((response) => response.json())
        .then((data) => {
          resolve(data);
          client.setex(`docker_stats_cache_${SERVER}`, 1, JSON.stringify(data));
          completed = true;
        })
        .catch(() => {
          resolve({
            servers: [],
            stats: [],
          });
        });

      setTimeout(() => {
        if (completed == false) {
          resolve({
            servers: [],
            stats: [],
          });
        }
      }, 500);
    }
  });
}
