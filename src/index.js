import express from "express";
import passport from "passport";
import bodyParser from "body-parser";
import cors from "cors";
import models from "./models";
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const app = express();

app.use(bodyParser.json());

let port = process.env.PORT || 24567;

// set the view engine to ejs
app.set("view engine", "ejs");

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + "/public"));

app.use(cors());
// const transporter = nodemailer.createTransport({
//   host: "sent.smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: process.env.YOUR_EMAIL_NAME,
//     pass: process.env.YOUR_EMAIL_PASS,
//   },
// });

var transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "1aa5732fb90c78",
    pass: "5c33c96aa360d5"
  }
});

const handlebarsOptions = {
  viewEngine: {
    extName: ".handlebars",
    partialsDir: "./src/services/",
    defaultLayout: false,
  },
  viewPath: "./src/services/",
  extName: ".handlebars",
};
transporter.use("compile", hbs(handlebarsOptions));
export {transporter}
// force: true will drop the table if it already exits
// models.sequelize.sync({ force: true }).then(() => {
models.sequelize.sync().then(() => {
  console.log("Drop and Resync with {force: true}");
});

// passport middleware
app.use(passport.initialize());

// passport config
require("./config/passport")(passport);

//default route
app.get("/", (req, res) => res.send("Hello my World"));

require("./routes/user.js")(app);

//create a server
var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("App listening at http://%s:%s", host, port);
});
