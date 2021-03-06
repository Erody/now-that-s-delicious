const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { catchErrors } = require('../handlers/errorHandlers');

// GET
router.get('/search', catchErrors(storeController.searchStores));
router.get('/stores/near', catchErrors(storeController.mapStores));

// POST
router.post('/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;