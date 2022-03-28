import { httpResponse } from "../interfaces/http";
import { data_strip } from "../lib/datastrip";
import { httpError } from "../lib/http-error";
import { appendLog } from "../lib/log";
import { login } from "../session";
const redis = require("redis");
const client = redis.createClient();

const fetch = require("node-fetch");

function httpResolve(app: any) {
  app.get("/@me/vps", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    login(token, ["SKIP_SERVERS"])
      .then(async (user: any) => {
        var include_iso = req.query?.include_iso || false;

        var server_request_uuid = req.headers["x-request-server"];
        var requires_data_strip = req.headers["x-data-strip"] || false;

        var servers = user.vps;
        if (server_request_uuid) {
          servers = servers.find((s) => s.uuid == server_request_uuid);
        }

        if (include_iso == "true") {
          var resp = await fetch(
            `http://${servers.node}:12645/qemu/vmconfig/${servers.name}.xml`
          );
          var reqData = await resp.json();

          try {
            var cdRom = reqData.domain.devices[0].disk.find((disk) => {
              return disk["$"].device == "cdrom";
            });
          } catch (e) {
            //httpError("user.me.vps.iso", req, res, e, "VPS ISO");
            return;
          }
          var mountedIso = cdRom.source[0]["$"].file;

          reqData = await redisCache(`hypervisor_iso_list_${servers.node}`);
          if (!reqData) {
            resp = await fetch(`http://${servers.node}:12645/qemu/isos`);
            reqData = await resp.json();
            client.setex(
              `hypervisor_iso_list_${servers.node}`,
              300,
              JSON.stringify(reqData)
            );
          } else {
            reqData = JSON.parse(reqData);
          }

          servers.iso = {
            mounted: mountedIso,
            availible: reqData,
          };
        }

        if (requires_data_strip == "true") {
          var stripped_data: any = await data_strip(
            servers,
            "qemu",
            req.headers["x-check-hash-latest"]
          );
          let httpResponse: httpResponse = {
            messages: [],
            data: stripped_data,
            success: true,
          };
          res.json(httpResponse);
          return;
        } else {
          let httpResponse: httpResponse = {
            messages: [],
            data: servers,
            success: true,
          };
          res.json(httpResponse);
          return;
        }
      })
      .catch((e) => {
        console.log(e);
        httpError("user.me.vps", req, res, e, "VPS");
        return;
      });
  });
}

function redisCache(key) {
  return new Promise((res) => {
    client.get(key, (err, data) => {
      if (err) console.log(err);
      res(data);
    });
  });
}

export { httpResolve };
