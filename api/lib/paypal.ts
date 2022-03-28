import { mysqlQuery } from "./mysql";
import * as utc from "./time";
import { listAllUsers, setUserCredit } from "./users";
import { config } from "../config";
var cluster = require("cluster");
const util = require("util");
var isJobRunner = false;
import * as paypalPaymentEmail from "../email/PayPalPaymentConfirm";

process.on("message", function (msg) {
  if (msg.threadWorker) {
    if (msg.threadWorker == cluster.worker.id) {
      isJobRunner = true;
    } else {
      isJobRunner = false;
    }
  }
});

const paypal = require("@paypal/checkout-server-sdk");
let environment;

if (config.paypal.mode == "live") {
  environment = new paypal.core.LiveEnvironment(
    config.paypal.client_id,
    config.paypal.client_secret
  );
} else {
  environment = new paypal.core.SandboxEnvironment(
    config.paypal.client_id,
    config.paypal.client_secret
  );
}

let client = new paypal.core.PayPalHttpClient(environment);

function createPayment(amount, userId) {
  return new Promise(async (res, rej) => {
    let request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: "CAPTURE",
      application_context: {
        return_url: config.paypal.return_url,
        cancel_url: config.paypal.cancel_url,
        brand_name: config.panel.company_name_full,
      },
      purchase_units: [
        {
          reference_id: userId,
          custom_id: userId,
          amount: {
            currency_code: config.paypal.currency,
            value: amount,
            breakdown: {
              item_total: {
                currency_code: config.paypal.currency,
                value: amount,
              },
            },
          },
          items: [
            {
              name: "Credit",
              sku: "item",
              unit_amount: {
                value: amount,
                currency_code: config.paypal.currency,
              },

              quantity: 1,
            },
          ],
        },
      ],
    });
    let response = await client.execute(request);
    await mysqlQuery(
      `INSERT INTO paypal_pending_payments(transaction_id) VALUES ('${response.result.id}')`
    );

    res(response.result.links[1].href);
  });
}

async function start() {
  // if (isJobRunner == true)
  await checkPendingPayments();
  setInterval(async () => {
    // if (isJobRunner == true)
    await checkPendingPayments();
  }, 60000);
}

async function checkPendingPayments() {
  return new Promise(async (res) => {
    var users: any = await listAllUsers(["SKIP_VPSS", "SKIP_USERS"]);
    var awaiting_payments: any = await mysqlQuery(
      `SELECT * FROM paypal_pending_payments`
    );
    for (var payment of awaiting_payments) {
      if (
        utc.addHours(new Date(payment.expire_at), 2).getTime() <
        utc.getTime(new Date()).getTime()
      ) {
        await mysqlQuery(
          `DELETE FROM paypal_pending_payments WHERE id = ${payment.id}`
        );
      } else {
        await doPayment(payment, users);
      }
    }
    res(true);
  });
}

function doPayment(paymentDb, users) {
  return new Promise(async (res) => {
    const request = new paypal.orders.OrdersGetRequest(
      paymentDb.transaction_id
    );
    const response = await client.execute(request);
    var payment_status = response.result.status;

    if (payment_status == "COMPLETED" || payment_status == "APPROVED") {
      const request = new paypal.orders.OrdersCaptureRequest(
        paymentDb.transaction_id
      );
      try {
        const response_capture = await client.execute(request);
      } catch (e) {
        console.log(e);
        await mysqlQuery(
          `DELETE FROM paypal_pending_payments WHERE id = ${paymentDb.id}`
        );
        res(false);
      }

      // console.log(
      //   util.inspect(response_capture, { showHidden: false, depth: null })
      // );

      var payment_amout = parseInt(
        response.result.purchase_units[0].amount.value
      );
      var payment_user = response.result.purchase_units[0].custom_id;

      var user = users.find((usr) => usr.id == payment_user);
      if (user) {
        await paypalPaymentEmail.send(user.email, payment_amout);
        await setUserCredit(user, user.balance + payment_amout);
        await mysqlQuery(
          `DELETE FROM paypal_pending_payments WHERE id = ${paymentDb.id}`
        );
        res(true);
      }
    } else {
      var payment_amout = parseInt(
        response.result.purchase_units[0].amount.value
      );
      var payment_user = response.result.purchase_units[0].custom_id;
      var user = users.find((usr) => usr.id == payment_user);
      console.log(
        `Payment [${paymentDb.transaction_id}] of ${config.currency.symbol}${payment_amout} from user ${user.username} has a status of '${payment_status}'`
      );
    }

    res(true);
  });
}

export { start, createPayment };
