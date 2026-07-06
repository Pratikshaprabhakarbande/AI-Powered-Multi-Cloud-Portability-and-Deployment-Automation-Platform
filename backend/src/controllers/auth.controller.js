/**
 * Auth controller — thin HTTP layer over auth.service.
 * Parses requests, calls the service, and formats the response envelope.
 */
import crypto from 'node:crypto';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import authService from '../services/auth.service.js';
import env from '../config/env.js';

const reqContext = (req) => ({
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  userId: req.user?.id
});

// Opt-in HttpOnly refresh-token cookie + double-submit CSRF cookie.
// No-op unless AUTH_COOKIE_REFRESH=true, so the Bearer-token flow is unchanged.
function setAuthCookies(res, tokens) {
  if (!env.auth.cookieRefresh || !tokens?.refreshToken) return;
  const base = { secure: env.auth.cookieSecure, sameSite: env.auth.cookieSameSite };
  res.cookie('refreshToken', tokens.refreshToken, {
    ...base,
    httpOnly: true,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  // CSRF token is readable by JS (double-submit pattern), not HttpOnly.
  res.cookie('csrfToken', crypto.randomBytes(24).toString('hex'), {
    ...base,
    httpOnly: false,
    path: '/'
  });
}

function clearAuthCookies(res) {
  if (!env.auth.cookieRefresh) return;
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.clearCookie('csrfToken', { path: '/' });
}

export const register = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.register(req.body, reqContext(req));
  setAuthCookies(res, tokens);
  return sendCreated(res, { message: 'Registration successful', data: { user, tokens } });
});

export const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.login(req.body, reqContext(req));
  setAuthCookies(res, tokens);
  return sendSuccess(res, { message: 'Login successful', data: { user, tokens } });
});

export const logout = asyncHandler(async (req, res) => {
  const refresh = req.body?.refreshToken || req.cookies?.refreshToken;
  await authService.logout(refresh, reqContext(req));
  clearAuthCookies(res);
  return sendSuccess(res, { message: 'Logout successful' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  // Accept the refresh token from the body (Bearer flow) or the HttpOnly cookie.
  const provided = req.body.refreshToken || req.cookies?.refreshToken;
  const { tokens } = await authService.refreshTokens(provided);
  setAuthCookies(res, tokens);
  return sendSuccess(res, { message: 'Token refreshed', data: { tokens } });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return sendSuccess(res, { message: 'Profile fetched', data: { user } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body, reqContext(req));
  return sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, {
    message: 'If an account exists for that email, a reset link has been sent.',
    data: result
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return sendSuccess(res, { message: 'Password has been reset. Please log in again.' });
});

export const changeEmail = asyncHandler(async (req, res) => {
  const user = await authService.changeEmail(req.user.id, req.body, reqContext(req));
  return sendSuccess(res, { message: 'Email updated successfully', data: { user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user.id, req.body, reqContext(req));
  return sendSuccess(res, { message: 'Password changed successfully', data: { user } });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await authService.uploadAvatar(req.user.id, req.body.avatar, reqContext(req));
  return sendSuccess(res, { message: 'Avatar uploaded successfully', data: { user } });
});

export default {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changeEmail,
  changePassword,
  uploadAvatar,
  forgotPassword,
  resetPassword
};
