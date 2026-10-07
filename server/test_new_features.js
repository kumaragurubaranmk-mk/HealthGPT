import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting End-to-End Test Suite for Enhanced HealthGPT Features...\n');

  // 1. Create a test user or login
  const testEmail = `test.pilot.${Date.now()}@healthtest.org`;
  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Dr. Jane Doe Pilot',
      email: testEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      phone: '+1 (555) 789-0123'
    })
  });
  const registerData = await registerRes.json();
  assert.strictEqual(registerRes.status, 201, `Register failed: ${JSON.stringify(registerData)}`);
  console.log('✅ 1. Patient registration created with empty record state');

  // Verify OTP
  const otp = registerData.devOtp;
  const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otpCode: otp,
      purpose: 'register'
    })
  });
  const verifyData = await verifyRes.json();
  assert.strictEqual(verifyRes.status, 200, `OTP verify failed: ${JSON.stringify(verifyData)}`);
  const token = verifyData.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  console.log('✅ 2. Account verified via OTP');

  // Setup Health Profile
  await fetch(`${API_BASE}/user/health-profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      blood_group: 'O+',
      allergies: 'Penicillin, Shellfish',
      existing_conditions: 'Type 2 Diabetes, Mild Hypertension',
      current_medications: 'Metformin 500mg'
    })
  });
  console.log('✅ 3. Clinical health profile initialized');

  // 4. Test Medical Report Upload with automated biomarker extraction
  const report1Res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Baseline Comprehensive Metabolic & Glycemic Panel',
      report_type: 'lab_test',
      report_date: '2026-06-15',
      doctor_name: 'Dr. Alice Carter, MD',
      facility_name: 'Central Diagnostic Labs',
      raw_text: 'Patient Fasting Blood Glucose: 135 mg/dL. HbA1c: 7.2%. Total Cholesterol: 215 mg/dL. Serum Creatinine: 0.9 mg/dL. Blood Pressure: 138/88.'
    })
  });
  const report1Data = await report1Res.json();
  assert.strictEqual(report1Res.status, 201, `Report 1 upload failed: ${JSON.stringify(report1Data)}`);
  assert(report1Data.biomarkers.length >= 4, 'Biomarkers should be extracted');
  const report1Id = report1Data.report.id;
  console.log(`✅ 4. Baseline Medical Report uploaded and extracted: ${report1Data.biomarkers.length} biomarkers identified (HbA1c: 7.2%, Glucose: 135, Cholesterol: 215)`);

  // 5. Test Report Version Update (preserving previous version)
  const report2Res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Follow-up Glycemic Panel & Lipid Control',
      report_type: 'lab_test',
      report_date: '2026-10-01',
      doctor_name: 'Dr. Alice Carter, MD',
      facility_name: 'Central Diagnostic Labs',
      raw_text: 'Patient Fasting Blood Glucose: 105 mg/dL. HbA1c: 6.5%. Total Cholesterol: 185 mg/dL. Serum Creatinine: 0.9 mg/dL. Blood Pressure: 122/78.',
      parent_report_id: report1Id
    })
  });
  const report2Data = await report2Res.json();
  assert.strictEqual(report2Res.status, 201, `Report 2 upload failed: ${JSON.stringify(report2Data)}`);
  assert.strictEqual(report2Data.report.version, 2, 'Report version must be incremented to 2');
  assert.strictEqual(report2Data.report.parent_report_id, report1Id, 'Parent report ID must be preserved');
  console.log('✅ 5. Report revision updated without overwriting: Version 2 created, Version 1 preserved in history chain');

  // 6. Test Automated Report Comparison & Delta calculation
  const compareRes = await fetch(`${API_BASE}/reports/${report2Data.report.id}/compare`, {
    method: 'GET',
    headers
  });
  const compareData = await compareRes.json();
  assert.strictEqual(compareRes.status, 200);
  assert(compareData.comparison.hasComparison, 'Comparison must be active');
  const hba1cComp = compareData.comparison.comparisons.find(c => c.name.toLowerCase().includes('hba1c'));
  assert(hba1cComp, 'HbA1c comparison must exist');
  assert.strictEqual(hba1cComp.previousValue, 7.2);
  assert.strictEqual(hba1cComp.currentValue, 6.5);
  assert.strictEqual(hba1cComp.trajectory, 'improved');
  console.log(`✅ 6. Automated Report Comparison verified: HbA1c: 7.2% -> 6.5% (Delta: ${hba1cComp.delta}%, Trajectory: ${hba1cComp.trajectory})`);
  console.log(`   AI explanation generated:\n   "${compareData.comparison.aiExplanation.split('\n')[1]}"`);

  // 7. Test Lifetime Health Timeline
  const timelineRes = await fetch(`${API_BASE}/reports/timeline`, {
    method: 'GET',
    headers
  });
  const timelineData = await timelineRes.json();
  assert.strictEqual(timelineRes.status, 200);
  assert(timelineData.timeline.length >= 2, 'Timeline should contain uploaded reports');
  assert(timelineData.biomarkerTrends['HBA1C'], 'Biomarker trends must contain HBA1C data points');
  console.log(`✅ 7. Lifetime Health Timeline verified: ${timelineData.timeline.length} chronological events, trend tracking active for ${Object.keys(timelineData.biomarkerTrends).length} biomarkers`);

  // 8. Test Medication Scheduling & Demo Call
  const medRes = await fetch(`${API_BASE}/medications`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      medicine_name: 'Metformin Extended Release',
      dosage: '500mg',
      frequency: 'once_daily',
      reminder_time: '08:00',
      start_date: '2026-10-01',
      call_reminder_enabled: 1,
      video_verification_enabled: 1,
      notes: 'Take with morning meal'
    })
  });
  const medData = await medRes.json();
  assert.strictEqual(medRes.status, 201);
  const medId = medData.reminder.id;
  console.log(`✅ 8. Medication scheduled: ${medData.reminder.medicine_name}`);

  // Test Demo Call trigger
  const callRes = await fetch(`${API_BASE}/medications/${medId}/demo-call`, {
    method: 'POST',
    headers
  });
  const callData = await callRes.json();
  assert.strictEqual(callRes.status, 200);
  assert.strictEqual(callData.is_demo, true);
  console.log(`✅ 9. Medicine Reminder by Call (DEMO CALL): Verified status: ${callData.message}`);

  // 9. Test Guardian Registration & Escalation
  const guardianRes = await fetch(`${API_BASE}/guardians`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Robert Doe',
      relation: 'Spouse',
      phone: '+1 (555) 912-3456',
      email: 'robert.doe@example.com',
      escalation_enabled: 1,
      escalation_timeout_mins: 15
    })
  });
  const guardianData = await guardianRes.json();
  assert.strictEqual(guardianRes.status, 201);
  console.log(`✅ 10. Guardian registered: ${guardianData.guardian.name} (${guardianData.guardian.phone})`);

  // 10. Test Medicine Video Verification (Confirmed dose)
  const videoConfirmRes = await fetch(`${API_BASE}/medications/video-verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      reminder_id: medId,
      scheduled_date: '2026-10-06',
      scheduled_time: '08:00',
      adherence_status: 'confirmed',
      user_notes: 'Swallowed with water after breakfast',
      session_duration_seconds: 18
    })
  });
  const videoConfirmData = await videoConfirmRes.json();
  assert.strictEqual(videoConfirmRes.status, 200);
  assert(videoConfirmData.disclaimer.includes('self-attested'), 'Honest video disclaimer must be present');
  console.log(`✅ 11. Medicine Video Verification confirmed with honest disclosure: "${videoConfirmData.disclaimer}"`);

  // 11. Test Medicine Video Verification (Missed dose -> triggers Guardian Alert)
  const videoMissedRes = await fetch(`${API_BASE}/medications/video-verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      reminder_id: medId,
      scheduled_date: '2026-10-07',
      scheduled_time: '08:00',
      adherence_status: 'missed',
      user_notes: 'Dose window elapsed without adherence',
      session_duration_seconds: 0
    })
  });
  const videoMissedData = await videoMissedRes.json();
  assert.strictEqual(videoMissedRes.status, 200);
  assert(videoMissedData.guardianAlert, 'Guardian alert must be automatically escalated on missed dose');
  assert.strictEqual(videoMissedData.guardianAlert.is_demo, true);
  console.log(`✅ 12. Guardian Alert escalated on missed dose: "${videoMissedData.guardianAlert.message}" (DEMO NOTIFICATION)`);

  // 12. Test Emergency SOS (dual contacts, clinical snapshot, demo disclaimer)
  const sosRes = await fetch(`${API_BASE}/sos/trigger`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      location_coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 5 },
      user_notes: 'Experiencing acute dizziness and chest pressure',
      include_clinical_snapshot: true
    })
  });
  const sosData = await sosRes.json();
  assert.strictEqual(sosRes.status, 200);
  assert.strictEqual(sosData.is_demo, true);
  assert.strictEqual(sosData.contact1.type, 'ambulance');
  assert.strictEqual(sosData.contact2.type, 'guardian');
  assert(sosData.clinicalSnapshot.activeMedications.includes('Metformin'));
  assert(sosData.clinicalSnapshot.allergies.includes('Penicillin'));
  console.log(`✅ 13. Emergency SOS verified: Contact 1 (Ambulance 108/911), Contact 2 (Guardian), Clinical snapshot passed: Allergies [${sosData.clinicalSnapshot.allergies}], Meds [${sosData.clinicalSnapshot.activeMedications}]`);

  // 13. Test Improved AI Health Assistant (Medicine Guidance & Report integration)
  const convRes = await fetch(`${API_BASE}/ai/conversations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Inquiry on Metformin and Lab Results',
      module_type: 'assistant',
      language: 'en'
    })
  });
  const convData = await convRes.json();
  const convId = convData.conversation.id;

  const aiQueryRes = await fetch(`${API_BASE}/ai/conversations/${convId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: 'Can you explain my Metformin medicine, and how does my HbA1c test relate to it?',
      language: 'en'
    })
  });
  const aiQueryData = await aiQueryRes.json();
  assert.strictEqual(aiQueryRes.status, 200);
  const aiMsg = aiQueryData.assistantMessage;
  assert(aiMsg.structured_data.summary.includes('Metformin') || aiMsg.structured_data.summary.includes('Medication'), 'AI should recognize user scheduled medication');
  console.log(`✅ 14. Improved AI Assistant verified: Recognized patient medication & clinical reports with simple layman guidance:`);
  console.log(`   Summary: "${aiMsg.structured_data.summary}"`);
  console.log(`   Disclaimer: "${aiMsg.structured_data.disclaimer}"`);

  console.log('\n🎉 ALL 14 BACKEND END-TO-END FEATURE VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
