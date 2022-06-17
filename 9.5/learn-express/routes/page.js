const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {

    console.log('==> test');
    next();
});

router.get('/', (req, res, next) => {
    res.render('main', () => {

    });
});