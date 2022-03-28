import { config } from "../config";
import { login } from "../session";

var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport(config.mail);

async function send(event, request, error) {
  var username = "Unknown";
  if (request.headers.authorization) {
    var session: any = await login(
      request.headers.authorization.split(" ")[1],
      ["SKIP_SERVERS", "SKIP_VPSS"]
    );
    username = session.username;
  }
  var mailOptions = {
    from: config.mail.auth.user,
    to: "jdk@dekuijperict.nl",
    subject: "An error/warning has occurred on your panel.",
    text: "You need an HTML email client to view this message.",
    html: `User: ${username}<br>
    Event: ${event}<br>
    Error: ${error}<br>
    Route: ${request.path}<br>
    Body: ${request.body == {} ? "empty" : JSON.stringify(request.body)}`,
  };

  //console.log(request);

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

export { send };
