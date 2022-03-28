import { config } from "./config";

import * as status from "./http/status";
import * as panel_capabilities from "./http/panelcapabilities";
import * as auth from "./http/auth";
import * as discord_auth from "./http/discordauth";
import * as discord_authorize from "./http/discordauthorize";
import * as finish_vps_install from "./http/finish_install";

import * as at_me from "./http/@me";
import * as register from "./http/register";
import * as me_vps from "./http/@me.vps";
import * as me_vps_metrics from "./http/@me.vps.metrics";
import * as me_servers from "./http/@me.servers";
import * as me_vps_powerstate from "./http/@me.vps.powerstate";
import * as me_vps_iso from "./http/@me.vps.iso";
import * as activate from "./http/activate";
import * as me_cancel from "./http/@me.cancel";
import * as me_deploy from "./http/@me.deploy";
import * as me_creditorder from "./http/@me.creditorder";
import * as me_changepassword from "./http/@me.changepassword";
import * as me_vps_alias from "./http/@me.vps.alias";
import * as me_reporterror from "./http/@me.reporterror";
import * as me_server_reset from "./http/@me.server.reset";
import * as me_order from "./http/@me.order";
import * as me_searchuser from "./http/@me.searchuser";
import * as vps_deleteforward from "./http/@me.vps.deleteforward";
import * as vps_createforward from "./http/@me.vps.createforward";
import * as me_vps_reinstall from "./http/@me.vps.reinstall";

import * as admin_users from "./http/@admin.users";
import * as admin_user_permissions from "./http/@admin.user.permissions";
import * as admin_log from "./http/@admin.log";
import * as admin_cancelnow from "./http/@admin.cancelnow";

import * as httpErrorEmail from "./email/httpError";

var cors = require("cors");

function httpHandler(app: any) {
  app.use(cors());

  //handle requests that are made without auth headers
  app.use(function (req, res, next) {
    // if (req.headers.origin == null) {
    //   res.json(
    //     "This side of the API is not accessible without valid auth header, your attempt has been send to a system administrator!"
    //   );
    //   httpErrorEmail.send(
    //     "unauthorized_request_to_restricted_api_endpoint_from_illigal_origin",
    //     req,
    //     "unathorized"
    //   );
    //   return;
    // }
    if (req.path.includes("@me") || req.path.includes("@admin")) {
      if (
        req.headers.authorization == null ||
        req.headers.authorization.includes("Bearer") == false
      ) {
        res.json(
          "This side of the API is not accessible without valid auth header, your attempt has been send to a system administrator!"
        );
        httpErrorEmail.send(
          "unauthorized_request_to_restricted_api_endpoint_without_authorization",
          req,
          "unathorized"
        );
        return;
      }
    }

    next();
  });

  panel_capabilities.httpResolve(app);
  auth.httpResolve(app);
  activate.httpResolve(app);
  status.httpResolve(app);
  register.httpResolve(app);
  at_me.httpResolve(app);
  me_reporterror.httpResolve(app);
  me_searchuser.httpResolve(app);

  if (config.capabilities.discordAuthentication == true) {
    discord_auth.httpResolve(app);
    discord_authorize.httpResolve(app);
  }

  if (config.capabilities.qemuVps == true) {
    me_vps.httpResolve(app);
    me_vps_metrics.httpResolve(app);
    me_vps_iso.httpResolve(app);
    me_vps_reinstall.httpResolve(app);
    me_vps_powerstate.httpResolve(app);
    me_vps_alias.httpResolve(app);
    vps_deleteforward.httpResolve(app);
    vps_createforward.httpResolve(app);
    finish_vps_install.httpResolve(app);
  }

  if (config.capabilities.pterodactylServer == true) {
    me_servers.httpResolve(app);
    me_server_reset.httpResolve(app);
  }

  me_cancel.httpResolve(app);
  me_deploy.httpResolve(app);
  me_order.httpResolve(app);
  me_creditorder.httpResolve(app);
  me_changepassword.httpResolve(app);

  admin_users.httpResolve(app);
  admin_user_permissions.httpResolve(app);
  admin_log.httpResolve(app);
  admin_cancelnow.httpResolve(app);
}

export { httpHandler };
