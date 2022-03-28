const fetch = require("node-fetch");
const { v4: uuidv4 } = require("uuid");
const redis = require("redis");
const client = redis.createClient();
const password = require("secure-random-password");

import { config } from "../config";
import { mysqlQuery } from "./mysql";
import { toBoolean } from "./common";
import { vpsModel, hypervisorData } from "../interfaces/default";
import { sqlVpsResult } from "../interfaces/sql";
import { listAllUsers } from "./users";
import * as utc from "./time";

var cluster = require("cluster");
var net = require("net");

var qemu_stats_hypervisor_sockets = [];

var isJobRunner;

process.on("message", function (msg) {
  if (msg.threadWorker) {
    if (msg.threadWorker == cluster.worker.id) {
      isJobRunner = true;
    } else {
      isJobRunner = false;
    }
  }
});

function redisCache(key) {
  return new Promise((res) => {
    client.get(key, (err, data) => {
      if (err) console.log(err);
      res(data);
    });
  });
}

var global_qemu_data = [];

setTimeout(async () => {
  if (config.capabilities.qemuVps) {
    if (isJobRunner == true) {
      var hypervisors: any = await redisCache("sql_hypervisor_list");
      if (!hypervisors) {
        hypervisors = await mysqlQuery("SELECT * FROM `qemu_hypervisors`");
        client.setex("sql_hypervisor_list", 60, JSON.stringify(hypervisors));
      } else {
        hypervisors = JSON.parse(hypervisors);
      }

      for (var hypervisor of hypervisors) {
        var tcp_client = new net.Socket();
        tcp_client.connect(1337, hypervisor.ip, function () {
          console.log(`Connected to node via TCP`);
        });

        tcp_client.on("data", function (buffer) {
          const buf = Buffer.from(buffer, "utf8");
          var data = buf.toString();

          var packet_data = JSON.parse(data);
          var is_qemu_data = packet_data.data_identifier == `qemu0`;

          if (is_qemu_data) {
            for (var qemu_stat_object of packet_data.data) {
              var existing_global_item = global_qemu_data.find(
                (d) => d.name == qemu_stat_object.name
              );

              if (existing_global_item) {
                var existing_global_item_index =
                  global_qemu_data.indexOf(existing_global_item);
                global_qemu_data.splice(existing_global_item_index, 1);
              }
              global_qemu_data.push(qemu_stat_object);
            }

            client.setex(
              "hypervisor_vps_details",
              5,
              JSON.stringify(global_qemu_data)
            );
          }
        });

        tcp_client.on("error", function (err) {});

        tcp_client.on("close", function () {
          tcp_client.connect(1337, hypervisor.ip, function () {
            console.log(`Connected to node via TCP`);
          });
          //console.log("Connection closed");
        });
        qemu_stats_hypervisor_sockets.push(tcp_client);
      }

      setInterval(() => {
        for (var socket of qemu_stats_hypervisor_sockets) {
          //attempt to reconnect
          if (socket._writableState.closed) {
            socket.connect();
            //console.log();
          }
        }

        var date = new Date();
        for (var vps_data of global_qemu_data) {
          //console.log(vps_data);
          client.setex(
            `vps_stats_${vps_data.name.split("-")[3]}_${date.getTime()}`,
            610,
            JSON.stringify(vps_data)
          );
        }
      }, 1000);
    }
  }
}, 5000);

// if (config.capabilities.qemuVps) {
//   setInterval(async () => {
//     if (isJobRunner == true) {
//       var hypervisors: any = await redisCache("sql_hypervisor_list");
//       if (!hypervisors) {
//         hypervisors = await mysqlQuery("SELECT * FROM `qemu_hypervisors`");
//         client.setex("sql_hypervisor_list", 60, JSON.stringify(hypervisors));
//       } else {
//         hypervisors = JSON.parse(hypervisors);
//       }

//       var vpssCpuDetails: any = await redisCache("hypervisor_vps_details");
//       if (!vpssCpuDetails) {
//         vpssCpuDetails = [];
//         for (var hypervisor of hypervisors) {
//           var data: any = await getHypervisorCpuDetails(hypervisor.ip);
//           for (var server of data) {
//             vpssCpuDetails.push(server);
//           }
//         }
//         client.setex(
//           "hypervisor_vps_details",
//           1,
//           JSON.stringify(vpssCpuDetails)
//         );
//       } else {
//         vpssCpuDetails = JSON.parse(vpssCpuDetails);
//       }

