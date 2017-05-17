const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

// GET
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/stores/:slug', catchErrors(storeController.getStore));
router.get('/add', authController.isLoggedIn, storeController.addStore);
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));
router.get('/login', userController.loginForm);
router.get('/logout', authController.logout);
router.get('/register', userController.registerForm);
router.get('/account', userController.account);

// POST
router.post('/add',
	storeController.upload,
	storeController.resize,
	catchErrors(storeController.createStore)
);
router.post('/add/:id',
	storeController.upload,
	storeController.resize,
	catchErrors(storeController.updateStore)
);
router.post('/register',
	userController.validateRegister,
	userController.register,
	authController.login
);
router.post('/login',
	userController.validateLogin,
	authController.login
);


module.exports = router;
