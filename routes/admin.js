const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

router.post('/pull', function (req, res, next) {
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