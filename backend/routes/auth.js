import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db, uuidv4, log } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { usn, mobile } = req.body;
    if (!usn || !mobile) {
      return res.status(400).json({ error: 'USN and mobile number are required' });
    }

    let user = await db('users').whereRaw('UPPER(usn) = UPPER(?)', [usn]).where('mobile', mobile).first();
    if (!user) {
      user = await db('users').where('mobile', mobile).first();
      if (!user) return res.status(401).json({ error: 'Invalid credentials. Please check your USN and mobile number.' });
    }

    return issueOtp(res, user, mobile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, usn, mobile, room } = req.body;
    if (!name || !usn || !mobile) {
      return res.status(400).json({ error: 'Name, USN, and mobile number are required' });
    }

    // Check for duplicates
    const existingUser = await db('users')
      .whereRaw('UPPER(usn) = UPPER(?)', [usn])
      .orWhere('mobile', mobile)
      .first();

    if (existingUser) {
      if (existingUser.usn.toUpperCase() === usn.toUpperCase()) {
        return res.status(409).json({ error: 'USN is already registered.' });
      }
      return res.status(409).json({ error: 'Mobile number is already registered.' });
    }

    // Create new user
    const newUser = {
      id: `STU${Math.floor(Math.random() * 10000)}`, // Simple ID generation
      name,
      usn: usn.toUpperCase(),
      role: 'student', // Default to student for public registration
      mobile,
      room: room || null,
      is_active: true
    };

    await db('users').insert(newUser);

    // Automatically issue OTP to directly log them in
    return issueOtp(res, newUser, mobile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login-role — demo shortcut
router.post('/login-role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role required' });

    const user = await db('users').where('role', role).first();
    if (!user) return res.status(404).json({ error: 'No user found for this role' });

    return issueOtp(res, user, user.mobile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function issueOtp(res, user, mobile) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await db('otp_sessions').insert({ id: uuidv4(), mobile, usn: user.usn, otp, expires_at: expiresAt });

  console.log(`\n📱 OTP for ${user.name} (${mobile}): ${otp}  [bypass: 123456]\n`);

  return res.json({
    success: true,
    message: 'OTP sent to registered mobile number',
    userId: user.id,
    maskedMobile: mobile.slice(0, 2) + '****' + mobile.slice(-4),
    ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
  });
}

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ error: 'userId and otp are required' });

    const user = await db('users').where('id', userId).first();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isBypass = otp === '123456';

    if (!isBypass) {
      const session = await db('otp_sessions')
        .where({ mobile: user.mobile, otp, used: false })
        .where('expires_at', '>', new Date().toISOString())
        .orderBy('created_at', 'desc')
        .first();

      if (!session) return res.status(401).json({ error: 'Invalid or expired OTP. Try again.' });
      await db('otp_sessions').where('id', session.id).update({ used: true });
    }

    const hostel = user.hostel_id ? await db('hostels').where('id', user.hostel_id).first() : null;

    const payload = {
      id: user.id, name: user.name, role: user.role,
      usn: user.usn, mobile: user.mobile, room: user.room,
      hostel: hostel?.name || null, hostelId: user.hostel_id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    await log(user.id, user.name, user.role, 'USER_LOGIN', user.id, 'user');

    return res.json({ success: true, token, user: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const user = await db('users').where('id', decoded.id).first();
    const hostel = user?.hostel_id ? await db('hostels').where('id', user.hostel_id).first() : null;
    return res.json({ ...decoded, hostel: hostel?.name });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
