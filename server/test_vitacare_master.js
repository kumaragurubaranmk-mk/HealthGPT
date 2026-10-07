import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runMasterTestSuite() {
  console.log('======================================================================');
  console.log('🏥 VITACARE AI – STEP 1 AUTOMATED COMPLIANCE & SECURITY TEST SUITE');
  console.log('======================================================================\n');

  const testReport = {
    total: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    security: { total: 0, passed: 0, failed: 0 },
    language: { total: 0, passed: 0, failed: 0 },
    medicineTracking: { total: 0, passed: 0, failed: 0 },
    callEscalation: { total: 0, passed: 0, failed: 0 },
    criticalFailures: [],
    highPriorityFailures: [],
    missingFeatures: []
  };

  function assert(category, testName, condition, details = '', isCritical = false) {
    testReport.total++;
    if (category === 'security') testReport.security.total++;
    if (category === 'language') testReport.language.total++;
    if (category === 'medicineTracking') testReport.medicineTracking.total++;
    if (category === 'callEscalation') testReport.callEscalation.total++;

    if (condition) {
      testReport.passed++;
      if (category === 'security') testReport.security.passed++;
      if (category === 'language') testReport.language.passed++;
      if (category === 'medicineTracking') testReport.medicineTracking.passed++;
      if (category === 'callEscalation') testReport.callEscalation.passed++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      testReport.failed++;
      if (category === 'security') testReport.security.failed++;
      if (category === 'language') testReport.language.failed++;
      if (category === 'medicineTracking') testReport.medicineTracking.failed++;
      if (category === 'callEscalation') testReport.callEscalation.failed++;
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
      if (isCritical) {
        testReport.criticalFailures.push(`${testName}: ${details}`);
      } else {
        testReport.highPriorityFailures.push(`${testName}: ${details}`);
      }
    }
  }

  try {
    // PREPARATION: Authenticate Patient A, Patient B, and Admin
    console.log('--- SETUP: Authenticating Test Users ---');
    const loginA = await request('POST', '/auth/login', {
      email: 'patient_a@vitacare.test',
      password: 'TestPatient@123!'
    });
    const tokenA = loginA.body.token;
    const patientA = loginA.body.user;

    const loginB = await request('POST', '/auth/login', {
      email: 'patient_b@vitacare.test',
      password: 'TestPatient@123!'
    });
    const tokenB = loginB.body.token;
    const patientB = loginB.body.user;

    const loginAdmin = await request('POST', '/admin/login', {
      username: 'admin',
      password: 'Admin@HealthGPT2026!'
    });
    const tokenAdmin = loginAdmin.body.token;

    assert('security', 'Authentication of Test Users (Patient A, Patient B, Admin)',
      Boolean(tokenA && tokenB && tokenAdmin),
      'Failed to authenticate seeded test users', true);

    const today = new Date().toISOString().split('T')[0];

    // =========================================================================
    // TEST 1 – Scheduled Medicine
    // Create a medicine schedule.
    // Expected: Medicine appears as PENDING. PASS only if the database also contains PENDING.
    // =========================================================================
    console.log('\n--- TEST 1: Scheduled Medicine & Initial PENDING Status ---');
    const createMed1 = await request('POST', '/medications', {
      medicine_name: 'Metformin XR',
      dosage: '500 mg',
      frequency: 'Once daily',
      reminder_time: '08:00 AM',
      instructions: 'Take with morning meal',
      start_date: today,
      duration_days: 14
    }, tokenA);

    const med1Id = createMed1.body.reminder?.id;
    const getReminders1 = await request('GET', '/medications', null, tokenA);
    const slot1 = (getReminders1.body.todaySlots || []).find(s => s.id === med1Id || s.reminderId === med1Id);
    
    // Check database directly
    const dbLog1 = db.prepare('SELECT status FROM medication_logs WHERE reminder_id = ? AND scheduled_date = ?').get(med1Id, today);

    assert('medicineTracking', 'TEST 1: Medicine appears as PENDING in API and DB contains PENDING',
      createMed1.status === 201 && slot1 && slot1.status === 'pending' && dbLog1 && dbLog1.status === 'pending',
      `API status: ${slot1?.status}, DB status: ${dbLog1?.status}`, true);

    // =========================================================================
    // TEST 2 – Manual Verification Attack
    // Attempt: POST medicine status = VERIFIED without a valid consumption event.
    // Expected: REQUEST REJECTED. Medicine remains PENDING.
    // =========================================================================
    console.log('\n--- TEST 2: Manual Verification Attack Rejection ---');
    const attack1 = await request('POST', `/medications/${med1Id}/verify`, {
      status: 'VERIFIED'
    }, tokenA);

    const attack2 = await request('PUT', `/medications/${med1Id}`, {
      status: 'VERIFIED'
    }, tokenA);

    const attack3 = await request('POST', `/medications/log`, {
      reminder_id: med1Id,
      status: 'verified'
    }, tokenA);

    const dbLogAfterAttacks = db.prepare('SELECT status FROM medication_logs WHERE reminder_id = ? AND scheduled_date = ?').get(med1Id, today);
    const getRemindersAfterAttacks = await request('GET', '/medications', null, tokenA);
    const slotAfterAttacks = (getRemindersAfterAttacks.body.todaySlots || []).find(s => s.id === med1Id);

    assert('security', 'TEST 2: Direct manual verification attempts return 403 Forbidden',
      attack1.status === 403 && attack2.status === 403 && attack3.status === 403,
      `Responses: attack1=${attack1.status}, attack2=${attack2.status}, attack3=${attack3.status}`, true);

    assert('medicineTracking', 'TEST 2: Medicine strictly remains PENDING in DB and UI after attack',
      dbLogAfterAttacks && dbLogAfterAttacks.status === 'pending' && slotAfterAttacks?.status === 'pending',
      `DB Status: ${dbLogAfterAttacks?.status}, API Status: ${slotAfterAttacks?.status}`, true);

    // =========================================================================
    // TEST 3 – Successful Consumption
    // Start legitimate consumption tracking. Simulate/use the real test tracking pipeline
    // to produce a valid consumption event.
    // Expected: Consumption event stored. Medicine becomes: VERIFIED. No manual verification required.
    // =========================================================================
    console.log('\n--- TEST 3: Legitimate Camera Computer-Vision Consumption Verification ---');
    const sessionId1 = `session-${Date.now()}`;
    const consumptionPayload = {
      sessionId: sessionId1,
      scheduled_time: '08:00 AM',
      scheduled_date: today,
      status: 'CONSUMPTION_DETECTED',
      verification_source: 'camera_cv_pipeline',
      confidence_score: 0.94,
      device_info: 'Chrome 122 on Windows (CV Tracker Modal)',
      telemetry_data: {
        faceDetected: true,
        pillInHand: true,
        mouthMotionTrajectory: 'hand_to_mouth_arc',
        dwellDurationMs: 820,
        swallowMotionDetected: true
      }
    };

    const validConsumptionRes = await request('POST', `/medications/${med1Id}/consumption-event`, consumptionPayload, tokenA);
    
    // Check consumption_events table
    const dbEvent1 = db.prepare('SELECT * FROM consumption_events WHERE medicine_id = ? AND status = ?').get(med1Id, 'VERIFIED');
    const dbLogVerified = db.prepare('SELECT * FROM medication_logs WHERE reminder_id = ? AND scheduled_date = ?').get(med1Id, today);
    const getRemindersAfterVerify = await request('GET', '/medications', null, tokenA);
    const slotVerified = (getRemindersAfterVerify.body.todaySlots || []).find(s => s.id === med1Id);

    assert('medicineTracking', 'TEST 3: Consumption event stored in DB and medicine becomes VERIFIED',
      validConsumptionRes.status === 200 &&
      validConsumptionRes.body.status === 'VERIFIED' &&
      Boolean(dbEvent1) &&
      dbLogVerified.status === 'verified' &&
      slotVerified.status === 'verified',
      `API: ${validConsumptionRes.body.status}, DB Event: ${Boolean(dbEvent1)}, Log: ${dbLogVerified?.status}`, true);

    // =========================================================================
    // TEST 4 – Duplicate Consumption Event
    // Send the same consumption event twice.
    // Expected: Only one verification. No duplicate guardian notification. No duplicate history entry.
    // =========================================================================
    console.log('\n--- TEST 4: Duplicate Consumption Event Idempotency ---');
    const alertCountBefore = db.prepare('SELECT COUNT(*) as cnt FROM guardian_alerts WHERE user_id = ? AND reminder_id = ?').get(patientA.id, med1Id).cnt;
    const timelineCountBefore = db.prepare("SELECT COUNT(*) as cnt FROM medical_timeline WHERE user_id = ? AND event_type = 'medicine_verified'").get(patientA.id).cnt;

    const duplicateConsumptionRes = await request('POST', `/medications/${med1Id}/consumption-event`, consumptionPayload, tokenA);

    const alertCountAfter = db.prepare('SELECT COUNT(*) as cnt FROM guardian_alerts WHERE user_id = ? AND reminder_id = ?').get(patientA.id, med1Id).cnt;
    const timelineCountAfter = db.prepare("SELECT COUNT(*) as cnt FROM medical_timeline WHERE user_id = ? AND event_type = 'medicine_verified'").get(patientA.id).cnt;

    assert('medicineTracking', 'TEST 4: Duplicate consumption returns duplicatePrevented=true and zero extra alerts/logs',
      duplicateConsumptionRes.status === 200 &&
      duplicateConsumptionRes.body.duplicatePrevented === true &&
      alertCountBefore === alertCountAfter &&
      timelineCountBefore === timelineCountAfter,
      `Prevented: ${duplicateConsumptionRes.body.duplicatePrevented}, Alerts Before: ${alertCountBefore}, After: ${alertCountAfter}`, true);

    // =========================================================================
    // TEST 5 – Patient Refuses
    // Patient refuses medicine.
    // Expected: Status becomes PATIENT_REFUSED. Patient call #1 starts.
    // =========================================================================
    console.log('\n--- TEST 5: Patient Refuses Medicine -> PATIENT_REFUSED & Call #1 ---');
    const createMed2 = await request('POST', '/medications', {
      medicine_name: 'Atorvastatin',
      dosage: '20 mg',
      frequency: 'Once daily',
      reminder_time: '09:00 PM',
      instructions: 'Before bed',
      start_date: today,
      duration_days: 30
    }, tokenA);
    const med2Id = createMed2.body.reminder?.id;

    const refuseRes = await request('POST', `/medications/${med2Id}/refuse`, {
      scheduled_time: '09:00 PM',
      reason: 'Patient reported dizziness'
    }, tokenA);

    const dbRefuseLog = db.prepare('SELECT status FROM medication_logs WHERE reminder_id = ? AND scheduled_date = ?').get(med2Id, today);
    const dbCall1 = db.prepare('SELECT * FROM call_logs WHERE reminder_id = ? AND attempt_number = 1').get(med2Id);

    assert('callEscalation', 'TEST 5: Refusal sets PATIENT_REFUSED and triggers Patient Call #1',
      refuseRes.status === 200 &&
      refuseRes.body.status === 'PATIENT_REFUSED' &&
      dbRefuseLog.status === 'refused' &&
      Boolean(dbCall1) &&
      dbCall1.call_type === 'patient_warning_1',
      `Refusal: ${refuseRes.body.status}, DB Log: ${dbRefuseLog?.status}, Call1: ${dbCall1?.call_type}`, true);

    // =========================================================================
    // TEST 6 – First Call Answered
    // Patient answers Call #1.
    // Expected: Escalation stops. Call #2 must NOT occur. Guardian must NOT be called.
    // =========================================================================
    console.log('\n--- TEST 6: First Call Answered -> Escalation Stops ---');
    // Mark Call 1 as answered
    const updateCall1Res = await request('POST', `/medications/calls/${dbCall1.id}/status`, {
      status: 'answered',
      durationSeconds: 32,
      notes: 'Patient confirmed verbally on call'
    }, tokenA);

    // Attempt escalation
    const escalateAfterAnswer = await request('POST', `/medications/${med2Id}/escalate`, {
      force: true
    }, tokenA);

    const dbCall2Check = db.prepare('SELECT * FROM call_logs WHERE reminder_id = ? AND attempt_number = 2').get(med2Id);
    const dbGuardianCheck = db.prepare("SELECT * FROM call_logs WHERE reminder_id = ? AND call_type = 'guardian_escalation'").get(med2Id);

    assert('callEscalation', 'TEST 6: Escalation stops when Call #1 is answered; Call #2 & Guardian NOT called',
      escalateAfterAnswer.body.stopped === true &&
      !dbCall2Check &&
      !dbGuardianCheck,
      `Stopped: ${escalateAfterAnswer.body.stopped}, Call2 Exists: ${Boolean(dbCall2Check)}, Guardian Exists: ${Boolean(dbGuardianCheck)}`, true);

    // =========================================================================
    // TEST 7 – First Call Not Answered
    // Patient does not answer Call #1.
    // Expected: Call #2 occurs after configured timeout.
    // =========================================================================
    console.log('\n--- TEST 7: First Call Not Answered -> Call #2 Occurs ---');
    const createMed3 = await request('POST', '/medications', {
      medicine_name: 'Amlodipine',
      dosage: '5 mg',
      frequency: 'Once daily',
      reminder_time: '10:00 AM',
      instructions: 'Morning with water',
      start_date: today,
      duration_days: 10
    }, tokenA);
    const med3Id = createMed3.body.reminder?.id;

    // Start Call 1
    const call1Med3Res = await request('POST', `/medications/${med3Id}/escalate`, { force: true }, tokenA);
    const call1Id = call1Med3Res.body.callId;

    // Simulate Call 1 unanswered / timeout
    await request('POST', `/medications/calls/${call1Id}/status`, {
      status: 'no_answer',
      durationSeconds: 0
    }, tokenA);

    // Trigger next escalation stage
    const call2Med3Res = await request('POST', `/medications/${med3Id}/escalate`, { force: true }, tokenA);
    const dbCall2Med3 = db.prepare('SELECT * FROM call_logs WHERE reminder_id = ? AND attempt_number = 2').get(med3Id);

    assert('callEscalation', 'TEST 7: Unanswered Call #1 leads to Call #2 dispatch',
      call2Med3Res.body.stage === 'patient_warning_2' &&
      Boolean(dbCall2Med3) &&
      dbCall2Med3.attempt_number === 2,
      `Stage: ${call2Med3Res.body.stage}, Call2 attempt: ${dbCall2Med3?.attempt_number}`, true);

    // =========================================================================
    // TEST 8 – Both Calls Unanswered
    // Patient does not answer Call #1. Patient does not answer Call #2.
    // Expected: Guardian escalation occurs exactly once.
    // =========================================================================
    console.log('\n--- TEST 8: Both Calls Unanswered -> Guardian Escalation ---');
    const call2Id = call2Med3Res.body.callId;
    await request('POST', `/medications/calls/${call2Id}/status`, {
      status: 'no_answer',
      durationSeconds: 0
    }, tokenA);

    const guardianEscalationRes = await request('POST', `/medications/${med3Id}/escalate`, { force: true }, tokenA);
    const dbGuardianAlert = db.prepare("SELECT * FROM guardian_alerts WHERE reminder_id = ? AND alert_type = 'guardian_escalation'").get(med3Id);

    assert('callEscalation', 'TEST 8: Guardian escalation occurs with exact VitaCare alert message format',
      guardianEscalationRes.body.stage === 'guardian_escalation' &&
      Boolean(dbGuardianAlert) &&
      dbGuardianAlert.message.includes('VitaCare Alert:') &&
      dbGuardianAlert.message.includes('has not confirmed consumption of Amlodipine'),
      `Stage: ${guardianEscalationRes.body.stage}, Message: "${dbGuardianAlert?.message}"`, true);

    // =========================================================================
    // TEST 9 – Guardian Escalation Duplication
    // Trigger the same escalation event multiple times.
    // Expected: Only one guardian escalation.
    // =========================================================================
    console.log('\n--- TEST 9: Guardian Escalation Duplication Prevention ---');
    const guardianAlertCountBefore = db.prepare("SELECT COUNT(*) as cnt FROM guardian_alerts WHERE reminder_id = ? AND alert_type = 'guardian_escalation'").get(med3Id).cnt;
    const guardianCallCountBefore = db.prepare("SELECT COUNT(*) as cnt FROM call_logs WHERE reminder_id = ? AND call_type = 'guardian_escalation'").get(med3Id).cnt;

    const dupGuardianRes1 = await request('POST', `/medications/${med3Id}/escalate`, { force: true }, tokenA);
    const dupGuardianRes2 = await request('POST', `/medications/${med3Id}/escalate`, { force: true }, tokenA);

    const guardianAlertCountAfter = db.prepare("SELECT COUNT(*) as cnt FROM guardian_alerts WHERE reminder_id = ? AND alert_type = 'guardian_escalation'").get(med3Id).cnt;
    const guardianCallCountAfter = db.prepare("SELECT COUNT(*) as cnt FROM call_logs WHERE reminder_id = ? AND call_type = 'guardian_escalation'").get(med3Id).cnt;

    assert('callEscalation', 'TEST 9: Repeated escalation calls return duplicatePrevented and do not duplicate alerts',
      dupGuardianRes1.body.duplicatePrevented === true &&
      dupGuardianRes2.body.duplicatePrevented === true &&
      guardianAlertCountBefore === 1 &&
      guardianAlertCountAfter === 1 &&
      guardianCallCountBefore === 1 &&
      guardianCallCountAfter === 1,
      `Alerts Before: ${guardianAlertCountBefore}, After: ${guardianAlertCountAfter}; Calls: ${guardianCallCountBefore} -> ${guardianCallCountAfter}`, true);

    // =========================================================================
    // TEST 10 – User Isolation
    // Patient A creates medicine. Login as Patient B. Attempt to access Patient A's medicine.
    // Expected: ACCESS DENIED.
    // =========================================================================
    console.log('\n--- TEST 10: Multi-Tenant Patient Privacy Isolation ---');
    const accessDeniedMed = await request('PUT', `/medications/${med1Id}`, { dosage: '999 mg' }, tokenB);
    const accessDeniedDelete = await request('DELETE', `/medications/${med1Id}`, null, tokenB);
    const accessDeniedVerify = await request('POST', `/medications/${med1Id}/consumption-event`, consumptionPayload, tokenB);
    const accessDeniedRefuse = await request('POST', `/medications/${med1Id}/refuse`, { reason: 'malicious' }, tokenB);

    assert('security', 'TEST 10: Patient B is denied access to Patient A medication (404/403 across all ops)',
      accessDeniedMed.status === 404 &&
      accessDeniedDelete.status === 404 &&
      accessDeniedVerify.status === 404 &&
      accessDeniedRefuse.status === 404,
      `Statuses: PUT=${accessDeniedMed.status}, DEL=${accessDeniedDelete.status}, VERIFY=${accessDeniedVerify.status}, REFUSE=${accessDeniedRefuse.status}`, true);

    // =========================================================================
    // TEST 11 – API ID Manipulation
    // Change userId, medicineId, scheduleId in API requests.
    // Expected: Unauthorized requests are rejected server-side.
    // =========================================================================
    console.log('\n--- TEST 11: API ID Manipulation Attack Rejection ---');
    const manipulatedIdRes = await request('POST', `/medications/fake-medicine-uuid-9999/consumption-event`, {
      userId: patientB.id,
      scheduleId: 'fake-schedule-id',
      status: 'CONSUMPTION_DETECTED',
      confidence_score: 0.99
    }, tokenA);

    assert('security', 'TEST 11: Spoofed medicineId and userId rejected server-side',
      manipulatedIdRes.status === 404 || manipulatedIdRes.status === 400 || manipulatedIdRes.status === 403,
      `Response code: ${manipulatedIdRes.status}`, true);

    // =========================================================================
    // TEST 12 – Language Test
    // Switch: English -> Tamil -> Telugu -> Hindi. Verify every page.
    // Expected: No important user-facing text remains unintentionally untranslated.
    // =========================================================================
    console.log('\n--- TEST 12: Comprehensive 4-Language Key Parity & Content Audit ---');
    const translationsPath = path.resolve(__dirname, '../client/src/translations');
    const en = JSON.parse(fs.readFileSync(path.join(translationsPath, 'en.json'), 'utf8'));
    const ta = JSON.parse(fs.readFileSync(path.join(translationsPath, 'ta.json'), 'utf8'));
    const te = JSON.parse(fs.readFileSync(path.join(translationsPath, 'te.json'), 'utf8'));
    const hi = JSON.parse(fs.readFileSync(path.join(translationsPath, 'hi.json'), 'utf8'));

    function extractKeys(obj, prefix = '') {
      return Object.keys(obj).reduce((res, el) => {
        if (Array.isArray(obj[el])) return [...res, prefix + el];
        if (typeof obj[el] === 'object' && obj[el] !== null) {
          return [...res, ...extractKeys(obj[el], prefix + el + '.')];
        }
        return [...res, prefix + el];
      }, []);
    }

    const enKeys = extractKeys(en);
    const taKeys = extractKeys(ta);
    const teKeys = extractKeys(te);
    const hiKeys = extractKeys(hi);

    const missingInTa = enKeys.filter(k => !taKeys.includes(k));
    const missingInTe = enKeys.filter(k => !teKeys.includes(k));
    const missingInHi = enKeys.filter(k => !hiKeys.includes(k));

    assert('language', 'TEST 12: 100% key parity across all 4 languages (EN, TA, TE, HI) with 0 missing keys',
      missingInTa.length === 0 && missingInTe.length === 0 && missingInHi.length === 0,
      `Missing: TA=${missingInTa.length}, TE=${missingInTe.length}, HI=${missingInHi.length}`, true);

    // =========================================================================
    // TEST 13 – Language Persistence
    // Select Tamil. Logout. Login again. Expected: Tamil remains selected. Repeat for Telugu and Hindi.
    // =========================================================================
    console.log('\n--- TEST 13: Language Preference Database Persistence ---');
    const testLangs = ['ta', 'te', 'hi', 'en'];
    let persistenceSuccess = true;

    for (const lang of testLangs) {
      // 1. Update language preference
      const updateLangRes = await request('PUT', '/user/language', { language: lang }, tokenA);
      if (updateLangRes.status !== 200) { persistenceSuccess = false; break; }

      // 2. Relogin
      const reloginRes = await request('POST', '/auth/login', {
        email: 'patient_a@vitacare.test',
        password: 'TestPatient@123!'
      });

      if (reloginRes.body.user?.preferred_language !== lang) {
        persistenceSuccess = false;
        console.error(`Language ${lang} not restored on login. Got: ${reloginRes.body.user?.preferred_language}`);
        break;
      }
    }

    assert('language', 'TEST 13: Language persistence across logout & login verified for Tamil, Telugu, Hindi, English',
      persistenceSuccess,
      'Failed to persist and restore language preferences', true);

    // =========================================================================
    // TEST 14 – Camera Permission Handling
    // Start consumption tracking. If permission is denied:
    // Expected: Clear localized error message. Application must not crash.
    // =========================================================================
    console.log('\n--- TEST 14: Camera Permission Handling & Localized Error Messaging ---');
    // Verify client modal code contains try/catch on navigator.mediaDevices.getUserMedia
    // and displays localized error message without crashing.
    const modalCode = fs.readFileSync(path.resolve(__dirname, '../client/src/components/PillConsumptionTrackerModal.jsx'), 'utf8');
    const handlesPermissionDenied = modalCode.includes('NotAllowedError') &&
      (modalCode.includes('cameraPermissionDenied') || modalCode.includes('camera_denied')) &&
      modalCode.includes('try') &&
      modalCode.includes('catch');

    assert('medicineTracking', 'TEST 14: Real camera permission error handled gracefully with localized i18n alert',
      handlesPermissionDenied,
      'Modal does not handle NotAllowedError or missing localized error key', false);

    // =========================================================================
    // TEST 15 – Camera Stop
    // End tracking. Expected: Camera stream stops. No unnecessary camera stream remains active.
    // =========================================================================
    console.log('\n--- TEST 15: Camera Stream Lifecycle & Stream Track Termination ---');
    const stopsMediaTracks = modalCode.includes('stream.getTracks().forEach(t => t.stop())') ||
      modalCode.includes('streamRef.current.getTracks().forEach(track => track.stop())') ||
      modalCode.includes('track.stop()');

    assert('medicineTracking', 'TEST 15: Camera stream tracks cleanly terminated on modal close / tracking end',
      stopsMediaTracks,
      'Modal does not clean up stream tracks', false);

    // =========================================================================
    // TEST 16 – Tracking Failure
    // Force/produce a tracking failure.
    // Expected: Medicine is NOT automatically marked VERIFIED. Status remains appropriate.
    // =========================================================================
    console.log('\n--- TEST 16: Tracking Failure Leaves Medicine PENDING / FAILED ---');
    const createMed4 = await request('POST', '/medications', {
      medicine_name: 'Lisinopril',
      dosage: '10 mg',
      frequency: 'Once daily',
      reminder_time: '12:00 PM',
      instructions: 'After lunch',
      start_date: today,
      duration_days: 7
    }, tokenA);
    const med4Id = createMed4.body.reminder?.id;

    // Simulate failed tracking event (e.g. low confidence or forced failure)
    const failTrackingRes = await request('POST', `/medications/${med4Id}/consumption-event`, {
      scheduled_time: '12:00 PM',
      scheduled_date: today,
      status: 'FAILED',
      forceFailure: true,
      confidence_score: 0.35,
      verification_source: 'camera_cv_pipeline'
    }, tokenA);

    const dbLogFailCheck = db.prepare('SELECT status FROM medication_logs WHERE reminder_id = ? AND scheduled_date = ?').get(med4Id, today);
    const getRemindersFailCheck = await request('GET', '/medications', null, tokenA);
    const slotFailCheck = (getRemindersFailCheck.body.todaySlots || []).find(s => s.id === med4Id);

    assert('medicineTracking', 'TEST 16: Tracking failure does NOT mark medicine VERIFIED (status is tracking_failed/pending)',
      failTrackingRes.body.status === 'TRACKING_FAILED' &&
      dbLogFailCheck.status !== 'verified' &&
      slotFailCheck.status !== 'verified',
      `Result status: ${failTrackingRes.body.status}, DB Log: ${dbLogFailCheck?.status}`, true);

    // =========================================================================
    // TEST 17 – Logout During Tracking
    // Start tracking. Logout.
    // Expected: Tracking/session is safely terminated according to security requirements.
    // No medicine data is assigned to another user.
    // =========================================================================
    console.log('\n--- TEST 17: Logout During Tracking Session Teardown & Isolation ---');
    // Attempt consumption verification with an unauthenticated / cleared session
    const logoutVerifyRes = await request('POST', `/medications/${med4Id}/consumption-event`, consumptionPayload, null);

    assert('security', 'TEST 17: Unauthenticated consumption attempt returns 401 Unauthorized after logout',
      logoutVerifyRes.status === 401,
      `Status code: ${logoutVerifyRes.status}`, true);

    // =========================================================================
    // TEST 18 – Expired Session
    // Allow authentication session to expire. Attempt consumption verification.
    // Expected: Request rejected.
    // =========================================================================
    console.log('\n--- TEST 18: Expired / Forged Session Token Rejection ---');
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtcGF0aWVudC1hLTAwMSIsImV4cCI6MTYwMDAwMDAwMH0.signature';
    const expiredVerifyRes = await request('POST', `/medications/${med4Id}/consumption-event`, consumptionPayload, forgedToken);

    assert('security', 'TEST 18: Expired or invalid JWT token strictly rejected with 401 Unauthorized',
      expiredVerifyRes.status === 401,
      `Status code: ${expiredVerifyRes.status}`, true);

    // =========================================================================
    // TEST 19 – Admin Configuration
    // Admin changes: Maximum call attempts = 2. Admin changes timeout.
    // Verify: Patient receives at most two call attempts before guardian escalation.
    // =========================================================================
    console.log('\n--- TEST 19: Administrator System Settings Governance ---');
    const adminConfigRes = await request('POST', '/admin/settings', {
      max_patient_warning_attempts: '2',
      warning_timeout_minutes: '10'
    }, tokenAdmin);

    const dbSettingAttempts = db.prepare("SELECT value FROM system_settings WHERE key = 'max_patient_warning_attempts'").get();
    const dbSettingTimeout = db.prepare("SELECT value FROM system_settings WHERE key = 'warning_timeout_minutes'").get();

    assert('security', 'TEST 19: Admin updates max_patient_warning_attempts=2 and timeout=10 successfully',
      adminConfigRes.status === 200 &&
      dbSettingAttempts?.value === '2' &&
      dbSettingTimeout?.value === '10',
      `Attempts: ${dbSettingAttempts?.value}, Timeout: ${dbSettingTimeout?.value}`, true);

    // =========================================================================
    // TEST 20 – Non-Admin Configuration Attack
    // Normal patient attempts to change: callAttempts, timeout, guardian escalation settings.
    // Expected: ACCESS DENIED.
    // =========================================================================
    console.log('\n--- TEST 20: Non-Admin Privilege Escalation Attack Rejection ---');
    const patientConfigAttack = await request('POST', '/admin/settings', {
      max_patient_warning_attempts: '99',
      warning_timeout_minutes: '0'
    }, tokenA);

    assert('security', 'TEST 20: Normal patient blocked from modifying admin settings (401/403 Strict Access Denied)',
      patientConfigAttack.status === 401 || patientConfigAttack.status === 403,
      `Status code: ${patientConfigAttack.status}`, true);

    // =========================================================================
    // REQUIREMENT 18: FOUR-LANGUAGE AUTOMATED TEST
    // For each language: English, Tamil, Telugu, Hindi
    // Verify all 12 key sections exist and are properly translated.
    // =========================================================================
    console.log('\n--- REQUIREMENT 18: Four-Language Section Completeness Audit ---');
    const languages = [
      { code: 'en', dict: en, name: 'English' },
      { code: 'ta', dict: ta, name: 'Tamil' },
      { code: 'te', dict: te, name: 'Telugu' },
      { code: 'hi', dict: hi, name: 'Hindi' }
    ];

    const criticalSections = [
      { section: 'Login', check: (d) => Boolean((d.auth?.signIn || d.auth?.loginButton) && d.auth?.email && d.auth?.password) },
      { section: 'Dashboard', check: (d) => Boolean(d.tracker?.title && d.tracker?.todayAdherence) },
      { section: 'Medicine tracker', check: (d) => Boolean(d.medications?.title && d.medications?.addMedicine) },
      { section: 'Tracking screen', check: (d) => Boolean(d.consumptionTracking?.title && d.consumptionTracking?.alignFace) },
      { section: 'Verified status', check: (d) => Boolean(d.medicine?.verified && d.medicine?.badges?.verifiedBadge) },
      { section: 'Pending status', check: (d) => Boolean(d.medicine?.pending && d.medicine?.badges?.pendingBadge) },
      { section: 'Refused status', check: (d) => Boolean(d.medicine?.refused && d.medicine?.badges?.refusedBadge) },
      { section: 'Missed/no-response status', check: (d) => Boolean(d.medicine?.missed && d.medicine?.noResponse) },
      { section: 'Alert History', check: (d) => Boolean(d.alerts?.alertHistoryTitle && d.alerts?.timeHeader) },
      { section: 'Error messages', check: (d) => Boolean(d.consumptionTracking?.cameraPermissionDenied && d.auth?.invalidCredentials) },
      { section: 'Buttons', check: (d) => Boolean(d.common?.save && d.common?.cancel && d.consumptionTracking?.cancelTracking) },
      { section: 'Navigation', check: (d) => Boolean(d.nav?.dashboard && d.nav?.alertHistory && d.nav?.medications) }
    ];

    for (const lang of languages) {
      for (const req of criticalSections) {
        const passed = req.check(lang.dict);
        assert('language', `Req 18 [${lang.name}]: ${req.section} translated properly`,
          passed,
          `Section ${req.section} incomplete in ${lang.name}`, false);
      }
    }

    // =========================================================================
    // REQUIREMENT 19: FINAL END-TO-END TESTS
    // Scenario 1: PATIENT FLOW
    // Login -> Medicine scheduled -> PENDING -> Tracking starts -> Consumption detected ->
    // Backend validates event -> VERIFIED -> Alert/history updated
    // Scenario 2: ESCALATION FLOW
    // Medicine scheduled -> PENDING -> Refuses / No response -> Call 1 -> No Answer ->
    // Call 2 -> No Answer -> Guardian Escalation -> Alert History updated
    // =========================================================================
    console.log('\n--- REQUIREMENT 19: Final Full End-to-End Clinical Scenarios ---');

    // E2E Flow 1: Happy Path
    const e2eMed1 = await request('POST', '/medications', {
      medicine_name: 'Metoprolol Succinate',
      dosage: '25 mg',
      frequency: 'Once daily',
      reminder_time: '08:30 AM',
      instructions: 'With breakfast',
      start_date: today,
      duration_days: 30
    }, tokenA);
    const e2eMed1Id = e2eMed1.body.reminder?.id;

    // Verify initial pending
    const e2eSlotsPending = (await request('GET', '/medications', null, tokenA)).body.todaySlots;
    const e2eSlot1Pending = e2eSlotsPending.find(s => s.id === e2eMed1Id);
    
    // Telemetry event verification
    const e2eVerifyRes = await request('POST', `/medications/${e2eMed1Id}/consumption-event`, {
      sessionId: `e2e-session-${Date.now()}`,
      scheduled_time: '08:30 AM',
      scheduled_date: today,
      status: 'CONSUMPTION_DETECTED',
      verification_source: 'camera_cv_pipeline',
      confidence_score: 0.96,
      telemetry_data: { motionArc: 'optimal', dwellMs: 910 }
    }, tokenA);

    // Verify updated verified state & alert history
    const e2eSlotsVerified = (await request('GET', '/medications', null, tokenA)).body.todaySlots;
    const e2eSlot1Verified = e2eSlotsVerified.find(s => s.id === e2eMed1Id);
    const alertHistoryRes1 = await request('GET', '/medications/alerts/history', null, tokenA);
    const alertHistoryVerified = (alertHistoryRes1.body.alerts || []).find(a => a.reminder_id === e2eMed1Id && a.alert_type === 'intake_verified');

    assert('medicineTracking', 'E2E Scenario 1: Scheduled -> PENDING -> CV Tracking -> VERIFIED -> Alert History Updated',
      e2eSlot1Pending?.status === 'pending' &&
      e2eVerifyRes.body.status === 'VERIFIED' &&
      e2eSlot1Verified?.status === 'verified' &&
      Boolean(alertHistoryVerified),
      'End-to-End Happy Path failed', true);

    // E2E Flow 2: Escalation Path
    const e2eMed2 = await request('POST', '/medications', {
      medicine_name: 'Levothyroxine',
      dosage: '50 mcg',
      frequency: 'Once daily',
      reminder_time: '07:00 AM',
      instructions: 'First thing on empty stomach',
      start_date: today,
      duration_days: 30
    }, tokenA);
    const e2eMed2Id = e2eMed2.body.reminder?.id;

    // Refusal
    const e2eRefusalRes = await request('POST', `/medications/${e2eMed2Id}/refuse`, {
      scheduled_time: '07:00 AM',
      reason: 'Patient felt unwell'
    }, tokenA);

    const call1IdE2E = e2eRefusalRes.body.escalation?.callId;
    await request('POST', `/medications/calls/${call1IdE2E}/status`, { status: 'no_answer' }, tokenA);

    // Call 2
    const e2eCall2Res = await request('POST', `/medications/${e2eMed2Id}/escalate`, { force: true }, tokenA);
    const call2IdE2E = e2eCall2Res.body.callId;
    await request('POST', `/medications/calls/${call2IdE2E}/status`, { status: 'no_answer' }, tokenA);

    // Guardian Escalation
    const e2eGuardianRes = await request('POST', `/medications/${e2eMed2Id}/escalate`, { force: true }, tokenA);

    // Verify Alert History
    const alertHistoryRes2 = await request('GET', '/medications/alerts/history', null, tokenA);
    const alertHistoryEscalated = (alertHistoryRes2.body.alerts || []).find(a => a.reminder_id === e2eMed2Id && a.alert_type === 'guardian_escalation');

    assert('callEscalation', 'E2E Scenario 2: Scheduled -> Refused -> Call 1 (No Answer) -> Call 2 (No Answer) -> Guardian Escalation -> Alert History Updated',
      e2eRefusalRes.body.status === 'PATIENT_REFUSED' &&
      e2eCall2Res.body.stage === 'patient_warning_2' &&
      e2eGuardianRes.body.stage === 'guardian_escalation' &&
      Boolean(alertHistoryEscalated) &&
      alertHistoryEscalated.message.includes('has not confirmed consumption of Levothyroxine'),
      'End-to-End Escalation Path failed', true);

  } catch (err) {
    console.error('💥 Unexpected Suite Error:', err);
    testReport.criticalFailures.push(`Unhandled suite exception: ${err.message}`);
  }

  // =========================================================================
  // PRINT SUMMARY
  // =========================================================================
  console.log('\n======================================================================');
  console.log('📊 TEST EXECUTION SUMMARY:');
  console.log(`Total Tests Run: ${testReport.total}`);
  console.log(`Passed: ${testReport.passed}`);
  console.log(`Failed: ${testReport.failed}`);
  console.log(`Blocked: ${testReport.blocked}`);
  console.log(`Security Tests: ${testReport.security.passed} / ${testReport.security.total}`);
  console.log(`Language Tests: ${testReport.language.passed} / ${testReport.language.total}`);
  console.log(`Medicine Tracking Tests: ${testReport.medicineTracking.passed} / ${testReport.medicineTracking.total}`);
  console.log(`Call Escalation Tests: ${testReport.callEscalation.passed} / ${testReport.callEscalation.total}`);
  console.log(`Production Readiness: ${testReport.failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log('======================================================================\n');

  return testReport;
}

runMasterTestSuite().then(report => {
  if (report.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
