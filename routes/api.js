const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { catchErrors } = require('../handlers/errorHandlers');

// GET
router.get('/search', catchErrors(storeController.searchStores));

module.exports = router;