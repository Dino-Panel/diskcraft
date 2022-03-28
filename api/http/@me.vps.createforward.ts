import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { setVpsAlias, setVpsPowerState } from "../lib/qemu";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";

const fetch = require("node-fetch");

function httpResolve(app: any) {
  app.post("/@me/vps/:uuid/createforward/:private_port", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    var private_port = req.params.private_port;

    //console.log(public_port);

    login(token, ["SKIP_SERVERS"])
      .then(async (user: any) => {
        var targetVps = user.vps.find((vps) => vps.uuid == req.params.uuid);

        if (!targetVps) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 404,
                sysCode: "VPS.NOTFOUND",
                displayText: "The selected VPS could not be found.",
                displayHeader: "VPS alias",
                event: "user.me.vps.aliaschange",
                isError: true,
              },
            ],
            data: null,
            success: false,
          };
          res.json(httpResponse);
          return;
        }

        fetch(
          `http://${targetVps.node}:12645/iptables/create/${targetVps.network.ipv4_address}/${private_port}`
        )
          .then((resp) => {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 200,
                  sysCode: "ME.VPS.CREATEFORWARD",
                  displayText: "The rule has been created.",
                  displayHeader: "VPS Port forwarding",
                  event: "user.me.vps.createportforward",
                  isError: false,
                },
              ],
              data: null,
              success: true,
            };
            res.json(httpResponse);
            return;
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {
        httpError(
          "user.me.deleteportforward",
          req,
          res,
          e,
          "VPS Port forwarding"
        );
        return;
      });
  });
}

export { httpResolve };
