import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, uuidv4, log } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { usn, password, mobile } = req.body;
    let identifier = usn ? usn : mobile;
    
    if (!identifier || !password) {
      return res.status(400).json({ error: 'USN/Mobile and password are required' });
    }

    let user = null;
    if (usn) {
      user = await db('users').whereRaw('UPPER(usn) = UPPER(?)', [usn]).first();
    }
    if (!user && mobile) {
      user = await db('users').where('mobile', mobile).first();
    }

    // Fallback securely if no password hash is set (e.g. seeded demo users)
    if (!user) {
       return res.status(401).json({ error: 'Invalid credentials or user not registered properly.' });
    }

    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Demo fallback: If no password_hash but they use password 'demo123', let seed users login
      isMatch = password === 'demo123';
    }

    if (!isMatch) {
       return res.status(401).json({ error: 'Invalid credentials.' });
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

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, usn, mobile, room, password } = req.body;
    if (!name || !usn || !mobile || !password) {
      return res.status(400).json({ error: 'Name, USN, mobile number, and password are required' });
    }

    // Check for duplicates
    const existingUser = await db('users')
      .whereRaw('UPPER(usn) = UPPER(?)', [usn])
      .orWhere('mobile', mobile)
      .first();

    if (existingUser) {
      if (existingUser.usn && existingUser.usn.toUpperCase() === usn.toUpperCase()) {
        return res.status(409).json({ error: 'USN is already registered.' });
      }
      return res.status(409).json({ error: 'Mobile number is already registered.' });
    }

    // Role detection
    const role = req.body.role && ['student', 'warden', 'guard', 'admin'].includes(req.body.role) 
                 ? req.body.role : 'student';

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = {
      id: uuidv4(),
      name,
      usn: usn ? usn.toUpperCase() : null,
      role,
      mobile,
      room: room || null,
      password_hash,
      is_active: true
    };

    await db('users').insert(newUser);

    // Auto-login after register
    const payload = {
      id: newUser.id, name: newUser.name, role: newUser.role,
      usn: newUser.usn, mobile: newUser.mobile, room: newUser.room,
      hostel: null, hostelId: null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    await log(newUser.id, newUser.name, newUser.role, 'USER_REGISTERED', newUser.id, 'user');

    return res.json({ success: true, token, user: payload });
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

    const hostel = user.hostel_id ? await db('hostels').where('id', user.hostel_id).first() : null;
    const payload = {
      id: user.id, name: user.name, role: user.role,
      usn: user.usn, mobile: user.mobile, room: user.room,
      hostel: hostel?.name || null, hostelId: user.hostel_id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: payload, bypassMode: true });
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
