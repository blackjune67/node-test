const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    res.locals.use = null;
    res.locals.followerCount = 0;
    res.locals.followingCount = 0;
    res.locals.followerIdList = [];
    next();
});

router.get('/profile', (req, res, next) => {
    console.log('==> test');
    res.render('profile', { title: '내정보' });
});

router.get('/join', (req, res) => {
    res.render('join', { title: '회원가입' });
});

router.get('/', (req, res, next) => {
    const twits = [];
    res.render('main', {
        title: 'june',
        twits,
    });
});

module.exports = router;