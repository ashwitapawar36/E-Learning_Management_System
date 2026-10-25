/**
 * Comprehensive Automated Test Suite for Course Enrollment Keys
 * Tests all requirements and validation edge cases from the specification.
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
  console.log('\n=== Starting Comprehensive Course Enrollment Key Test Suite ===\n');

  // Authenticate instructor1, instructor2, and student
  const instructor1Token = await login('ashwita.pawar@elms.edu', 'password123');
  const instructor2Token = await login('alan.turing@elms.edu', 'password123');
  const studentToken = await login('riddhi@elms.edu', 'password123');
  
  // Register a fresh test student
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

  // Register a second fresh test student for post-regeneration testing
  const testStudent2Email = `teststudent2_${timestamp}@student.elms.edu`;
  const regRes2 = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Second Test Student',
      email: testStudent2Email,
      password: 'password123',
      role: 'student'
    }
  });
  const testStudent2Token = regRes2.data?.data?.token;

  console.log('[Setup Complete: Authenticated Instructors and Test Students]');

  // -------------------------------------------------------------
  // Test 1: Course creation automatically generates a unique, secure enrollment key
  // -------------------------------------------------------------
  console.log('\n[Test 1] Course creation auto-generates unique secure enrollment key');
  const autoCourseTitle = `Auto Key Protected Course ${timestamp}`;
  const autoCreateRes = await api('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: {
      title: autoCourseTitle,
      description: 'Course with automatically generated enrollment key',
      category: 'Software Engineering',
      status: 'published'
    }
  });

  assert(autoCreateRes.status === 201, 'Course created with 201 Created');
  const autoCourse = autoCreateRes.data.data;
  assert(Boolean(autoCourse.enrollment_key), 'Enrollment key is returned to course creator');
  assert(/^ELMS-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(autoCourse.enrollment_key), `Key matches secure format ELMS-XXXX-XXXX (Got: ${autoCourse.enrollment_key})`);
  assert(autoCourse.requires_enrollment_key === true, 'Course has requires_enrollment_key = true by default');
  assert(!autoCourse.enrollment_key_hash, 'Key hash is NOT exposed in response');

  // -------------------------------------------------------------
  // Test 2: Instructor can retrieve the enrollment key via authenticated endpoint
  // -------------------------------------------------------------
  console.log('\n[Test 2] Instructor views course enrollment key');
  const getKeyRes = await api(`/courses/${autoCourse.id}/enrollment-key`, {
    headers: { Authorization: `Bearer ${instructor1Token}` }
  });
  assert(getKeyRes.status === 200, 'Instructor retrieves enrollment key with 200 OK');
  assert(getKeyRes.data.data.enrollment_key === autoCourse.enrollment_key, 'Retrieved key matches auto-generated key');

  // Instructor courses list includes key for management page
  const instCoursesRes = await api('/courses/instructor', {
    headers: { Authorization: `Bearer ${instructor1Token}` }
  });
  const myCourse = instCoursesRes.data.data.find(c => c.id === autoCourse.id);
  assert(myCourse && myCourse.enrollment_key === autoCourse.enrollment_key, 'Instructor courses management query includes enrollment_key');

  // -------------------------------------------------------------
  // Test 3: Unauthorized users cannot view course enrollment key
  // -------------------------------------------------------------
  console.log('\n[Test 3] Unauthorized users rejected from viewing key');
  // Student attempts to view key
  const studentViewKeyRes = await api(`/courses/${autoCourse.id}/enrollment-key`, {
    headers: { Authorization: `Bearer ${testStudentToken}` }
  });
  assert(studentViewKeyRes.status === 403, 'Student rejected with 403 Forbidden');

  // Different instructor attempts to view key
  const nonOwnerViewKeyRes = await api(`/courses/${autoCourse.id}/enrollment-key`, {
    headers: { Authorization: `Bearer ${instructor2Token}` }
  });
  assert(nonOwnerViewKeyRes.status === 403, 'Non-owner instructor rejected with 403 Forbidden');

  // Unauthenticated user attempts to view key
  const anonViewKeyRes = await api(`/courses/${autoCourse.id}/enrollment-key`);
  assert(anonViewKeyRes.status === 401, 'Unauthenticated user rejected with 401 Unauthorized');

  // -------------------------------------------------------------
  // Test 4: Student enters incorrect key -> rejected
  // -------------------------------------------------------------
  console.log('\n[Test 4] Student enters incorrect key -> rejected');
  const wrongKeyRes = await api(`/enrollments/courses/${autoCourse.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: 'WRONG_KEY_9999' }
  });
  assert(wrongKeyRes.status === 400, 'Rejected with 400 status');
  assert(
    wrongKeyRes.data.message === 'Incorrect enrollment key. Please check the key provided by your instructor and try again.',
    'Returns clear error message on incorrect key'
  );

  // -------------------------------------------------------------
  // Test 5: Empty key or omitted key -> rejected
  // -------------------------------------------------------------
  console.log('\n[Test 5] Empty key or omitted key -> rejected');
  const emptyKeyRes = await api(`/enrollments/courses/${autoCourse.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: '' }
  });
  assert(emptyKeyRes.status === 400, 'Empty key rejected with 400 status');

  const omittedKeyRes = await api(`/enrollments/courses/${autoCourse.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: {}
  });
  assert(omittedKeyRes.status === 400, 'Omitted key rejected with 400 status');

  // -------------------------------------------------------------
  // Test 6: Student enters correct key -> enrollment succeeds
  // -------------------------------------------------------------
  console.log('\n[Test 6] Student enters correct key -> enrollment succeeds');
  const correctKeyRes = await api(`/enrollments/courses/${autoCourse.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: autoCourse.enrollment_key }
  });
  assert(correctKeyRes.status === 201, 'Enrollment succeeds with 201 Created');
  assert(correctKeyRes.data.data.status === 'active', 'Enrollment is active');
  assert(correctKeyRes.data.data.progress_percentage === 0, 'Progress initialized at 0%');

  // -------------------------------------------------------------
  // Test 7: Student already enrolled -> duplicate enrollment prevented
  // -------------------------------------------------------------
  console.log('\n[Test 7] Duplicate enrollment prevented');
  const duplicateRes = await api(`/enrollments/courses/${autoCourse.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: autoCourse.enrollment_key }
  });
  assert(duplicateRes.status === 409, 'Duplicate enrollment rejected with 409 Conflict');
  assert(duplicateRes.data.message.includes('already'), 'Informs user they are already enrolled');

  // -------------------------------------------------------------
  // Test 8: Student enters key for a different course -> rejected
  // -------------------------------------------------------------
  console.log('\n[Test 8] Cross-course key isolation');
  const course2Title = `Independent Course ${timestamp}`;
  const course2Res = await api('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor2Token}` },
    body: {
      title: course2Title,
      description: 'Second independent course',
      category: 'Database Systems',
      status: 'published'
    }
  });
  const course2 = course2Res.data.data;
  assert(course2.enrollment_key !== autoCourse.enrollment_key, 'Each course has its own distinct key');

  // Student tries to enroll in course2 using autoCourse's key
  const crossKeyRes = await api(`/enrollments/courses/${course2.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: autoCourse.enrollment_key }
  });
  assert(crossKeyRes.status === 400, 'Cross-course key rejected with 400');

  // Student enrolls in course2 using course2's own key -> succeeds
  const course2SuccessRes = await api(`/enrollments/courses/${course2.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` },
    body: { enrollment_key: course2.enrollment_key }
  });
  assert(course2SuccessRes.status === 201, 'Course 2 accepts its own valid key');

  // -------------------------------------------------------------
  // Test 9: Unauthenticated user -> rejected
  // -------------------------------------------------------------
  console.log('\n[Test 9] Unauthenticated user cannot enroll');
  const anonEnrollRes = await api(`/enrollments/courses/${autoCourse.id}/enroll`, {
    method: 'POST',
    body: { enrollment_key: autoCourse.enrollment_key }
  });
  assert(anonEnrollRes.status === 401, 'Unauthenticated enrollment rejected with 401 Unauthorized');

  // -------------------------------------------------------------
  // Test 10: Instructor attempts student enrollment -> rejected
  // -------------------------------------------------------------
  console.log('\n[Test 10] Instructor cannot enroll as student');
  const instructorEnrollRes = await api(`/enrollments/courses/${course2.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: { enrollment_key: course2.enrollment_key }
  });
  assert(instructorEnrollRes.status === 403, 'Instructor rejected with 403 Forbidden');

  // -------------------------------------------------------------
  // Test 11: Key regeneration
  // -------------------------------------------------------------
  console.log('\n[Test 11] Key regeneration: new key works, old key fails, existing students stay enrolled');
  
  // Non-owner attempts regeneration -> rejected 403
  const unauthRegenRes = await api(`/courses/${autoCourse.id}/regenerate-enrollment-key`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor2Token}` }
  });
  assert(unauthRegenRes.status === 403, 'Unauthorized instructor cannot regenerate key (403)');

  // Student attempts regeneration -> rejected 403
  const studentRegenRes = await api(`/courses/${autoCourse.id}/regenerate-enrollment-key`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudentToken}` }
  });
  assert(studentRegenRes.status === 403, 'Student cannot regenerate key (403)');

  // Course owner regenerates key
  const oldKey = autoCourse.enrollment_key;
  const regenRes = await api(`/courses/${autoCourse.id}/regenerate-enrollment-key`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` }
  });
  assert(regenRes.status === 200, 'Owner regenerates key with 200 OK');
  const newKey = regenRes.data.data.enrollment_key;
  assert(newKey && newKey !== oldKey, `New key is generated (${newKey} !== ${oldKey})`);

  // Verify existing enrolled student is still enrolled
  const studentCourseView = await api(`/courses/${autoCourse.id}`, {
    headers: { Authorization: `Bearer ${testStudentToken}` }
  });
  assert(studentCourseView.data.data.is_enrolled === true, 'Existing student remains enrolled after key regeneration');

  // New student attempts to enroll with OLD key -> rejected
  const oldKeyAttemptRes = await api(`/enrollments/courses/${autoCourse.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudent2Token}` },
    body: { enrollment_key: oldKey }
  });
  assert(oldKeyAttemptRes.status === 400, 'New enrollment using old key is rejected with 400');

  // New student attempts to enroll with NEW key -> succeeds
  const newKeyAttemptRes = await api(`/enrollments/courses/${autoCourse.id}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testStudent2Token}` },
    body: { enrollment_key: newKey }
  });
  assert(newKeyAttemptRes.status === 201, 'New student enrolls successfully with regenerated key');

  // -------------------------------------------------------------
  // Test 12: Zero-exposure in public catalog and student views
  // -------------------------------------------------------------
  console.log('\n[Test 12] Zero-exposure of enrollment keys in public/student endpoints');
  const publicCatalog = await api('/courses');
  const exposedInCatalog = publicCatalog.data.data.some(c => c.enrollment_key !== undefined || c.enrollment_key_hash !== undefined);
  assert(!exposedInCatalog, 'enrollment_key and enrollment_key_hash absent from public catalog');

  const publicCourseDetails = await api(`/courses/${autoCourse.id}`, {
    headers: { Authorization: `Bearer ${testStudentToken}` }
  });
  assert(publicCourseDetails.data.data.enrollment_key === undefined, 'enrollment_key absent from student course details');
  assert(publicCourseDetails.data.data.enrollment_key_hash === undefined, 'enrollment_key_hash absent from student course details');
  assert(publicCourseDetails.data.data.requires_enrollment_key === true, 'requires_enrollment_key boolean exposed to inform UI');

  // -------------------------------------------------------------
  // Test 13: Backward compatibility with custom keys and open courses
  // -------------------------------------------------------------
  console.log('\n[Test 13] Backward compatibility with custom keys and settings');
  const customKey = `CUSTOM_SECRET_${timestamp}`;
  const customCourseRes = await api('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: {
      title: `Custom Key Course ${timestamp}`,
      description: 'Course with instructor-specified custom key',
      enrollment_key: customKey,
      requires_enrollment_key: true
    }
  });
  assert(customCourseRes.status === 201, 'Custom key course created');
  assert(customCourseRes.data.data.enrollment_key === customKey, 'Custom key preserved accurately');

  console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
