import { httpResponse } from "../interfaces/http";
import { httpError } from "../lib/http-error";
import { parse_order_for_limits } from "../lib/limits";
import { appendLog } from "../lib/log";
import { mysqlQuery } from "../lib/mysql";
import {
  randomAllocation,
  createPterodactylServer,
  listAllPterodactylUsers,
  createPterodactylUser,
} from "../lib/pterodactyl";
import { createVps } from "../lib/qemu";
import { login } from "../session";

const redis = require("redis");
const client = redis.createClient();

const fetch = require("node-fetch");

function redisCache(key) {
  return new Promise((res) => {
    client.get(key, (err, data) => {
      if (err) console.log(err);
      res(data);
    });
  });
}

function httpResolve(app: any) {
  app.post("/@me/order", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    var cart = req.body;
    var cart_items = cart.items;
    var coupon_code = cart.coupon_code;

    if (process.argv.includes("--disableDeploy")) {
      let httpResponse: httpResponse = {
        messages: [
          {
            code: 200,
            sysCode: "DEPLOY_DISABLED",
            displayText: "New deployments have been disabled temporarily.",
            displayHeader: "Deploy",
            event: "deploy",
            isError: true,
          },
        ],
        data: null,
        success: false,
      };
      res.json(httpResponse);
      return;
    }

    login(token, ["SKIP_VPSS", "SKIP_SERVERS"]).then(async (user: any) => {
      if (user.permissions.can_deploy == false) {
        let httpResponse: httpResponse = {
          messages: [
            {
              code: 401,
              sysCode: "NO_DEPLOY_PERMS",
              displayText: "You don't have permission to create a new server!",
              displayHeader: "Deploy",
              event: "deploy",
              isError: true,
            },
          ],
          data: null,
          success: false,
        };
        res.json(httpResponse);
        return;
      }

      if (
        user.pterodactyl_id == null &&
        user.permissions.can_enable_pterodactyl == false
      ) {
        let httpResponse: httpResponse = {
          messages: [
            {
              code: 401,
              sysCode: "NO_DEPLOY_PERMS",
              displayText: "You don't have permission to create a new server!",
              displayHeader: "Deploy",
              event: "deploy",
              isError: true,
            },
          ],
          data: null,
          success: false,
        };
        res.json(httpResponse);
        return;
      }

      var total: any = 0;
      //build total price first
      for (var item of cart_items) {
        for (let i = 0; i < item.quantity; i++) {
          if (item.service == "pterodactyl") {
            var package_data: any = await searchPterodacylPackage(item.code);
            total += package_data.package.price;
          }
        }
      }

      if (user.balance - total < 0) {
        httpError("user.me.deploy", req, res, "NO_BALANCE", "Order");
        return;
      }

      var messages: any = [
        {
          code: 200,
          sysCode: "ORDER_COMPLETE",
          displayText:
            "Your order has been completed, we will now start to install your servers.",
          displayHeader: "Order",
          event: "order.complete",
          isError: false,
        },
      ];

      //skip this for now
      // var cart_parsed: any = await parse_order_for_limits(cart_items, user);
      //cart_items = cart_parsed.cart;

      var cart_promise_list = [];

      for (var item of cart_items) {
        for (let i = 0; i < item.quantity; i++) {
          cart_promise_list.push(create_server(item, user));
          await sleep(2500);
        }
      }

      var new_servers = await Promise.all(cart_promise_list);

      for (var new_server of new_servers) {
        if (new_server) messages.push(new_server);
      }

      let httpResponse: httpResponse = {
        messages: messages,
        data: null,
        success: true,
      };
      res.json(httpResponse);
      return;
    });
  });
}

function sleep(timeout) {
  return new Promise((res) => {
    setTimeout(() => {
      res(true);
    }, timeout);
  });
}

