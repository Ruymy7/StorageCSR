/* 
* StorageCSR (ETSISI-UPM)
* Autor: Padrón Castañeda, Ruymán
* Trabajo Fin de Grado
*/

const express       = require('express');
const router        = express.Router();
const fs            = require('fs');
const nconf         = require('nconf');
const { exec }      = require('child_process');
const multer        = require('multer');
const xlsxj         = require("xlsx-to-json");
const iconvlite     = require('iconv-lite');
const http          = require('http');
const CronJob       = require('cron').CronJob;

/* Comprueba si el token es correcto antes de ejecutar la siguiente acción */
function checkAdminToken (req, res, next) {
    const apiToken = nconf.get('adminToken');
    const token = req.get('token');
    if(!token || token !== apiToken){
        return res.status(400).json({ error: "Wrong or missing token"});
    }
    next();
}

/* Comprueba si la sesión esta iniciada antes de seguir con lo demás */
function isSessionActive (req, res, next) {
    if(req.session.userInfo){
        next();
    } else {
        return res.status(400).json({error: "You must be logged in"})
    }
}

/* Multer para subir los ficheros xlsx de la parrilla */
const xlsStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const xls = 'public/xls';
        if (!fs.existsSync(xls)) {
            fs.mkdirSync(xls);
        }
        cb(null, xls);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const xlsUpload = multer({
    storage: xlsStorage
});

/* Función que convierte los ficheros xlsx de la parrilla a json para luego tratarlos */
function xlsToJSON(filename, res) {
    const path = 'public/xls/'+filename;
    xlsxj({
        input: path,
        output: path.replace(".xlsx", ".json"),
        lowerCaseHeaders:true
    }, function(err, result) {
        if(err) {
            console.error(err);
            res.send({saved: false, error: err});
        }else {
            startKalturaSession(result, filename, res);
        }
    });
}

/* Crea una sesión en el servidor de Kaltura que dura 10s para obtener los metadatos (título, subtítulo...) de los vídeos y audios de la parrilla */
function startKalturaSession(result, filename, res) {
    http.get("http://iaas92-43.cesvima.upm.es/api_v3/service/session/action/start?partnerId=103&secret=<kalturaSecret>&format=1&expiry=10", (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            const ks = data.replace(/"/g, '');
            JSONtoGrill(result, filename, res, ks); // Una vez obtenida la sesión se crea la parrilla con los datos de cada medio
        });
    }).on("error", (err) => {
        res.send({saved: false, error: err});
        console.log("Error: " + err.message);
    });
}

/* Función que crea el json que se almacenará y luego se enviará a la aplicación móvil */
function JSONtoGrill(json, filename, res, ks) {
    let saved = true;
    const grill = {
        "categories": [
            {
                "name": "videos",
                "mp4": "http://iaas92-43.cesvima.upm.es",
                "images": "http://iaas92-43.cesvima.upm.es",
                "videos": []
            }
        ]
    };

    json.forEach(function (element, i) {
        if(element.ID && element.ID !== '') {
            // Se obtienen los metadatos de cada podcast uno a uno usando la API de Kaltura
            http.get("http://iaas92-43.cesvima.upm.es/api_v3/index.php?service=media&action=get&entryId=" + element.ID + "&ks=" + ks + "&format=1", (resp) => {
                let metadata = '';
                resp.on('data', (chunk) => {
                    metadata += chunk;
                });
                resp.on('end', () => {
                    metadata = JSON.parse(metadata);
                    let mediaType = metadata.mediaType == 1 ? "videos/mp4" : "audio/mp3" // Como se indica en la API de Kaltura, si el mediatype es == 1
                                                                                         // corresponde con un vídeo, en cambio si es == 5 corresponde a un audio
                    // Aquí se rellenan los metadatos de cada podcast con los obtenidos en Kaltura además de los introducidos en el fichero xlsx
                    const mp4Json = {
                        "subtitle": metadata.description || "",
                        "day": element.Dia || null,
                        "hour": element.Hora || null,
                        "sources": [
                            {
                                "type": "mp4",
                                "mime": mediaType,
                                "url": "/p/106/sp/0/playManifest/entryId/" + element.ID + "/format/url/flavorParamId/301951/video.mp4"
                            }
                        ],
                        "image": "/p/106/thumbnail/entry_id/" + element.ID + "/width/480/height/200",
                        "image-480x270": "/p/106/thumbnail/entry_id/" + element.ID + "/width/350/height/270",
                        "image-780x1200": "/p/106/thumbnail/entry_id/" + element.ID + "/width/780/height/1200",
                        "title": metadata.name || "",
                        "studio": "Campus Sur Radio",
                        "duration": parseInt(metadata.duration) || 0,
                    };
                    grill.categories[0].videos.push(mp4Json);

                    const path = 'public/jsons/' + filename.replace(".xlsx", ".json");
                    try {
                        // Si aun no existe el directorio /jsons debe crearse antes de guardar el archivo de la parrilla
                        if (!fs.existsSync('public/jsons/')) {
                            fs.mkdirSync('public/jsons/');
                            const str = iconvlite.encode(JSON.stringify(grill), 'iso-8859-1'); // Se codifica usando iso-8859-1 para que incluya tanto tildes como ñ
                            fs.writeFileSync(path, str);
                        } else {
                            const str = iconvlite.encode(JSON.stringify(grill), 'iso-8859-1'); // Se codifica usando iso-8859-1 para que incluya tanto tildes como ñ
                            fs.writeFileSync(path, str);
                        }
                    } catch (e) {
                        console.log(e);
                        // Si se produce algún error se notifica al front para que muestre una alerta
                        saved = false;
                        res.send({saved: false, error: e});
                    }
                });
            }).on("error", (err) => {
                console.log("Error: " + err.message);
                // Si se produce algún error se notifica al front para que muestre una alerta
                res.send({saved: false, error: err});
                saved = false;
            });
        }
    });
    // En caso de que se haya guardado correctamente el archivo se notifica al front para que muestre la alerta
    if(saved) {
        res.send({saved: true});
    }
}

