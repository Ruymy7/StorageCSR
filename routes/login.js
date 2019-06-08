/* 
* StorageCSR (ETSISI-UPM)
* Autor: Padrón Castañeda, Ruymán
* Trabajo Fin de Grado
*/

const express   = require('express');
const router    = express.Router();
const fs        = require('fs');
const bcryptjs  = require('bcryptjs');

/* GET para obtener la página de login */
router.get('/', function(req, res, next) {
    res.render('login', { title: 'CSR Storage'});
});

/* POST al que se envía el usuario y contraseña para inciar sesión */
router.post('/', function (req, res, next) {
   const user = req.body.user;
   const password = req.body.password;
   const path = 'users.json';
   const file = JSON.parse(fs.readFileSync(path, 'utf-8'));
   // Se busca en el fichero de usuarios el nombre de usuario y el hash de la contraseña almacenados
   const index = file.users.indexOf(user);
   if(index >= 0) { // En caso de que no exista el usuario index tendría el valor -1
       const hash = file.passwords[index]; // Se busca el hash para ese índice que es el índice del usuario introducido
       if (checkPasswordHash(password, hash)) {
           // Usuario y contraseña correctos
           req.session.userInfo = { user: user };
           res.send({valid: true});
       } else {
           // Usuario y contraseña incorrectos
           res.json({valid: false});
       }
   } else {
       res.json({valid: false});
   }
});

/* POST para cerrar la sesión */
router.post('/logout', function (req, res, next) {
    req.session.destroy();
});

/* Función para crear contraseñas para nuevos usuarios */
function getPasswordHash(password) {
    return bcryptjs.hashSync(password, bcryptjs.genSaltSync());
}

/* Función que comprueba que la contraseña coincide con el hash almacenado para ella */
function checkPasswordHash(password, hash) {
    return bcryptjs.compareSync(password, hash);
}

module.exports = router;