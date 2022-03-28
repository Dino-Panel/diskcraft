import git from "simple-git";
import fetch from "node-fetch";
import { spawn, exec } from "child_process";
var path = require("path");
var fs = require("fs");
const fse = require("fs-extra");

export default function () {
  return new Promise(async (res) => {
    var packageJsonCurrent = fs.readFileSync(
      path.join(__dirname, "../", "package.json"),
      "utf-8"
    );
    if (packageJsonCurrent) {
      packageJsonCurrent = JSON.parse(packageJsonCurrent);
      var currentVersion = packageJsonCurrent.version;

      var resp = await fetch(
        `https://raw.githubusercontent.com/Diskcraft/portal-api-base/main/package.json`
      );
      var remotePackageJson = await resp.json();
      var remoteVersion = remotePackageJson.version;

      if (remoteVersion != currentVersion) {
        await doUpdate();
        res(true);
        fs.rmdirSync(path.join(__dirname, "../", "temp"), {
          recursive: true,
        });
      }
      res(false);
      fs.rmdirSync(path.join(__dirname, "../", "temp"), {
        recursive: true,
      });
    }
  });
}

function doUpdate() {
  return new Promise((res, rej) => {
    if (!fs.existsSync(path.join(__dirname, "../", "temp"))) {
      fs.mkdirSync(path.join(__dirname, "../", "temp"));
    }

    git().clone(
      `https://github.com/Diskcraft/portal-api-base.git`,
      path.join(__dirname, "../", "temp"),
      [`--branch=main`],
      (result) => {
        if (result != null) rej(`Unable to clone repo \n ${result}`);
        res(true);

        fse.copySync(
          path.join(__dirname, "../", "temp"),
          path.join(__dirname, "../"),
          { overwrite: true },
          async function (err) {
            if (err) {
              console.error(err);
            } else {
              await updateDependencies();
              fs.rmdirSync(path.join(__dirname, "../", "temp"), {
                recursive: true,
              });
              res(true);
            }
          }
        );
      }
    );
  });
}

function updateDependencies() {
  return new Promise((res) => {
    let command = `npm install`;
    let child = exec(command);

    // Wait for results
    child.stdout.on("end", res);
    child.stdout.on("data", (data) =>
      console.log(
        "Auto Git Update - npm install: " + data.replace(/\r?\n|\r/g, "")
      )
    );
    child.stderr.on("data", (data) => {
      if (data.toLowerCase().includes("error")) {
        // npm passes warnings as errors, only reject if "error" is included
        data = data.replace(/\r?\n|\r/g, "");
        console.log("Auto Git Update - Error installing dependencies");
        console.log("Auto Git Update - " + data);
      } else {
        console.log("Auto Git Update - " + data);
      }
    });
  });
}
