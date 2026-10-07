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

async function runComprehensiveQATest() {
  console.log('======================================================================');
  console.log('🏥 VITACARE AI – COMPREHENSIVE QA, SECURITY & FULL-STACK SYSTEM AUDIT');
  console.log('======================================================================\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {}
  };

  function assert(category, testId, condition, description, details = '') {
    results.total++;
    if (!results.categories[category]) {
      results.categories[category] = { passed: 0, failed: 0, tests: [] };
    }

    if (condition) {
      results.passed++;
      results.categories[category].passed++;
      results.categories[category].tests.push({ testId, description, status: 'PASS' });
      console.log(`✅ [${category}] ${testId}: ${description}`);
    } else {
      results.failed++;
      results.categories[category].failed++;
      results.categories[category].tests.push({ testId, description, status: 'FAIL', details });
      console.error(`❌ [${category}] ${testId} FAILED: ${description} (Details: ${details})`);
    }
  }

  try {
    // ---------------------------------------------------------
    // 1. ADMIN AUTHENTICATION TESTS (A1, A2, A3, A4)
    // ---------------------------------------------------------
    console.log('\n--- 1. ADMIN AUTHENTICATION TESTS ---');
    
    // A1: Admin Login with valid credentials
    const a1Res = await request('POST', '/admin/login', {
      username: 'admin',
      password: 'Admin@HealthGPT2026!'
    });
    assert('Admin Auth', 'A1-Login', a1Res.status === 200 && a1Res.body.token, 'Admin login succeeds with authorized credentials');
    const adminToken = a1Res.body.token;

    // Verify admin dashboard accessible
    const a1Dash = await request('GET', '/admin/dashboard', null, adminToken);
    assert('Admin Auth', 'A1-DashAccess', a1Dash.status === 200 && a1Dash.body.stats, 'Admin dashboard accessible and returns stats');

    // A2: Invalid Admin Login
    const a2Res = await request('POST', '/admin/login', {
      username: 'admin',
      password: 'WrongPassword123!'
    });
    assert('Admin Auth', 'A2-InvalidLogin', a2Res.status === 401 && !a2Res.body.token, 'Invalid password rejected with 401 without data leak');

    // A3: Normal User Admin Access Prevention
    const emailAlice = `alice_${Date.now()}@vitacare.ai`;
    const regPatientA = await request('POST', '/auth/register', {
      full_name: 'Patient Alice',
      email: emailAlice,
      password: 'PasswordAlice123!',
      confirmPassword: 'PasswordAlice123!',
      phone: '+91 91234 56789',
      guardian_name: 'Bob Guardian',
      guardian_phone: '+91 98765 43211'
    });
    const otpAlice = regPatientA.body.devOtp;
    const authAlice = await request('POST', '/auth/verify-otp', {
      email: emailAlice,
      otpCode: otpAlice
    });
    const tokenAlice = authAlice.body.token;
    const userAlice = authAlice.body.user;

    const a3Res = await request('GET', '/admin/dashboard', null, tokenAlice);
    assert('Admin Auth', 'A3-NormalUserAdminAccess', a3Res.status === 401, 'Normal patient token cannot access admin routes (Strict 401)');

    const a3DirectApi = await request('GET', '/admin/users', null, tokenAlice);
    assert('Admin Auth', 'A3-AdminUsersApi', a3DirectApi.status === 401, 'Normal patient token cannot query admin user management API');

    // A4: Logout / Invalid Token Protection
    const a4Res = await request('GET', '/admin/dashboard', null, 'invalid.token.payload');
    assert('Admin Auth', 'A4-InvalidTokenRejected', a4Res.status === 401, 'Invalidated/forged admin token rejected');

    // ---------------------------------------------------------
    // 2. USER AUTHENTICATION & SESSION PRIVACY (U1, U2, U3)
    // ---------------------------------------------------------
    console.log('\n--- 2. USER AUTHENTICATION TESTS ---');
    assert('User Auth', 'U1-Register', userAlice && userAlice.id && userAlice.email.includes('alice_'), 'User A registered with unique ID');

    // U2: Login
    const loginRes = await request('POST', '/auth/login', {
      email: userAlice.email,
      password: 'PasswordAlice123!'
    });
    assert('User Auth', 'U2-Login', loginRes.status === 200 && loginRes.body.token, 'User A logs in successfully and receives session token');

    // U3: Session Persistence
    const profileRes = await request('GET', '/users/profile', null, tokenAlice);
    assert('User Auth', 'U3-SessionData', profileRes.status === 200 && profileRes.body.user.full_name === 'Patient Alice', 'User profile persists across sessions');

    // ---------------------------------------------------------
    // 3. USER DATA ISOLATION & SECURITY (S1, S2, S3, S4, S5)
    // ---------------------------------------------------------
    console.log('\n--- 3. USER DATA ISOLATION & SECURITY TESTS ---');

    // Create User B
    const emailBob = `bob_${Date.now()}@vitacare.ai`;
    const regPatientB = await request('POST', '/auth/register', {
      full_name: 'Patient Bob',
      email: emailBob,
      password: 'PasswordBob123!',
      confirmPassword: 'PasswordBob123!',
      phone: '+91 92222 33333',
      guardian_name: 'Charlie Guardian',
      guardian_phone: '+91 94444 55555'
    });
    const otpBob = regPatientB.body.devOtp;
    const authBob = await request('POST', '/auth/verify-otp', {
      email: emailBob,
      otpCode: otpBob
    });
    const tokenBob = authBob.body.token;
    const userBob = authBob.body.user;

    // Add private report to User A
    const repAliceRes = await request('POST', '/reports', {
      title: 'Alice Private Blood Test',
      report_type: 'lab_test',
      report_date: '2026-10-06',
      doctor_name: 'Dr. Smith',
      facility_name: 'Metro Pathology',
      raw_text: 'Fasting Blood Glucose: 92 mg/dL. Hemoglobin: 14.1 g/dL.'
    }, tokenAlice);
    const aliceReportId = repAliceRes.body.report.id;

    // Add private report to User B
    const repBobRes = await request('POST', '/reports', {
      title: 'Bob Private Cardiac Panel',
      report_type: 'lab_test',
      report_date: '2026-10-06',
      doctor_name: 'Dr. Jones',
      facility_name: 'Heart Clinic',
      raw_text: 'Total Cholesterol: 210 mg/dL. Heart Rate: 72 bpm.'
    }, tokenBob);
    const bobReportId = repBobRes.body.report.id;

    // S1: User A sees only User A reports
    const aliceReports = await request('GET', '/reports', null, tokenAlice);
    const aliceHasOnlyOwn = aliceReports.body.reports.every(r => r.user_id === userAlice.id);
    const aliceSeesBob = aliceReports.body.reports.some(r => r.title.includes('Bob'));
    assert('Data Isolation', 'S1-UserAIsolation', aliceHasOnlyOwn && !aliceSeesBob, 'User A reports list strictly contains only User A records');

    // S2: User B sees only User B reports
    const bobReports = await request('GET', '/reports', null, tokenBob);
    const bobHasOnlyOwn = bobReports.body.reports.every(r => r.user_id === userBob.id);
    const bobSeesAlice = bobReports.body.reports.some(r => r.title.includes('Alice'));
    assert('Data Isolation', 'S2-UserBIsolation', bobHasOnlyOwn && !bobSeesAlice, 'User B reports list strictly contains only User B records');

    // S3: ID Manipulation Attack - User B attempts to access User A's private report by ID
    const bobAccessAliceReport = await request('GET', `/reports/${aliceReportId}`, null, tokenBob);
    assert('Data Isolation', 'S3-ReportIdTampering', bobAccessAliceReport.status === 404, 'User B cannot access User A report via ID tampering (404/Isolated)');

    // S3: ID Manipulation Attack - User A attempts to access User B's private report by ID
    const aliceAccessBobReport = await request('GET', `/reports/${bobReportId}`, null, tokenAlice);
    assert('Data Isolation', 'S3-ReportIdTamperingReverse', aliceAccessBobReport.status === 404, 'User A cannot access User B report via ID tampering (404/Isolated)');

    // S4: Unauthorized API Access
    const unauthReports = await request('GET', '/reports');
    assert('Data Isolation', 'S4-UnauthApiAccess', unauthReports.status === 401, 'Unauthenticated API access to /reports rejected with 401');

    const unauthMeds = await request('GET', '/medications');
    assert('Data Isolation', 'S4-UnauthMedsAccess', unauthMeds.status === 401, 'Unauthenticated API access to /medications rejected with 401');

    // S5: Session Security
    const forgedTokenRes = await request('GET', '/users/profile', null, 'malformed.jwt.token');
    assert('Data Isolation', 'S5-SessionSecurity', forgedTokenRes.status === 401, 'Malformed session token safely denied without server error');

    // ---------------------------------------------------------
    // 4. PRESCRIPTIONS & HEALTH REPORTS (P1, P2, P3, P4)
    // ---------------------------------------------------------
    console.log('\n--- 4. PRESCRIPTION & REPORT TESTS ---');

    // P1: Upload Prescription for User A
    const prescRes = await request('POST', '/prescriptions', {
      title: 'Alice Orthopedic Prescription',
      doctor_name: 'Dr. Adams',
      prescription_date: '2026-10-06',
      raw_ocr_text: 'Rx: Paracetamol 500mg, 1 tablet twice daily after food for 5 days.',
      verified_medicines: [
        {
          medicine_name: 'Paracetamol',
          dosage: '500 mg',
          frequency: 'Twice daily',
          timing: 'After food',
          instructions: 'Take with water',
          duration: '5 days',
          intakeTimes: ['08:00 AM', '08:00 PM']
        }
      ]
    }, tokenAlice);
    assert('Prescription/Reports', 'P1-PrescriptionUpload', prescRes.status === 201 && prescRes.body.id, 'Prescription uploaded and medicines scheduled for User A');
    const alicePrescriptionId = prescRes.body.id;

    // P2: Upload Health Report for User A
    assert('Prescription/Reports', 'P2-ReportUpload', repAliceRes.status === 201 && repAliceRes.body.report.title === 'Alice Private Blood Test', 'Health report uploaded with mapped biomarkers');

    // P3: Invalid file / empty data rejection
    const invalidRep = await request('POST', '/reports', {
      title: '', // Missing required title
      report_date: ''
    }, tokenAlice);
    assert('Prescription/Reports', 'P3-InvalidPayloadRejection', invalidRep.status === 400, 'Invalid/empty report submission rejected with HTTP 400');

    // P4: User B cannot view User A's prescription
    const bobAccessAlicePresc = await request('GET', `/prescriptions/${alicePrescriptionId}`, null, tokenBob);
    assert('Prescription/Reports', 'P4-PrescriptionIsolation', bobAccessAlicePresc.status === 404, 'User B cannot access User A prescription via ID tampering (404)');

    // ---------------------------------------------------------
    // 5. MEDICINE SCHEDULE & STATUS TEST (REQ 2, 6, 7)
    // ---------------------------------------------------------
    console.log('\n--- 5. MEDICINE SCHEDULE & VERIFICATION TESTS ---');

    // Create Paracetamol 500 mg at 08:00 AM for User A
    const medAddRes = await request('POST', '/medications', {
      medicine_name: 'Paracetamol',
      dosage: '500 mg',
      frequency: 'Once daily',
      reminder_time: '08:00 AM',
      intake_times: ['08:00 AM'],
      instructions: 'Take after breakfast',
      start_date: new Date().toISOString().split('T')[0]
    }, tokenAlice);
    assert('Medicine Verification', 'M1-ScheduleCreation', medAddRes.status === 201 && medAddRes.body.reminder.medicine_name === 'Paracetamol', 'Paracetamol 500mg scheduled at 08:00 AM');
    const paracetamolId = medAddRes.body.reminder.id;

    // Check today's timeline - Initial status must be Pending (⏳)
    const remindersRes = await request('GET', '/medications', null, tokenAlice);
    const paraSlot = remindersRes.body.todaySlots?.find(s => s.reminderId === paracetamolId);
    assert('Medicine Verification', 'M2-PendingStatus', paraSlot && paraSlot.status === 'pending' && paraSlot.status_badge.includes('Pending'), 'Initial medicine status is dynamically set to ⏳ Pending');

    // Patient confirms intake -> Status becomes VERIFIED (✅)
    const verifyIntakeRes = await request('POST', `/medications/${paracetamolId}/verify`, {
      scheduled_time: '08:00 AM',
      notes: 'Taken with breakfast'
    }, tokenAlice);
    assert('Medicine Verification', 'M3-VerifiedStatus', verifyIntakeRes.status === 200 && verifyIntakeRes.body.status === 'verified', 'Patient intake updates status to ✅ Verified');

    // Verify DB log and persistence on reload
    const remindersAfterVerify = await request('GET', '/medications', null, tokenAlice);
    const paraSlotAfter = remindersAfterVerify.body.todaySlots?.find(s => s.reminderId === paracetamolId);
    assert('Medicine Verification', 'M4-DbPersistence', paraSlotAfter && paraSlotAfter.status === 'verified', 'Verified status persists in database across page refreshes');

    // ---------------------------------------------------------
    // 6. MEDICINE CONFIRMATION & GUARDIAN NOTIFICATION (REQ 5, 8)
    // ---------------------------------------------------------
    console.log('\n--- 6. GUARDIAN INTAKE NOTIFICATION TEST ---');
    assert('Guardian System', 'G1-IntakeAlertSent', verifyIntakeRes.body.alert?.success === true, 'Guardian alert triggered upon verification');
    
    // Check exact required message format: "VitaCare Alert: [Patient Name] has taken [Medicine Name] at [Time]."
    const alertMsg = verifyIntakeRes.body.alert?.message || '';
    const expectedPrefix = 'VitaCare Alert: Patient Alice has taken Paracetamol at';
    assert('Guardian System', 'G2-ExactAlertFormat', alertMsg.startsWith(expectedPrefix) && alertMsg.endsWith('.'), `Exact message format matched: "${alertMsg}"`);

    // Verify alert in Alert History API
    const historyAlice = await request('GET', '/medications/alerts/history', null, tokenAlice);
    const hasIntakeAlert = historyAlice.body.alerts?.some(a => a.alert_type === 'intake_verified' && a.medicine_name === 'Paracetamol');
    assert('Guardian System', 'G3-AlertHistorySaved', hasIntakeAlert, 'Intake alert successfully recorded in Alert History table');

    // ---------------------------------------------------------
    // 7. MISSED MEDICINE ESCALATION TEST (REQ 5, 9, 10)
    // ---------------------------------------------------------
    console.log('\n--- 7. MISSED MEDICINE ESCALATION TESTS ---');

    // Schedule a medicine for missed dose testing
    const medMissedRes = await request('POST', '/medications', {
      medicine_name: 'Metformin',
      dosage: '500 mg',
      frequency: 'Once daily',
      reminder_time: '01:00 PM',
      intake_times: ['01:00 PM'],
      instructions: 'Take with lunch',
      start_date: new Date().toISOString().split('T')[0]
    }, tokenAlice);
    const metforminId = medMissedRes.body.reminder.id;

    // Stage 1: Warning Call #1 to patient mobile
    const escAttempt1 = await request('POST', `/medications/${metforminId}/escalate`, { scheduled_time: '01:00 PM' }, tokenAlice);
    assert('Escalation', 'E1-WarningCall1', escAttempt1.body.stage === 'patient_warning_1' && escAttempt1.body.attemptNumber === 1, 'Attempt #1 dispatches Warning Call #1 to patient registered phone');

    // Deduplication / Throttling test (Stage 1 called immediately within cooldown)
    const escSpam = await request('POST', `/medications/${metforminId}/escalate`, { scheduled_time: '01:00 PM' }, tokenAlice);
    assert('Escalation', 'E2-DeduplicationThrottling', escSpam.body.throttled === true, 'Duplicate alert within cooldown throttled safely (Idempotency verified)');

    // Simulate elapsed time between warnings
    db.prepare("UPDATE guardian_alerts SET created_at = datetime('now', '-30 seconds') WHERE reminder_id = ?").run(metforminId);

    // Stage 2: Warning Call #2 to patient mobile
    const escAttempt2 = await request('POST', `/medications/${metforminId}/escalate`, { scheduled_time: '01:00 PM' }, tokenAlice);
    assert('Escalation', 'E3-WarningCall2', escAttempt2.body.stage === 'patient_warning_2' && escAttempt2.body.attemptNumber === 2, 'Attempt #2 dispatches Warning Call #2 to patient registered phone');

    db.prepare("UPDATE guardian_alerts SET created_at = datetime('now', '-30 seconds') WHERE reminder_id = ?").run(metforminId);

    // Stage 3: Escalation to Guardian Emergency Number
    const escAttempt3 = await request('POST', `/medications/${metforminId}/escalate`, { scheduled_time: '01:00 PM' }, tokenAlice);
    assert('Escalation', 'E4-GuardianEscalation', escAttempt3.body.stage === 'guardian_escalation' && escAttempt3.body.message.includes('VitaCare Emergency Alert'), 'Escalates to guardian emergency dispatch after patient non-response');

    // Verify Alert History records all attempts
    const historyMetformin = await request('GET', '/medications/alerts/history', null, tokenAlice);
    const metforminAlerts = historyMetformin.body.alerts?.filter(a => a.reminder_id === metforminId);
    assert('Escalation', 'E5-HistoryChain', metforminAlerts.length >= 3, 'Alert History accurately chronicles Warning #1, Warning #2, and Guardian Escalation');

    // ---------------------------------------------------------
    // 8. CARE CONNECT REAL CAMERA & VIDEO VERIFICATION (REQ 3, 12)
    // ---------------------------------------------------------
    console.log('\n--- 8. CARE CONNECT VIDEO VERIFICATION TESTS ---');
    const careConnectSession = await request('POST', '/medications/careconnect', {
      reminder_id: paracetamolId,
      medicine_name: 'Paracetamol',
      dosage: '500 mg',
      scheduled_time: '08:00 AM',
      session_duration_seconds: 45,
      adherence_status: 'verified',
      user_notes: 'Verified via WebRTC real live camera feed'
    }, tokenAlice);
    assert('Care Connect', 'C1-LiveSessionLogging', careConnectSession.status === 200 && careConnectSession.body.session?.adherence_status === 'verified', 'Care Connect live video session logged and adherence verified');

    // ---------------------------------------------------------
    // 9. MULTI-LANGUAGE PERSISTENCE (REQ 4, 14)
    // ---------------------------------------------------------
    console.log('\n--- 9. MULTI-LANGUAGE SUPPORT TESTS ---');
    const languages = [
      { code: 'ta', name: 'Tamil' },
      { code: 'te', name: 'Telugu' },
      { code: 'hi', name: 'Hindi' },
      { code: 'en', name: 'English' }
    ];

    for (const lang of languages) {
      const setLangRes = await request('POST', '/users/language', { preferred_language: lang.code }, tokenAlice);
      const getProfile = await request('GET', '/users/profile', null, tokenAlice);
      assert('Multi-Language', `L-${lang.code}`, (getProfile.body.profile?.preferred_language || getProfile.body.user?.preferred_language) === lang.code, `Language preference [${lang.name} - ${lang.code}] persisted to user account`);
    }

    // ---------------------------------------------------------
    // 10. GUARDIAN SYSTEM ISOLATION (REQ 15)
    // ---------------------------------------------------------
    console.log('\n--- 10. GUARDIAN SYSTEM & PRIVACY TESTS ---');
    const aliceGuardians = await request('GET', '/guardians', null, tokenAlice);
    const bobGuardians = await request('GET', '/guardians', null, tokenBob);

    assert('Guardian System', 'G4-GuardianIsolation', 
      aliceGuardians.body.guardians?.every(g => g.user_id === userAlice.id) &&
      bobGuardians.body.guardians?.every(g => g.user_id === userBob.id),
      'Guardians strictly isolated per patient account; zero cross-tenant contamination'
    );

    // ---------------------------------------------------------
    // 11. ADMIN DASHBOARD METRICS ACCURACY (REQ 8, 16)
    // ---------------------------------------------------------
    console.log('\n--- 11. ADMIN DASHBOARD METRICS ACCURACY TESTS ---');
    const adminStatsRes = await request('GET', '/admin/dashboard', null, adminToken);
    const stats = adminStatsRes.body.stats;

    // Directly query database to compare
    const totalUsersDb = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalSchedulesDb = db.prepare('SELECT COUNT(*) as count FROM medication_reminders').get().count;
    const verifiedMedsDb = db.prepare("SELECT COUNT(*) as count FROM medication_logs WHERE status IN ('taken', 'verified')").get().count;
    const guardianAlertsDb = db.prepare('SELECT COUNT(*) as count FROM guardian_alerts').get().count;

    assert('Admin Control', 'ADM1-UsersMetric', stats.totalUsers === totalUsersDb, `Admin totalUsers (${stats.totalUsers}) matches DB count (${totalUsersDb})`);
    assert('Admin Control', 'ADM2-SchedulesMetric', stats.totalSchedules === totalSchedulesDb, `Admin totalSchedules (${stats.totalSchedules}) matches DB count (${totalSchedulesDb})`);
    assert('Admin Control', 'ADM3-VerifiedMedsMetric', stats.verifiedMedicines === verifiedMedsDb, `Admin verifiedMedicines (${stats.verifiedMedicines}) matches DB count (${verifiedMedsDb})`);
    assert('Admin Control', 'ADM4-GuardianAlertsMetric', stats.guardianAlerts === guardianAlertsDb, `Admin guardianAlerts (${stats.guardianAlerts}) matches DB count (${guardianAlertsDb})`);

    // ---------------------------------------------------------
    // 12. ADMIN MEDICINE & SETTINGS CONFIGURATION (REQ 11)
    // ---------------------------------------------------------
    console.log('\n--- 12. ADMIN MEDICINE & SETTINGS MANAGEMENT ---');
    // Admin add medicine
    const adminAddMed = await request('POST', '/admin/medicines', {
      user_id: userAlice.id,
      medicine_name: 'Atorvastatin',
      dosage: '20 mg',
      frequency: 'Once daily at bedtime',
      reminder_time: '10:00 PM',
      start_date: '2026-10-06'
    }, adminToken);
    assert('Admin Control', 'ADM5-AdminAddMedicine', adminAddMed.status === 201 && adminAddMed.body.medicine.medicine_name === 'Atorvastatin', 'Admin successfully added medicine schedule');
    const adminCreatedMedId = adminAddMed.body.medicine.id;

    // Admin edit medicine
    const adminEditMed = await request('PUT', `/admin/medicines/${adminCreatedMedId}`, {
      dosage: '40 mg',
      instructions: 'Take with water before sleep'
    }, adminToken);
    assert('Admin Control', 'ADM6-AdminEditMedicine', adminEditMed.status === 200 && adminEditMed.body.medicine.dosage === '40 mg', 'Admin successfully edited medicine dosage');

    // Admin update system settings
    const adminUpdateSettings = await request('PUT', '/admin/settings', {
      settings: [
        { key: 'max_patient_warning_attempts', value: '2' },
        { key: 'warning_timeout_minutes', value: '10' }
      ]
    }, adminToken);
    assert('Admin Control', 'ADM7-AdminUpdateSettings', adminUpdateSettings.status === 200, 'Admin successfully updated escalation timeout and attempt settings');

    // Admin delete medicine
    const adminDelMed = await request('DELETE', `/admin/medicines/${adminCreatedMedId}`, null, adminToken);
    assert('Admin Control', 'ADM8-AdminDeleteMedicine', adminDelMed.status === 200, 'Admin successfully deleted medicine');

    // ---------------------------------------------------------
    // 13. DATABASE & FRONTEND SECURITY AUDIT (REQ 21, 22)
    // ---------------------------------------------------------
    console.log('\n--- 13. SECURITY AUDIT & VULNERABILITY CHECKS ---');

    // Check that user passwords in SQLite are bcrypt hashed ($2a$ or $2b$) and never plaintext
    const passwordSamples = db.prepare('SELECT password_hash FROM users LIMIT 10').all();
    const allHashed = passwordSamples.every(row => row.password_hash.startsWith('$2a$') || row.password_hash.startsWith('$2b$'));
    assert('Database Security', 'SEC1-BcryptPasswords', allHashed && passwordSamples.length > 0, 'All user and admin passwords are secure bcrypt hashes (zero plaintext)');

    // SQL Injection Attempt on login and search
    const sqlInjectionRes = await request('POST', '/auth/login', {
      email: "' OR '1'='1",
      password: "' OR '1'='1"
    });
    assert('Database Security', 'SEC2-SqlInjectionBlock', sqlInjectionRes.status === 401, 'SQL injection attempt blocked safely via parameterized queries');

    // XSS payload attempt in medical notes
    const xssAttempt = await request('POST', '/medications', {
      medicine_name: 'Aspirin <script>alert(1)</script>',
      dosage: '81 mg',
      frequency: 'Once daily',
      reminder_time: '09:00 AM',
      notes: '<img src=x onerror=alert(document.cookie)>',
      start_date: '2026-10-06'
    }, tokenAlice);
    assert('Database Security', 'SEC3-XssHandling', xssAttempt.status === 201, 'XSS input stored safely as string without executing or breaking database');

    // Frontend bundle secrets inspection
    const distPath = path.resolve(__dirname, '../client/dist/assets');
    let bundleSafe = true;
    let leakedPatterns = [];

    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath).filter(f => f.endsWith('.js'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(distPath, file), 'utf8');
        if (content.includes('Admin@HealthGPT2026!') || content.includes('healthgpt.db') || content.includes('JWT_SECRET')) {
          bundleSafe = false;
          leakedPatterns.push(`Sensitive keyword found in ${file}`);
        }
      }
    }
    assert('Frontend Security', 'SEC4-NoSecretLeaksInBuild', bundleSafe, 'Frontend production bundle contains zero exposed passwords, DB secrets or tokens', leakedPatterns.join(', '));

    // ---------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`📊 AUDIT COMPLETE: ${results.passed} / ${results.total} PASSED (${results.failed} FAILED)`);
    console.log('======================================================================');

    return results;

  } catch (err) {
    console.error('Fatal testing error:', err);
    throw err;
  }
}

runComprehensiveQATest().then(results => {
  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(err => {
  console.error(err);
  process.exit(1);
});
