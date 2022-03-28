import { userModel, vpsModel } from "../interfaces/default";
import {
  user_model_stripped,
  vps_model_stripped,
} from "../interfaces/stripped";

function data_strip(data, type, check_hash) {
  return new Promise((res) => {
    var return_item: any;

    if (type == "user") {
      return_item = parse_user_single(data);

      var data_hash = create_hash_checksum(btoa(JSON.stringify(return_item)));
      if (data_hash == check_hash) return_item = {};

      res(return_item);
    }

    if (type == "qemu") {
      if (Array.isArray(data) == true) {
        return_item = [];

        for (var qemu_server of data) {
          return_item.push(parse_qemu_single(qemu_server));
        }
      } else {
        return_item = parse_qemu_single(data);
      }

      var data_hash = create_hash_checksum(btoa(JSON.stringify(return_item)));
      if (data_hash == check_hash) return_item = [];

      res(return_item);
    }
  });
}

function parse_user_single(data: userModel) {
  var object: user_model_stripped = {
    balance: data.balance,
    pterodactyl_id: data.pterodactyl_id,
    discord_id: data.discord_id,
    permissions: data.permissions,
  };
  return object;
}

function parse_qemu_single(data: vpsModel) {
  var object: vps_model_stripped = {
    uuid: data.uuid || null,
    alias: data.alias,
    status: data.status || "Installing",
    firewall_rules: data.firewall_rules || [],
    iso: data.iso,
    renew: data.renew,
    suspended: data.suspended || false,
    stats: {
      cpu: data.stats.cpu,
      diskRead: data.stats.diskRead,
      diskWrite: data.stats.diskWrite,
      netIn: data.stats.netIn,
      netOut: data.stats.netOut,
    },
    share_details: data.share_details,
    installed: data.installed,
  };
  return object;
}

function create_hash_checksum(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function btoa(string) {
  return Buffer.from(string).toString("base64");
}

export { data_strip };
