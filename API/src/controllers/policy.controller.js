const policyModel = require('../models/policy.model');
const { sendSuccess, sendError } = require('../utils/response');

const getPolicies = async (req, res, next) => {
  try {
    const policies = await policyModel.getAll();
    return sendSuccess(res, policies);
  } catch (err) {
    next(err);
  }
};

const updatePolicies = async (req, res, next) => {
  try {
    const { policies } = req.body;
    if (!Array.isArray(policies) || policies.length === 0) {
      return sendError(res, 'policies array is required', 400);
    }
    const updated = await policyModel.updateMany(policies);
    return sendSuccess(res, updated, 'Policies updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getPolicies, updatePolicies };
