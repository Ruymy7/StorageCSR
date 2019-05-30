const express       = require('express');
const router        = express.Router();
const fs            = require('fs');
const nconf         = require('nconf');
const { exec }      = require('child_process');
const multer        = require('multer');
const xlsxj         = require("xlsx-to-json");
const iconvlite     = require('iconv-lite');

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
        }else {
            JSONtoGrill(result, filename, res);
        }
    });

    /*const pathxls = 'public/xls/' + filename;
    const pathtmpJSON = 'public/xls/' + filename.replace(".xlsx", ".json");
    try{
        if (fs.existsSync(pathxls))
            fs.unlinkSync(pathxls);

        if (fs.existsSync(pathtmpJSON))
            fs.unlinkSync(pathtmpJSON);

    } catch (e) {
        console.log('ERROR: ', e);
    }*/
}

function JSONtoGrill(json, filename, res) {
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
            const mp4Json = {
                "start-timestamp": element.Timestamp_inicio,
                "end-timestamp": element.Timestamp_final,
                "subtitle": element.Subtitulo,
                "sources": [
                    {
                        "type": "mp4",
                        "mime": "videos/mp4",
                        "url": "/p/106/sp/0/playManifest/entryId/"+element.Nombre_del_archivo+"/format/url/flavorParamId/301951/video.mp4"
                    }
                ],
                "image": "/p/106/thumbnail/entry_id/"+element.Nombre_del_archivo+"/width/480/height/200",
                "image-480x270": "/p/106/thumbnail/entry_id/"+element.Nombre_del_archivo+"/width/350/height/270",
                "image-780x1200": "/p/106/thumbnail/entry_id/"+element.Nombre_del_archivo+"/width/780/height/1200",
                "title": element.Titulo,
                "studio": element.Estudio,
                "duration": element.Duracion
            };
            grill.categories[0].videos.push(mp4Json);
    });

    const path = 'public/jsons/' + filename.replace(".xlsx", ".json");

    try {
        const str = iconvlite.encode(JSON.stringify(grill), 'iso-8859-1');
        fs.writeFileSync(path, str);
    } catch (e) {
        console.log(e);
    }
}

// ---------------- POSTS ------------------

router.post('/pull', checkAdminToken, function (req, res, next) {
    exec('git pull', (error, stdout, stderr) => {
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
    res.end();
});

// ---------------- GETS ------------------

router.get('/', function(req, res, next){
    res.render('admin', {title: "CSR Administración"});
});

router.get('/addgrill', function(req, res, next){
    res.render('admin', {title: "CSR Administración"});
});
module.exports = router;