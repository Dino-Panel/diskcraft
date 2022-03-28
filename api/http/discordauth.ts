import { httpResponse } from "../interfaces/http";
import { createAuthUrl } from "../lib/discord";
import { appendLog } from "../lib/log";
import { login } from "../session";

function httpResolve(app: any) {
  app.get("/discordauth", function (req, res) {
    var authUrl = createAuthUrl();

    let httpResponse: httpResponse = {
      messages: [
        {
          code: 200,
          sysCode: "DISCORD_LOGIN_REDIRECT",
          displayText: "Taking you to the login page",
          displayHeader: "Discord Login",
          event: "discord.login",
          isError: false,
        },
      ],
      data: authUrl,
      success: true,
    };
    res.json(httpResponse);
    return;
  });
}

export { httpResolve };
