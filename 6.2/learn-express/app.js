const express = require('express');

const dotenv = require('dotenv');
dotenv.config();

const path = require('path');
const { nextTick } = require('process');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const session = require('express-session');
const fs = require('fs');

const app = express();


// * 앱 관련 설정
app.set('port', process.env.PORT || 3000);

app.use(morgan('dev'));

app.use('/', express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

try {
    fs.readdirSync('uploads');
} catch {
    console.log('업로드 폴더가 없어 uploads폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads/');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalnamem, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'multipart.html'));
});

app.post('/upload', upload.single('pdf'), (req, res) => {
    console.log(req.file);
    res.send('ok');
});

app.get('/', (req, res, next) => {
    console.log('GET / 요청에만 실행됩니다.');
    next();
}, (req, res) => {
    throw new Error('에러발생');
});

app.use((err, req, res, next) => {
    console.log(`==> ${err}`);
    console.error(err);
    res.status('500').send(err.message);
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});