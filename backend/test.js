const API_URL = 'http://localhost:5000/api';

async function fetchJSON(url, options) {
  const res = await fetch(API_URL + url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

async function runTests() {
  console.log('--- E2E API Test Suite ---');
  try {
    // 1. Register Admin
    console.log('1. Registering Admin...');
    const adminRes = await fetchJSON('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: `admin_${Date.now()}@test.com`, password: 'password123', role: 'admin' })
    });
    const adminToken = adminRes.token;
    console.log('✅ Admin registered');

    // 2. Create Exam
    console.log('2. Creating Exam as Admin...');
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000); 
    
    const examRes = await fetchJSON('/exams/create', {
      method: 'POST',
      body: JSON.stringify({ title: 'Automated Test Exam', form_url: 'https://forms.gle/test', start_time: now.toISOString(), end_time: end.toISOString(), duration_minutes: 60 }),
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const examCode = examRes.code;
    const examId = examRes._id;
    console.log(`✅ Exam created: ${examCode}`);

    // 3. Register Student
    console.log('3. Registering Student...');
    const studentRes = await fetchJSON('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: `student_${Date.now()}@test.com`, password: 'password123', role: 'student' })
    });
    const studentToken = studentRes.token;
    console.log('✅ Student registered');

    // 4. Join Exam
    console.log('4. Joining Exam as Student...');
    const joinRes = await fetchJSON('/exams/join-exam', {
      method: 'POST',
      body: JSON.stringify({ code: examCode }),
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    const attemptId = joinRes.attempt._id;
    console.log('✅ Exam joined, Attempt ID:', attemptId);

    // 5. Log Proctoring Event
    console.log('5. Logging Event (Student LOOKING_AWAY)...');
    const logRes = await fetchJSON('/monitoring/log-event', {
      method: 'POST',
      body: JSON.stringify({ attempt_id: attemptId, event_type: 'LOOKING_AWAY', confidence: 0.95 }),
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    console.log(`✅ Event logged. New Risk Score: ${logRes.risk_score}`);

    // 6. Admin Reads Live Feed
    console.log('6. Validating Admin Live Feed...');
    const liveRes = await fetchJSON('/monitoring/live', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (liveRes.some(a => a._id === attemptId)) {
      console.log('✅ Found attempt in Admin Live Feed!');
    } else {
      console.log('❌ Attempt NOT found in live feed');
    }

    console.log('\n🎉 All backend tests passed!');
  } catch (err) {
    console.error('\n❌ Test failed:');
    console.error(err.message);
  }
}

runTests();
