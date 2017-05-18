const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const User = mongoose.model('User');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
	failureRedirect: '/login',
	failureFlash: 'Failed login.',
	successRedirect: '/',
	successFlash: 'You are now logged in.'
});

exports.logout = (req, res) => {
	req.logout();
	req.flash('success', 'You are now logged out.');
	res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
	if(req.isAuthenticated()) {
		next();
		return;
	}
	req.flash('error', 'You must be logged in to visit this page.');
	res.redirect('login');
};

exports.forgot = async (req, res) => {
	// see if user exists
	const user = await User.findOne({ email: req.body.email });
	if(!user) {
		req.flash('error', 'No account with that email exists.');
		return res.redirect('/login');
	}
	// set reset tokens and expiry on their account
	user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
	user.resetPasswordTokenExpires = Date.now() + 3600000; // 1 hour
	await user.save();
	// send them an email with the token
	const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
	await mail.send({
		user,
		subject: 'Password Reset',
		resetURL,
		filename: 'password-reset',
		from: `Immo Struchholz <immostruchholz@gmail.com>`
	});
	req.flash('success', `You have been emailed a password reset link.`);
	// redirect to login page
	res.redirect('/login');
};

exports.reset = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordTokenExpires: { $gt: Date.now() }
	});
	if(!user) {
		req.flash('error', 'Password reset token is invalid or has expired');
		return res.redirect('/login');
	}
	res.render('reset', {title: 'Reset your password'});
};

exports.confirmPassword = (req, res, next) => {
	if(req.body.password === req.body['password-confirm']) {
		return next();
	}
	req.flash('error', 'Passwords do not match');
	res.redirect('back');
};

exports.update = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordTokenExpires: { $gt: Date.now() }
	});
	if(!user) {
		req.flash('error', 'Password reset token is invalid or has expired');
		return res.redirect('/login');
	}
	const setPassword = promisify(user.setPassword, user);
	await setPassword(req.body.password);
	user.resetPasswordToken = undefined;
	user.resetPasswordTokenExpires = undefined;
	const updatedUser = await user.save();
	await req.login(updatedUser);
	req.flash('success', 'Your password has been reset.');
	res.redirect('/');
};
