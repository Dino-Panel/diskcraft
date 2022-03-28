import { config } from "../config";

var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport(config.mail);

function send(email: string, fileLoc) {
  var mailOptions = {
    from: config.mail.auth.user,
    to: email,
    subject: "VPS Graph",
    text: "You need an HTML email client to view this message.",
    html: ``,
    attachments: [
      {
        filename: "graph.png",
        path: fileLoc, // stream this file
      },
    ],
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

export { send };
