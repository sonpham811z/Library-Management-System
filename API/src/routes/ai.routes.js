const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.post('/chat', aiController.handleAgentChat);

module.exports = router;