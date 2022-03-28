const cryptoLib = require("crypto");
const DiscordOauth2 = require("discord-oauth2");
var fetch = require("node-fetch");

var client_id = "805024245977448458";
var client_secret = "GOQM2LQRdSvIUDuGidB0PfbyBEJRsAz6";
var redirect_url = "https://panel.diskos.net/discordauthcallback";

function createAuthUrl() {
  const oauth = new DiscordOauth2({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_url,
  });

  const url = oauth.generateAuthUrl({
    scope: ["email", "identify"],
    state: cryptoLib.randomBytes(16).toString("hex"), // Be aware that randomBytes is sync if no callback is provided
  });
  return url;
}

function codeToUser(code) {
  return new Promise((res, rej) => {
    fetch(`https://discord.com/api/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `client_id=${client_id}&client_secret=${client_secret}&grant_type=authorization_code&code=${code}&redirect_uri=${redirect_url}`,
    })
      .then((resp) => {
        if (resp.status != 200) {
          rej("Code verification failed");
          return;
        }
        resp.json().then((data) => {
          var token = data.access_token;

          fetch(`https://discord.com/api/users/@me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((resp) => {
              if (resp.status != 200) {
                rej("Code verification failed");
              } else {
                resp.json().then((data) => {
                  res(data.id);
                });
              }
            })
            .catch(() => {
              rej("Code verification failed");
            });
        });
      })
      .catch(() => {
        rej("Code verification failed");
      });
  });
}

export { createAuthUrl, codeToUser };
