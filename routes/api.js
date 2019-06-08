/* 
* StorageCSR (ETSISI-UPM)
* Autor: Padrón Castañeda, Ruymán
* Trabajo Fin de Grado
*/

const express       = require('express');
const router        = express.Router();
const fs            = require('fs');
const nconf         = require('nconf');
const multer        = require('multer');

/* Función para comprobar el token de subida de archivos */
function checkToken (req, res, next) {
    const apiToken = nconf.get('apiToken');
    const token = req.get('token');
    if(!token || token !== apiToken){
        return res.status(400).json({ error: "Wrong or missing token"});
    }
    next();
}

/* Multer para almacenar jsons */
const jsonStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const jsons = 'public/jsons';
        if (!fs.existsSync(jsons)) {
            fs.mkdirSync(jsons);
        }
        cb(null, jsons);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const jsonUpload = multer({
    storage: jsonStorage
});

/* Multer para almacenar vídeos */
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const videos = 'public/videos';
        if(!fs.existsSync(videos)){
            fs.mkdirSync(videos);
        }
        cb(null, videos);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const videoUpload = multer({
    storage: videoStorage
});

/* Multer para almacenar audios */
const audioStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const audios = 'public/audios';
        if(!fs.existsSync(audios)){
            fs.mkdirSync(audios);
        }
        cb(null, audios);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const audioUpload = multer({
    storage: audioStorage
});

/* Multer para almacenar miniaturas */
const thumbStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const thumb = 'public/thumbnails';
        if(!fs.existsSync(thumb)){
            fs.mkdirSync(thumb);
        }
        cb(null, thumb);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const thumbUpload = multer({
    storage: thumbStorage
});

// **************************** GETS ****************************

/* GET para comprobar que tu token es correcto */
router.get('/', checkToken, function(req, res, next){
    res.render('api', {title: "CSR Storage", content: "Bienvenido al servidor de almacenamiento de Campus Sur Radio", smallMsg: "¡Parece que tu token es correcto! :)"});
});

/* GET para obtener la parrilla de radio actual, es usado por la aplicación Android */
router.get('/radioGrill', function (req, res, next) {
    const path = "public/jsons/semana_actual.json";
    try{
        if(fs.existsSync(path)){
            // Si existe el fichero semana_actual.json lo envía
            const json = fs.readFileSync(path);
            res.send(json); res.end();
        } else {
            // Si no existe envia un error indicando que no hay parrilla
            res.json({error: "No hay parrilla para esta semana"});
        }
    } catch (e) {
        console.log('ERROR: ', e);
    }
});

/* GET para obtener la miniatura de los vídeos o audios */
router.get('/thumbnails/:thumb', function (req, res, next) {
    try{
        const thumb = req.params.thumb;
        const path = "public/thumbnails/" + thumb;

        const file = fs.createReadStream(path);
        file.pipe(res);
    } catch (error) {
        res.status(error.status || 404);
        res.render('error', {error});
    }
});

/* GET para obtener el streaming de los vídeos */
router.get('/videos/:video',  function (req, res, next) {
    try {
        const video = req.params.video;
        const path = "public/videos/" + video;

        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const lastModified = stat.mtime.toUTCString();
        const mtime = stat.mtimeMs;
        let now = new Date();
        now.setHours(now.getHours() + 1);
        now = now.toUTCString();

        // El rango indica desde que byte hasta que byte espera el navegador o el dispositivo que se le envíe el streaming
        const range = req.headers.range;
        if (range) { 
            // Si el navegador o el dispositivo donde se reproduce envía un rango en la cabecera de la petición
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            // Si envía solo un rango de inicio se define como fin del streaming el último byte del archivo seleccionado
            let end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
            let chunkSize = (end-start)+1; // Indica el tamaño del trozo de vídeo que se envía
            const file = fs.createReadStream(path, {start, end});
            const head = { // Aquí se rellena la cabecera que se envía al dispositivo o navegador
                'Content-Range': 'bytes ' + start + ' - ' + end + ' / ' + fileSize,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
                'Last-Modified': lastModified,
                'etag': mtime, // Sirve para comprobar que no se ha modificado el archivo desde el último envío parcial
                'status': 206, // Código de estado HTML que significa que se está enviando contenido en partes
                'cache-control': 'max-age=3600',
                'Expires': now // Tiene una validez de una hora el contenido, para que así pueda almacenarlo en caché el navegador
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            // Si el dispositivo o el navegador no define el rango de bytes que desea obtener
            const header = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Last-Modified': lastModified,
                'etag': mtime,
                'status': 200, // Código de estado en HTML que significa que se ha enviado correctamente el contenido
                'cache-control': 'max-age=3600',
                'Expires': now
            };
            res.writeHead(200, header);
            // Aquí se le envía el vídeo completo sin realizar envío por trozos o streaming
            fs.createReadStream(path).pipe(res);
        }
    } catch (error) {
        res.status(error.status || 404);
        res.render('error', {error});
    }
});

