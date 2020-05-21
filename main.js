var express = require('express');
const bodyParser = require('body-parser');
var crypto = require("crypto");
var app = express();
const dbManager = require('./db');
var config = new dbManager.Config();
var db = new dbManager.SQLite();
app.use(express.static('web'));
app.use(bodyParser.json())

function isAuthorized(req) {
    if ('query' in req && 'token' in req.query) {
        return db.isTokenValid(req.query.token);
    }
}

app.get('/api', function (req, res) {
    res.json({"message": "Hello World!"});
});

app.get('/api/isValid', function (req, res) {
    if (req.query.token) {
        isAuthorized(req).then((value) => {
            if (value) {
                res.json({"message": "Token is valid", "valid": true});
            } else {
                res.json({"message": "Token is not valid", "valid": false});
            }
        });
    }
});

app.post('/api/register/token', function (req, res) {
    if (!config.registrationEnabled(dbManager.REGTYPE_TOKEN)) {
        res.status(403).json({"error": "Token based registration is not allowed"})
        return
    }
    let token = crypto.randomBytes(32).toString('hex');
    db.registerUser(token, dbManager.REGTYPE_TOKEN);
    res.json({"message": "Created user.", "token": token});
});

app.get('/api/register', function (req, res) {
   res.json(config.getRegistrationOptions());
});

app.put('/api/positions', function (req, res) {
    // Body has to have id, long and lat
    isAuthorized(req).then((authorized => {
        if (authorized) {
            if ('id' in req.body && 'long' in req.body && 'lat' in req.body) {
                //TODO The following method should not assume the token to be in the query
                db.setPos(req.query.token, req.body['id'], req.body['lat'], req.body['long']).then(() => {
                    db.getPositions(req.query.token).then((result) => {
                        res.json({"message": "Saved position", positions: result})
                    })
                });
            } else {
                res.status(400).json({"error": "Wrong Body!"})
            }
        } else {
            res.status(401).json({"error": "Not logged in!"})
        }
    }));
});

app.get('/api/positions', function (req, res) {
    isAuthorized(req).then((authorized => {
        if (authorized) {
            //TODO The following method should not assume the token to be in the query
            db.getPositions(req.query.token).then((result) => {
                res.json({"message": "There are positions", positions: result})
            })
        } else {
            res.status(401).json({"error": "Not logged in!"})
        }
    }))
});


app.listen(config.getWebserverPort(), config.getBindAddress(), function () {
    console.log(`Running app on port ${config.getWebserverPort()}!`);
});
