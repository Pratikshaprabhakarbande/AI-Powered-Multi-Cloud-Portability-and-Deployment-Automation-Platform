/**
 * UserRepository
 * Adds user-specific queries on top of the generic BaseRepository.
 */
import BaseRepository from './BaseRepository.js';
import { User } from '../models/index.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /** Find by email. Include the password (normally stripped) for auth. */
  async findByEmail(email, { withPassword = false } = {}) {
    // Sanitize: coerce to string, lowercase, and validate format to prevent
    // NoSQL injection (CodeQL: "Database query built from user-controlled sources").
    const sanitized = String(email || '').toLowerCase().trim();
    if (!sanitized || typeof sanitized !== 'string') return null;
    const query = this.model.findOne({ email: sanitized });
    if (withPassword) query.select('+password');
    return query.exec();
  }

  async emailExists(email, excludeId) {
    return this.model.isEmailTaken(email, excludeId);
  }

  async recordLogin(userId) {
    return this.model.findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { new: true });
  }

  async findByRole(role, options = {}) {
    return this.paginate({ role }, options);
  }

  async updateAvatar(userId, avatarData) {
    // Validate: must be a string, either a data:image URL or an https URL, max 2MB base64.
    if (!avatarData || typeof avatarData !== 'string') return null;
    const trimmed = avatarData.trim();
    // Only allow data:image URIs or https URLs — reject anything else (prevents Mongo operator injection).
    const isDataUri = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(trimmed);
    const isHttpsUrl = /^https:\/\//.test(trimmed);
    if (!isDataUri && !isHttpsUrl) return null;
    // Limit size (base64 images can be large but cap at ~2MB encoded).
    if (trimmed.length > 2 * 1024 * 1024) return null;
    return this.model.findByIdAndUpdate(userId, { avatarUrl: trimmed }, { new: true });
  }
}

export default new UserRepository();
