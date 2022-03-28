require("dotenv").config();
import { httpHandler } from "./http";
import * as billing from "./lib/billing";
import * as paypal from "./lib/paypal";
import { config } from "./config";
import { listAllUsers } from "./lib/users";
//import autoUpdate from "./lib/autoUpdate";

var cluster = require("cluster");
const totalCPUs = require("os").cpus().length;
if (cluster.isWorker) {
  //var workerId = ;
  var handledRequests = 0;
  var requestsPerWorker = 20;
  var express = require("express");
  var server = null;
  var app = express();
  var handleingRequests = 0;
  app.use(express.json());

  app.use(function (req, res, next) {
    handleingRequests++;
    res.header("X-Worker-Process", process.pid);
    res.header("X-Worker-Requests-Handled-Minute", handledRequests);
    setInterval(() => {
      handledRequests = 0;
    }, 60000);
    res.on("finish", function () {
      handledRequests++;
    });
    next();
  });

  httpHandler(app);

  server = app.listen(config.api.port, () => {});
} else {
  // autoUpdate().then(() => {
  var workers = [];

  cluster.on("fork", function (worker) {
    console.log("Worker : [ %d ][ Status : Forking ]", worker.process.pid);
  });

  cluster.on("online", function (worker) {
    console.log("Worker : [ %d ][ Status : Online ]", worker.process.pid);
  });

  cluster.on("listening", function (worker, address) {
    console.log(
      "Worker : [ %d ][ Status : Listening ][ Port : %d ]",
      worker.process.pid,
      address.port
    );
  });

  cluster.on("disconnect", function (worker) {
    console.log("Worker : [ %d ][ Status : Disconnected ]", worker.process.pid);
  });

  cluster.on("exit", function (worker, code, signal) {
    console.log(
      "Worker : [ %d ][ Status : Exit ][ Signal : %s ][ Code : %s ]",
      worker.process.pid,
      signal,
      code
    );

    workers.splice(workers.indexOf(worker), 1);
    workers.push(cluster.fork());

    var workerIds: any = Object.keys(cluster.workers);

    for (var worker of workers) {
      if (worker.state == "active")
        worker.send({
          threadWorker: Math.min(...workerIds),
        });
    }
  });

  var multiplier = 8 / totalCPUs;
  if (multiplier < 1) multiplier = 1;

  for (var i = 0; i < totalCPUs * multiplier; i++) {
    var worker = cluster.fork();
    workers.push(worker);
    worker.on(`stdout`, (data) => {
      console.log(data);
    });
  }

  var workerIds: any = Object.keys(cluster.workers);

  for (var worker of workers) {
    worker.send({
      threadWorker: Math.min(...workerIds),
    });
  }

  if (!process.argv.includes("--disableBilling")) {
    setInterval(() => {
      console.log();
      billing.run();
    }, 60000);

    billing.run();
  } else {
    console.log(`Starting with billing disabled`);
  }

  if (!process.argv.includes("--disablePaypal")) {
    setTimeout(() => {
      paypal.start();
    }, 1000);
  } else {
    console.log(`Starting with PayPal disabled`);
  }

  if (process.argv.includes("--disableDeployment")) {
    console.log(`Starting with deployment disabled`);
  }
  // });
}
