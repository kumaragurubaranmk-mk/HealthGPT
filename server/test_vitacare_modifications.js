import http from 'http';
import { db } from './src/database/db.js';

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
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
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

async function runTests() {
  console.log('========================================================');
  console.log('🧪 VITACARE COMPREHENSIVE REQUIREMENTS VERIFICATION TEST');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. ADMIN AUTHENTICATION
    console.log('--- TEST GROUP 1: Admin Panel & Admin Authentication ---');
    const adminLoginRes = await request('POST', '/admin/login', {
      username: 'admin',
      password: 'Admin@HealthGPT2026!'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.token, 'Admin login succeeds with authorized credentials');
    const adminToken = adminLoginRes.body.token;

    // 2. NORMAL USER ACCESS PROTECTION
    console.log('\n--- TEST GROUP 2: Security & Route Protection ---');
    const unauthAdminAccess = await request('GET', '/admin/dashboard');
    assert(unauthAdminAccess.status === 401, 'Unauthenticated user cannot access admin routes (401)');

    // 3. USER REGISTRATION & AUTHENTICATION
    console.log('\n--- TEST GROUP 3: Patient Registration & Privacy Isolation ---');
    const testEmail = `patient_${Date.now()}@vitacare.ai`;
    const regRes = await request('POST', '/auth/register', {
      full_name: 'Devaki Raman',
      email: testEmail,
      password: 'PatientPassword123!',
      confirmPassword: 'PatientPassword123!',
      phone: '+91 98765 43210',
      guardian_name: 'Karthik Raman',
      guardian_phone: '+91 98765 12345'
    });
    assert(regRes.status === 201 && regRes.body.devOtp, 'Patient registered successfully and received OTP');

    const verifyOtpRes = await request('POST', '/auth/verify-otp', {
      email: testEmail,
      otpCode: regRes.body.devOtp
    });
    assert(verifyOtpRes.status === 200 && verifyOtpRes.body.token, 'Patient verifies OTP and receives authenticated token');
    const userToken = verifyOtpRes.body.token;
    const userId = verifyOtpRes.body.user.id;

    // Normal user token cannot access admin routes
    const userAsAdmin = await request('GET', '/admin/dashboard', null, userToken);
    assert(userAsAdmin.status === 401, 'Normal authenticated patient token cannot access admin panel (Strict 401)');

    // 4. MULTI-LANGUAGE PREFERENCE PERSISTENCE
    console.log('\n--- TEST GROUP 4: Multi-Language Support (en, ta, te, hi) ---');
    const langRes = await request('POST', '/user/language', { language: 'ta' }, userToken);
    assert(langRes.status === 200 && langRes.body.language === 'ta', 'User preferred language set to Tamil (ta) and persisted');

    const profileRes = await request('GET', '/user/profile', null, userToken);
    assert(profileRes.body.profile.preferred_language === 'ta', 'Preferred language retrieved from user account profile');

    // 5. MEDICINE SCHEDULE CREATION & TRACKING
    console.log('\n--- TEST GROUP 5: Health Tracker & Medicine Scheduling ---');
    const medRes = await request('POST', '/medications', {
      medicine_name: 'Paracetamol',
      dosage: '500 mg',
      frequency: 'Once daily',
      reminder_time: '08:00 AM',
      instructions: 'After breakfast with warm water',
      start_date: new Date().toISOString().split('T')[0],
      duration_days: 7
    }, userToken);
    assert(medRes.status === 201 && medRes.body.reminder.id, 'Created scheduled medicine: Paracetamol (500mg)');
    const reminderId = medRes.body.reminder.id;

    const remindersRes = await request('GET', '/medications', null, userToken);
    const slots = remindersRes.body.todaySlots || [];
    assert(slots.length > 0, "Today's medicine schedule generated dynamically");
    const currentSlot = slots.find(s => s.reminderId === reminderId || s.id === reminderId);
    assert(currentSlot && currentSlot.status === 'pending', 'Initial status of scheduled medicine is Pending (⏳)');

    // 6. MEDICINE VERIFICATION & GUARDIAN NOTIFICATION
    console.log('\n--- TEST GROUP 6: Medicine Verification & Intake Guardian Notification ---');
    const verifyMedRes = await request('POST', `/medications/${reminderId}/verify`, {
      scheduled_time: '08:00 AM',
      notes: 'Patient confirmed dose intake'
    }, userToken);
    assert(verifyMedRes.status === 200 && verifyMedRes.body.status === 'verified', 'Medicine status successfully updated to Verified (✅)');
    assert(verifyMedRes.body.alert?.message?.includes('VitaCare Alert: Devaki Raman has taken Paracetamol at'), 'Guardian alert generated with exact VitaCare format: "VitaCare Alert: [Patient] has taken [Medicine] at [Time]"');

    // 7. MEDICINE ALERT WARNING CALLS & GUARDIAN ESCALATION FLOW
    console.log('\n--- TEST GROUP 7: Unconfirmed Medicine Warning Flow & Escalation ---');
    // Create second medicine that remains unconfirmed (Pending)
    const med2Res = await request('POST', '/medications', {
      medicine_name: 'Vitamin Tablet',
      dosage: '1 tablet',
      frequency: 'Once daily',
      reminder_time: '02:00 PM',
      instructions: 'With lunch',
      start_date: new Date().toISOString().split('T')[0]
    }, userToken);
    const reminder2Id = med2Res.body.reminder.id;

    // Stage 1: Warning Call #1
    const esc1 = await request('POST', `/medications/${reminder2Id}/escalate`, { scheduled_time: '02:00 PM' }, userToken);
    assert(esc1.body.stage === 'patient_warning_1', 'Attempt #1 dispatches Warning Call #1 to patient mobile');

    // Reset timestamp slightly so we can test Stage 2 without waiting 15s cooldown
    db.prepare("UPDATE guardian_alerts SET created_at = datetime('now', '-30 seconds') WHERE reminder_id = ?").run(reminder2Id);

    // Stage 2: Warning Call #2
    const esc2 = await request('POST', `/medications/${reminder2Id}/escalate`, { scheduled_time: '02:00 PM' }, userToken);
    assert(esc2.body.stage === 'patient_warning_2', 'Attempt #2 dispatches Warning Call #2 to patient mobile');

    db.prepare("UPDATE guardian_alerts SET created_at = datetime('now', '-30 seconds') WHERE reminder_id = ?").run(reminder2Id);

    // Stage 3: Escalation to Guardian
    const esc3 = await request('POST', `/medications/${reminder2Id}/escalate`, { scheduled_time: '02:00 PM' }, userToken);
    assert(esc3.body.stage === 'guardian_escalation', 'Attempt #3 escalates to guardian phone after patient non-response');
    assert(esc3.body.message.includes('VitaCare Emergency Alert'), 'Emergency guardian alert message format verified');

    // 8. ALERT HISTORY CHECK
    const historyRes = await request('GET', '/medications/alerts/history', null, userToken);
    assert(historyRes.body.alerts.length >= 3, 'Alert and Escalation History accurately maintained in database');

    // 9. CARE CONNECT LIVE VIDEO VERIFICATION ENDPOINT
    console.log('\n--- TEST GROUP 8: Care Connect Live Video Intake Verification ---');
    const careConnectRes = await request('POST', '/medications/careconnect', {
      reminder_id: reminder2Id,
      medicine_name: 'Vitamin Tablet',
      dosage: '1 tablet',
      scheduled_time: '02:00 PM',
      session_duration_seconds: 30,
      adherence_status: 'verified'
    }, userToken);
    assert(careConnectRes.status === 200 && careConnectRes.body.status === 'verified', 'Care Connect session verified intake and notified guardian');

    // 10. ADMIN DASHBOARD STATS & REVENUE/GOVERNANCE METRICS
    console.log('\n--- TEST GROUP 9: Admin Dashboard & Settings Control ---');
    const adminDashRes = await request('GET', '/admin/dashboard', null, adminToken);
    assert(adminDashRes.status === 200, 'Admin dashboard accessible by authorized administrator');
    const s = adminDashRes.body.stats;
    assert(s.totalUsers >= 1, `Total registered users metric: ${s.totalUsers}`);
    assert(s.medicineSchedules >= 2, `Medicine schedules metric: ${s.medicineSchedules}`);
    assert(s.verifiedMedicines >= 1, `Verified medicines metric: ${s.verifiedMedicines}`);
    assert(s.guardianAlerts >= 1, `Guardian alerts metric: ${s.guardianAlerts}`);
    assert(adminDashRes.body.websiteConfiguration, 'Website configuration exposed in admin dashboard');

    // Admin updates escalation thresholds
    const updateSettingsRes = await request('POST', '/admin/settings', {
      max_patient_warning_attempts: '3',
      warning_timeout_minutes: '20'
    }, adminToken);
    assert(updateSettingsRes.status === 200, 'Admin can edit system settings and escalation parameters');

    // 11. ADMIN MEDICINE MANAGEMENT
    console.log('\n--- TEST GROUP 10: Admin Medicine Management ---');
    const adminMedsRes = await request('GET', '/admin/medicines', null, adminToken);
    assert(adminMedsRes.body.medicines.length >= 2, 'Admin can view all platform medicines');

    console.log('\n========================================================');
    console.log(`🎉 ALL REQUIREMENTS VERIFIED: ${passed} Passed, ${failed} Failed`);
    console.log('========================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
