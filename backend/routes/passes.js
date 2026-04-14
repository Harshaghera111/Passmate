import { Router } from 'express';
import { db, uuidv4, log } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

async function enrichPass(pass) {
  if (!pass) return null;
  const student = await db('users').where('id', pass.student_id).select('id','name','usn','room','hostel_id','branch','year','mobile','parent_mobile').first();
  const hostel = student?.hostel_id ? await db('hostels').where('id', student.hostel_id).first() : null;
  const warden = pass.warden_id ? await db('users').where('id', pass.warden_id).select('id','name').first() : null;
  return {
    ...pass,
    studentName: student?.name,
    usn: student?.usn,
    room: student?.room,
    block: hostel?.block,
    hostel: hostel?.name,
    wardenName: warden?.name,
    isLate: !!pass.is_late,
    parentStatus: pass.parent_status,
  };
}

// GET /api/passes
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, studentId } = req.query;
    const { role, id: userId, hostelId: userHostelId } = req.user;

    let query = db('gate_passes').orderBy('created_at', 'desc');

    if (role === 'student') {
      query = query.where('student_id', userId);
    } else if (role === 'warden') {
      const hostelStudents = await db('users').where('hostel_id', userHostelId).select('id');
      const ids = hostelStudents.map(u => u.id);
      if (ids.length === 0) return res.json([]);
      query = query.whereIn('student_id', ids);
    }

    if (status) query = query.where('status', status);
    if (studentId && role !== 'student') query = query.where('student_id', studentId);

    const passes = await query;
    const enriched = await Promise.all(passes.map(enrichPass));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/passes/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pass = await db('gate_passes').where('id', req.params.id).first();
    if (!pass) return res.status(404).json({ error: 'Pass not found' });
    res.json(await enrichPass(pass));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/passes — student creates request
