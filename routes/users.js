const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const { checkReturnTo, isLoggedIn } = require('../middleware');
const users = require('../controllers/users');

router.route('/register')
    .get(users.renderRegisterForm)
    .post(catchAsync(users.register));

router.route('/login')
    .get(users.renderLoginForm)
    .post(checkReturnTo, passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}) , users.login);

router.get('/logout', isLoggedIn, users.logout);

module.exports = router;