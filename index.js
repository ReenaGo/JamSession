const path = require("path");
const express = require("express");
const session = require("express-session");
const twilio = require("twilio");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const db = require("./models");
const randomName = require("./public/randomname");
const myStore = new SequelizeStore({ db: db.sequelize });
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const ChatGrant = AccessToken.ChatGrant;
var http = require("http");
//var config = require('./config');
var IpMessagingGrant = AccessToken.IpMessagingGrant;
//var twiliAccntInfoFromFile=config.getTwiliAccountSettingsfromFile ;

// Only load local environment (.env) file if not hosted on Heroku, etc.
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Load configuration information from system environment variables.
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_CHAT_SERVICE_SID = process.env.TWILIO_CHAT_SERVICE_SID ;
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
    saveUninitialized: true,
    store: myStore
  })
);

myStore.sync();

// Middleware
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "assets")));

// set up ejs
app.set("view engine", "ejs");
app.set("views", "app/views");

//***********************************************************************************************/
//Signup functionality
app.get("/signup", (req, res, next) => {
  res.render("signup", {});
});

app.post("/signup", (req, res, next) => {
  // signup *****
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let email = req.body.email;
  let password = req.body.password;
  let bio = req.body.Bio1;
  let imageURL = req.body.imageURL;

  bcrypt.hash(password, 10, (err, hash) => {
    db.user
      .create({ firstName: firstName, lastName: lastName, email: email, Image: imageURL, Bio: bio, password: hash })
      .then(user => {
        req.session.user_id = user.id;
        res.redirect("/profilePage");
      });
  });
});

// ***************************************************************************************************
// login Functionality
app.post("/login", (req, res, next) => {
  var emailforlogin = req.body.emailforlogin;
  var passwordforlogin = req.body.passwordforlogin;
  db.user.findOne({ where: { email: emailforlogin } }).then(function(user) {
    if (user === null) {
      res.render("signup", { error_message: "User Not Found" });
    } else {
      bcrypt.compare(passwordforlogin, user.password, function(err, matched) {
        if (matched) {
          // set user_id in the session
          req.session.user_id = user.id;
          // redirect to welcome page
          res.redirect("/profilePage");
        } else {
          // render the login form
          res.render("signup", { error_message: "Bad Password" });
        }
      });
    }
  });
});

// ************************************************************************************************
// Profile Page Functionality
app.get("/profilePage", (req, res, next) => {
  // res.render('profilePage')
  db.user.findByPk(req.session.user_id).then(function(user) {
    db.communities
      .findAll({
        attributes: ["comName"]
      })
      .then(function(communities) {
        res.render("profilePage", {
          firstName: user.firstName,
          lastName: user.lastName,
          imageURL: user.Image,
          bio: user.Bio,
          communities: communities.comName
        });
      });
  });
});


// *************************************************************************************************
// community Page functionality
// app.get('community/:id', (req, res, next)=>{
//   let communityId = req.params.id;
//   db.communities.findOne(communityId).then(function (community)=>{
//     res.render('community', {
//       comName: communities.comName;
//       description: communities.description;
//     })
//   })
// })

// endpoint to procure Twilio Video Token
app.get("/videoToken", (req, res) => {
  const identity = req.query.identity || randomName();

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
/*
Generate an Access Token for a chat application user - it generates a random
username for the client requesting a token, and takes a device ID as a query
parameter.
*/

let credentials = require("./credentials.json");

app.get("/chatToken", function(req, res) {
  let username = req.query.username;
    console.log("username is: ", username);
  let token = new AccessToken(
      credentials.TWILIO_ACCOUNT_SID,
      credentials.TWILIO_API_KEY,
      credentials.TWILIO_API_SECRET,
      {
          identity: username,
          ttl: 40000
      }
  );

let grant = new ChatGrant({ serviceSid: credentials.TWILIO_CHAT_SERVICE_SID });

  token.addGrant(grant);
  const tokenJwt = token.toJwt();
  console.log("token: " + tokenJwt);

  res.send(tokenJwt);
});

app.get("/chat", function(req, res) {
  res.sendFile("/public/chat.html", { root: __dirname });
});

app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}`);
});
