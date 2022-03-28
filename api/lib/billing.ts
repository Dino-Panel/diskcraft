import { vpsModel } from "../interfaces/default";
import { config } from "../config";
import { listAllUsers, setUserCredit } from "./users";
import {
  deleteVps,
  listAllVpss,
  setVpsExpiryDate,
  suspendVps,
  unsuspendApi,
} from "./qemu";
import * as utc from "../lib/time";
import {
  deletePterodactylServer,
  listAllServers,
  setPterodactylServerExpiry,
  suspendPterodactylServer,
  unsuspendPterodactylServer,
} from "./pterodactyl";

async function run() {
  const users: any = await listAllUsers(["SKIP_VPSS", "SKIP_SERVERS"]);

  var vpsList: any = [];
  if (config.capabilities.qemuVps == true) {
    vpsList = await listAllVpss();
  }
  const freeVpss = vpsList.filter((vps) => vps.price == 0);

  var serverList: any = [];
  if (config.capabilities.pterodactylServer == true) {
    serverList = await listAllServers();
  }
  const freeServers = serverList.filter((server) => server.price == 0);

  console.log(`-={BILLING START}=-`);

  var billedEarned = 0;
  var billedCount = 0;

  console.log(
    `   ${length(vpsList)} VPS${
      length(vpsList) != 1 ? "s are" : " is"
    } registerd on this service.`
  );
  console.log(
    `      ${length(freeVpss)} Of them ${
      length(freeVpss) != 1 ? "are" : "is"
    } free.`
  );
  console.log(
    `   ${length(serverList)} servers${
      length(serverList) != 1 ? "s are" : " is"
    } registerd on this service.`
  );
  console.log(
    `      ${length(freeServers)} Of them ${
      length(freeServers) != 1 ? "are" : "is"
    } free.`
  );

  for (var server of serverList) {
    const serverOwner = users.find(
      (user) => user.pterodactyl_id == server.owner
    );

    if (server.suspended == false) {
      if (
        utc.addHours(new Date(server.expiresAt), 2).getTime() <
        utc.getTime(new Date()).getTime()
      ) {
        if (server.renew == true) {
          if (serverOwner.balance - server.price < 0) {
            suspendPterodactylServer(server);
          } else {
            var date = new Date();
            var nextMonth = new Date(date.setMonth(date.getMonth() + 1));
            await setUserCredit(
              serverOwner,
              serverOwner.balance - server.price
            );
            setPterodactylServerExpiry(
              server,
              utc.parseSql(utc.getTime(nextMonth))
            );
            billedCount++;
            billedEarned = billedEarned + server.price;
          }
        } else {
          deletePterodactylServer(server);
        }
      }
    } else {
      if (server.renew == true) {
        if (serverOwner.balance - server.price >= 0) {
          unsuspendPterodactylServer(server);

          var date = new Date();
          var nextMonth = new Date(date.setMonth(date.getMonth() + 1));
          await setUserCredit(serverOwner, serverOwner.balance - server.price);
          setPterodactylServerExpiry(
            server,
            utc.parseSql(utc.getTime(nextMonth))
          );
          billedCount++;
          billedEarned = billedEarned + server.price;
        }
      } else {
        deletePterodactylServer(server);
      }
    }
  }

  for (var vpsObj of vpsList) {
    var vps: any = vpsObj;
    const serverOwner = users.find((user) => user.id == vps.parent);

    if (vps.suspended == false) {
      if (
        utc.addHours(new Date(vps.expiresAt), 2).getTime() <
        utc.getTime(new Date()).getTime()
      ) {
        if (vps.renew == true) {
          if (serverOwner.balance - vps.price < 0) {
            await suspendVps(vps);
          } else {
            await setUserCredit(serverOwner, serverOwner.balance - vps.price);
            var date = new Date();
            var nextMonth = new Date(date.setMonth(date.getMonth() + 1));
            await setVpsExpiryDate(vps, utc.parseSql(utc.getTime(nextMonth)));
            billedCount++;
            billedEarned = billedEarned + vps.price;
          }
        } else {
          await deleteVps(vps);
        }
      }
    } else {
      if (vps.renew == true) {
        if (serverOwner.balance - vps.price >= 0) {
          await unsuspendApi(vps);
          await setUserCredit(serverOwner, serverOwner.balance - vps.price);
          var date = new Date();
          var nextMonth = new Date(date.setMonth(date.getMonth() + 1));

          await setVpsExpiryDate(vps, utc.parseSql(utc.getTime(nextMonth)));
          billedCount++;
          billedEarned = billedEarned + vps.price;
        }
      } else {
        await deleteVps(vps);
      }
    }
  }

  console.log(`-={BILLING STOP}=-`);
  console.log(
    `Billed ${billedCount} service${
      billedCount != 1 ? "s" : ""
    }, and earned €${billedEarned}`
  );
}

function length(input: any) {
  var count = 0;
  for (var i in input) {
    count++;
  }
  return count;
}

let addHours = function (d, h) {
  d.setTime(d.getTime() + h * 60 * 60 * 1000);
  return d;
};

export { run };
