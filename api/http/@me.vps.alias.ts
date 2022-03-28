import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { setVpsAlias, setVpsPowerState } from "../lib/qemu";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";

function httpResolve(app: any) {
  app.post("/@me/vps/:uuid/alias", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const newAlias = req.body.alias;

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

        await setVpsAlias(targetVps, newAlias);

        let httpResponse: httpResponse = {
          messages: [
            {
              code: 200,
              sysCode: "ME.VPS.ALIAS",
              displayText: "The VPS alias has been set.",
              displayHeader: "VPS alias",
              event: "user.me.vps.aliaschange",
              isError: false,
            },
          ],
          data: null,
          success: true,
        };
        await appendLog(
          `user.vps.alias|authorized`,
          {
            alias: newAlias,
          },
          `vps.${targetVps.id}`,
          targetVps.name,
          `user.${user.id}`,
          user.username,
          true
        );
        res.json(httpResponse);
        return;
      })
      .catch((e) => {
        httpError("user.me.vpsalias", req, res, e, "VPS alias");
        return;
      });
  });
}

export { httpResolve };
