import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/analytics
router.get('/analytics', authenticate, requireRole('admin', 'warden'), async (req, res) => {
  try {
    const totalStudents = (await db('users').where({ role: 'student', is_active: true }).count('id as c').first()).c;
    const passesToday = (await db('gate_passes').whereRaw("DATE(created_at) = DATE('now')").count('id as c').first()).c;
    const lateReturns = (await db('gate_passes').where('is_late', true).count('id as c').first()).c;
    const highViolations = (await db('users').where('role', 'student').where('is_active', true).where('violations', '>=', 3).count('id as c').first()).c;

    const statusBreakdown = await db('gate_passes').select('status as name').count('id as value').groupBy('status').orderBy('value', 'desc');
    const COLORS = { approved: '#10B981', pending: '#F59E0B', rejected: '#EF4444', active: '#2F6FED', returned: '#7C3AED', expired: '#9BA3B2' };
    const coloredStatus = statusBreakdown.map(r => ({ ...r, color: COLORS[r.name] || '#9BA3B2' }));

    const reasonBreakdown = await db('gate_passes').select('reason').count('id as count').groupBy('reason').orderBy('count', 'desc').limit(6);

    const dailyPassData = await db('gate_passes')
      .whereRaw("created_at >= datetime('now', '-14 days')")
      .select(db.raw(`
        DATE(created_at) as date,
        COUNT(id) as total,
        SUM(CASE WHEN status IN ('approved','active','returned') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      `))
      .groupByRaw("DATE(created_at)")
      .orderBy('date');


    res.json({ kpis: { totalStudents, passesToday, lateReturns, highViolations }, statusBreakdown: coloredStatus, reasonBreakdown, dailyPassData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/logs
router.get('/logs', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { limit = 100, offset = 0, action, role } = req.query;
    let query = db('audit_logs').orderBy('created_at', 'desc');
    if (action) query = query.where('action', action);
    if (role) query = query.where('role', role);
    const logs = await query.limit(parseInt(limit)).offset(parseInt(offset));
    const total = (await db('audit_logs').count('id as c').first()).c;
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/violations
router.get('/violations', authenticate, requireRole('admin', 'warden'), async (req, res) => {
  try {
    const violators = await db('users')
      .leftJoin('hostels', 'users.hostel_id', 'hostels.id')
      .select('users.id', 'users.name', 'users.usn', 'users.room', 'users.mobile', 'users.parent_mobile', 'users.violations', 'users.total_passes', 'users.on_time_returns', 'hostels.name as hostel', 'hostels.block')
      .where('users.role', 'student')
      .where('users.violations', '>', 0)
      .orderBy('users.violations', 'desc');
    res.json(violators);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
