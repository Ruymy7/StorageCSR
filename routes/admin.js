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

function checkAdminToken (req, res, next) {
    const apiToken = nconf.get('adminToken');
    const token = req.get('token');
    if(!token || token !== apiToken){
        return res.status(400).json({ error: "Wrong or missing token"});
    }
    next();
}

function isSessionActive (req, res, next) {
    if(req.session.userInfo){
        next();
    } else {
        return res.status(400).json({error: "You must be logged in"})
    }
}

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

function startKalturaSession(result, filename, res) {
    http.get("http://iaas92-43.cesvima.upm.es/api_v3/service/session/action/start?partnerId=103&secret=84663d015be15d8bf0ce58d7de6c552d&format=1&expiry=10", (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            const ks = data.replace(/"/g, '');
            JSONtoGrill(result, filename, res, ks);
        });
    }).on("error", (err) => {
        res.send({saved: false, error: err});
        console.log("Error: " + err.message);
    });
}

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
            http.get("http://iaas92-43.cesvima.upm.es/api_v3/index.php?service=media&action=get&entryId=" + element.ID + "&ks=" + ks + "&format=1", (resp) => {
                let metadata = '';
                resp.on('data', (chunk) => {
                    metadata += chunk;
                });
                resp.on('end', () => {
                    metadata = JSON.parse(metadata);
                    const mp4Json = {
                        "start-timestamp": element.Timestamp_inicio || 0,
                        "end-timestamp": element.Timestamp_final || 0,
                        "subtitle": metadata.description || "",
                        "day": element.Dia || null,
                        "hour": element.Hora || null,
                        "sources": [
                            {
                                "type": "mp4",
                                "mime": "videos/mp4",
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
                        if (!fs.existsSync('public/jsons/')) {
                            fs.mkdirSync('public/jsons/');
                            const str = iconvlite.encode(JSON.stringify(grill), 'iso-8859-1');
                            fs.writeFileSync(path, str);
                        } else {
                            const str = iconvlite.encode(JSON.stringify(grill), 'iso-8859-1');
                            fs.writeFileSync(path, str);
                        }
                    } catch (e) {
                        console.log(e);
                        saved = false;
                        res.send({saved: false, error: e});
                    }
                });
            }).on("error", (err) => {
                console.log("Error: " + err.message);
                res.send({saved: false, error: err});
                saved = false;
            });
        }
    });
    if(saved) {
        res.send({saved: true});
    }
}

// ---------------- POSTS ------------------

router.post('/pull', checkAdminToken, function (req, res, next) {
    exec('git stash && git pull && git stash apply && pm2 restart StorageCSR', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.send('Error: ' + error);
            return;
        }
        res.send(stdout);
    });
});

router.post('/addgrill', isSessionActive, xlsUpload.single('file'), function(req, res, next) {
    xlsToJSON(req.file.filename, res);
});

// ---------------- GETS ------------------

router.get('/', function(req, res, next){
    xlsActual = false;
    xlsSiguiente = false;
    const path = "public/xls/";

    if(fs.existsSync(path + "semana_actual.xlsx")) xlsActual = true;
    if(fs.existsSync(path + "semana_siguiente.xlsx")) xlsSiguiente = true;

    res.render('admin', {title: "CSR Administración", xlsActual: xlsActual, xlsSiguiente: xlsSiguiente});
});

router.get('/addgrill', function(req, res, next){
    xlsActual = false;
    xlsSiguiente = false;
    const path = "public/xls/";

    if(fs.existsSync(path + "semana_actual.xlsx")) xlsActual = true;
    if(fs.existsSync(path + "semana_siguiente.xlsx")) xlsSiguiente = true;

    res.render('admin', {title: "CSR Administración", xlsActual: xlsActual, xlsSiguiente: xlsSiguiente});
});

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