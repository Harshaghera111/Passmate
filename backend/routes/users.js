import { Router } from 'express';
import { db, uuidv4, log } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// GET /api/users
router.get('/', authenticate, requireRole('admin', 'warden'), async (req, res) => {
  try {
    const { role, hostelId } = req.query;
    let query = db('users').leftJoin('hostels', 'users.hostel_id', 'hostels.id')
      .select('users.*', 'hostels.name as hostel_name', 'hostels.block')
      .where('users.is_active', true);
    if (role) query = query.where('users.role', role);
    if (hostelId) query = query.where('users.hostel_id', hostelId);
    const users = (await query.orderBy('users.name')).map(({ password_hash, ...u }) => u);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await db('users').leftJoin('hostels', 'users.hostel_id', 'hostels.id')
      .select('users.*', 'hostels.name as hostel_name', 'hostels.block')
      .where('users.id', req.params.id).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password_hash, ...rest } = user;
    res.json(rest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/passes
router.get('/:id/passes', authenticate, async (req, res) => {
  try {
    const { role, id: requesterId } = req.user;
    if (role === 'student' && req.params.id !== requesterId) return res.status(403).json({ error: 'Access denied' });
    const passes = await db('gate_passes').where('student_id', req.params.id).orderBy('created_at', 'desc');
    res.json(passes.map(p => ({ ...p, isLate: !!p.is_late, parentStatus: p.parent_status })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, role, mobile, email, usn, parentMobile, hostelId, room, branch, year } = req.body;
    if (!name || !role || !mobile) return res.status(400).json({ error: 'Name, role, and mobile are required' });
    const id = uuidv4();
    await db('users').insert({ id, usn: usn || null, name, role, mobile, email: email || null, parent_mobile: parentMobile || null, hostel_id: hostelId || null, room: room || null, branch: branch || null, year: year || null, password_hash: bcrypt.hashSync('passmate123', 10) });
    await log(req.user.id, req.user.name, 'admin', 'USER_CREATED', id, 'user', req.ip);
    const user = await db('users').where('id', id).first();
    const { password_hash, ...rest } = user;
    res.status(201).json(rest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/suspend
router.patch('/:id/suspend', authenticate, requireRole('admin'), async (req, res) => {
  await db('users').where('id', req.params.id).update({ is_active: false });
  await log(req.user.id, req.user.name, 'admin', 'USER_SUSPENDED', req.params.id, 'user', req.ip);
  res.json({ success: true });
});

// PATCH /api/users/:id/reactivate
router.patch('/:id/reactivate', authenticate, requireRole('admin'), async (req, res) => {
  await db('users').where('id', req.params.id).update({ is_active: true });
  await log(req.user.id, req.user.name, 'admin', 'USER_REACTIVATED', req.params.id, 'user', req.ip);
  res.json({ success: true });
});

export default router;
