const express       = require('express');
const router        = express.Router();
const nconf         = require('nconf');
const { exec }      = require('child_process');

function checkAdminToken (req, res, next) {
    const apiToken = nconf.get('adminToken');
    const token = req.get('token');
    if(!token || token !== apiToken){
        return res.status(400).json({ error: "Wrong or missing token"});
    }
    next();
}

// ---------------- POSTS ------------------

router.post('/pull', checkAdminToken, function (req, res, next) {
    exec('git pull', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.send('Error: ' + error);
            return;
        }
        res.send(stdout);
    });
});

module.exports = router;