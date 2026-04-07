const express = require('express');
const router = express.Router();
const thamsoController = require('../controllers/thamso.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// GET /api/thamso — public read, any authenticated user
router.get('/', authenticate, thamsoController.getAll);

// PUT /api/thamso — admin only (role check will be enforced in Step 2 auth refactor)
router.put('/', authenticate, thamsoController.updateMany);

module.exports = router;
