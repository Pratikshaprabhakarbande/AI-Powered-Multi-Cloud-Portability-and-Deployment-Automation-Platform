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
    const query = this.model.findOne({ email: String(email).toLowerCase() });
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
    return this.model.findByIdAndUpdate(userId, { avatarUrl: avatarData }, { new: true });
  }
}

export default new UserRepository();
