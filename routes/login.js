const express   = require('express');
const router    = express.Router();
const fs        = require('fs');
const bcryptjs  = require('bcryptjs');

router.get('/', function(req, res, next) {
    res.render('login', { title: 'CSR Storage'});
});

router.post('/', function (req, res, next) {
   const user = req.body.user;
   const password = req.body.password;
   const path = 'users.json';
   const file = JSON.parse(fs.readFileSync(path, 'utf-8'));
   const index = file.users.indexOf(user);
   if(index >= 0) {
       const hash = file.passwords[index];
       if (checkPasswordHash(password, hash)) {
           req.session.userInfo = { user: user };
           res.send({valid: true});
       } else {
           res.json({valid: false});
       }
   } else {
       res.json({valid: false});
   }
});

router.post('/logout', function (req, res, next) {
    req.session.destroy();
});

function getPasswordHash(password) { // Opción para crear contraseñas para nuevos usuarios
    return bcryptjs.hashSync(password, bcryptjs.genSaltSync());
}

function checkPasswordHash(password, hash) {
    return bcryptjs.compareSync(password, hash);
}

module.exports = router;