// ---------------- POSTS ------------------

/* POST para descargar los cambios de GitHub y reiniciar el servidor para que se apliquen */
// Antes de realizar lo definido en el interior debe comprobar que la llamada incluye el token de administrador
router.post('/pull', checkAdminToken, function (req, res, next) {
    // Se usa en el servidor de producción, de esta manera no es necesario acceder por SSH u otro método para descargar los cambios
    exec('git stash && git pull && git stash apply && pm2 restart StorageCSR', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.send('Error: ' + error);
            return;
        }
        res.send(stdout);
    });
});

/* POST para añadir la parrilla de radio */
// Antes de guardar el archivo se debe comprobar si la sesión está iniciada para evitar que se suban archivos sin permiso
router.post('/addgrill', isSessionActive, xlsUpload.single('file'), function(req, res, next) {
    xlsToJSON(req.file.filename, res); // Llamada a función que transforma el xlsx a json
});

// ---------------- GETS ------------------

/* GET que muestra la página principal de administración */
router.get('/', function(req, res, next){
    xlsActual = false;
    xlsSiguiente = false;
    const path = "public/xls/";
    
    // Comprobamos si hay parrilla de semana actual y semana siguiente guardadas en el servidor para luego mostrarlo en el front
    if(fs.existsSync(path + "semana_actual.xlsx")) xlsActual = true;
    if(fs.existsSync(path + "semana_siguiente.xlsx")) xlsSiguiente = true;

    res.render('admin', {title: "CSR Administración", xlsActual: xlsActual, xlsSiguiente: xlsSiguiente});
});


router.get('/addgrill', function(req, res, next){
    res.redirect('/');
});

/* Cron que cambia la parrilla cada semana */
new CronJob('1 0 * * 1', function() { // Se ejecuta cada lunes a las 00:01 de manera que cada semana cambia la parrilla
    const jsonPath = 'public/jsons/';
    const xlsxPath = 'public/xls/';

    // En caso de que no se incluya una parrilla de semana siguiente se seguirá usando la de semana actual de manera que no quede vacia la aplicación

    if(fs.existsSync(jsonPath + 'semana_siguiente.json') && fs.existsSync(jsonPath + 'semana_actual.json')){ // Si existe el fichero de la semana siguiente se elimina el de la semana actual
        // y se cambia el nombre del fichero semana_siguiente por el de semana_actual
        fs.unlinkSync(jsonPath + 'semana_actual.json');
        fs.renameSync(jsonPath + 'semana_siguiente.json', jsonPath + 'semana_actual.json');
        fs.unlinkSync(xlsxPath + 'semana_actual.xlsx');
        fs.renameSync(xlsxPath + 'semana_siguiente.xlsx', xlsxPath + 'semana_actual.xlsx');
        console.log('All files renamed');
    } else if(fs.existsSync(jsonPath + 'semana_siguiente.json')) { // En caso de que solo exista el de semana siguiente, lo renombramos a semana actual
        fs.renameSync(jsonPath + 'semana_siguiente.json', jsonPath + 'semana_actual.json');
        if(fs.existsSync(xlsxPath + 'semana_actual.xlsx')){
            fs.unlinkSync(xlsxPath + 'semana_actual.xlsx');
        }
        fs.renameSync(xlsxPath + 'semana_siguiente.xlsx', xlsxPath + 'semana_actual.xlsx');
        console.log('Only json files renamed');
    }
}, null, true);

module.exports = router;