//       var date = new Date();
//       for (var vps of vpssCpuDetails) {
//         client.setex(
//           `vps_stats_${vps.name.split("-")[3]}_${date.getTime()}`,
//           610,
//           JSON.stringify(vps)
//         );
//       }
//     }
//   }, 1000);
// }

function getVpsStatsLog(vpsName: string) {
  return new Promise(async (res) => {
    var data_last_minute = [];
    var data: any = await getVpsStatKeys(
      `vps_stats_${vpsName.split("-")[3]}_*`
    );
    data.sort((a, b) => parseInt(a.split("_")[3]) - parseInt(b.split("_")[3]));
    for (var log of data) {
      data = await getVpsStatKey(log);
      data = JSON.parse(data);
      data_last_minute.push({
        data: data,
        time: log.split("_")[3],
      });
    }
    res(data_last_minute);
  });
}

function getVpsStatKey(key) {
  return new Promise((res) => {
    client.get(key, (err, data) => {
      if (err) console.log(err);
      res(data);
    });
  });
}

function getVpsStatKeys(filter) {
  return new Promise((res) => {
    client.keys(filter, (err, data) => {
      if (err) console.log(err);
      res(data);
    });
  });
}

function listAllVpss() {
  return new Promise(async (res) => {
    var vpss: object[] = [];
    var queryResult: any;
    var iptables_rules: any;
    var hypervisorData: any;
    var hypervisorCpuData: any;
    var qemu_shares: any;
    var hypervisors: any;

    var users: any = await listAllUsers(["SKIP_VPSS", "SKIP_SERVERS"]);

    qemu_shares = await redisCache("sql_qemu_share_list");
    if (!qemu_shares) {
      qemu_shares = await mysqlQuery("SELECT * FROM qemu_shares");
      client.setex("sql_qemu_share_list", 1, JSON.stringify(qemu_shares));
    } else {
      qemu_shares = JSON.parse(qemu_shares);
    }

    queryResult = await redisCache("sql_vps_list");
    if (!queryResult) {
      queryResult = await mysqlQuery(
        "SELECT * FROM qemu_servers_2 WHERE uuid IS NOT NULL"
      );
      client.setex("sql_vps_list", 1, JSON.stringify(queryResult));
    } else {
      queryResult = JSON.parse(queryResult);
    }

    hypervisors = await redisCache("sql_hypervisor_list");
    if (!hypervisors) {
      hypervisors = await mysqlQuery("SELECT * FROM qemu_hypervisors");
      client.setex("sql_hypervisor_list", 60, JSON.stringify(hypervisors));
    } else {
      hypervisors = JSON.parse(hypervisors);
    }

    iptables_rules = await redisCache("iptables_rules_cache");
    if (!iptables_rules) {
      iptables_rules = [];
      for (var hypervisor of hypervisors) {
        var request_iptabels = await fetch(
          `http://${hypervisor.ip}:12645/iptables/list`
        );
        if (request_iptabels && request_iptabels.status == 200) {
          request_iptabels = await request_iptabels.json();
          for (var forward_rule of request_iptabels) {
            iptables_rules.push(forward_rule);
          }
        }
      }
      client.setex("iptables_rules_cache", 1, JSON.stringify(iptables_rules));
    } else {
      iptables_rules = JSON.parse(iptables_rules);
    }

    hypervisorData = [];
    for (var hypervisor of hypervisors) {
      var dataHypervisor: any = await request(
        hypervisor.ip,
        hypervisor.libvirt_api_key,
        `libvirt/domains`
      );
      for (var data of dataHypervisor) {
        hypervisorData.push(data);
      }
    }
    client.setex("hypervisor_data_vps", 1, JSON.stringify(hypervisorData));

    //var vpssCpuDetails = global_qemu_data;
    //DEPR
    // var vpssCpuDetails: any = await redisCache("hypervisor_vps_details");
    // if (!vpssCpuDetails) {
    //   vpssCpuDetails = [];
    //   for (var hypervisor of hypervisors) {
    //     var data: any = await getHypervisorCpuDetails(hypervisor.ip);
    //     for (var server of data) {
    //       vpssCpuDetails.push(server);
    //     }
    //   }
    //   client.setex("hypervisor_vps_details", 1, JSON.stringify(vpssCpuDetails));
    // } else {
    //   vpssCpuDetails = JSON.parse(vpssCpuDetails);
    // }

    var global_qemu_data_from_redis: any = await redisCache(
      "hypervisor_vps_details"
    );
    global_qemu_data_from_redis = JSON.parse(global_qemu_data_from_redis) || [];

    for (var serverDataIndex in queryResult) {
      let serverData: sqlVpsResult;
      let vps: vpsModel;
      let correspondingHypervisorData: hypervisorData;

      serverData = queryResult[serverDataIndex];
      correspondingHypervisorData = hypervisorData.find(
        (hvd) => hvd.uuid == serverData.uuid
      );

      if (correspondingHypervisorData) {
        var stats = global_qemu_data_from_redis.find(
          (v) =>
            global_qemu_data_from_redis != null &&
            correspondingHypervisorData != null &&
            v.name == correspondingHypervisorData.name
        );

        // console.log(stats);

        if (!stats) {
          stats = {
            cpu: 0,
            netIn: 0,
            netOut: 0,
            ram: 0,
            name: correspondingHypervisorData.name,
          };
        }

        var hypervisor = hypervisors.find((h) => h.ip == serverData.node);

        var vps_network = await mysqlQuery(
          `SELECT * FROM qemu_allocations_2 WHERE id='${serverData.allocation_id}'`
        );

        var forward_rules = iptables_rules.filter(
          (r) => r.private_ip == vps_network[0].ipv4_address
        );

        var shares = qemu_shares.filter(
          (s) => s.qemu_server_id == serverData.id
        );
        var shares_detailed = [];
        for (var share of shares) {
          var user = users.find((u) => u.id == share.share_user_id);
          shares_detailed.push({
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
          });
        }

        for (var share of shares) {
          vps = {
            id: serverData.id,
            uuid: serverData.uuid,
            name: correspondingHypervisorData.name || "Unknown",
            network: vps_network[0],
            status: correspondingHypervisorData.status || "Unknown",
            parent: share.share_user_id,
            price: serverData.price,
            alias: serverData.name_alias,
            firewall_rules: forward_rules,
            net_io_speed: serverData.net_io_speed,
            iso: null,
            location: hypervisor.name,
            novnc_port: serverData.novnc_port,
            vnc_port: serverData.vnc_port,
            vnc_server: hypervisor.vnc_server,
            vnc_password: serverData.vnc_password,
            renew: toBoolean(serverData.renew),
            suspended: toBoolean(serverData.suspended),
            expiresAt: serverData.expire_date,
            node: serverData.node,
            hardware: {
              cpuCores: correspondingHypervisorData.cpu,
              ram: correspondingHypervisorData.ram / 1024,
              disk: serverData.disk_size * 1024,
            },
            stats: stats,
            statsHistory: null,
            is_share: true,
            share_details: null,
            cloudinit_username: "root",
            cloudinit_password: "HIDDEN",
            installed: toBoolean(serverData.installed),
          };

          vpss.push(vps);
        }
        vps = {
          id: serverData.id,
          uuid: serverData.uuid,
          name: correspondingHypervisorData.name || "Unknown",
          network: vps_network[0],
          status: correspondingHypervisorData.status || "Unknown",
          parent: serverData.server_user,
          price: serverData.price,
          alias: serverData.name_alias,
          firewall_rules: forward_rules,
          net_io_speed: serverData.net_io_speed,
          iso: null,
          location: hypervisor.name,
          novnc_port: serverData.novnc_port,
          vnc_port: serverData.vnc_port,
          vnc_server: hypervisor.vnc_server,
          vnc_password: serverData.vnc_password,
          renew: toBoolean(serverData.renew),
          suspended: toBoolean(serverData.suspended),
          expiresAt: serverData.expire_date,
          node: serverData.node,
          hardware: {
            cpuCores: correspondingHypervisorData.cpu,
            ram: correspondingHypervisorData.ram / 1024,
            disk: serverData.disk_size * 1024,
          },
          stats: stats,
          statsHistory: null,
          is_share: false,
          share_details: shares_detailed,
          cloudinit_username: "root",
          cloudinit_password: serverData.cloudinit_password,
          installed: toBoolean(serverData.installed),
        };

        vpss.push(vps);
      }
    }
    res(vpss);
  });
}

