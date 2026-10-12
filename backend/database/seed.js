const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedDatabase() {
  console.log('Seeding database with demo data and hashed passwords...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Clear existing data
    await client.query(`
      TRUNCATE notifications, submissions, assignments, course_materials, 
               modules, enrollments, courses, users RESTART IDENTITY CASCADE;
    `);

    // 2. Hash default passwords
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 3. Insert Users
    const usersRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, bio)
      VALUES 
        ('Dr. Ashwita Pawar', 'ashwita.pawar@elms.edu', $1, 'instructor', 'Professor of Computer Science & Software Engineering specialist.'),
        ('Prof. Alan Turing', 'alan.turing@elms.edu', $1, 'instructor', 'Chair of Systems and Database Architecture.'),
        ('Riddhi Prabhudesai', 'riddhi@elms.edu', $1, 'student', 'Undergraduate Engineering Student (Class C).'),
        ('John Doe', 'john.doe@elms.edu', $1, 'student', 'Junior Computer Science Major interested in Full Stack.'),
        ('Jane Smith', 'jane.smith@elms.edu', $1, 'student', 'Senior Data Engineering and Web Tech student.'),
        ('System Admin', 'admin@elms.edu', $1, 'admin', 'ELMS Platform Operations Administrator.')
      RETURNING id, name, email, role;
    `, [passwordHash]);
    console.log(`Inserted ${usersRes.rows.length} users.`);

    const ashwitaId = usersRes.rows[0].id;
    const alanId = usersRes.rows[1].id;
    const riddhiId = usersRes.rows[2].id;
    const johnId = usersRes.rows[3].id;
    const janeId = usersRes.rows[4].id;

    // 4. Insert Courses
    const coursesRes = await client.query(`
      INSERT INTO courses (title, description, instructor_id, category, status, thumbnail_url)
      VALUES 
        ('Advanced Software Engineering & System Design',
         'Comprehensive study of object-oriented modeling, UML design patterns, architectural trade-offs, and scalable enterprise systems.',
         $1, 'Software Engineering', 'published', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'),
        ('Full-Stack Web Engineering with React and Node.js',
         'Production-grade full stack engineering using React 18, Express, connection pooling with PostgreSQL, and modern Tailwind UI.',
         $1, 'Web Development', 'published', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'),
        ('Database Systems & SQL Transaction Management',
         'Relational algebra, query optimization, PostgreSQL execution plans, and ACID transaction isolation mechanics.',
         $2, 'Database Systems', 'published', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80'),
        ('Cloud Native DevOps and Microservices',
         'Docker containerization, Kubernetes orchestration, CI/CD pipelines, and cloud deployment fundamentals.',
         $2, 'DevOps & Cloud', 'draft', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80')
      RETURNING id, title;
    `, [ashwitaId, alanId]);
    console.log(`Inserted ${coursesRes.rows.length} courses.`);

    const c1Id = coursesRes.rows[0].id;
    const c2Id = coursesRes.rows[1].id;
    const c3Id = coursesRes.rows[2].id;

    // 5. Insert Enrollments
    await client.query(`
      INSERT INTO enrollments (student_id, course_id, status, progress_percentage)
      VALUES 
        ($1, $2, 'active', 65),
        ($1, $3, 'active', 20),
        ($4, $2, 'active', 40),
        ($4, $5, 'active', 85),
        ($6, $3, 'active', 15);
    `, [riddhiId, c1Id, c2Id, johnId, c3Id, janeId]);
    console.log('Inserted enrollments.');

    // 6. Insert Modules
    const modRes = await client.query(`
      INSERT INTO modules (course_id, title, description, order_index)
      VALUES 
        ($1, 'Module 1: UML Structural Modeling', 'Class diagrams, multiplicities, aggregation vs composition, and domain modeling.', 1),
        ($1, 'Module 2: UML Dynamic Behavioral Modeling', 'Sequence diagrams, lifelines, activation bars, and collaboration diagrams.', 2),
        ($1, 'Module 3: Enterprise Architecture & REST Design', 'Layered architecture: controllers, services, database connection pooling.', 3),
        ($2, 'Module 1: React 18, Vite & Tailwind CSS', 'Modern component state, declarative routing, and utility CSS frameworks.', 1),
        ($2, 'Module 2: Express.js Backend & Direct PostgreSQL Integration', 'Parameterized queries, connection pooling, and token authorization.', 2),
        ($3, 'Module 1: Relational Schemas & Integrity Constraints', 'Primary keys, foreign keys, unique indexes, and schema definitions.', 1),
        ($3, 'Module 2: Concurrency & Transaction Management', 'ACID properties, row locking, deadlocks, and isolation levels.', 2)
      RETURNING id, title;
    `, [c1Id, c2Id, c3Id]);
    console.log(`Inserted ${modRes.rows.length} modules.`);

    const mod1Id = modRes.rows[0].id;
    const mod2Id = modRes.rows[1].id;
    const mod3Id = modRes.rows[2].id;
    const mod4Id = modRes.rows[3].id;
    const mod5Id = modRes.rows[4].id;

    // 7. Insert Course Materials
    await client.query(`
      INSERT INTO course_materials (module_id, title, material_type, file_url, content, order_index)
      VALUES 
        ($1, 'Experiment 3 Lab Guide: UML Class Diagrams', 'file', '/uploads/demo-docs/exp3_guide.pdf', 'Complete lab guidelines for identifying classes, attributes, methods, and relationship multiplicity.', 1),
        ($1, 'Aggregation vs Composition in Software Architecture', 'text', NULL, 'In UML, Aggregation (white diamond) is a weak has-a relationship where child objects can exist independently. Composition (filled diamond) is a strong part-of relationship where child lifecycle is bounded by the parent container.', 2),
        ($1, 'Interactive Video: Reverse Engineering Database to UML', 'video', 'https://www.youtube.com/watch?v=UI6lqHOVHic', 'Video breakdown of entity relationship diagrams and translation to object-oriented class diagrams.', 3),
        ($2, 'Experiment 4 Lab Guide: Sequence & Collaboration Diagrams', 'file', '/uploads/demo-docs/exp4_guide.pdf', 'Detailed stimulus-response sequence diagrams, asynchronous messaging, and lifelines.', 1),
        ($2, 'Sequence Diagram Walkthrough for E-LMS', 'text', NULL, 'Walkthrough of lifelines: Student, E-LMS Web Client, Express Server, PostgreSQL DB, Notification Dispatcher.', 2),
        ($3, 'Vite & Tailwind CSS Quickstart Cheat Sheet', 'text', NULL, 'Comprehensive reference sheet for configuring Tailwind typography, flexbox/grid layouts, and responsive cards.', 1),
        ($4, 'PostgreSQL Connection Pooling with node-postgres (pg)', 'link', 'https://node-postgres.com/features/pooling', 'Official documentation for pg.Pool, client checkout, parameterized queries, and transactions.', 1);
    `, [mod1Id, mod2Id, mod4Id, mod5Id]);
    console.log('Inserted course materials.');

    // 8. Insert Assignments
    const now = new Date();
    const dueDate1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const dueDate2 = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString();
    const dueDate3 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const dueDate4 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const assignRes = await client.query(`
      INSERT INTO assignments (course_id, module_id, title, description, due_date, max_points, status)
      VALUES 
        ($1, $2, 'Experiment 3: UML Class Diagram Design', 'Design and submit a comprehensive UML Class Diagram for the E-Learning Management System identifying all major entities, attributes, methods, and multiplicity relationships.', $3::timestamptz, 25, 'published'),
        ($1, $4, 'Experiment 4: Sequence & Collaboration Diagram', 'Model the dynamic interaction sequences for Course Enrollment and Assignment Submission workflows including system lifelines and return messages.', $5::timestamptz, 25, 'published'),
        ($6, $7, 'Hands-on Lab 1: React Component Hierarchy and State Flow', 'Implement a responsive course dashboard layout with dynamic data binding and active route navigation.', $8::timestamptz, 50, 'published'),
        ($9, NULL, 'Transaction Isolation and Concurrency Benchmark', 'Write an automated SQL transaction script testing concurrent enrollments with SERIALIZABLE vs READ COMMITTED isolation.', $10::timestamptz, 100, 'published')
      RETURNING id, title;
    `, [c1Id, mod1Id, dueDate1, mod2Id, dueDate2, c2Id, mod4Id, dueDate3, c3Id, dueDate4]);
    console.log(`Inserted ${assignRes.rows.length} assignments.`);

    const a1Id = assignRes.rows[0].id;
    const a2Id = assignRes.rows[1].id;

    // 9. Insert Submissions
    await client.query(`
      INSERT INTO submissions (assignment_id, student_id, file_url, content, submitted_at, grade, feedback, graded_by, graded_at, status)
      VALUES 
        ($1, $2, '/uploads/submissions/riddhi_exp3_submission.pdf', 'Submitted complete UML class diagram with 10 entities, multiplicities, and relational database mappings.', NOW() - INTERVAL '1 day', 24.5, 'Outstanding work! Very clear notation, accurate multiplicities, and proper composition relationships.', $3, NOW() - INTERVAL '4 hours', 'graded'),
        ($4, $2, '/uploads/submissions/riddhi_exp4_submission.pdf', 'Submitted sequence diagram showing complete interaction flow between Student, Web Frontend, Express Server, and PostgreSQL database.', NOW() - INTERVAL '2 hours', NULL, NULL, NULL, NULL, 'submitted'),
        ($1, $5, NULL, 'Submitted text response with class breakdown and relationship schema.', NOW() - INTERVAL '6 hours', NULL, NULL, NULL, NULL, 'submitted');
    `, [a1Id, riddhiId, ashwitaId, a2Id, johnId]);
    console.log('Inserted sample submissions.');

    // 10. Insert Notifications
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, link, is_read)
      VALUES 
        ($1, 'Grade Released: Experiment 3 Class Diagram', 'Your submission for Experiment 3 was evaluated. Score: 24.5/25. Feedback: Outstanding work!', 'grade', '/student/assignments', false),
        ($1, 'Welcome to Advanced Software Engineering', 'You are actively enrolled in CS401. Check Module 1 for syllabus and lecture resources.', 'enrollment', '/student/courses/' || $2, true),
        ($3, 'New Submission Received', 'Student Riddhi Prabhudesai submitted Experiment 4: Sequence & Collaboration Diagram for grading.', 'assignment', '/instructor/courses/' || $2 || '/assignments/' || $4, false),
        ($3, 'New Submission Received', 'Student John Doe submitted Experiment 3: UML Class Diagram Design for grading.', 'assignment', '/instructor/courses/' || $2 || '/assignments/' || $5, false),
        ($6, 'New Assignment Published', 'Experiment 3: UML Class Diagram Design is now published with due date in 5 days.', 'assignment', '/student/assignments', false);
    `, [riddhiId, c1Id, ashwitaId, a2Id, a1Id, johnId]);
    console.log('Inserted notifications.');

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with demo data and bcrypt passwords!');
    console.log('Demo Credentials:');
    console.log(' - Instructor: ashwita.pawar@elms.edu / password123');
    console.log(' - Student:    riddhi@elms.edu / password123');
    console.log(' - Student:    john.doe@elms.edu / password123');
    console.log(' - Admin:      admin@elms.edu / password123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