function create_server(item, user) {
  return new Promise(async (res) => {
    var message = null;

    if (item.service == "qemu") {
      var targetPackageName: any = item.code;
      var vpsPackages: any = await mysqlQuery(
        `SELECT * FROM qemu_packages WHERE shown = '1'`
      );
      var vpsPackage = vpsPackages.find((pkg) => pkg.code == targetPackageName);

      if (!vpsPackage) {
        message = {
          code: 404,
          sysCode: "QEMU_PKG_ERR",
          displayText: "The QEMU package could not be found.",
          displayHeader: "Order",
          event: "order.process",
          isError: true,
        };
        res(message);
      }

      try {
        await createVps(
          user.id,
          vpsPackage.core_count,
          vpsPackage.ram,
          vpsPackage.disk,
          vpsPackage.price,
          vpsPackage.net_io_speed,
          targetPackageName
        );
      } catch (e) {
        message = {
          code: 404,
          sysCode: "QEMU_OUT_OF_STOCK",
          displayText: "One of the items you orderd is currently out of stock.",
          displayHeader: "Order",
          event: "order.process",
          isError: true,
        };
      }

      res(message);
    }

    if (item.service == "pterodactyl") {
      var pterodactyl_user_id: any = await get_pterodactyl_user(user);
      if (pterodactyl_user_id.new_user == true) {
        message = {
          code: 200,
          sysCode: "NEW_USER",
          displayText: "Please check your email to create panel credentials.",
          displayHeader: "Pterodactyl Panel",
          event: "deploy",
          isError: false,
        };
      }
      pterodactyl_user_id = pterodactyl_user_id.pterodactyl_id;
      var package_data: any = await searchPterodacylPackage(item.code);

      var template: any = JSON.parse(package_data.holder.container_template);
      template.environment = JSON.stringify(template.environmentArr).slice(
        1,
        -1
      );

      template.cpu = package_data.package.cpu;
      template.ram = package_data.package.ram;
      template.disk = package_data.package.disk;
      template.features.backups = package_data.package.backups;
      template.features.databases = package_data.package.databases;

      var allocationNodes = package_data.holder.nodes || null;
      var allocation = (await randomAllocation(allocationNodes)).attributes.id;

      var pterodactylObject = {
        name: await funny_name(),
        user: user.pterodactyl_id,
        egg: template.egg,
        docker_image: template.dockerImage,
        startup: template.startupCmd,
        environment: template.environmentArr,
        limits: {
          memory: template.ram,
          swap: 0,
          disk: template.disk,
          io: 500,
          cpu: template.cpu,
        },
        feature_limits: template.features,
        allocation: {
          default: allocation,
        },
        price: package_data.package.price,
        type: package_data.package.code,
      };

      await createPterodactylServer(pterodactylObject);
      await appendLog(
        `user.deploy.server|authorized`,
        {
          package: package_data.package.code,
        },
        `user.${user.id}`,
        user.username,
        `user.${user.id}`,
        user.username,
        true
      );

      res(message);
    }
  });
}

function funny_name() {
  return new Promise((res) => {
    fetch(
      `https://story-shack-cdn-v2.glitch.me/generators/funny-name-generator`
    )
      .then((data) => {
        data.json().then((data) => {
          res(data.data.name);
        });
      })
      .catch((e) => {
        console.log(e);
      });
  });
}

function get_pterodactyl_user(user) {
  return new Promise(async (res) => {
    if (
      user.pterodactyl_id == null ||
      user.pterodactyl_id == "" ||
      user.pterodactyl_id == undefined
    ) {
      var pterodactylUsers: any = await listAllPterodactylUsers();
      var pterodactylUser = pterodactylUsers.find(
        (u) => u.attributes.email == user.email
      );

      if (!pterodactylUser) {
        //create user

        await createPterodactylUser(
          user.email,
          user.username,
          user.first_name,
          user.last_name
        );

        var pterodactylUsers: any = await listAllPterodactylUsers();
        var pterodactylUser = pterodactylUsers.find(
          (u) => u.attributes.email == user.email
        );

        await mysqlQuery(
          `UPDATE users SET pterodactyl_user_id='${pterodactylUser.attributes.id}' WHERE id = '${user.id}'`
        );
        user.pterodactyl_id = pterodactylUser.attributes.id;

        res({
          new_user: true,
          pterodactyl_id: user.pterodactyl_id,
        });
      } else {
        await mysqlQuery(
          `UPDATE users SET pterodactyl_user_id='${pterodactylUser.attributes.id}' WHERE id = '${user.id}'`
        );
        user.pterodactyl_id = pterodactylUser.attributes.id;

        res({
          new_user: false,
          pterodactyl_id: user.pterodactyl_id,
        });
      }
    } else {
      res({
        new_user: false,
        pterodactyl_id: user.pterodactyl_id,
      });
    }
  });
}

function searchPterodacylPackage(type) {
  return new Promise(async (res) => {
    var catogories: any = await mysqlQuery(
      `SELECT * FROM pterodactyl_package_category`
    );
    for (const catogory of catogories) {
      var catogoryItems: any = await mysqlQuery(
        `SELECT * FROM pterodactyl_packages WHERE category = '${catogory.code}'`
      );
      var temp = catogoryItems.find((cat) => cat.code == type);
      if (temp != undefined)
        res({
          package: temp,
          holder: catogory,
        });
    }
    res(null);
  });
}
export { httpResolve };
