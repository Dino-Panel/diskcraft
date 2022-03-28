var bcrypt = require("bcrypt");

import { config } from "../config";
import { userModel } from "../interfaces/default";
import { sqlUserResult } from "../interfaces/sql";
import { listAllServers } from "../lib/pterodactyl";
import { mysqlQuery } from "./mysql";
import { toBoolean } from "./common";
import { listAllVpss } from "./qemu";

function listAllUsers(options: any = []) {
  return new Promise(async (res, rej) => {
    var users: object[] = [];
    var queryResult: any;
    var vpss: any;
    var servers: any;

    if (
      options.includes("SKIP_SERVERS") ||
      config.capabilities.pterodactylServer == false
    ) {
      servers = [];
    } else {
      servers = await listAllServers();
    }

    if (options.includes("SKIP_VPSS") || config.capabilities.qemuVps == false) {
      vpss = [];
    } else {
      vpss = await listAllVpss();
    }

    queryResult = await mysqlQuery(
      "SELECT users.id, username, first_name, last_name, email, is_admin, phone_number, balance, discord_user_id, pterodactyl_user_id, enable_pterodactyl, deploy, add_credit, change_password, is_activated, activation_code  FROM users INNER JOIN user_permissions ON user_permissions.user_id = users.id"
    );

    for (var userDataIndex in queryResult) {
      let userData: sqlUserResult = queryResult[userDataIndex];
      var ownedVpss: object[];
      var ownedServers: object[];

      if (toBoolean(userData.is_admin) == true) {
        ownedVpss = vpss.filter((vps) => vps.is_share == false);
        ownedServers = servers;
      } else {
        ownedVpss = vpss.filter((vps) => vps.parent == userData.id);
        ownedServers = servers.filter(
          (server) => server.owner == userData.pterodactyl_user_id
        );
      }

      let user: userModel;
      user = {
        id: userData.id,
        username: userData.username,
        balance: userData.balance,
        email: userData.email,
        phone: 0,
        activated: toBoolean(userData.is_activated),
        activation_code: userData.activation_code,
        admin: toBoolean(userData.is_admin),
        first_name: userData.first_name,
        last_name: userData.last_name,
        discord_id: userData.discord_user_id,
        pterodactyl_id: userData.pterodactyl_user_id,
        permissions: {
          can_add_credit: toBoolean(userData.add_credit),
          can_change_password: toBoolean(userData.change_password),
          can_deploy: toBoolean(userData.deploy),
          can_enable_pterodactyl: toBoolean(userData.enable_pterodactyl),
        },
        servers: ownedServers || [],
        vps: ownedVpss || [],
      };
      users.push(user);
    }
    res(users);
  });
}

function createUser(
  username = null,
  email = null,
  password = null,
  first_name = null,
  last_name = null,
  activationCode = null
) {
  return new Promise((res, rej) => {
    if (username == null || username == "" || username.length < 3)
      return rej("Username does not meet requirements");
    if (email == null || email == "" || validateEmail(email) == false)
      return rej("Email does not meet requirements");
    if (first_name == null || first_name == "")
      return rej("First name does not meet requirements");
    if (last_name == null || last_name == "")
      return rej("Last name does not meet requirements");
    if (password == null || password == "" || password.length < 8)
      return rej("Password does not meet requirements");

    const saltRounds = 14;
    bcrypt.genSalt(saltRounds).then((salt) => {
      bcrypt.hash(password, salt).then(async (hash) => {
        try {
          var result: any = await mysqlQuery(
            `INSERT INTO users(username, email, password_hash, password_salt, balance, first_name, last_name, activation_code) VALUES ('${username}', '${email}', '${hash}', '${salt}', 0.0, '${first_name}', '${last_name}', '${activationCode}')`
          );
        } catch (err) {
          if (err.code == "ER_DUP_ENTRY") {
            if (err.sqlMessage.includes("users.users_username_unique"))
              return rej(`Username already taken.`);
            if (err.sqlMessage.includes("users.users_email_unique"))
              return rej(`Email already used.`);
          }
          rej(err);
        }
        var newUserId = result.insertId;
        var result: any = await mysqlQuery(
          `INSERT INTO user_permissions(user_id) VALUES (${newUserId})`
        );
        res(true);
      });
    });
  });
}

function changePassword(user: userModel, newPassword: any) {
  return new Promise((res) => {
    bcrypt.genSalt(14).then((salt) => {
      bcrypt.hash(newPassword, salt).then(async (hash) => {
        await mysqlQuery(
          `UPDATE users SET password_hash='${hash}', password_salt='${salt}' WHERE id = ${user.id}`
        );
        res(true);
      });
    });
  });
}

function booleanToInt(value) {
  if (value == true) return 1;
  if (value == false) return 0;
}

function setPermissions(user: userModel, newPermissions: any) {
  return new Promise(async (res) => {
    await mysqlQuery(
      `UPDATE user_permissions SET enable_pterodactyl='${booleanToInt(
        newPermissions.can_enable_pterodactyl
      )}',deploy='${booleanToInt(
        newPermissions.can_deploy
      )}',add_credit='${booleanToInt(
        newPermissions.can_add_credit
      )}',change_password='${booleanToInt(
        newPermissions.can_change_password
      )}' WHERE user_id = ${user.id}`
    );
    res(true);
  });
}

function setUserCredit(user: userModel, newBalance: number) {
  return new Promise(async (res, rej) => {
    var allUsers: any = await listAllUsers();

    var userTarget = allUsers.find((usr) => usr.id == user.id);

    if (!userTarget) return rej("User not found");

    await mysqlQuery(
      `UPDATE users SET balance=${newBalance} WHERE id = ${user.id}`
    );
    res("OK");
  });
}

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export {
  listAllUsers,
  createUser,
  setUserCredit,
  changePassword,
  setPermissions,
};
