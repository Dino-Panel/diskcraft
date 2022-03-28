import { httpResponse } from "../interfaces/http";
import * as httpErrorEmail from "../email/httpError";
const knownErrors = [
  "LOGIN_TOKEN_ERROR",
  "DEPLOY_DISABLED",
  "DEPLOY_SERVICE_NOT_FOUND",
  "NO_PERMISSIONS",
  "NO_BALANCE",
  "NO_IP",
  "OUT_OF_STOCK",
  "INVALID_REQUEST_BODY",
];

function httpError(event, request, response, error, msgBoxTitle) {
  if (!knownErrors.includes(error)) {
    return unknownError(event, request, response, error, msgBoxTitle);
  }

  if (error != "LOGIN_TOKEN_ERROR") {
    httpErrorEmail.send(event, request, error);
  }

  let httpResponse: httpResponse = {
    messages: [
      {
        code: 403,
        sysCode: "UNUSED",
        displayText: "",
        displayHeader: msgBoxTitle || "",
        event: event,
        isError: true,
      },
    ],
    data: null,
    success: false,
  };

  var errorNotification = httpResponse.messages[0];

  if (error == "LOGIN_TOKEN_ERROR") {
    errorNotification.code = 401;
    errorNotification.sysCode = "SESSION_EXPIRED";
    errorNotification.displayText =
      "Your session has expired, please sign in again.";
    errorNotification.displayHeader = "Session";
  }

  if (error == "DEPLOY_DISABLED") {
    errorNotification.code = 503;
    errorNotification.sysCode = "DEPLOY_DISABLED";
    errorNotification.displayText = "The deployment feature has been disabled.";
    errorNotification.displayHeader = "Deployment";
  }

  if (error == "DEPLOY_SERVICE_NOT_FOUND") {
    errorNotification.code = 404;
    errorNotification.sysCode = "SERVICE_NOT_FOUND";
    errorNotification.displayText = "The selected package could not be found.";
    errorNotification.displayHeader = "Deployment";
  }

  if (error == "NO_PERMISSIONS") {
    errorNotification.code = 403;
    errorNotification.sysCode = "NO_PERMISSIONS";
    errorNotification.displayText =
      "You don't have permission to perform this action.";
  }
  if (error == "NO_BALANCE") {
    errorNotification.code = 402;
    errorNotification.sysCode = "NO_BALANCE";
    errorNotification.displayText =
      "You don't have enough balance to perform this action.";
  }
  if (error == "NO_IP" || error == "OUT_OF_STOCK") {
    errorNotification.code = 409;
    errorNotification.sysCode = "OUT_OF_STOCK";
    errorNotification.displayText =
      "The selected item is currently out of stock.";
  }
  if (error == "INVALID_REQUEST_BODY") {
    errorNotification.code = 400;
    errorNotification.sysCode = "INVALID_REQUEST_BODY";
    errorNotification.displayText =
      "There is something wrong with the body sent along the request.";
  }

  return response.json(httpResponse);
}

function unknownError(event, request, response, error, msgBoxTitle) {
  let httpResponse: httpResponse = {
    messages: [
      {
        code: 500,
        sysCode: "UNUSED",
        displayText: "An unkown error has occurred, please try again later",
        displayHeader: msgBoxTitle,
        event: event,
        isError: true,
      },
    ],
    data: null,
    success: false,
  };

  return response.json(httpResponse);
}

export { httpError };
