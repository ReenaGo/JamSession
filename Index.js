const path = require("path");
const express = require('express');
const session = require('express-session');
const twilio = require("twilio");
const bodyParser = require('body-parser')
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
    saveUninitialized: true,
    store: myStore
}));

myStore.sync();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, "public")));





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
    


app.set('view engine', 'ejs');
app.set('views', 'app/views');

app.listen(PORT, () => {
    console.log(`Express listening on port ${PORT}`);
})