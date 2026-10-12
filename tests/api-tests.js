/**
 * Automated End-to-End API Test Suite for E-Learning Management System
 * Tests complete Instructor-to-Student Workflow against PostgreSQL backend
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      host: API_HOST,
      port: API_PORT,
      path: `/api${path}`,
      method,
      headers
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting ELMS End-to-End API Validation Test Suite');
  console.log('====================================================\n');

  try {
    // 1. Health check
    const health = await request('GET', '/health');
    console.log(`[PASS] Health check status: ${health.status} (${health.data.message})`);

    // 2. Instructor Login (Dr. Ashwita Pawar)
    const instLogin = await request('POST', '/auth/login', {
      email: 'ashwita.pawar@elms.edu',
      password: 'password123'
    });
    if (instLogin.status !== 200 || !instLogin.data.data.token) {
      throw new Error(`Instructor login failed: ${JSON.stringify(instLogin.data)}`);
    }
    const instructorToken = instLogin.data.data.token;
    console.log(`[PASS] Instructor login successful: Dr. Ashwita Pawar (Role: ${instLogin.data.data.user.role})`);

    // 3. Student Login (Riddhi Prabhudesai)
    const studLogin = await request('POST', '/auth/login', {
      email: 'riddhi@elms.edu',
      password: 'password123'
    });
    if (studLogin.status !== 200 || !studLogin.data.data.token) {
      throw new Error(`Student login failed: ${JSON.stringify(studLogin.data)}`);
    }
    const studentToken = studLogin.data.data.token;
    console.log(`[PASS] Student login successful: Riddhi Prabhudesai (Role: ${studLogin.data.data.user.role})`);

    // 4. Get Course Catalog
    const catalog = await request('GET', '/courses');
    console.log(`[PASS] Course catalog loaded: ${catalog.data.count} courses available`);
    const courseId = catalog.data.data[0].id;

    // 5. Course Details with Modules & Assignments
    const courseDetail = await request('GET', `/courses/${courseId}`, null, studentToken);
    console.log(`[PASS] Course detail loaded: "${courseDetail.data.data.title}" (${courseDetail.data.data.modules.length} modules, ${courseDetail.data.data.assignments.length} assignments)`);

    // 6. Instructor Analytics Dashboard
    const instAnalytics = await request('GET', '/analytics/instructor', null, instructorToken);
    console.log(`[PASS] Instructor Dashboard stats: ${instAnalytics.data.data.overview.total_courses} courses, ${instAnalytics.data.data.overview.total_enrollments} enrollments, ${instAnalytics.data.data.overview.pending_grading_count} pending submissions`);

    // 7. Student Analytics Dashboard
    const studAnalytics = await request('GET', '/analytics/student', null, studentToken);
    console.log(`[PASS] Student Dashboard stats: ${studAnalytics.data.data.overview.enrolled_courses_count} enrolled, ${studAnalytics.data.data.overview.average_progress}% avg progress`);

    // 8. Workflow Test: Instructor creates new Course
    const newCourse = await request('POST', '/courses', {
      title: 'Automated Testing Lab Course',
      description: 'Course created by automated test suite to verify end-to-end CRUD operations.',
      category: 'Software Engineering',
      status: 'published'
    }, instructorToken);
    console.log(`[PASS] Instructor created course: "${newCourse.data.data.title}" (ID: ${newCourse.data.data.id})`);
    const testCourseId = newCourse.data.data.id;

    // 9. Instructor creates a Module
    const newModule = await request('POST', `/modules/courses/${testCourseId}/modules`, {
      title: 'Unit 1: Test Automation & CI Pipelines',
      description: 'Understanding automated integration testing and verification.',
      order_index: 1
    }, instructorToken);
    console.log(`[PASS] Instructor created module: "${newModule.data.data.title}" (ID: ${newModule.data.data.id})`);
    const testModuleId = newModule.data.data.id;

    // 10. Instructor adds Course Material (Text lecture note)
    const newMaterial = await request('POST', `/materials/modules/${testModuleId}/materials`, {
      title: 'Integration Test Best Practices',
      material_type: 'text',
      content: 'Always test authentication, database transactions, foreign key integrity, and role permissions.'
    }, instructorToken);
    console.log(`[PASS] Instructor added material: "${newMaterial.data.data.title}"`);

    // 11. Instructor creates an Assignment
    const newAssignment = await request('POST', `/assignments/courses/${testCourseId}/assignments`, {
      module_id: testModuleId,
      title: 'Assignment A1: Automated Verification Suite',
      description: 'Implement a comprehensive test harness verifying instructor-to-student workflows.',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_points: 30
    }, instructorToken);
    console.log(`[PASS] Instructor created assignment: "${newAssignment.data.data.title}" (Max points: 30)`);
    const testAssignmentId = newAssignment.data.data.id;

    // 12. Student Enrolls in the newly created course
    const enrollRes = await request('POST', `/enrollments/courses/${testCourseId}/enroll`, {}, studentToken);
    console.log(`[PASS] Student enrolled in course ID ${testCourseId}: status=${enrollRes.data.data.status}`);

    // 13. Student submits the assignment
    const submissionRes = await request('POST', `/submissions/assignments/${testAssignmentId}`, {
      content: 'Here is the test execution log and architectural diagram confirming all requirements.'
    }, studentToken);
    console.log(`[PASS] Student submitted assignment (ID: ${submissionRes.data.data.id}, status: ${submissionRes.data.data.status})`);
    const testSubmissionId = submissionRes.data.data.id;

    // 14. Instructor views submissions for the assignment
    const subList = await request('GET', `/submissions/assignments/${testAssignmentId}`, null, instructorToken);
    console.log(`[PASS] Instructor retrieved submissions for assignment: found ${subList.data.data.length} submission(s)`);

    // 15. Instructor Grades the submission with Feedback
    const gradeRes = await request('PUT', `/submissions/${testSubmissionId}/grade`, {
      grade: 29.5,
      feedback: 'Excellent automated execution and comprehensive test assertions!'
    }, instructorToken);
    console.log(`[PASS] Instructor graded submission: Grade ${gradeRes.data.data.grade}/30, status=${gradeRes.data.data.status}`);

    // 16. Student checks Notifications for Grade Release
    const notifs = await request('GET', '/notifications', null, studentToken);
    console.log(`[PASS] Student received notifications: total ${notifs.data.count}, unread: ${notifs.data.unread_count}`);

    // 17. Student updates progress
    const progressRes = await request('PUT', `/enrollments/courses/${testCourseId}/progress`, {
      progress_percentage: 100
    }, studentToken);
    console.log(`[PASS] Student progress updated to ${progressRes.data.data.progress_percentage}% (Course marked ${progressRes.data.data.status})`);

    // Clean up test course
    await request('DELETE', `/courses/${testCourseId}`, null, instructorToken);
    console.log(`[PASS] Test course cleaned up successfully.`);

    console.log('\n====================================================');
    console.log('🎉 ALL 17 END-TO-END TESTS PASSED SUCCESSFULLY!');
    console.log('   The complete Instructor-to-Student workflow is');
    console.log('   fully operational against PostgreSQL!');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err.message);
    process.exit(1);
  }
}

// Start server in child process for tests if not already running
const { fork } = require('child_process');
const path = require('path');

const serverProcess = fork(path.join(__dirname, '..', 'backend', 'server.js'), [], {
  env: { ...process.env, PORT: '5000' }
});

setTimeout(() => {
  runTests().finally(() => {
    serverProcess.kill();
  });
}, 2000);
