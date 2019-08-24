const path = require("path");

const express = require("express");
const session = require("express-session");

const twilio = require("twilio");
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const ChatGrant = AccessToken.ChatGrant;

const bcrypt = require("bcrypt");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const db = require("./models");
const myStore = new SequelizeStore({ db: db.sequelize });

// Only load local environment (.env) file if not hosted on Heroku, etc.
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Load configuration information from system environment variables.
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;
const PORT = process.env.PORT || 3000;

// Create an authenticated client to access the Twilio REST API
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const app = express();

app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUnitialized: true,
    store: myStore
  })
);

myStore.sync();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// set up ejs
app.set("view engine", "ejs");
app.set("views", "app/views");

// Express Routes

app.get("/test", (req, res, next) => {
  res.send("Success");
});

// ejs test
app.get("/reena", (req, res, next) => {
  res.render("login", { reena: "is the best" });
});

// endpoint to procure Twilio Video Token
app.get("/videoToken", (req, res) => {
  const identity = req.query.identity || "anonymous";

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created.
  const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET);

  // Assign the generated identity to the token (passed in from client)
  token.identity = identity;

  // Grant the access token Twilio Video capabilities.
  const grant = new VideoGrant();
  token.addGrant(grant);

  // Serialize the token to a JWT string and include it in a JSON response.
  res.send({
    identity: identity,
    token: token.toJwt()
  });
});

// endpoint to procure Twilio Chat Token
app.get("/chatToken", (req, res) => {
  const identity = req.query.identity || "anonymous";

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created.
  const token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET);

  // Assign the generated identity to the token (passed in from client)
  token.identity = identity;
  token.ttl = 7200;

  // Grant the access token Twilio Video capabilities.
  const grant = new ChatGrant();
  token.addGrant(grant);

  // Serialize the token to a JWT string and include it in a JSON response.
  res.send({
    identity: identity,
    token: token.toJwt()
  });
});

// app.use(function (req, res, next) {
//     if (req.session.user_id !== undefined) {
//       next();
//     } else if (req.path === "/login") {
//       next();
//     } else if (req.path === "/signup") {
//       next();
//     } else {
//       res.redirect("/login");
//     }
//   });

app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}`);
});