function getHypervisorCpuDetails(server: string) {
  return new Promise((res) => {
    fetch(`http://${server}:12645/qemu/statistics`)
      .then((resp) => {
        resp.json().then((data) => {
          res(data);
        });
      })
      .catch((err) => {
        res([]);
      });
  });
}

function setVpsPowerState(
  vps: vpsModel,
  action: "shutdown" | "start" | "reboot" | "reset" | "destroy"
) {
  return new Promise(async (res, rej) => {
    if (action == "start" && vps.status == "running")
      rej({ code: 500, message: "Domain is already running" });

    if (
      (action == "shutdown" ||
        action == "reboot" ||
        action == "reset" ||
        action == "destroy") &&
      vps.status == "running"
    )
      rej({ code: 500, message: "Domain is not running" });

    var hypervisors: any = await mysqlQuery("SELECT * FROM `qemu_hypervisors`");

    var hypervisor = hypervisors.find((h) => h.ip == vps.node);

    request(
      hypervisor.ip,
      hypervisor.libvirt_api_key,
      `libvirt/domains/by-uuid/${vps.uuid}`,
      "patch",
      [{ power_mgt: { request: action } }]
    )
      .then((result: any) => {
        if (result.success == false) {
          rej(result.errors);
          return;
        }
        res(result.messages);
      })
      .catch((e) => rej(e));
  });
}

