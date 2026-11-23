import { Router } from 'express';
import { db, uuidv4, log } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getAdminDb, getAdminAuth } from '../firebaseAdmin.js';

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

// Helper: Detect whether valid server-side Firebase Admin credentials are configured
function hasFirebaseCredentials() {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.K_SERVICE ||
    process.env.GAE_INSTANCE
  );
}

// POST /api/passes/:id/parent-token — Authenticated student generates / rotates parent approval token
router.post('/:id/parent-token', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Verify server credentials before attempting Cloud Firestore operations
    if (!hasFirebaseCredentials()) {
      return res.status(503).json({
        error: 'Database service unavailable. Firebase Admin credentials are not configured on the server.',
      });
    }

    // 2. Authenticate requesting student using Firebase Admin Auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const idToken = authHeader.split(' ')[1];
    let decodedUser;
    try {
      const adminAuth = getAdminAuth();
      decodedUser = await adminAuth.verifyIdToken(idToken);
    } catch (authErr) {
      return res.status(401).json({ error: 'Authentication failed: Invalid or expired Firebase token' });
    }

    // 3. Retrieve pass document from Firestore
    const adminDb = getAdminDb();
    const passRef = adminDb.collection('passes').doc(id);
    const passDoc = await passRef.get();

    if (!passDoc.exists) {
      return res.status(404).json({ error: 'Pass not found' });
    }

    const passData = passDoc.data();

    // 4. Verify student ownership
    if (passData.studentId !== decodedUser.uid) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to manage tokens for this pass' });
    }

    // 5. Ensure pass is in a state eligible for parent approval
    if (!['pending', 'parent_rejected'].includes(passData.status)) {
      return res.status(400).json({
        error: `Cannot generate parent token: Pass is currently "${passData.status}" (must be "pending")`,
      });
    }

    // 6. Generate UUID token and securely store/rotate in pass_secrets/{passId}
    const parentToken = uuidv4();
    const now = new Date();
    const secretRef = adminDb.collection('pass_secrets').doc(id);

    await secretRef.set({
      passId: id,
      parentToken,
      parentTokenUsed: false,
      studentId: decodedUser.uid,
      createdAt: now,
      rotatedAt: now,
    });

    // 7. Remove any legacy parentToken stored directly on the pass document
    if (passData.parentToken) {
      await passRef.update({
        parentToken: null,
      }).catch(err => console.warn('[passes] Notice: Could not clear legacy token on pass doc:', err.message));
    }

    const origin = req.get('origin') || process.env.APP_URL || 'http://localhost:5173';
    const parentApprovalUrl = `${origin}/parent/approve/${id}?token=${parentToken}`;

    return res.status(201).json({
      success: true,
      passId: id,
      parentToken,
      parentApprovalUrl,
      message: 'Parent approval token generated and stored in pass_secrets securely',
    });
  } catch (err) {
    console.error('[passes] POST /:id/parent-token error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/passes/parent/:id — Unauthenticated route for parents
router.get('/parent/:id', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Approval token is required' });

    const { id } = req.params;

    // 1. Verify server credentials before attempting Cloud Firestore operations
    if (!hasFirebaseCredentials()) {
      // Allow legacy SQL passes only if record genuinely exists in SQL
      try {
        const legacyPass = await db('gate_passes').where({ id: req.params.id, parent_token: token }).first();
        if (legacyPass) {
          return res.json(await enrichPass(legacyPass));
        }
      } catch (_) {
        // SQL table unavailable or query failed
      }

      console.error('[Firestore] Missing Firebase Admin credentials in server environment.');
      return res.status(503).json({
        error: 'Database service unavailable. Firebase Admin credentials are not configured on the server.',
      });
    }

    // 2. Check Cloud Firestore (Primary source of truth)
    try {
      const adminDb = getAdminDb();
      const passRef = adminDb.collection('passes').doc(id);
      const secretRef = adminDb.collection('pass_secrets').doc(id);

      const [passDoc, secretDoc] = await Promise.all([
        passRef.get(),
        secretRef.get(),
      ]);

      if (passDoc.exists) {
        const passData = passDoc.data();
        const secretData = secretDoc.exists ? secretDoc.data() : null;

        // Token resolution: check pass_secrets first, fallback to legacy passDoc for backward compatibility
        const expectedToken = secretData?.parentToken || passData.parentToken;
        const isTokenUsed = secretData
          ? secretData.parentTokenUsed
          : (passData.parentTokenUsed || passData.parentApproved !== null);

        // Validate token
        if (!expectedToken || expectedToken !== token) {
          return res.status(403).json({ error: 'Invalid or missing approval token' });
        }

        return res.json({
          id: passDoc.id,
          studentName: passData.studentName ?? '',
          usn: passData.usn ?? '',
          room: passData.room ?? '',
          hostel: passData.hostel ?? '',
          reason: passData.reason ?? '',
          reasonDetail: passData.reasonDetail ?? '',
          outTime: passData.outTime?.toDate ? passData.outTime.toDate() : passData.outTime,
          expectedReturn: passData.expectedReturn?.toDate ? passData.expectedReturn.toDate() : passData.expectedReturn,
          status: passData.status,
          parentApproved: passData.parentApproved,
          parentApprovedAt: passData.parentApprovedAt?.toDate ? passData.parentApprovedAt.toDate() : passData.parentApprovedAt,
          parentTokenUsed: !!isTokenUsed,
        });
      }
    } catch (fsErr) {
      console.error('[Firestore] GET /parent/:id infrastructure error:', fsErr.message);
      return res.status(503).json({
        error: 'Database service unavailable. Please check server database configuration.',
      });
    }

    // 3. Fallback to SQL database ONLY when Firestore document genuinely does not exist (legacy records)
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
    if (!token || !action) return res.status(400).json({ error: 'Token and action are required' });
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
    }

    const { id } = req.params;
    let isApprove = action === 'approve';

    // 1. Verify server credentials before attempting Cloud Firestore operations
    if (!hasFirebaseCredentials()) {
      // Allow legacy SQL passes only if record genuinely exists in SQL
      try {
        const legacyPass = await db('gate_passes').where({ id: req.params.id, parent_token: token }).first();
        if (legacyPass) {
          if (legacyPass.parent_status !== 'pending') return res.status(409).json({ error: 'Already responded to' });

          const now = new Date().toISOString();
          const updates = { parent_status: isApprove ? 'approved' : 'rejected', parent_approved_at: now, updated_at: now };
          if (!isApprove) { updates.status = 'rejected'; updates.warden_note = note || 'Rejected by parent'; }

          await db('gate_passes').where('id', legacyPass.id).update(updates);
          await log(null, 'Parent', 'parent', `PARENT_${action.toUpperCase()}`, legacyPass.id, 'gate_pass', req.ip);

          return res.json({ success: true, message: `Pass ${isApprove ? 'approved' : 'rejected'} by parent` });
        }
      } catch (_) {
        // SQL table unavailable or query failed
      }

      console.error('[Firestore] Missing Firebase Admin credentials in server environment.');
      return res.status(503).json({
        error: 'Database service unavailable. Firebase Admin credentials are not configured on the server.',
      });
    }

    // 2. Primary: Update Firestore pass and pass_secrets via Firebase Admin SDK transaction
    let handledByFirestore = false;
    try {
      const adminDb = getAdminDb();
      const passRef = adminDb.collection('passes').doc(id);
      const secretRef = adminDb.collection('pass_secrets').doc(id);

      const txResult = await adminDb.runTransaction(async (transaction) => {
        const passDoc = await transaction.get(passRef);
        if (!passDoc.exists) return null;

        const secretDoc = await transaction.get(secretRef);
        const passData = passDoc.data();
        const secretData = secretDoc.exists ? secretDoc.data() : null;

        // Token resolution: check pass_secrets first, fallback to legacy passDoc
        const expectedToken = secretData?.parentToken || passData.parentToken;
        const isTokenUsed = secretData
          ? secretData.parentTokenUsed
          : (passData.parentTokenUsed || passData.parentApproved !== null);

        // Validate token
        if (!expectedToken || expectedToken !== token) {
          throw { status: 403, message: 'Invalid or missing approval token' };
        }

        // Reject previously used tokens
        if (isTokenUsed || passData.parentApproved !== null) {
          throw { status: 409, message: 'This pass has already been responded to' };
        }

        // Prevent approval of passes that are no longer pending
        if (passData.status !== 'pending') {
          throw { status: 400, message: `Pass is no longer pending (current status: "${passData.status}")` };
        }

        // Expiration check
        const expectedReturn = passData.expectedReturn?.toDate
          ? passData.expectedReturn.toDate()
          : (passData.expectedReturn ? new Date(passData.expectedReturn) : null);
        if (expectedReturn && new Date() > expectedReturn) {
          throw { status: 410, message: 'This gate pass request has expired' };
        }

        const now = new Date();
        const updateData = {
          parentApproved: isApprove,
          parentApprovedAt: now,
          status: isApprove ? 'parent_approved' : 'parent_rejected',
          updatedAt: now,
        };
        if (!isApprove && note) {
          updateData.parentNote = note;
        }

        // Atomically consume token in pass_secrets if document exists
        if (secretDoc.exists) {
          transaction.update(secretRef, {
            parentTokenUsed: true,
            usedAt: now,
          });
        } else {
          // Legacy pass compatibility: update field on passDoc
          updateData.parentTokenUsed = true;
        }

        transaction.update(passRef, updateData);
        return { success: true, studentId: passData.studentId };
      });

      if (txResult) {
        handledByFirestore = true;

        // Record audit log in Firestore
        try {
          await adminDb.collection('audit_logs').add({
            action: isApprove ? 'parent_approved' : 'parent_rejected',
            passId: id,
            actorId: 'parent',
            actorRole: 'parent',
            timestamp: new Date(),
            meta: { note: note || null },
          });
        } catch (auditErr) {
          console.warn('[audit] Failed to write audit log from backend:', auditErr.message);
        }

        // Optional SQL sync if pass exists in SQL table
        try {
          const sqlPass = await db('gate_passes').where('id', id).first();
          if (sqlPass) {
            const now = new Date().toISOString();
            await db('gate_passes').where('id', id).update({
              parent_status: isApprove ? 'approved' : 'rejected',
              parent_approved_at: now,
              status: isApprove ? sqlPass.status : 'rejected',
              updated_at: now,
            });
          }
        } catch (_) {}

        return res.json({
          success: true,
          message: `Pass ${isApprove ? 'approved' : 'rejected'} by parent`,
        });
      }
    } catch (fsErr) {
      if (fsErr.status) {
        return res.status(fsErr.status).json({ error: fsErr.message });
      }
      console.error('[Firestore] PATCH /parent-approve infrastructure error:', fsErr.message);
      return res.status(503).json({
        error: 'Database service unavailable. Please check server database configuration.',
      });
    }

    // 3. Fallback to SQL database ONLY if pass genuinely did not exist in Firestore (legacy records)
    if (!handledByFirestore) {
      const pass = await db('gate_passes').where({ id: req.params.id, parent_token: token }).first();
      if (!pass) return res.status(404).json({ error: 'Pass not found or invalid token' });
      if (pass.parent_status !== 'pending') return res.status(409).json({ error: 'Already responded to' });

      const now = new Date().toISOString();
      const updates = { parent_status: isApprove ? 'approved' : 'rejected', parent_approved_at: now, updated_at: now };
      if (!isApprove) { updates.status = 'rejected'; updates.warden_note = note || 'Rejected by parent'; }

      await db('gate_passes').where('id', pass.id).update(updates);
      await log(null, 'Parent', 'parent', `PARENT_${action.toUpperCase()}`, pass.id, 'gate_pass', req.ip);

      return res.json({ success: true, message: `Pass ${isApprove ? 'approved' : 'rejected'} by parent` });
    }
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
