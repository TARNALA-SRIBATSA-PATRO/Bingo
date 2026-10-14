import crypto from 'crypto';
import { verifyPassword, setPassword } from './analyticsStore.js';

// Obfuscated Admin Path (customizable via env var or secure fallback)
export const ADMIN_PATH = process.env.ADMIN_PATH || '/sys-admin-panel-92f7';

// In-memory active admin sessions: token -> { createdAt, expiresAt, ip }
const activeSessions = new Map();

// In-memory failed login tracking per IP: ip -> { attempts: number, lockedUntil: timestamp }
const loginAttempts = new Map();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to get client IP
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of activeSessions.entries()) {
    if (now > data.expiresAt) {
      activeSessions.delete(token);
    }
  }
  for (const [ip, data] of loginAttempts.entries()) {
    if (data.lockedUntil && now > data.lockedUntil) {
      loginAttempts.delete(ip);
    }
  }
}, 60000);

// Authenticate Admin with Brute-Force Lockout Defense
export function handleAdminLogin(req, res) {
  const ip = getClientIp(req);
  const now = Date.now();
  const attemptRecord = loginAttempts.get(ip) || { attempts: 0, lockedUntil: null };

  // Check if IP is currently locked out
  if (attemptRecord.lockedUntil && now < attemptRecord.lockedUntil) {
    const remainingSecs = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
    const remainingMins = Math.ceil(remainingSecs / 60);
    return res.status(429).json({
      success: false,
      error: `Too many failed login attempts. Access locked for security. Please try again in ${remainingMins} minute(s).`,
      locked: true,
      remainingSeconds: remainingSecs
    });
  }

  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Password required' });
  }

  const isValid = verifyPassword(password);

  if (!isValid) {
    attemptRecord.attempts += 1;
    if (attemptRecord.attempts >= MAX_FAILED_ATTEMPTS) {
      attemptRecord.lockedUntil = now + LOCKOUT_WINDOW_MS;
      loginAttempts.set(ip, attemptRecord);
      return res.status(429).json({
        success: false,
        error: `Too many failed attempts. Security lockout active for 15 minutes.`,
        locked: true,
        remainingSeconds: Math.ceil(LOCKOUT_WINDOW_MS / 1000)
      });
    }

    loginAttempts.set(ip, attemptRecord);
    const remainingAttempts = MAX_FAILED_ATTEMPTS - attemptRecord.attempts;
    return res.status(401).json({
      success: false,
      error: `Invalid admin password. ${remainingAttempts} attempt(s) remaining before security lockout.`,
      remainingAttempts
    });
  }

  // Password correct: reset failed attempts for this IP
  loginAttempts.delete(ip);

  // Generate secure 256-bit session token
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    ip
  });

  return res.json({
    success: true,
    token,
    expiresIn: SESSION_TTL_MS
  });
}

// Admin Logout
export function handleAdminLogout(req, res) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token && activeSessions.has(token)) {
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
}

// Change Password
export function handleAdminChangePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Both current and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long' });
  }

  if (!verifyPassword(currentPassword)) {
    return res.status(401).json({ success: false, error: 'Current password incorrect' });
  }

  setPassword(newPassword);
  return res.json({ success: true, message: 'Admin password updated securely.' });
}

// Middleware: Protect Admin Endpoints
export function requireAdminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Session invalid or expired. Please sign in again.' });
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
  }

  next();
}
