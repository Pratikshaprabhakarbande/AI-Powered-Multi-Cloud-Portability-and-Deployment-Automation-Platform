/**
 * Presence middleware — updates user.lastSeenAt on each authenticated request.
 * Fire-and-forget: does NOT await the DB write to avoid slowing down requests.
 * Throttled: only updates if lastSeenAt is older than 60 seconds to reduce write pressure.
 */
import { User } from '../models/index.js';

const PRESENCE_THROTTLE_MS = 60 * 1000; // 60 seconds

export function updatePresence(req, _res, next) {
  if (req.user?.id) {
    const lastSeen = req.user.lastSeenAt ? new Date(req.user.lastSeenAt).getTime() : 0;
    const now = Date.now();

    // Only update if lastSeenAt is older than the throttle interval
    if (now - lastSeen > PRESENCE_THROTTLE_MS) {
      User.updateOne({ _id: req.user.id }, { lastSeenAt: new Date(now) })
        .exec()
        .catch(() => {
          // Silently ignore presence update errors
        });
    }
  }
  next();
}

export default updatePresence;
