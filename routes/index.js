/* 
* StorageCSR (ETSISI-UPM)
* Autor: Padrón Castañeda, Ruymán
* Trabajo Fin de Grado
*/

const express = require('express');
const router = express.Router();

/* GET para obtener la página con las funcionalidades de la API */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'CSR Storage'});
});

module.exports = router;
