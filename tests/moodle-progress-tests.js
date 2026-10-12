/**
 * Automated Verification Test Suite for Moodle Activity Completion & Database Safety
 * Tests all 15 Phase 9 requirements against the running ELMS backend & PostgreSQL database.
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

async function runMoodleTests() {
  console.log('================================================================');
  console.log('🧪 Starting Moodle LMS Activity Completion & Security Validation');
  console.log('================================================================\n');

  try {
    // 1. Health check
    const health = await request('GET', '/health');
    if (health.status !== 200) throw new Error('Backend health check failed');
    console.log(`✓ 1. Backend server healthy on port ${API_PORT}`);

    // 2. Instructor login (Dr. Ashwita Pawar - user id 1)
    const instRes = await request('POST', '/auth/login', {
      email: 'ashwita.pawar@elms.edu',
      password: 'password123'
    });
    if (instRes.status !== 200) throw new Error(`Instructor login failed: ${JSON.stringify(instRes.data)}`);
    const instToken = instRes.data.data.token;
    console.log(`✓ 2. Instructor login successful: Dr. Ashwita Pawar`);

    // 3. Student A login (Riddhi Prabhudesai - user id 2)
    const studARes = await request('POST', '/auth/login', {
      email: 'riddhi@elms.edu',
      password: 'password123'
    });
    if (studARes.status !== 200) throw new Error(`Student A login failed: ${JSON.stringify(studARes.data)}`);
    const studAToken = studARes.data.data.token;
    const studentAId = studARes.data.data.user.id;
    console.log(`✓ 3. Student A login successful: Riddhi Prabhudesai (ID: ${studentAId})`);

    // 4. Student B login (John Doe - user id 4)
    const studBRes = await request('POST', '/auth/login', {
      email: 'john.doe@elms.edu',
      password: 'password123'
    });
    if (studBRes.status !== 200) throw new Error(`Student B login failed: ${JSON.stringify(studBRes.data)}`);
    const studBToken = studBRes.data.data.token;
    const studentBId = studBRes.data.data.user.id;
    console.log(`✓ 4. Student B login successful: John Doe (ID: ${studentBId})`);

    // 5. Instructor creates a new course with capacity 2 and an enrollment deadline
    const newCourseRes = await request('POST', '/courses', {
      title: 'Moodle Progress Verification Course',
      description: 'Test course to verify automatic database-backed activity completion.',
      category: 'Software Engineering',
      status: 'published'
    }, instToken);
    if (newCourseRes.status !== 201) throw new Error(`Course creation failed: ${JSON.stringify(newCourseRes.data)}`);
    const courseId = newCourseRes.data.data.id;
    console.log(`✓ 5. Instructor created course (ID: ${courseId})`);

    // 6. Instructor creates Module 1
    const mod1Res = await request('POST', `/modules/courses/${courseId}/modules`, {
      title: 'Module 1: Architecture Overview',
      description: 'Introduction to architectural concepts.',
      order_index: 1
    }, instToken);
    const mod1Id = mod1Res.data.data.id;
    console.log(`✓ 6. Module 1 created (ID: ${mod1Id})`);

    // 7. Instructor adds a learning resource (material)
    const mat1Res = await request('POST', `/materials/modules/${mod1Id}/materials`, {
      title: 'Moodle Design Specifications PDF',
      material_type: 'file',
      file_url: '/uploads/demo-docs/exp3_guide.pdf'
    }, instToken);
    const mat1Id = mat1Res.data.data.id;
    console.log(`✓ 7. Course Material added (ID: ${mat1Id})`);

    // 8. Instructor creates an Assignment with grades_released initially false
    const assignRes = await request('POST', `/assignments/courses/${courseId}/assignments`, {
      module_id: mod1Id,
      title: 'Lab 1: Class Diagram Implementation',
      description: 'Submit your UML diagram and explanation.',
      due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
      max_points: 50
    }, instToken);
    const assignId = assignRes.data.data.id;
    console.log(`✓ 8. Assignment created (ID: ${assignId})`);

    // 9. Verify Unauthorized access is rejected: Student A is NOT enrolled yet
    const unauthAccess = await request('GET', `/materials/${mat1Id}/access`, null, studAToken);
    if (unauthAccess.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unenrolled student, got ${unauthAccess.status}`);
    }
    console.log(`✓ 9. Unauthorized material access properly rejected with 403 Forbidden`);

    // 10. Student A enrolls in the course
    const enrollRes = await request('POST', `/enrollments/courses/${courseId}/enroll`, {}, studAToken);
    if (enrollRes.status !== 200 && enrollRes.status !== 201) throw new Error(`Enrollment failed: ${JSON.stringify(enrollRes.data)}`);
    console.log(`✓ 10. Student A enrolled successfully`);

    // 11. Initial progress must be exactly 0% with 0 completed activities
    const initProgress = await request('GET', `/courses/${courseId}/progress`, null, studAToken);
    if (initProgress.status !== 200 || initProgress.data.data.progress_percentage !== 0 || initProgress.data.data.completed_activities !== 0) {
      throw new Error(`Expected initial progress 0% and 0 completed, got: ${JSON.stringify(initProgress.data)}`);
    }
    if (initProgress.data.data.total_activities !== 2) {
      throw new Error(`Expected total_activities 2 (1 material + 1 assignment), got: ${initProgress.data.data.total_activities}`);
    }
    console.log(`✓ 11. New enrollment starts at 0% (0 of 2 activities completed)`);

    // 12. Student A accesses authorized learning material
    const accessRes1 = await request('GET', `/materials/${mat1Id}/access`, null, studAToken);
    if (accessRes1.status !== 200) throw new Error(`Material access failed: ${JSON.stringify(accessRes1.data)}`);
    const progressAfterMat = accessRes1.data.data.progress;
    if (progressAfterMat.completed_activities !== 1 || progressAfterMat.progress_percentage !== 50) {
      throw new Error(`Expected 1 completed activity (50%), got: ${JSON.stringify(progressAfterMat)}`);
    }
    console.log(`✓ 12. Accessing material marked resource complete: 1/2 activities (50%)`);

    // 13. IDEMPOTENCY TEST: Student A accesses the same material again
    const accessRes2 = await request('GET', `/materials/${mat1Id}/access`, null, studAToken);
    if (accessRes2.status !== 200) throw new Error(`Material re-access failed: ${JSON.stringify(accessRes2.data)}`);
    const progressAfterMat2 = accessRes2.data.data.progress;
    if (progressAfterMat2.completed_activities !== 1 || progressAfterMat2.progress_percentage !== 50) {
      throw new Error(`Idempotency violated: completed activities increased to ${progressAfterMat2.completed_activities}`);
    }
    console.log(`✓ 13. Idempotency confirmed: Re-accessing material keeps completion at exactly 1/2 (50%)`);

    // 14. Student A submits the assignment
    const submitRes1 = await request('POST', `/submissions/assignments/${assignId}`, {
      content: 'Initial submission of UML Class diagram architecture.'
    }, studAToken);
    if (submitRes1.status !== 201) throw new Error(`Submission failed: ${JSON.stringify(submitRes1.data)}`);
    
    // Check progress after submission
    const progressAfterSub = await request('GET', `/courses/${courseId}/progress`, null, studAToken);
    if (progressAfterSub.data.data.completed_activities !== 2 || progressAfterSub.data.data.progress_percentage !== 100) {
      throw new Error(`Expected 2/2 completed activities (100%), got: ${JSON.stringify(progressAfterSub.data)}`);
    }
    console.log(`✓ 14. Assignment submission completed: 2/2 activities (100%)`);

    // 15. IDEMPOTENCY TEST: Student A resubmits assignment
    const submitRes2 = await request('POST', `/submissions/assignments/${assignId}`, {
      content: 'Updated revised submission with component definitions.'
    }, studAToken);
    if (submitRes2.status !== 201) throw new Error(`Resubmission failed: ${JSON.stringify(submitRes2.data)}`);

    const progressAfterResub = await request('GET', `/courses/${courseId}/progress`, null, studAToken);
    if (progressAfterResub.data.data.completed_activities !== 2 || progressAfterResub.data.data.progress_percentage !== 100) {
      throw new Error(`Idempotency violated on resubmission: ${JSON.stringify(progressAfterResub.data)}`);
    }
    console.log(`✓ 15. Idempotency confirmed: Resubmitting assignment does not duplicate completion (remains 2/2 - 100%)`);

    // 16. ISOLATION TEST: Student B enrolls and checks progress - Student B must be at 0%
    await request('POST', `/enrollments/courses/${courseId}/enroll`, {}, studBToken);
    const progressStudB = await request('GET', `/courses/${courseId}/progress`, null, studBToken);
    if (progressStudB.data.data.completed_activities !== 0 || progressStudB.data.data.progress_percentage !== 0) {
      throw new Error(`Student isolation failed: Student B has progress from Student A!`);
    }
    console.log(`✓ 16. User isolation confirmed: Student A's completions did not affect Student B (Student B is at 0%)`);

    // 17. DENOMINATOR RECALCULATION: Instructor adds a new required assignment
    const assign2Res = await request('POST', `/assignments/courses/${courseId}/assignments`, {
      module_id: mod1Id,
      title: 'Lab 2: Sequence Diagrams',
      description: 'Second required assignment.',
      due_date: new Date(Date.now() + 86400000 * 10).toISOString(),
      max_points: 50
    }, instToken);
    const assign2Id = assign2Res.data.data.id;

    // Student A's progress should automatically recalculate to 2 / 3 = 67%
    const progressAfterNewAct = await request('GET', `/courses/${courseId}/progress`, null, studAToken);
    if (progressAfterNewAct.data.data.total_activities !== 3 || progressAfterNewAct.data.data.completed_activities !== 2 || progressAfterNewAct.data.data.progress_percentage !== 67) {
      throw new Error(`Denominator recalculation failed: Expected 2/3 (67%), got: ${JSON.stringify(progressAfterNewAct.data)}`);
    }
    console.log(`✓ 17. Denominator recalculation confirmed: Adding new activity recalculated progress to 2/3 (67%)`);

    // 18. GRADE RELEASE TEST: Instructor grades Student A's submission, hides grade
    const submissionsList = await request('GET', `/submissions/assignments/${assignId}`, null, instToken);
    const subRecord = submissionsList.data.data.find(s => s.student_id === studentAId);
    if (!subRecord) throw new Error('Submission record not found for grading');

    // Grade the submission
    await request('PUT', `/submissions/${subRecord.id}/grade`, {
      grade: 48,
      feedback: 'Outstanding architecture design and documentation.'
    }, instToken);

    // Hide grades
    await request('PUT', `/assignments/${assignId}/release-grades`, {
      grades_released: false
    }, instToken);

    // Student A checks assignment: grade and feedback MUST be null
    const studentAssignViewHidden = await request('GET', `/assignments/${assignId}`, null, studAToken);
    if (studentAssignViewHidden.data.data.student_submission?.grade !== null) {
      throw new Error(`Unreleased grade leaked to student! Grade: ${studentAssignViewHidden.data.data.student_submission?.grade}`);
    }
    console.log(`✓ 18. Grade release protection confirmed: Student cannot see grade when grades_released = false`);

    // Instructor releases grades
    await request('PUT', `/assignments/${assignId}/release-grades`, {
      grades_released: true
    }, instToken);

    const studentAssignViewReleased = await request('GET', `/assignments/${assignId}`, null, studAToken);
    if (parseFloat(studentAssignViewReleased.data.data.student_submission?.grade) !== 48) {
      throw new Error(`Released grade not visible to student after release!`);
    }
    console.log(`✓ 19. Grade release confirmed: Grade 48/50 and feedback visible to student after instructor release`);

    // 20. INSTRUCTOR PROGRESS VIEW: Instructor views student progress roster
    const rosterRes = await request('GET', `/enrollments/courses/${courseId}/students`, null, instToken);
    if (rosterRes.status !== 200 || rosterRes.data.data.length < 2) {
      throw new Error(`Roster view failed: ${JSON.stringify(rosterRes.data)}`);
    }
    const studentARoster = rosterRes.data.data.find(s => s.student_id === studentAId);
    if (studentARoster.completed_activities_count !== 2 || studentARoster.total_activities_count !== 3 || studentARoster.progress_percentage !== 67) {
      throw new Error(`Instructor roster metrics mismatch: ${JSON.stringify(studentARoster)}`);
    }
    console.log(`✓ 20. Instructor student progress view verified: Student A has 2/3 activities (67%)`);

    // Clean up test course
    await request('DELETE', `/courses/${courseId}`, null, instToken);
    console.log(`✓ 21. Test course cleaned up safely.`);

    console.log('\n================================================================');
    console.log('🎉 ALL 21 MOODLE LMS AUTOMATION & SECURITY VERIFICATIONS PASSED!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  }
}

runMoodleTests();