router.get('/audios/:audio', function (req, res, next) {
    try {
        const audio = req.params.audio;
        const path = "public/audios/" + audio;

        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const lastModified = stat.mtime.toUTCString();
        const mtime = stat.mtimeMs;
        let now = new Date();
        now.setHours(now.getHours() + 1);
        now = now.toUTCString();

        // El rango indica desde que byte hasta que byte espera el navegador o el dispositivo que se le envíe el streaming
        const range = req.headers.range;
        if (range) {
            // Si el navegador o el dispositivo donde se reproduce envía un rango en la cabecera de la petición
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            // Si envía solo un rango de inicio se define como fin del streaming el último byte del archivo seleccionado
            let end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
            let chunkSize = (end-start)+1; // Indica el tamaño del trozo de audio que se envía
            const file = fs.createReadStream(path, {start, end});
            const head = { // Aquí se rellena la cabecera que se envía al dispositivo o navegador
                'Content-Range': 'bytes ' + start + ' - ' + end + ' / ' + fileSize,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'audio/mp3',
                'Last-Modified': lastModified,
                'etag': mtime, // Sirve para comprobar que no se ha modificado el archivo desde el último envío parcial
                'status': 206, // Código de estado HTML que significa que se está enviando contenido en partes
                'cache-control': 'max-age=3600',
                'Expires': now // Tiene una validez de una hora el contenido, para que así pueda almacenarlo en caché el navegador
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            // Si el dispositivo o el navegador no define el rango de bytes que desea obtener
            const header = {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mp3',
                'Accept-Ranges': 'bytes',
                'Last-Modified': lastModified,
                'etag': mtime,
                'status': 200, // Código de estado en HTML que significa que se ha enviado correctamente el contenido
                'cache-control': 'max-age=3600',
                'Expires': now
            };
            res.writeHead(200, header);
            // Aquí se le envía el audio completo sin realizar envío por trozos o streaming
            fs.createReadStream(path).pipe(res);
        }
    } catch (error) {
        res.status(error.status || 404);
        res.render('error', {error});
    }
});


// **************************** POSTS ****************************
// ANTES DE PODER SUBIR CUALQUIER ARCHIVO EN LOS SIGUIENTES POSTS SE COMPRUEBA EL TOKEN

/* POST para subir el json de la parrilla de manera manual */
router.post('/json', checkToken, jsonUpload.single('file'), function (req, res, next) {
    res.send("JSON guardado correctamente");
    res.end();
});

/* POST para subir vídeos */
router.post('/video', checkToken, videoUpload.single('video'), function (req, res, next) {
    res.send("Video guardado correctamente");
    res.end();
});

/* POST para subir audios */
router.post('/audio', checkToken, audioUpload.single('audio'), function (req, res, next) {
    res.send("Audio guardado correctamente");
    res.end();
});

/* POST para subir miniaturas */
router.post('/thumbnails', checkToken, thumbUpload.single('thumb'), function (req, res, next) {
    res.send("Imagen guardada correctamente");
    res.end();
});


module.exports = router;
