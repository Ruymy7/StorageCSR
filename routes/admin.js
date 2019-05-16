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
        lowerCaseHeaders:true //converts excel header rows into lowercase as json keys
    }, function(err, result) {
        if(err) {
            console.error(err);
        }else {
            JSONtoGrill(result, filename, res);
        }
    });
}

function JSONtoGrill(json, filename, res) {
    const grill = {
        "categories": [
            {
                "name": "videos",
                "mp4": "http://csradio.ddns.net:2019/api/videos/",
                "images": "http://csradio.ddns.net:2019/api/thumbnails/",
                "videos": [ ]
            }
            ,
            {
                "name": "audios",
                "mp3": "http://csradio.ddns.net:2019/api/audios/",
                "images": "http://csradio.ddns.net:2019/api/thumbnails/",
                "audios": [ ]
            }
        ]
    };

    json.forEach(function (element, i) {
        if(element.Tipo_de_archivo === 'mp4') {
            const mp4Json = {
                "start-timestamp": element.Timestamp_inicio,
                "end-timestamp": element.Timestamp_final,
                "subtitle": element.Subtitulo,
                "sources": [
                    {
                        "type": "mp4",
                        "mime": "videos/mp4",
                        "url": element.Nombre_del_archivo
                    }
                ],
                "image": element.Miniatura,
                "image-480x270": element.Miniatura,
                "image-780x1200": element.Miniatura,
                "title": element.Titulo,
                "studio": element.Estudio,
                "duration": element.Duracion
            };
            grill.categories[0].videos.push(mp4Json);
        } else if(element.Tipo_de_archivo === 'mp3'){
            const mp3Json = {
                "start-timestamp": element.Timestamp_inicio,
                "end-timestamp": element.Timestamp_final,
                "subtitle": element.Subtitulo,
                "sources": [
                    {
                        "type": "mp3",
                        "mime": "videos/mp3",
                        "url": element.Nombre_del_archivo
                    }
                ],
                "image": element.Miniatura,
                "image-480x270": element.Miniatura,
                "image-780x1200": element.Miniatura,
                "title": element.Titulo,
                "studio": element.Estudio,
                "duration": element.Duracion
            };
            grill.categories[1].audios.push(mp3Json);
        }
    });

    const path = 'public/jsons/' + filename.replace(".xlsx", ".json");
    const pathxls = 'public/xls/' + filename;
    const pathtmpJSON = 'public/xls/' + filename.replace(".xlsx", ".json");

    try {
        const str = iconvlite.encode(JSON.stringify(grill), 'iso-8859-1');
        fs.writeFileSync(path, str);
        res.send(str); res.end();
        if (fs.existsSync(pathxls))
            fs.unlinkSync(pathxls);

        if (fs.existsSync(pathtmpJSON))
            fs.unlinkSync(pathtmpJSON);

    } catch (e) {
        console.log('ERROR: ', e);
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
});

module.exports = router;