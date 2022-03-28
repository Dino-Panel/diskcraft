import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { setVpsAlias, setVpsPowerState } from "../lib/qemu";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";

const fetch = require("node-fetch");

function httpResolve(app: any) {
  app.post("/@me/vps/:uuid/deleteforward/:publicport", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    var public_port = req.params.publicport;

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

        fetch(`http://${targetVps.node}:12645/iptables/delete/${public_port}`)
          .then((resp) => {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 200,
                  sysCode: "ME.VPS.DELETEFORWARD",
                  displayText: "The rule has been deleted.",
                  displayHeader: "VPS Port forwarding",
                  event: "user.me.vps.deleteportforward",
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
