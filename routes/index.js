let express = require('express');
let database = require('../database.js')
let router = express.Router();
const { check, body } = require("express-validator");
const jwt = require("jsonwebtoken");
const { google } = require('googleapis');

const OAuth2Data = require('../google_key.json')

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0]

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
let authed = false;

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/auth/google', (req, res) => {
  if (!authed) {
      // Generate an OAuth URL and redirect there
      const url = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: 'https://www.googleapis.com/auth/gmail.readonly'
      });
      console.log(url)
      res.redirect(url);
  } else {
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      gmail.users.labels.list({
          userId: 'me',
      }, (err, res) => {
          if (err) return console.log('The API returned an error: ' + err);
          const labels = res.data.labels;
          if (labels.length) {
              console.log('Labels:');
              labels.forEach((label) => {
                  console.log(`- ${label.name}`);
              });
          } else {
              console.log('No labels found.');
          }
      });
      res.send('Logged in')
  }
})

router.get('/auth/google/callback', function (req, res) {
  const code = req.query.code
  if (code) {
      // Get an access token based on our OAuth code
      oAuth2Client.getToken(code, function (err, tokens) {
          if (err) {
              console.log('Error authenticating')
              console.log(err);
          } else {
              console.log('Successfully authenticated');
              oAuth2Client.setCredentials(tokens);
              authed = true;
              res.redirect('/')
          }
      });
  }
});

router.post('/auth/signin', async (req, res, next) => {
  check(req.body.email, "Wrong email").isEmail();
  check(req.body.password, "Wrond password");

  const exists = await database.matchPasswordByEmail(req.body.email, req.body.password);

  if(!exists){
    return res.status(422).send({error: 'account with such email or password doesn\'t exist or is not activated yet'})
  }
  const data = {id: await database.getUserIdByEmail(req.body.email)};
  const token = jwt.sign(data, "rsa", {expiresIn: "1h"});

  return res.status(200).send({
    message: 'Signed in',
    token
  });
})

router.post('/auth/signup', async (req, res, next) => {
  check(req.body.email, "Wrong email").isEmail();
  check(req.body.username, "Username is requied").not().isEmpty().isLength({min: 3});
  check(req.body.password, "Wrond password");

  const exists = await database.existsUserByEmail(req.body.email);

  if(exists){
    return res.status(422).send({message: 'email taken'})
  }
  
  const creation = await database.createUser(req.body.email, req.body.username, req.body.password);

  if(!creation){
    return res.status(500).send({message: 'error while creating user'})
  }

  return res.status(200).send({message: 'registered successfully!'});
})

module.exports = router;