function createVps(
  userId,
  cpuCores,
  gbRam,
  gbDisk,
  price,
  net_io_speed = 28000,
  pkg_code
) {
  return new Promise(async (res, rej) => {
    const users: any = await listAllUsers();
    const user = users.find((user) => user.id == userId);

    if (user.balance - price < 0) {
      rej("NO_BALANCE");
      return;
    }

    var vnc_port = null;
    var vnc_password = null;
    var novnc_port = null;
    var uuid_short = null;
    var network: any = await getFreeIp();

    if (network == null || network == undefined) {
      rej("NO_IP");
      return;
    }
    var deployNode = network.node;

    var existingServers: any = await listAllVpss();

    while (vnc_port == null) {
      var vnc_port_temp = Math.floor(Math.random() * 10000) + 40000;
      var checkForUse = existingServers.find(
        (server) => server.vnc_port == vnc_port_temp
      );

      if (checkForUse == null) {
        vnc_port = vnc_port_temp;
      }
    }

    while (novnc_port == null) {
      var no_vnc_port_temp = Math.floor(Math.random() * 1000) + 50000;
      var checkForUse = existingServers.find(
        (server) => server.novnc_port == no_vnc_port_temp
      );

      if (checkForUse == null || checkForUse == undefined) {
        novnc_port = no_vnc_port_temp;
      }
    }

    while (uuid_short == null) {
      var uuid_short_temp = uuidv4();
      uuid_short_temp = uuid_short_temp.split("-")[1];
      var checkForUse = existingServers.find((server) =>
        server.name.includes(uuid_short_temp)
      );

      if (checkForUse == null || checkForUse == undefined) {
        uuid_short = uuid_short_temp;
        vnc_password = uuidv4().split("-")[0];
      }
    }

    var cloudinit_password = password.randomPassword({
      length: 18,
      characters: [password.lower, password.upper, password.digits],
    });

    network.net_io_speed = net_io_speed;

    var data = {
      config: {
        name: `VPS-CLIENT-${userId}-${uuid_short}`,
        system_uuid: null,
        diskSize: gbDisk,
        network: network,
        vncServer: deployNode,
        vncPort: vnc_port,
        noVncPort: novnc_port,
        vncPassword: vnc_password,
        cpuCores: cpuCores,
        ramGb: gbRam,
        cloudinit_password: cloudinit_password,
      },
    };

    var renewTime = utc.parseSql(utc.getTime(utc.addHours(new Date(), 1)));

    await mysqlQuery(
      `INSERT INTO qemu_servers_2(price, server_user, vnc_port, vnc_password, allocation_id, disk_size, novnc_port, node, expire_date, net_io_speed, cloudinit_password, type) VALUES 
      (${price}, ${userId}, ${data.config.vncPort}, '${data.config.vncPassword}', '${network.id}', ${data.config.diskSize}, ${data.config.noVncPort}, '${deployNode}', '${renewTime}', ${net_io_speed}, '${cloudinit_password}', '${pkg_code}')`
    );

    await fetch(
      `http://${deployNode}:12645/iptables/deleteip/${network.ipv4_address}`
    );

    fetch(`http://${deployNode}:12645/qemu/vm/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((resp) => {
      resp.json().then((result) => {
        if (result != "OK") {
          rej(result);
          return;
        }

        fetch(
          `http://${deployNode}:12645/qemu/vmconfig/${data.config.name}.xml`
        ).then((resp) => {
          resp.json().then(async (vps) => {
            await mysqlQuery(
              `UPDATE qemu_servers_2 SET uuid='${vps.domain.uuid[0]}' WHERE cloudinit_password = '${cloudinit_password}'`
            );

            fetch(
              `http://${deployNode}:12645/iptables/create/${network.ipv4_address}/22`
            );

            res(true);
          });
        });
      });
    });
  });
}

