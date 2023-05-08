let express = require('express');
let database = require('../database.js')
let router = express.Router();
const { check, body } = require("express-validator");
const jwt = require("jsonwebtoken");

router.get('/public', async (req, res, next) => {
    const data = await database.getPublicResources()

    return res.status(200).send({data: data})
})

router.get('/user', async (req, res, next) => {
    const jwtToken = req.headers.authorization
    console.log(jwtToken)
    if(!jwtToken){
        return res.status(422).send({ error: "No token" });
    }

    jwt.verify(jwtToken, "rsa", async (error, decoded) => {
        if (error) {
          return res.status(422).send({ error: error }); 
        }

        const data = await database.getPrivateResources(await database.getUserRoleById(decoded.id));

        if(data == null){
            return res.status(403).send({error: 'access denied'});
        }

        return res.status(200).send(data);

    });
});

router.get('/admin-verify', (req, res, next) => {
    const jwtToken = req.headers.authorization
    if(!jwtToken){
        return res.status(422).send({ error: "No token" });
    }

    jwt.verify(jwtToken, "rsa", async (error, decoded) => {
        if (error) {
          return res.status(422).send({ error: error });
        }

        const data = await database.getUserRoleById(decoded.id);

        if(data == null){
            return res.status(403).send({message: 'access denied'});
        }

        return res.status(200).send({message: 'access allowed'})
    });
});

router.get('/admin', async (req, res, next) => {
    const jwtToken = req.headers.authorization
    if(!jwtToken){
        return res.status(422).send({ message: "No token" });
    }

    jwt.verify(jwtToken, "rsa", async (error, decoded) => {
        if (error) {
          return res.status(422).send({ error: error });
        }

        const data = await database.getAdminResources(await database.getUserRoleById(decoded.id));

        if(data == null){
            return res.status(403).send({message: 'access denied'});
        }

        return res.status(200).send(data);

    });
});

router.post('/activation', async (req, res, next) => {
    console.log(req.body);

    let givenId = req.body.id;

    database.changeStatusById(givenId);
});

router.get('/getUsers', async (req, res, next) => {
    const jwtToken = req.headers.authorization
    if(!jwtToken){
        return res.status(422).send({ message: "No token" });
    }

    jwt.verify(jwtToken, "rsa", async (error, decoded) => {
        if (error) {
          return res.status(422).send({ error: error });
        }

        const data = await database.getAllUsers();

        return res.status(200).send(data);
    });
});

module.exports = router;
