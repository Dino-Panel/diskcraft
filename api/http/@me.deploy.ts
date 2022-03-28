import { httpResponse } from "../interfaces/http";
import { httpError } from "../lib/http-error";
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
  app.get("/@me/deploy", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

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

    login(token, ["SKIP_VPSS", "SKIP_SERVERS"])
      .then(async (user: any) => {
        if (user.permissions.can_deploy == false) {
          let httpResponse: httpResponse = {
            messages: [
              {
                code: 401,
                sysCode: "NO_DEPLOY_PERMS",
                displayText:
                  "You don't have permission to create a new server!",
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
                displayText:
                  "You don't have permission to create a new server!",
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

        var vpsPackages = await mysqlQuery(
          `SELECT * FROM qemu_packages WHERE shown = '1'`
        );
        var list: any = await redisCache(`deployment_packages`);

        if (list == null) {
          list = [];
          var catogories: any = await mysqlQuery(
            `SELECT code, name FROM pterodactyl_package_category`
          );
          for (const catogory of catogories) {
            var catogoryItems = await mysqlQuery(
              `SELECT * FROM pterodactyl_packages WHERE category = '${catogory.code}'`
            );
            list.push({
              code: catogory.code,
              name: catogory.name,
              list: catogoryItems,
            });
          }
          client.setex(`deployment_packages`, 30, JSON.stringify(list));
        } else {
          list = JSON.parse(list);
        }

        let httpResponse: httpResponse = {
          messages: [],
          data: {
            vps: vpsPackages,
            pterodactyl: list,
          },
          success: true,
        };
        res.json(httpResponse);
        return;
      })
      .catch((e) => {
        httpError("user.me.deploy", req, res, e, "Deployment");
      });
  });

  app.post("/@me/deploy", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    if (process.argv.includes("--disableDeploy")) {
      httpError("user.me.deploy", req, res, "DEPLOY_DISABLED", "Deployment");
      return;
    }

    var itemType = req.body.service;
    var validItemTypes = ["vps", "pterodactyl"];

    if (validItemTypes.includes(itemType) == false) {
      httpError(
        "user.me.deploy",
        req,
        res,
        "DEPLOY_SERVICE_NOT_FOUND",
        "Deployment"
      );
      return;
    }

    login(token, ["SKIP_VPSS", "SKIP_SERVERS"])
      .then(async (user: any) => {
        if (user.permissions.can_deploy == false) {
          httpError("user.me.deploy", req, res, "NO_PERMISSIONS", "Deployment");
          return;
        }

        if (
          user.pterodactyl_id == null &&
          user.permissions.can_enable_pterodactyl == false
        ) {
          httpError("user.me.deploy", req, res, "NO_PERMISSIONS", "Deployment");
          return;
        }

        if (itemType == "vps") {
          var targetPackageName: any = req.body.package;
          var vpsPackages: any = await mysqlQuery(
            `SELECT * FROM qemu_packages WHERE shown = '1'`
          );
          var vpsPackage = vpsPackages.find(
            (pkg) => pkg.code == targetPackageName
          );

          if (!vpsPackage) {
            httpError(
              "user.me.deploy",
              req,
              res,
              "DEPLOY_SERVICE_NOT_FOUND",
              "Deployment"
            );
            return;
          }

          createVps(
            user.id,
            vpsPackage.core_count,
            vpsPackage.ram,
            vpsPackage.disk,
            vpsPackage.price,
            vpsPackage.net_io_speed,
            targetPackageName
          )
            .then(async () => {
              let httpResponse: httpResponse = {
                messages: [
                  {
                    code: 200,
                    sysCode: "VPS_CREATED",
                    displayText: "Your new VPS has been created.",
                    displayHeader: "Deployment",
                    event: "deploy",
                    isError: false,
                  },
                ],
                data: null,
                success: true,
              };
              res.json(httpResponse);

              await appendLog(
                `user.deploy.vps|authorized`,
                {
                  package: targetPackageName,
                },
                `user.${user.id}`,
                user.username,
                `user.${user.id}`,
                user.username,
                true
              );
              return;
            })
            .catch((e) => {
              httpError("user.me.deploy", req, res, e, "Deployment");
              return;
            });
        }
        if (itemType == "pterodactyl") {
          var targetPackage: any = req.body.package;
          const targetPackageName = targetPackage;
          targetPackage = await searchPterodacylPackage(targetPackage);

          if (!targetPackage) {
            httpError(
              "user.me.deploy",
              req,
              res,
              "DEPLOY_SERVICE_NOT_FOUND",
              "Deployment"
            );
            return;
          }

          var template: any = JSON.parse(
            targetPackage.holder.container_template
          );
          template.environment = JSON.stringify(template.environmentArr).slice(
            1,
            -1
          );

          template.cpu = targetPackage.package.cpu;
          template.ram = targetPackage.package.ram;
          template.disk = targetPackage.package.disk;
          template.features.backups = targetPackage.package.backups;
          template.features.databases = targetPackage.package.databases;

          if (user.balance - targetPackage.package.price < 0) {
            httpError("user.me.deploy", req, res, "NO_BALANCE", "Deployment");
            return;
          }

          var isNewUser = false;

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

              isNewUser = true;

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

              if (!pterodactylUser) {
                httpError("user.me.deploy", req, res, "UNKOWN", "Deployment");
              }

              await mysqlQuery(
                `UPDATE users SET pterodactyl_user_id='${pterodactylUser.attributes.id}' WHERE id = '${user.id}'`
              );
              user.pterodactyl_id = pterodactylUser.attributes.id;
            } else {
              await mysqlQuery(
                `UPDATE users SET pterodactyl_user_id='${pterodactylUser.attributes.id}' WHERE id = '${user.id}'`
              );
              user.pterodactyl_id = pterodactylUser.attributes.id;
            }
          }

          var allocationNodes = targetPackage.holder.nodes || null;
          var allocation = (await randomAllocation(allocationNodes)).attributes
            .id;

          if (allocation == null) {
            httpError("user.me.deploy", req, res, "OUT_OF_STOCK", "Deployment");
            return;
          }

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
            price: targetPackage.package.price,
            type: targetPackage.package.code,
          };

          await createPterodactylServer(pterodactylObject);
          await appendLog(
            `user.deploy.server|authorized`,
            {
              package: targetPackageName,
            },
            `user.${user.id}`,
            user.username,
            `user.${user.id}`,
            user.username,
            true
          );

          if (isNewUser == false) {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 200,
                  sysCode: "SERVER_DEPLOYMENT",
                  displayText: "Your new server has been created.",
                  displayHeader: "Deployment",
                  event: "deploy",
                  isError: false,
                },
              ],
              data: null,
              success: true,
            };
            res.json(httpResponse);
            return;
          } else {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 200,
                  sysCode: "SERVER_DEPLOYMENT",
                  displayText: "Your new server has been created.",
                  displayHeader: "Deployment",
                  event: "deploy",
                  isError: false,
                },
                {
                  code: 200,
                  sysCode: "NEW_USER",
                  displayText:
                    "Please check your email to create panel credentials.",
                  displayHeader: "Pterodactyl Panel",
                  event: "deploy",
                  isError: false,
                },
              ],
              data: null,
              success: true,
            };
            res.json(httpResponse);
            return;
          }
        }
      })
      .catch((e) => {
        httpError("user.me.deploy", req, res, e, "Deployment");
        return;
      });
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
