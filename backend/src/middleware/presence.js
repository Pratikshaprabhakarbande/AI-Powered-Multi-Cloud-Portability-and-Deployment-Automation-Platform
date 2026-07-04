/**
 * Presence middleware — updates user.lastSeenAt on each authenticated request.
 * Fire-and-forget: does NOT await the DB write to avoid slowing down requests.
 */
import { User } from '../models/index.js';

export function updatePresence(req, _res, next) {
  if (req.user?.id) {
    // Fire-and-forget update
    User.updateOne({ _id: req.user.id }, { lastSeenAt: new Date() }).exec();
  }
  next();
}

export default updatePresence;
