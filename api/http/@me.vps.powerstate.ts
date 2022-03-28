import { httpResponse } from "../interfaces/http";
import { login } from "../session";
import { setVpsPowerState } from "../lib/qemu";
import { appendLog } from "../lib/log";
import { httpError } from "../lib/http-error";

function httpResolve(app: any) {
  app.get("/@me/vps/:uuid/:poweraction", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

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
                displayHeader: "VPS Power",
                event: "user.me.vps.powerchange",
                isError: true,
              },
            ],
            data: null,
            success: false,
          };
          res.json(httpResponse);
          return;
        }

        const poweractions = [
          "shutdown",
          "start",
          "reboot",
          "destroy",
          "reset",
        ];

        if (!poweractions.includes(req.params.poweraction)) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 404,
                sysCode: "VPS.POWERACTION.NOTFOUND",
                displayText: "There was an error executing the power command.",
                displayHeader: "VPS Power",
                event: "user.me.vps.powerchange",
                isError: true,
              },
            ],
            data: null,
            success: false,
          };
          res.json(httpResponse);
          return;
        }

        try {
          setVpsPowerState(targetVps, req.params.poweraction);
        } catch (e) {
          httpError("user.me.vps.powerchange", req, res, e, "VPS Power");
          return;
        }

        let httpResponse: httpResponse = {
          messages: [
            {
              code: 200,
              sysCode: "ME.VPS.POWERSTATE",
              displayText: "The power action has been sent.",
              displayHeader: "VPS Power",
              event: "user.vps.powerchange",
              isError: false,
            },
          ],
          data: null,
          success: true,
        };
        await appendLog(
          `user.vps.powerstate|authorized`,
          {
            state: req.params.poweraction,
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
        httpError("user.me.vps.powerchange", req, res, e, "VPS Power");
        return;
      });
  });
}

export { httpResolve };
