let express = require('express');
let database = require('../database.js')
let router = express.Router();
const { check, body } = require("express-validator");
const jwt = require("jsonwebtoken");

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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
