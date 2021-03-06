/* 
* StorageCSR (ETSISI-UPM)
* Autor: Padrón Castañeda, Ruymán
* Trabajo Fin de Grado
*/

const createError   = require('http-errors');
const express       = require('express');
const path          = require('path');
const cookieParser  = require('cookie-parser');
const logger        = require('morgan');
const nconf         = require('nconf');
const http          = require('http');
const session       = require('express-session');

nconf.file({ file: 'storage.conf'});

// Declare routes
const loginRouter = require('./routes/login');
const indexRouter = require('./routes/index');
const apiRouter   = require('./routes/api');
const adminRouter = require('./routes/admin');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ resave: false, saveUninitialized: false, secret: '123456789' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Path Handler
app.use(function (req, res, next) {
    if(!req.session.userInfo && !String(req.path).includes('api') && req.path !== '/login' && req.method !== 'POST'){
        res.redirect('/login');
    } else if(req.session.userInfo && (req.path === '/login' || req.path === '/')) {
        res.redirect('/admin');
    } else {
        next();
    }
});

app.use('/login', loginRouter);
app.use('/index', indexRouter);
app.use('/api', apiRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

const port = nconf.get('port');

http.createServer(app).listen(port, function (error) {
    if (error) {
        console.log("[STORAGE-CSR] Error while starting the server:", error);
    } else {
        console.log("[STORAGE-CSR] Server listening on:", nconf.get('url'));
    }
});
module.exports = app;
