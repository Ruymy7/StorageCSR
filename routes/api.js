var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET users listing. */
router.get('/videos', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/videoList', function(req, res, next){
  const list = req.body.list;
  fs.linkSync();
});

module.exports = router;
