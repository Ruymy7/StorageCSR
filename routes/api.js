var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET users listing. */
router.get('/video', function(req, res, next) {

  res.send('respond with a resource');
});

router.post('/videoList', function(req, res, next){
  fs.linkSync();
});

module.exports = router;
