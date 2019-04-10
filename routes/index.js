var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CSR Storage' , content: "Bienvenido al servidor de almacenamiento de Campus Sur Radio"});
});

module.exports = router;