router.post('/', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { reason, reasonDetail, outTime, expectedReturn } = req.body;
    if (!reason || !reasonDetail || !outTime || !expectedReturn) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = 'GP-' + Date.now();
    const parentToken = uuidv4();

    await db('gate_passes').insert({
      id, student_id: req.user.id, reason, reason_detail: reasonDetail,
      out_time: outTime, expected_return: expectedReturn,
      status: 'pending', parent_status: 'pending',
      parent_token: parentToken,
      parent_approved_at: null,
      qr_code: `${id}::${req.user.id}::${req.user.usn}::pending`,
    });

    await db('users').where('id', req.user.id).increment('total_passes', 1);
    await log(req.user.id, req.user.name, 'student', 'PASS_CREATED', id, 'gate_pass', req.ip);

    const parentApprovalUrl = `http://localhost:5173/parent/approve/${id}?token=${parentToken}`;
    console.log(`\n📨 Parent approval link: ${parentApprovalUrl}\n`);

    const pass = await db('gate_passes').where('id', id).first();
    res.status(201).json(await enrichPass(pass));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/passes/parent/:id — Unauthenticated route for parents
router.get('/parent/:id', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const pass = await db('gate_passes').where({ id: req.params.id, parent_token: token }).first();
    if (!pass) return res.status(404).json({ error: 'Pass not found or invalid token' });

    res.json(await enrichPass(pass));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/passes/:id/parent-approve
router.patch('/:id/parent-approve', async (req, res) => {
  try {
    const { token, action, note } = req.body;
    if (!token || !action) return res.status(400).json({ error: 'Token and action required' });

    const pass = await db('gate_passes').where({ id: req.params.id, parent_token: token }).first();
    if (!pass) return res.status(404).json({ error: 'Pass not found or invalid token' });
    if (pass.parent_status !== 'pending') return res.status(409).json({ error: 'Already responded to' });

    const now = new Date().toISOString();
    const updates = { parent_status: action === 'approve' ? 'approved' : 'rejected', parent_approved_at: now, updated_at: now };
    if (action === 'reject') { updates.status = 'rejected'; updates.warden_note = note || 'Rejected by parent'; }

    await db('gate_passes').where('id', pass.id).update(updates);
    await log(null, 'Parent', 'parent', `PARENT_${action.toUpperCase()}`, pass.id, 'gate_pass', req.ip);

    res.json({ success: true, message: `Pass ${action === 'approve' ? 'approved' : 'rejected'} by parent` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/passes/:id/warden-approve
router.patch('/:id/warden-approve', authenticate, requireRole('warden'), async (req, res) => {
  try {
    const { note } = req.body;
    const pass = await db('gate_passes').where('id', req.params.id).first();
    if (!pass) return res.status(404).json({ error: 'Pass not found' });
    // Bypassing strict parent check for demo/SaaS pivot testing
    // if (pass.parent_status !== 'approved') return res.status(409).json({ error: 'Parent has not approved yet' });

    const now = new Date().toISOString();
    const qrCode = `${pass.id}::${pass.student_id}::approved::${now}`;

    await db('gate_passes').where('id', pass.id).update({
      status: 'approved', warden_id: req.user.id, warden_note: note || null,
      warden_approved_at: now, qr_code: qrCode, updated_at: now,
    });

    await log(req.user.id, req.user.name, 'warden', 'PASS_APPROVED', pass.id, 'gate_pass', req.ip);
    const updated = await db('gate_passes').where('id', pass.id).first();
    res.json(await enrichPass(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/passes/:id/warden-reject
router.patch('/:id/warden-reject', authenticate, requireRole('warden'), async (req, res) => {
  try {
    const { note } = req.body;
    const pass = await db('gate_passes').where('id', req.params.id).first();
    if (!pass) return res.status(404).json({ error: 'Pass not found' });

    const now = new Date().toISOString();
    await db('gate_passes').where('id', pass.id).update({
      status: 'rejected', warden_id: req.user.id,
      warden_note: note || 'Rejected by warden', updated_at: now,
    });

    await log(req.user.id, req.user.name, 'warden', 'PASS_REJECTED', pass.id, 'gate_pass', req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/passes/:id/scan-exit
router.patch('/:id/scan-exit', authenticate, requireRole('guard'), async (req, res) => {
  try {
    const pass = await db('gate_passes').where('id', req.params.id).first();
    if (!pass) return res.status(404).json({ error: 'Pass not found' });
    if (pass.status !== 'approved') return res.status(409).json({ error: `Pass status is "${pass.status}", not "approved"` });

    const now = new Date().toISOString();
    await db('gate_passes').where('id', pass.id).update({ status: 'active', exit_scanned_at: now, guard_exit_id: req.user.id, updated_at: now });
    await log(req.user.id, req.user.name, 'guard', 'PASS_EXIT_SCANNED', pass.id, 'gate_pass', req.ip);
    res.json({ success: true, action: 'exit_recorded', passId: pass.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/passes/:id/scan-entry
router.patch('/:id/scan-entry', authenticate, requireRole('guard'), async (req, res) => {
  try {
    const pass = await db('gate_passes').where('id', req.params.id).first();
    if (!pass) return res.status(404).json({ error: 'Pass not found' });
    if (pass.status !== 'active') return res.status(409).json({ error: `Pass status is "${pass.status}", expected "active"` });

    const now = new Date();
    const nowStr = now.toISOString();
    const isLate = now > new Date(pass.expected_return);

    await db('gate_passes').where('id', pass.id).update({
      status: 'returned', actual_return: nowStr, entry_scanned_at: nowStr,
      guard_entry_id: req.user.id, is_late: isLate, updated_at: nowStr,
    });

    if (isLate) {
      const minutesLate = Math.round((now - new Date(pass.expected_return)) / 60000);
      await db('violations').insert({ id: uuidv4(), student_id: pass.student_id, pass_id: pass.id, type: 'LATE_RETURN', note: `Returned ${minutesLate} mins late` });
      await db('users').where('id', pass.student_id).increment('violations', 1);
    } else {
      await db('users').where('id', pass.student_id).increment('on_time_returns', 1);
    }

    await log(req.user.id, req.user.name, 'guard', 'PASS_ENTRY_SCANNED', pass.id, 'gate_pass', req.ip);
    res.json({ success: true, action: 'entry_recorded', isLate, passId: pass.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/passes/verify/:passId
router.get('/verify/:passId', authenticate, requireRole('guard'), async (req, res) => {
  try {
    const pass = await db('gate_passes').where('id', req.params.passId).first();
    if (!pass) return res.status(404).json({ valid: false, error: 'Pass not found' });
    const valid = pass.status === 'approved' || pass.status === 'active';
    res.json({ valid, pass: await enrichPass(pass) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
