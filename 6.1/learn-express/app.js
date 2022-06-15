const express = require('express');
const path = require('path');
const { nextTick } = require('process');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
// const multer = require('multer');
const session = require('express-session');

const app = express();

// * 앱 관련 설정
app.set('port', process.env.PORT || 3000);

// * 요청과 응답에 대한 logging
app.use(morgan('dev'));
// app.use('요청경로', express.static('실제경로')); // * 정적파일 관련된 것.
app.use('/', express.static(path.join(__dirname, 'public'))); // * 정적파일
app.use(cookieParser('june'));
app.use(session({
    resave : false,
    saveUninitialized: false,
    secret: 'june',
    cookie: {
        httpOnly: true,
    },
    // name: 'connect.sid'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(multer().array());

app.use((req, res, next) => {
    req.data = '하준';
});

app.get('/', (req, res, next) => {
    //req.data // * 전달 받은 걸
    req.session
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/category/js', (req, res) => {
    res.send('hello express post');
});


app.get('/about', (req, res) => {
    // console.log('-------------------');
    res.send('hello express post!!');
});


// * 라우터 매개변수갖는 라우터 (동적처리)
app.get('/category/:name', (req, res) => {
    res.send(`hello ${req.params.name}`);
    // res.send('hello wildcard!!!');
});

/* app.get('*', (req, res) => {
    res.send('모든 요청은 여기로!!');
}); */

/* app.use((req, res, next) => {
    console.log('==> 404!!!!');
    res.status(404).send('404.....');
    // res.statusCode('404').send('404 입니다.');
}); */

// ! 에러 처리는 마지막쪽에
// 에러처리는 4개의 매개변수가 다 들어있어야한다.
app.use((err, req, res, next) => {
    console.error(err);
    res.send('에러났지?');
});

app.listen(app.get('port'), () => {
   console.log('익스프레스 서버 실행'); 
});