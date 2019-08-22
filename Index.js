const path = require("path");

const express = require('express');
const session = require('express-session');
const twilio = require("twilio");
const bcrypt = require ('bcrypt');
const SequelizeStore = require ('connect-session-sequelize')(session.Store);
const db = require ('./models');
const myStore = new SequelizeStore({db: db.sequelize});


if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

// Load configuration information from system environment variables.
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

console.log(TWILIO_ACCOUNT_SID);

const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;
const REENA = process.env.REENA;

const PORT = process.env.PORT || 3000;

// Create an authenticated client to access the Twilio REST API
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const app = express();

app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUnitialized: true,
    store: myStore
}));

myStore.sync();

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, "public")));





app.get("/test", (req, res, next) => {
    console.log(REENA);
    res.send("Success");
  });

  app.get("/reena", (req, res, next) => {
    res.render("login", {reena: "is the best"});
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

app.set('view engine', 'ejs');
app.set('views', 'app/views');

app.listen(PORT, () => {
    console.log(`Express listening on port ${PORT}`);
})