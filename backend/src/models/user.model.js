/**
 * User model
 * Authentication identity + RBAC role. Passwords are hashed with bcrypt and
 * never returned in API responses (marked `private`).
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createSchema } from './baseSchema.js';
import { ROLES, ROLE_VALUES, PROVIDER_VALUES } from '../config/constants.js';
import env from '../config/env.js';

const userSchema = createSchema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      private: true // stripped by toJSON plugin
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.VIEWER,
      index: true
    },
    organization: { type: String, trim: true, default: 'Demo Org' },
    avatarUrl: { type: String, default: null },
    // Placeholder for a future email verification flow. Currently set to false on
    // email change but no verification mechanism exists yet to set it to true.
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      defaultProvider: { type: String, default: 'aws' },
      emailNotifications: { type: Boolean, default: true }
    },

    // ---- Extended profile fields ----
    bio: { type: String, maxlength: 500, default: null },
    phone: { type: String, default: null },
    country: { type: String, default: null },
    timezone: { type: String, default: null },
    jobTitle: { type: String, default: null },

    // ---- Two-Factor Authentication ----
    twoFactorSecret: { type: String, private: true, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorBackupCodes: {
      type: [{ code: { type: String }, used: { type: Boolean, default: false } }],
      private: true,
      default: []
    },

    // ---- Presence ----
    lastSeenAt: { type: Date, default: null },

    // ---- Notification Preferences ----
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      deploymentNotifications: { type: Boolean, default: true },
      monitoringAlerts: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false }
    },

    // ---- Connected Cloud Accounts ----
    connectedAccounts: {
      type: [{
        provider: { type: String, enum: PROVIDER_VALUES, required: true },
        accountId: { type: String, required: true },
        region: { type: String },
        connectedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['connected', 'disconnected'], default: 'connected' }
      }],
      default: []
    }
  },
  { collection: 'users' },
  { audit: false } // users are not "owned" by another user
);

// ---- Indexes ----
userSchema.index({ role: 1, isActive: 1 });

// ---- Hooks: hash password on create/update ----
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(env.bcryptSaltRounds);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

// ---- Methods ----
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ---- Statics ----
userSchema.statics.isEmailTaken = async function isEmailTaken(email, excludeId) {
  const user = await this.findOne({ email: email.toLowerCase(), _id: { $ne: excludeId } });
  return !!user;
};

const User = mongoose.model('User', userSchema);
export default User;