function getFreeIp() {
  return new Promise((res, rej) => {
    mysqlQuery(
      `SELECT * FROM qemu_allocations_2 WHERE id NOT IN (SELECT allocation_id FROM qemu_servers_2) ORDER BY RAND() LIMIT 1`
    ).then((result) => {
      res(result[0]);
    });
  });
}

function stopVpsRenewal(vps: vpsModel) {
  return new Promise(async (res, rej) => {
    await mysqlQuery(
      `UPDATE qemu_servers_2 SET renew=0 WHERE id = '${vps.id}'`
    );
    res("OK");
  });
}

function suspendVps(vps: vpsModel) {
  return new Promise(async (res, rej) => {
    await mysqlQuery(
      `UPDATE qemu_servers_2 SET suspended=1 WHERE id = '${vps.id}'`
    );
    res("OK");
  });
}

function unsuspendApi(vps: vpsModel) {
  return new Promise(async (res, rej) => {
    await mysqlQuery(
      `UPDATE qemu_servers_2 SET suspended=0 WHERE id = '${vps.id}'`
    );
    res("OK");
  });
}

function setVpsExpiryDate(vps: vpsModel, date: any) {
  return new Promise(async (res, rej) => {
    await mysqlQuery(
      `UPDATE qemu_servers_2 SET expire_date='${date}' WHERE id = '${vps.id}'`
    );
    res("OK");
  });
}

function setVpsAlias(vps: vpsModel, alias: any) {
  return new Promise(async (res, rej) => {
    await mysqlQuery(
      `UPDATE qemu_servers_2 SET name_alias='${alias}' WHERE id = '${vps.id}'`
    );
    res("OK");
  });
}

function deleteVps(vps: vpsModel) {
  return new Promise(async (res, rej) => {
    fetch(
      `http://${vps.node}:12645/iptables/deleteip/${vps.network.ipv4_address}`
    );
    await setVpsPowerState(vps, `destroy`);
    mysqlQuery(`DELETE FROM qemu_servers_2 WHERE id = '${vps.id}'`)
      .then(() => {
        fetch(`http://${vps.node}:12645/qemu/vm/delete/${vps.name}`).then(
          (resp) => {
            resp.json().then((data) => {
              if (data != "OK") {
                rej(data);
                return;
              }
              res("OK");
            });
          }
        );
      })
      .catch((err) => {
        rej(err);
        return;
      });
  });
}

function request(
  server: string,
  key: string,
  module: string = "",
  type: string = "get",
  data: any = null
) {
  return new Promise((res, rej) => {
    if (module == "" || module == null) return rej("No module");

    fetch(`http://${server}:8081/${module}`, {
      method: type,
      headers: {
        "X-Auth-Key": key,
        "X-Auth-Username": "API",
        "content-Type": "applicationjson",
        "Accept-Encoding": "none",
      },
      body: type == "get" ? null : JSON.stringify(data),
    }).then((response) => {
      response
        .json()
        .then((data) => {
          res(data.results);
        })
        .catch((err) => {
          rej(err);
        });
    });
  });
}

export {
  listAllVpss,
  setVpsPowerState,
  stopVpsRenewal,
  setVpsExpiryDate,
  deleteVps,
  suspendVps,
  unsuspendApi,
  createVps,
  setVpsAlias,
  getVpsStatsLog,
};
