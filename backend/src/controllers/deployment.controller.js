/**
 * Deployment controller — thin HTTP layer over deploy.service.
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import deployService from '../services/deploy.service.js';

const ctx = (req) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

export const create = asyncHandler(async (req, res) => {
  const data = await deployService.createDeployment(req.user.id, req.user, req.body, ctx(req));
  return sendCreated(res, { message: 'Deployment created', data });
});

export const get = asyncHandler(async (req, res) => {
  const data = await deployService.getDeployment(req.params.id);
  return sendSuccess(res, { message: 'Deployment detail', data });
});

export const rollback = asyncHandler(async (req, res) => {
  const data = await deployService.rollbackDeployment(req.params.id, req.user, ctx(req));
  return sendSuccess(res, { message: 'Deployment rolled back', data });
});

export const cancel = asyncHandler(async (req, res) => {
  const data = await deployService.cancelDeployment(req.params.id, req.user, ctx(req));
  return sendSuccess(res, { message: 'Deployment terminated', data });
});

export const list = asyncHandler(async (req, res) => {
  const data = await deployService.listDeployments(req.user.id, req.query);
  return sendSuccess(res, { message: 'Deployments', data });
});

export const regions = asyncHandler(async (req, res) => {
  const data = deployService.getRegions(req.params.provider);
  return sendSuccess(res, { message: 'Regions', data });
});

export default { create, get, rollback, cancel, list, regions };
