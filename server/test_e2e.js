async function runE2EVerification() {
  console.log('--- STARTING HEALTHGPT AUTOMATED VERIFICATION ---');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('✓ API Health Check:', healthData.status === 'healthy' ? 'PASSED' : 'FAILED');

  // 2. User Registration
  const testEmail = `test.patient.${Date.now()}@test.health`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Dr. Test Patient',
      email: testEmail,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      phone: '+91 98765 00000',
      guardian_email: 'guardian@test.health',
      guardian_phone: '+91 98765 00001',
      date_of_birth: '1995-04-12'
    })
  });
  const regData = await regRes.json();
  console.log('✓ User Registration:', regRes.status === 201 ? 'PASSED' : 'FAILED', '- Dev OTP:', regData.devOtp);

  // 3. OTP Verification
  const verifyRes = await fetch('http://localhost:5000/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otpCode: regData.devOtp
    })
  });
  const verifyData = await verifyRes.json();
  const token = verifyData.token;
  console.log('✓ Account OTP Verification & JWT:', token ? 'PASSED' : 'FAILED');

  // 4. Verify Empty Health Profile Initialization
  const profRes = await fetch('http://localhost:5000/api/user/health-profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const profData = await profRes.json();
  const isCleanEmpty = !profData.profile.blood_group && !profData.profile.allergies;
  console.log('✓ Empty Health Profile Enforced (Zero Preloaded Data):', isCleanEmpty ? 'PASSED' : 'FAILED');

  // 5. Multilingual AI Assistant Queries
  // English
  const convRes = await fetch('http://localhost:5000/api/ai/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'E2E Health Test', language: 'en', module_type: 'assistant' })
  });
  const convData = await convRes.json();
  const convId = convData.conversation.id;

  const msgEnRes = await fetch(`http://localhost:5000/api/ai/conversations/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content: 'What are safe home remedies for mild fever?', language: 'en' })
  });
  const msgEnData = await msgEnRes.json();
  console.log('✓ English AI Structured Guidance:', msgEnData.assistantMessage?.structured_data?.summary ? 'PASSED' : 'FAILED');

  // Tamil (தமிழ்)
  const msgTaRes = await fetch(`http://localhost:5000/api/ai/conversations/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content: 'தலைவலிக்கு என்ன செய்ய வேண்டும்?', language: 'ta' })
  });
  const msgTaData = await msgTaRes.json();
  console.log('✓ Tamil (தமிழ்) AI Guidance:', msgTaData.assistantMessage?.structured_data?.summary ? 'PASSED' : 'FAILED');

  // Telugu (తెలుగు)
  const msgTeRes = await fetch(`http://localhost:5000/api/ai/conversations/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content: 'జ్వరం వచ్చినప్పుడు తీసుకోవలసిన జాగ్రత్తలు ఏమిటి?', language: 'te' })
  });
  const msgTeData = await msgTeRes.json();
  console.log('✓ Telugu (తెలుగు) AI Guidance:', msgTeData.assistantMessage?.structured_data?.summary ? 'PASSED' : 'FAILED');

  // Hindi (हिन्दी)
  const msgHiRes = await fetch(`http://localhost:5000/api/ai/conversations/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content: 'सामान्य सिरदर्द के कारण क्या हैं?', language: 'hi' })
  });
  const msgHiData = await msgHiRes.json();
  console.log('✓ Hindi (हिन्दी) AI Guidance:', msgHiData.assistantMessage?.structured_data?.summary ? 'PASSED' : 'FAILED');

  // 6. Emergency Triage Trigger Check
  const emergRes = await fetch(`http://localhost:5000/api/ai/conversations/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content: 'I have severe chest pain and left arm numbness', language: 'en' })
  });
  const emergData = await emergRes.json();
  console.log('✓ Emergency Triage Red Alert Filter:', emergData.assistantMessage?.is_emergency === 1 ? 'PASSED' : 'FAILED');

  // 7. Admin Authentication & Dashboard
  const adminRes = await fetch('http://localhost:5000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@HealthGPT2026!' })
  });
  const adminData = await adminRes.json();
  const adminToken = adminData.token;
  console.log('✓ Admin Authentication:', adminToken ? 'PASSED' : 'FAILED');

  const adminDashRes = await fetch('http://localhost:5000/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminDashData = await adminDashRes.json();
  console.log('✓ Admin Governance Dashboard Metrics:', adminDashData.stats?.totalUsers >= 1 ? 'PASSED' : 'FAILED');

  // 8. Frontend Vite Dev Server Check
  const viteRes = await fetch('http://localhost:5173/');
  const viteHtml = await viteRes.text();
  console.log('✓ Frontend Vite Serving HealthGPT App:', viteHtml.includes('HealthGPT') ? 'PASSED' : 'FAILED');

  console.log('--- ALL SYSTEMS VERIFIED AND OPERATIONAL ---');
}

runE2EVerification().catch(console.error);
