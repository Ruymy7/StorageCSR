const express       = require('express');
const router        = express.Router();
const fs            = require('fs');
const nconf         = require('nconf');
const multer     = require('multer');


function checkToken (req, res, next) {
  const apiToken = nconf.get('apiToken');
  const token = req.get('token');
  if(!token || token !== apiToken){
    return res.status(400).json({ error: "Wrong or missing token"});
  }
  next();
}

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

router.get('/', checkToken, function(req, res, next){
  res.render('api', {title: "CSR Storage", content: "Bienvenido al servidor de almacenamiento de Campus Sur Radio", smallMsg: "¡Parece que tu token es correcto! :)"});
});


router.get('/radioGrill', checkToken, function (req, res, next) {
  const date = new Date();
  const mm = date.getMonth() < 10 ? "0" + (date.getMonth()+1) : date.getMonth();
  const yyyy = date.getFullYear();
  const path = "public/jsons/" + yyyy + "_" + mm + ".json";
  if(fs.existsSync(path)){
    const readStream = fs.createReadStream(path);
    readStream.pipe(res);
  } else {
    res.json({error: "No grill for this month"});
  }
});

router.get('/thumbnails/:thumb', function (req, res, next) {
  const thumb = req.params.thumb;
  const path = "public/thumbnails/" + thumb;

  const file = fs.createReadStream(path);
  file.pipe(res);
});

router.get('/videos/:video', checkToken,  function (req, res, next) {
  const video = req.params.video;
  const path = "public/videos/" + video;

  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
    const chunkSize = (end-start)+1;
    const file = fs.createReadStream(path, {start, end});
    const head = {
      'Content-Range': 'bytes ' + start + ' - ' + end + ' / ' + fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const header = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, header);
    fs.createReadStream(path).pipe(res);
  }
});

router.get('/audios/:audio', checkToken, function (req, res, next) {
  const audio = req.params.audio;
  const path = "public/audios/" + audio;

  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
    const chunkSize = (end-start)+1;
    const file = fs.createReadStream(path, {start, end});
    const head = {
      'Content-Range': 'bytes ' + start + ' - ' + end + ' / ' + fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'audio/mp3',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const header = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mp3',
    };
    res.writeHead(200, header);
    fs.createReadStream(path).pipe(res);
  }
});


// **************************** POSTS ****************************

router.post('/json', checkToken, jsonUpload.single('file'), function (req, res, next) {
  res.send("JSON guardado correctamente");
  res.end();
});

router.post('/video', checkToken, videoUpload.single('video'), function (req, res, next) {
  res.send("Video guardado correctamente");
  res.end();
});

router.post('/audio', checkToken, audioUpload.single('audio'), function (req, res, next) {
  res.send("Audio guardado correctamente");
  res.end();
});

router.post('/thumbnails', checkToken, thumbUpload.single('thumb'), function (req, res, next) {
  res.send("Imagen guardada correctamente");
  res.end();
});


module.exports = router;
