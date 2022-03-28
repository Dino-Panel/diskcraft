import { httpResponse } from "../interfaces/http";
import { mysqlQuery } from "../lib/mysql";
import { listAllUsers } from "../lib/users";
import { listAllVpss } from "../lib/qemu";
import * as vps_email from "../email/newVps";

function httpResolve(app: any) {
  app.get("/finish-vps-install/:vps_name", async function (req, res) {
    const vps_list: any = await listAllVpss();

    var vps = vps_list.find((v) => v.name == req.params.vps_name);

    if (vps) {
      await mysqlQuery(
        `UPDATE qemu_servers_2 SET installed='1' WHERE id = '${vps.id}'`
      );
      if (vps.installed == true) return;
      handle_email(vps);
    }
    res.sendStatus(200);
    return;
  });
  app.post("/finish-vps-install/:vps_name", async function (req, res) {
    const vps_list: any = await listAllVpss();

    var vps = vps_list.find((v) => v.name == req.params.vps_name);

    if (vps) {
      await mysqlQuery(
        `UPDATE qemu_servers_2 SET installed='1' WHERE id = '${vps.id}'`
      );
      if (vps.installed == true) return;
      handle_email(vps);
    }
    res.sendStatus(200);
    return;
  });
}

async function handle_email(vps) {
  var users: any = await listAllUsers(["SKIP_VPSS", "SKIP_SERVERS"]);
  var user = users.find((u) => u.id == vps.parent);

  vps_email.send(user.email, vps);
}

export { httpResolve };
