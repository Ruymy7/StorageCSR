const express       = require('express');
const router        = express.Router();
const fs            = require('fs');
const nconf         = require('nconf');
const { exec }      = require('child_process');
const multer        = require('multer');
const xlsxj         = require("xlsx-to-json");
const iconvlite     = require('iconv-lite');
const http          = require('http');
const parseString   = require('xml2js').parseString;

function checkAdminToken (req, res, next) {
    const apiToken = nconf.get('adminToken');
    const token = req.get('token');
    if(!token || token !== apiToken){
        return res.status(400).json({ error: "Wrong or missing token"});
    }
    next();
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
        if(element.Nombre_del_archivo && element.Nombre_del_archivo !== '') {
            http.get("http://iaas92-43.cesvima.upm.es/api_v3/index.php?service=media&action=get&entryId=" + element.Nombre_del_archivo + "&ks=" + ks + "&format=1", (resp) => {
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
                        "sources": [
                            {
                                "type": "mp4",
                                "mime": "videos/mp4",
                                "url": "/p/106/sp/0/playManifest/entryId/" + element.Nombre_del_archivo + "/format/url/flavorParamId/301951/video.mp4"
                            }
                        ],
                        "image": "/p/106/thumbnail/entry_id/" + element.Nombre_del_archivo + "/width/480/height/200",
                        "image-480x270": "/p/106/thumbnail/entry_id/" + element.Nombre_del_archivo + "/width/350/height/270",
                        "image-780x1200": "/p/106/thumbnail/entry_id/" + element.Nombre_del_archivo + "/width/780/height/1200",
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
    exec('git stash && git pull && git stash apply && pm2 restart app', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.send('Error: ' + error);
            return;
        }
        res.send(stdout);
    });
});

router.post('/addgrill', checkAdminToken, xlsUpload.single('file'), function(req, res, next) {
    xlsToJSON(req.file.filename, res);
});

// ---------------- GETS ------------------

router.get('/', function(req, res, next){
    res.render('admin', {title: "CSR Administración"});
});

router.get('/addgrill', function(req, res, next){
    res.render('admin', {title: "CSR Administración"});
});

module.exports = router;