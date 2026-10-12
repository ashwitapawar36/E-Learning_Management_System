-- =============================================================================
-- E-Learning Management System (ELMS) Demo Seed Data
-- Database: PostgreSQL
-- Author: Ashwita Pawar & Riddhi Prabhudesai
-- Note: Default password for all users is: password123
-- Pre-computed bcrypt hash: $2a$10$wT0lGzO6Pj7pL1V5DkU7U.wO4yYmE6rWk9e7Mv4Z3vQ4tL9sYmE6a
-- =============================================================================

BEGIN;

-- Clean existing records
TRUNCATE notifications, submissions, assignments, course_materials, 
         modules, enrollments, courses, users RESTART IDENTITY CASCADE;

-- Insert Users
INSERT INTO users (id, name, email, password_hash, role, bio) VALUES
(1, 'Dr. Ashwita Pawar', 'ashwita.pawar@elms.edu', '$2a$10$VvQv52b61bXoQ1C9t0tIu.uG8h0Z071Z9W7Qj1B1M7H5C1D2E3F4G', 'instructor', 'Professor of Computer Science & Software Engineering specialist.'),
(2, 'Prof. Alan Turing', 'alan.turing@elms.edu', '$2a$10$VvQv52b61bXoQ1C9t0tIu.uG8h0Z071Z9W7Qj1B1M7H5C1D2E3F4G', 'instructor', 'Chair of Systems and Database Architecture.'),
(3, 'Riddhi Prabhudesai', 'riddhi@elms.edu', '$2a$10$VvQv52b61bXoQ1C9t0tIu.uG8h0Z071Z9W7Qj1B1M7H5C1D2E3F4G', 'student', 'Undergraduate Engineering Student (Class C).'),
(4, 'John Doe', 'john.doe@elms.edu', '$2a$10$VvQv52b61bXoQ1C9t0tIu.uG8h0Z071Z9W7Qj1B1M7H5C1D2E3F4G', 'student', 'Junior Computer Science Major interested in Full Stack.'),
(5, 'Jane Smith', 'jane.smith@elms.edu', '$2a$10$VvQv52b61bXoQ1C9t0tIu.uG8h0Z071Z9W7Qj1B1M7H5C1D2E3F4G', 'student', 'Senior Data Engineering and Web Tech student.'),
(6, 'System Admin', 'admin@elms.edu', '$2a$10$VvQv52b61bXoQ1C9t0tIu.uG8h0Z071Z9W7Qj1B1M7H5C1D2E3F4G', 'admin', 'ELMS Platform Operations Administrator.');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Insert Courses
INSERT INTO courses (id, title, description, instructor_id, category, status, thumbnail_url) VALUES
(1, 'Advanced Software Engineering & System Design', 'Comprehensive study of object-oriented modeling, UML design patterns, architectural trade-offs, and scalable enterprise systems.', 1, 'Software Engineering', 'published', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'),
(2, 'Full-Stack Web Engineering with React and Node.js', 'Production-grade full stack engineering using React 18, Express, connection pooling with PostgreSQL, and modern Tailwind UI.', 1, 'Web Development', 'published', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'),
(3, 'Database Systems & SQL Transaction Management', 'Relational algebra, query optimization, PostgreSQL execution plans, and ACID transaction isolation mechanics.', 2, 'Database Systems', 'published', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80'),
(4, 'Cloud Native DevOps and Microservices', 'Docker containerization, Kubernetes orchestration, CI/CD pipelines, and cloud deployment fundamentals.', 2, 'DevOps & Cloud', 'draft', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80');

SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));

-- Insert Enrollments
INSERT INTO enrollments (id, student_id, course_id, status, progress_percentage) VALUES
(1, 3, 1, 'active', 65),
(2, 3, 2, 'active', 20),
(3, 4, 1, 'active', 40),
(4, 4, 3, 'active', 85),
(5, 5, 2, 'active', 15);

SELECT setval('enrollments_id_seq', (SELECT MAX(id) FROM enrollments));

-- Insert Modules
INSERT INTO modules (id, course_id, title, description, order_index) VALUES
(1, 1, 'Module 1: UML Structural Modeling', 'Class diagrams, multiplicities, aggregation vs composition, and domain modeling.', 1),
(2, 1, 'Module 2: UML Dynamic Behavioral Modeling', 'Sequence diagrams, lifelines, activation bars, and collaboration diagrams.', 2),
(3, 1, 'Module 3: Enterprise Architecture & REST Design', 'Layered architecture: controllers, services, database connection pooling.', 3),
(4, 2, 'Module 1: React 18, Vite & Tailwind CSS', 'Modern component state, declarative routing, and utility CSS frameworks.', 1),
(5, 2, 'Module 2: Express.js Backend & Direct PostgreSQL Integration', 'Parameterized queries, connection pooling, and token authorization.', 2),
(6, 3, 'Module 1: Relational Schemas & Integrity Constraints', 'Primary keys, foreign keys, unique indexes, and schema definitions.', 1),
(7, 3, 'Module 2: Concurrency & Transaction Management', 'ACID properties, row locking, deadlocks, and isolation levels.', 2);

SELECT setval('modules_id_seq', (SELECT MAX(id) FROM modules));

-- Insert Course Materials
INSERT INTO course_materials (id, module_id, title, material_type, file_url, content, order_index) VALUES
(1, 1, 'Experiment 3 Lab Guide: UML Class Diagrams', 'file', '/uploads/demo-docs/exp3_guide.pdf', 'Complete lab guidelines for identifying classes, attributes, methods, and relationship multiplicity.', 1),
(2, 1, 'Aggregation vs Composition in Software Architecture', 'text', NULL, 'In UML, Aggregation (white diamond) is a weak has-a relationship where child objects can exist independently. Composition (filled diamond) is a strong part-of relationship where child lifecycle is bounded by the parent container.', 2),
(3, 1, 'Interactive Video: Reverse Engineering Database to UML', 'video', 'https://www.youtube.com/watch?v=UI6lqHOVHic', 'Video breakdown of entity relationship diagrams and translation to object-oriented class diagrams.', 3),
(4, 2, 'Experiment 4 Lab Guide: Sequence & Collaboration Diagrams', 'file', '/uploads/demo-docs/exp4_guide.pdf', 'Detailed stimulus-response sequence diagrams, asynchronous messaging, and lifelines.', 1),
(5, 2, 'Sequence Diagram Walkthrough for E-LMS', 'text', NULL, 'Walkthrough of lifelines: Student, E-LMS Web Client, Express Server, PostgreSQL DB, Notification Dispatcher.', 2),
(6, 4, 'Vite & Tailwind CSS Quickstart Cheat Sheet', 'text', NULL, 'Comprehensive reference sheet for configuring Tailwind typography, flexbox/grid layouts, and responsive cards.', 1),
(7, 5, 'PostgreSQL Connection Pooling with node-postgres (pg)', 'link', 'https://node-postgres.com/features/pooling', 'Official documentation for pg.Pool, client checkout, parameterized queries, and transactions.', 1);

SELECT setval('course_materials_id_seq', (SELECT MAX(id) FROM course_materials));

-- Insert Assignments
INSERT INTO assignments (id, course_id, module_id, title, description, due_date, max_points, status) VALUES
(1, 1, 1, 'Experiment 3: UML Class Diagram Design', 'Design and submit a comprehensive UML Class Diagram for the E-Learning Management System identifying all major entities, attributes, methods, and multiplicity relationships.', CURRENT_TIMESTAMP + INTERVAL '5 days', 25, 'published'),
(2, 1, 2, 'Experiment 4: Sequence & Collaboration Diagram', 'Model the dynamic interaction sequences for Course Enrollment and Assignment Submission workflows including system lifelines and return messages.', CURRENT_TIMESTAMP + INTERVAL '12 days', 25, 'published'),
(3, 2, 4, 'Hands-on Lab 1: React Component Hierarchy and State Flow', 'Implement a responsive course dashboard layout with dynamic data binding and active route navigation.', CURRENT_TIMESTAMP + INTERVAL '7 days', 50, 'published'),
(4, 3, NULL, 'Transaction Isolation and Concurrency Benchmark', 'Write an automated SQL transaction script testing concurrent enrollments with SERIALIZABLE vs READ COMMITTED isolation.', CURRENT_TIMESTAMP + INTERVAL '3 days', 100, 'published');

SELECT setval('assignments_id_seq', (SELECT MAX(id) FROM assignments));

-- Insert Submissions
INSERT INTO submissions (id, assignment_id, student_id, file_url, content, submitted_at, grade, feedback, graded_by, graded_at, status) VALUES
(1, 1, 3, '/uploads/submissions/riddhi_exp3_submission.pdf', 'Submitted complete UML class diagram with 10 entities, multiplicities, and relational database mappings.', CURRENT_TIMESTAMP - INTERVAL '1 day', 24.5, 'Outstanding work! Very clear notation, accurate multiplicities, and proper composition relationships.', 1, CURRENT_TIMESTAMP - INTERVAL '4 hours', 'graded'),
(2, 2, 3, '/uploads/submissions/riddhi_exp4_submission.pdf', 'Submitted sequence diagram showing complete interaction flow between Student, Web Frontend, Express Server, and PostgreSQL database.', CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL, NULL, NULL, NULL, 'submitted'),
(3, 1, 4, NULL, 'Submitted text response with class breakdown and relationship schema.', CURRENT_TIMESTAMP - INTERVAL '6 hours', NULL, NULL, NULL, NULL, 'submitted');

SELECT setval('submissions_id_seq', (SELECT MAX(id) FROM submissions));

-- Insert Notifications
INSERT INTO notifications (id, user_id, title, message, type, link, is_read) VALUES
(1, 3, 'Grade Released: Experiment 3 Class Diagram', 'Your submission for Experiment 3 was evaluated. Score: 24.5/25. Feedback: Outstanding work!', 'grade', '/student/assignments', false),
(2, 3, 'Welcome to Advanced Software Engineering', 'You are actively enrolled in CS401. Check Module 1 for syllabus and lecture resources.', 'enrollment', '/student/courses/1', true),
(3, 1, 'New Submission Received', 'Student Riddhi Prabhudesai submitted Experiment 4: Sequence & Collaboration Diagram for grading.', 'assignment', '/instructor/courses/1/assignments/2', false),
(4, 1, 'New Submission Received', 'Student John Doe submitted Experiment 3: UML Class Diagram Design for grading.', 'assignment', '/instructor/courses/1/assignments/1', false),
(5, 4, 'New Assignment Published', 'Experiment 3: UML Class Diagram Design is now published with due date in 5 days.', 'assignment', '/student/assignments', false);

SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));

COMMIT;
