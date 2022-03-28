import { httpResponse } from "../interfaces/http";
import { httpError } from "../lib/http-error";
import { appendLog } from "../lib/log";
import { createPayment } from "../lib/paypal";
import { login } from "../session";

function httpResolve(app: any) {
  app.post("/@me/creditorder", function (req, res) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];

    if (process.argv.includes("--disablePaypal")) {
      let httpResponse: httpResponse = {
        messages: [
          {
            code: 200,
            sysCode: "PAYPAL_DISABLED",
            displayText: "PayPal payments have been disabled temporarily.",
            displayHeader: "Add balance",
            event: "user.me.creditorder",
            isError: true,
          },
        ],
        data: null,
        success: false,
      };
      res.json(httpResponse);
      return;
    }

    var creditAmount = req.body.amount;

    if (creditAmount < 5 || creditAmount > 100) {
      let httpResponse: httpResponse = {
        messages: [
          {
            code: 403,
            sysCode: "INVALID_AMOUNT",
            displayText: "The balance amount entered is invalid.",
            displayHeader: "Add balance",
            event: "user.me.creditorder",
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
        if (user.permissions.can_add_credit == false) {
          httpError(
            "user.me.creditorder",
            req,
            res,
            "NO_PERMISSIONS",
            "Add balance"
          );
          return;
        }

        await appendLog(
          `user.startcreditorder|authorized`,
          {
            amount: creditAmount,
          },
          `user.${user.id}`,
          user.username,
          `user.${user.id}`,
          user.username,
          false
        );

        createPayment(creditAmount, user.id)
          .then((url) => {
            let httpResponse: httpResponse = {
              messages: [
                {
                  code: 200,
                  sysCode: "ADD_CREDIT_PAYMENT_REDIRECT",
                  displayText: "Taking you to the payment gateway.",
                  displayHeader: "Add Balance",
                  event: "user.me.creditorder.redirect",
                  isError: false,
                },
              ],
              data: {
                url,
              },
              success: true,
            };
            res.json(httpResponse);
            return;
          })
          .catch((e) => {
            httpError("user.me.creditorder", req, res, e, "Add balance");
            return;
          });
      })
      .catch((e) => {
        httpError("user.me.creditorder", req, res, e, "Add balance");
        return;
      });
  });
}

export { httpResolve };
