/**
 * User model
 * Authentication identity + RBAC role. Passwords are hashed with bcrypt and
 * never returned in API responses (marked `private`).
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createSchema } from './baseSchema.js';
import { ROLES, ROLE_VALUES } from '../config/constants.js';
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
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      defaultProvider: { type: String, default: 'aws' },
      emailNotifications: { type: Boolean, default: true }
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
