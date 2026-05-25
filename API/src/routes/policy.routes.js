const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policy.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// All authenticated can view policies
router.get('/', policyController.getPolicies);

// ADMIN only: update policies
router.put('/', authorize(ROLES.ADMIN), policyController.updatePolicies);

module.exports = router;
