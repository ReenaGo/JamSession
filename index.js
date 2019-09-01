const path = require("path");
const express = require('express');
const session = require('express-session');
const twilio = require("twilio");
const bodyParser = require('body-parser')
const bcrypt = require ('bcrypt');
const SequelizeStore = require ('connect-session-sequelize')(session.Store);
const db = require ('./models');
const myStore = new SequelizeStore({db: db.sequelize});
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const ChatGrant = AccessToken.ChatGrant;
var http = require('http');
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
var    TWILIO_IPM_SERVICE_SID = process.env.TWILIO_CHAT_SERVICE_SID ;
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

// Express Routes

app.get("/test", (req, res, next) => {
  res.send("Success");
});

// ejs test
app.get("/reena", (req, res, next) => {
  res.render("login", { reena: "is the best" });
});


app.get("/signup", (req, res, next) => {
    res.render('signup', {})
});

app.post("/signup", (req, res, next)=>{
    // signup *****
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email =req.body.email;
    let password = req.body.password;
    console.log(firstName, lastName, email, password)

    bcrypt.hash(password,10,(err,hash)=>{
        db.user.create({firstName: firstName, lastName: lastName, email: email, password: hash,}).then((user)=>{
            req.session.user_id = user.id;
            res.redirect("/profilePage");
        });
    });

    
});




app.post('/login', (req,res,next)=>{

    var emailforlogin = req.body.emailforlogin;
    var passwordforlogin = req.body.passwordforlogin;

  
    db.user.findOne({ where: { email: emailforlogin } }).then(function (user) {
      if (user === null) {
        res.render('signup', { error_message: 'User Not Found' });
      } else {
        bcrypt.compare(passwordforlogin, user.password, function (err, matched) {
          if (matched) {
            // set user_id in the session
            req.session.user_id = user.id
            // redirect to welcome page
            res.redirect("/profilePage");
          } else {
            // render the login form
            res.render("signup", { error_message: 'Bad Password' });
          }
        });
      }
    });
})

app.get("/profilePage",(req,res,next)=>{
    // res.render('profilePage')
      db.user.findByPk(req.session.user_id).then(function (user) {
        res.render('profilePage', {
            firstName: user.firstName,
            lastName: user.lastName
        });
      });
  })

app.get("/chat" , function(req,res)
 {    
    //console.log(__dirname);
    //res.sendFile(__dirname);
    res.render('chat')
   
 }
);
    

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
/*
Generate an Access Token for a chat application user - it generates a random
username for the client requesting a token, and takes a device ID as a query
parameter.
*/
app.get('/chatToken', function(request, response) {
    var identity = request.query.identity;
    var endpointId = request.query.endpointId;

    // Create a "grant" which enables a client to use IPM as a given user,
    // on a given device
    var ipmGrant = new IpMessagingGrant({
        serviceSid: TWILIO_IPM_SERVICE_SID,
        endpointId: endpointId
    });

    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    //console.log(TWILIO_ACCOUNT_SID);
    //console.log(TWILIO_IPM_API_KEY);
    //console.log(TWILIO_IPM_API_SECRET);
    //console.log(TWILIO_IPM_SERVICE_SID);

    var token = new AccessToken(TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET);
    token.addGrant(ipmGrant);
    token.identity = identity;

    // Serialize the token to a JWT string and include it in a JSON response
    response.send({
        identity: identity,
        token: token.toJwt()
    });
});


app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}`);
});
