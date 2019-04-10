const express       = require('express');
const router        = express.Router();
const fs            = require('fs');
const nconf         = require('nconf');


function checkToken (req, res, next) {
  const apiToken = nconf.get('apiToken');
  const token = req.get('token');
  if(!token || token !== apiToken){
    return res.status(400).json({ error: "Wrong or missing token"});
  }
  next();
}

router.get('/', checkToken, function(req, res, next){
  res.send("Bienvenido al servidor de almacenamiento de Campus Sur Radio");
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


module.exports = router;