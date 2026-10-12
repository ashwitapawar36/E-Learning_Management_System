/**
 * Comprehensive Automated Test Suite for Moodle-Style Course Enrollment Keys
 * Tests all 11 requirements from the specification.
 */
const BASE_URL = 'http://localhost:5000/api';

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function login(email, password) {
  const res = await api('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  return res.data.data.token;
}

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== Starting Enrollment Key Test Suite ===\n');

  // Log in instructor1, instructor2, and student with seed password
  const instructor1Token = await login('ashwita.pawar@elms.edu', 'password123');
  const instructor2Token = await login('alan.turing@elms.edu', 'password123');
  const studentToken = await login('riddhi@elms.edu', 'password123');
  
  // Also create a fresh student to test key operations cleanly
  const timestamp = Date.now();
  const testStudentEmail = `teststudent_${timestamp}@student.elms.edu`;
  const regRes = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Student',
      email: testStudentEmail,
      password: 'password123',
      role: 'student'
    }
  });
  const testStudentToken = regRes.data?.data?.token;

  console.log('[Setup Complete: Authenticated Instructor 1, Instructor 2, and Student]');

  // -------------------------------------------------------------
  // Test 1: Instructor creates a course with an enrollment key
  // -------------------------------------------------------------
  console.log('\n[Test 1] Instructor creates a course with an enrollment key');
  const course1Title = `Protected Systems Course ${timestamp}`;
  const course1Key = `KEY_${timestamp}`;
  
  const createRes1 = await api('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: {
      title: course1Title,
      description: 'Course requiring enrollment key',
      category: 'Software Engineering',
      status: 'published',
      requires_enrollment_key: true,
      enrollment_key: course1Key
    }
  });

  assert(createRes1.status === 201, 'Course created with 201 status', `Got ${createRes1.status}`);
  const course1 = createRes1.data.data;
  assert(course1.requires_enrollment_key === true, 'Course has requires_enrollment_key = true');
  assert(course1.has_enrollment_key === true, 'Course has has_enrollment_key = true');
  assert(!course1.enrollment_key_hash, 'Key hash is NOT exposed in createCourse response');

  // -------------------------------------------------------------
  // Test 2: Student enters an incorrect key and enrollment is rejected
  // -------------------------------------------------------------
  console.log('\n[Test 2] Student enters incorrect key -> rejected');
  const wrongKeyRes = await api(`/enrollments/courses/${course1.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: 'WRONG_KEY_123' }
  });

  assert(wrongKeyRes.status === 400, 'Rejected with 400 status', `Got ${wrongKeyRes.status}`);
  assert(
    wrongKeyRes.data.message === 'Incorrect enrollment key. Please check the key provided by your instructor and try again.',
    'Returns exact specified error message',
    wrongKeyRes.data.message
  );

  // -------------------------------------------------------------
  // Test 4: Student cannot bypass key verification by omitting key
  // -------------------------------------------------------------
  console.log('\n[Test 4] Direct API call bypass prevention');
  const bypassRes = await api(`/enrollments/courses/${course1.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: {}
  });

  assert(bypassRes.status === 400, 'Rejected with 400 status when omitting key');
  assert(
    bypassRes.data.message === 'Incorrect enrollment key. Please check the key provided by your instructor and try again.',
    'Returns exact specified error message on key omission'
  );

  // -------------------------------------------------------------
  // Test 3: Student enters the correct key and enrollment succeeds
  // -------------------------------------------------------------
  console.log('\n[Test 3] Student enters correct key -> enrollment succeeds');
  const correctKeyRes = await api(`/enrollments/courses/${course1.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: course1Key }
  });

  assert(correctKeyRes.status === 201, 'Enrollment succeeds with 201', `Got ${correctKeyRes.status}`);
  assert(correctKeyRes.data.data.status === 'active', 'Enrollment is active');
  assert(correctKeyRes.data.data.progress_percentage === 0, 'Progress initialized at 0%');

  // Duplicate enrollment attempt
  const dupRes = await api(`/enrollments/courses/${course1.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: course1Key }
  });
  assert(dupRes.status === 409, 'Duplicate active enrollment prevented with 409 Conflict');

  // -------------------------------------------------------------
  // Test 5: Courses without keys allow normal enrollment
  // -------------------------------------------------------------
  console.log('\n[Test 5] Courses without keys allow normal enrollment');
  const openCourseTitle = `Open Access Course ${timestamp}`;
  const openRes = await api('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: {
      title: openCourseTitle,
      description: 'Open public enrollment',
      category: 'Web Development',
      status: 'published',
      requires_enrollment_key: false
    }
  });
  const openCourse = openRes.data.data;
  assert(openCourse.requires_enrollment_key === false, 'Open course has requires_enrollment_key = false');

  const openEnrollRes = await api(`/enrollments/courses/${openCourse.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: {}
  });
  assert(openEnrollRes.status === 201, 'Enrolled into open course without key with 201 status');

  // -------------------------------------------------------------
  // Test 6: Changing a key does not remove existing students
  // -------------------------------------------------------------
  console.log('\n[Test 6] Changing key retains existing students');
  const newCourse1Key = `NEW_KEY_${timestamp}`;
  const updateKeyRes = await api(`/courses/${course1.id}/enrollment-settings`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: {
      requires_enrollment_key: true,
      enrollment_key: newCourse1Key
    }
  });

  assert(updateKeyRes.status === 200, 'Updated enrollment key with 200 status');
  assert(updateKeyRes.data.data.has_enrollment_key === true, 'has_enrollment_key remains true');

  // Verify previously enrolled student still has active enrollment in course
  const myEnrollmentsRes = await api('/enrollments/my', {
    headers: { Authorization: `Bearer ${testStudentToken}` }
  });
  const studentHasCourse1 = myEnrollmentsRes.data.data.some(e => e.course_id === course1.id && e.enrollment_status === 'active');
  assert(studentHasCourse1, 'Previously enrolled student retains active enrollment after key rotation');

  // Verify student view of course1 still shows is_enrolled = true
  const courseDetailsForStudent = await api(`/courses/${course1.id}`, {
    headers: { Authorization: `Bearer ${testStudentToken}` }
  });
  assert(courseDetailsForStudent.data.data.is_enrolled === true, 'Student course view confirms is_enrolled: true');

  // -------------------------------------------------------------
  // Test 7: Different courses accept their own respective keys
  // -------------------------------------------------------------
  console.log('\n[Test 7] Different courses have independent keys');
  const course2Title = `Course 2 Distinct Key ${timestamp}`;
  const course2Key = `DISTINCT_KEY_${timestamp}`;
  const createRes2 = await api('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor2Token}` },
    body: {
      title: course2Title,
      description: 'Second course with independent key',
      category: 'Database Systems',
      status: 'published',
      requires_enrollment_key: true,
      enrollment_key: course2Key
    }
  });
  const course2 = createRes2.data.data;

  // Student tries to enroll in course2 using course1's key -> rejected
  const crossKeyRes = await api(`/enrollments/courses/${course2.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: newCourse1Key }
  });
  assert(crossKeyRes.status === 400, 'Course 2 rejects Course 1 key');

  // Student enrolls in course2 using course2's key -> accepted
  const course2SuccessRes = await api(`/enrollments/courses/${course2.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: course2Key }
  });
  assert(course2SuccessRes.status === 201, 'Course 2 accepts its own key');

  // -------------------------------------------------------------
  // Test 8: Only the course owner can modify enrollment settings
  // -------------------------------------------------------------
  console.log('\n[Test 8] Course owner authorization check');
  // Instructor 2 tries to modify Instructor 1's course
  const unauthorizedRes = await api(`/courses/${course1.id}/enrollment-settings`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${instructor2Token}` },
    body: {
      requires_enrollment_key: false
    }
  });
  assert(unauthorizedRes.status === 403, 'Non-owner instructor rejected with 403 Forbidden');

  // Student tries to modify enrollment settings
  const studentUnauthorizedRes = await api(`/courses/${course1.id}/enrollment-settings`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: {
      requires_enrollment_key: false
    }
  });
  assert(studentUnauthorizedRes.status === 403, 'Student rejected with 403 Forbidden');

  // -------------------------------------------------------------
  // Test 9: Keys and hashes NEVER appear in student-facing API responses
  // -------------------------------------------------------------
  console.log('\n[Test 9] Zero-exposure of key hash in responses');
  const catalogRes = await api('/courses');
  const allHashesInCatalog = catalogRes.data.data.some(c => c.enrollment_key_hash !== undefined || c.enrollment_key !== undefined);
  assert(!allHashesInCatalog, 'enrollment_key_hash and enrollment_key absent from getAllCourses');

  const course1PublicRes = await api(`/courses/${course1.id}`);
  assert(course1PublicRes.data.data.enrollment_key_hash === undefined, 'enrollment_key_hash absent from getCourseById');
  assert(course1PublicRes.data.data.enrollment_key === undefined, 'enrollment_key absent from getCourseById');
  assert(course1PublicRes.data.data.requires_enrollment_key === true, 'requires_enrollment_key is exposed to inform UI');

  // -------------------------------------------------------------
  // Test 10: Automatic progress tracking works after enrollment
  // -------------------------------------------------------------
  console.log('\n[Test 10] Automatic progress tracking preserved');
  const progressRes = await api(`/courses/${course1.id}/progress`, {
    headers: { Authorization: `Bearer ${testStudentToken}` }
  });
  assert(progressRes.status === 200, 'Progress endpoint returns 200 status');
  assert(progressRes.data.data.progress_percentage === 0, 'Progress percentage starts at 0%');

  // -------------------------------------------------------------
  // Test 11: Rate limiting on failed enrollment attempts
  // -------------------------------------------------------------
  console.log('\n[Test 11] Rate limiting on failed key attempts');
  // Create a third course to test rate limiting cleanly for testStudent
  const course3Title = `Rate Limit Test Course ${timestamp}`;
  const course3Key = `RATELIMIT_${timestamp}`;
  const createRes3 = await api('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: {
      title: course3Title,
      description: 'Rate limit test',
      category: 'Software Engineering',
      status: 'published',
      requires_enrollment_key: true,
      enrollment_key: course3Key
    }
  });
  const course3 = createRes3.data.data;

  // Make 5 consecutive wrong attempts
  for (let i = 1; i <= 5; i++) {
    await api(`/enrollments/courses/${course3.id}/enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testStudentToken}` },
      body: { enrollment_key: `GUESS_${i}` }
    });
  }

  // 6th attempt should return 429 Too Many Requests
  const rateLimitedRes = await api(`/enrollments/courses/${course3.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: 'GUESS_6' }
  });

  assert(rateLimitedRes.status === 429, 'Rate limited with 429 Too Many Requests', `Got ${rateLimitedRes.status}`);
  assert(
    rateLimitedRes.data.message.includes('Too many failed enrollment attempts'),
    'Rate limit message informed to user',
    rateLimitedRes.data.message
  );

  console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
