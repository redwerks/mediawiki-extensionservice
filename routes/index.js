"use strict";
var router = require('express-promise-router')();

module.exports = router;

router.use('/api', require('./api'));
