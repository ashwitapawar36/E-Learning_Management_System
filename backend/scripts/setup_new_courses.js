const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// 1. Generate SVG banners
const bannersDir = path.resolve(__dirname, '../../frontend/public/course-banners');
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}

const svgBanners = {
  'aisc.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="blue-diamonds" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="30" height="30" fill="#1565c0" />
      <rect x="30" width="30" height="30" fill="#1976d2" />
      <rect y="30" width="30" height="30" fill="#2196f3" />
      <rect x="30" y="30" width="30" height="30" fill="#0d47a1" />
    </pattern>
    <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d47a1" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#1e88e5" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#42a5f5" stop-opacity="0.85" />
    </linearGradient>
  </defs>
  <rect width="800" height="260" fill="#1565c0" />
  <rect width="800" height="260" fill="url(#blue-diamonds)" opacity="0.65" />
  <rect width="800" height="260" fill="url(#blue-grad)" opacity="0.45" />
</svg>`,

  'c2-dc.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="purple-diamonds" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="30" height="30" fill="#7e57c2" />
      <rect x="30" width="30" height="30" fill="#9575cd" />
      <rect y="30" width="30" height="30" fill="#b39ddb" />
      <rect x="30" y="30" width="30" height="30" fill="#5e35b1" />
    </pattern>
    <linearGradient id="purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#512da8" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#d1c4e9" stop-opacity="0.55" />
    </linearGradient>
  </defs>
  <rect width="800" height="260" fill="#673ab7" />
  <rect width="800" height="260" fill="url(#purple-diamonds)" opacity="0.8" />
  <rect width="800" height="260" fill="url(#purple-grad)" opacity="0.4" />
</svg>`,

  'coa-lab.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="green-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="#00897b" />
      <rect width="20" height="40" fill="#00796b" opacity="0.7" />
      <rect width="40" height="20" fill="#26a69a" opacity="0.65" />
      <rect width="20" height="20" fill="#4db6ac" opacity="0.55" />
    </pattern>
    <linearGradient id="green-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#004d40" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#80cbc4" stop-opacity="0.25" />
    </linearGradient>
  </defs>
  <rect width="800" height="260" fill="#00897b" />
  <rect width="800" height="260" fill="url(#green-grid)" />
  <rect width="800" height="260" fill="url(#green-grad)" />
</svg>`,

  'crypto.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="grey-circles" width="120" height="120" patternUnits="userSpaceOnUse">
      <circle cx="60" cy="60" r="50" fill="none" stroke="#b0bec5" stroke-width="14" opacity="0.65" />
      <circle cx="0" cy="0" r="50" fill="none" stroke="#cfd8dc" stroke-width="14" opacity="0.5" />
      <circle cx="120" cy="0" r="50" fill="none" stroke="#cfd8dc" stroke-width="14" opacity="0.5" />
      <circle cx="0" cy="120" r="50" fill="none" stroke="#cfd8dc" stroke-width="14" opacity="0.5" />
      <circle cx="120" cy="120" r="50" fill="none" stroke="#cfd8dc" stroke-width="14" opacity="0.5" />
    </pattern>
  </defs>
  <rect width="800" height="260" fill="#eceff1" />
  <rect width="800" height="260" fill="url(#grey-circles)" />
</svg>`,

  'daa.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <rect width="800" height="260" fill="#e2e8f0" />
  <path d="M-50,60 C150,140 300,-20 500,60 C700,140 850,20 950,60" fill="none" stroke="#ffffff" stroke-width="38" opacity="0.85" />
  <path d="M-50,110 C150,190 300,30 500,110 C700,190 850,70 950,110" fill="none" stroke="#cbd5e1" stroke-width="32" opacity="0.65" />
  <path d="M-50,160 C150,240 300,80 500,160 C700,240 850,120 950,160" fill="none" stroke="#ffffff" stroke-width="38" opacity="0.8" />
  <path d="M-50,210 C150,290 300,130 500,210 C700,290 850,170 950,210" fill="none" stroke="#cbd5e1" stroke-width="32" opacity="0.5" />
</svg>`,

  'data-structures.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="indigo-triangles" width="80" height="80" patternUnits="userSpaceOnUse">
      <polygon points="0,0 80,0 40,40" fill="#3f51b5" />
      <polygon points="0,0 40,40 0,80" fill="#303f9f" />
      <polygon points="80,0 80,80 40,40" fill="#5c6bc0" />
      <polygon points="0,80 80,80 40,40" fill="#7986cb" />
    </pattern>
    <linearGradient id="indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#283593" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#5c6bc0" stop-opacity="0.6" />
    </linearGradient>
  </defs>
  <rect width="800" height="260" fill="#3949ab" />
  <rect width="800" height="260" fill="url(#indigo-triangles)" opacity="0.85" />
  <rect width="800" height="260" fill="url(#indigo-grad)" opacity="0.4" />
</svg>`,

  'dbms.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="dbms-rings" width="140" height="140" patternUnits="userSpaceOnUse">
      <circle cx="70" cy="70" r="55" fill="none" stroke="#90a4ae" stroke-width="16" opacity="0.65" />
      <circle cx="0" cy="0" r="55" fill="none" stroke="#b0bec5" stroke-width="16" opacity="0.5" />
      <circle cx="140" cy="0" r="55" fill="none" stroke="#b0bec5" stroke-width="16" opacity="0.5" />
      <circle cx="0" cy="140" r="55" fill="none" stroke="#b0bec5" stroke-width="16" opacity="0.5" />
      <circle cx="140" cy="140" r="55" fill="none" stroke="#b0bec5" stroke-width="16" opacity="0.5" />
    </pattern>
  </defs>
  <rect width="800" height="260" fill="#eceff1" />
  <rect width="800" height="260" fill="url(#dbms-rings)" />
</svg>`,

  'dc-te.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="blue-hex" width="56" height="96" patternUnits="userSpaceOnUse">
      <polygon points="28,0 56,16 56,48 28,64 0,48 0,16" fill="#42a5f5" opacity="0.85" />
      <polygon points="28,48 56,64 56,96 28,112 0,96 0,64" fill="#1e88e5" opacity="0.9" />
      <polygon points="56,24 84,40 84,72 56,88 28,72 28,40" fill="#64b5f6" opacity="0.8" />
    </pattern>
    <linearGradient id="dc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1565c0" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#90caf9" stop-opacity="0.3" />
    </linearGradient>
  </defs>
  <rect width="800" height="260" fill="#2196f3" />
  <rect width="800" height="260" fill="url(#blue-hex)" />
  <rect width="800" height="260" fill="url(#dc-grad)" />
</svg>`,

  'digital-systems.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="gold-triangles" width="80" height="80" patternUnits="userSpaceOnUse">
      <polygon points="0,0 80,0 40,40" fill="#ffb300" />
      <polygon points="0,0 40,40 0,80" fill="#ffa000" />
      <polygon points="80,0 80,80 40,40" fill="#ffc107" />
      <polygon points="0,80 80,80 40,40" fill="#ffd54f" />
    </pattern>
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff8f00" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#ffe082" stop-opacity="0.4" />
    </linearGradient>
  </defs>
  <rect width="800" height="260" fill="#ffb300" />
  <rect width="800" height="260" fill="url(#gold-triangles)" opacity="0.9" />
  <rect width="800" height="260" fill="url(#gold-grad)" />
</svg>`,

  'do-not-use.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="teal-triangles" width="80" height="80" patternUnits="userSpaceOnUse">
      <polygon points="0,0 80,0 40,40" fill="#26a69a" />
      <polygon points="0,0 40,40 0,80" fill="#00897b" />
      <polygon points="80,0 80,80 40,40" fill="#4db6ac" />
      <polygon points="0,80 80,80 40,40" fill="#80cbc4" />
    </pattern>
  </defs>
  <rect width="800" height="260" fill="#009688" />
  <rect width="800" height="260" fill="url(#teal-triangles)" opacity="0.9" />
</svg>`,

  'hsm-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="purple-tiles" width="70" height="70" patternUnits="userSpaceOnUse">
      <rect width="66" height="66" x="2" y="2" fill="none" stroke="#7e57c2" stroke-width="4" opacity="0.6" />
      <rect width="46" height="46" x="12" y="12" fill="none" stroke="#9575cd" stroke-width="4" opacity="0.7" />
      <rect width="26" height="26" x="22" y="22" fill="#5e35b1" opacity="0.5" />
    </pattern>
  </defs>
  <rect width="800" height="260" fill="#673ab7" />
  <rect width="800" height="260" fill="url(#purple-tiles)" />
</svg>`,

  'hsm-2.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" height="100%">
  <defs>
    <pattern id="slate-circles" width="120" height="120" patternUnits="userSpaceOnUse">
      <circle cx="60" cy="60" r="50" fill="none" stroke="#78909c" stroke-width="14" opacity="0.65" />
      <circle cx="0" cy="0" r="50" fill="none" stroke="#90a4ae" stroke-width="14" opacity="0.5" />
      <circle cx="120" cy="0" r="50" fill="none" stroke="#90a4ae" stroke-width="14" opacity="0.5" />
      <circle cx="0" cy="120" r="50" fill="none" stroke="#90a4ae" stroke-width="14" opacity="0.5" />
      <circle cx="120" cy="120" r="50" fill="none" stroke="#90a4ae" stroke-width="14" opacity="0.5" />
    </pattern>
  </defs>
  <rect width="800" height="260" fill="#b0bec5" />
  <rect width="800" height="260" fill="url(#slate-circles)" />
</svg>`
};

for (const [filename, content] of Object.entries(svgBanners)) {
  fs.writeFileSync(path.join(bannersDir, filename), content.trim());
}
console.log('Successfully written 12 SVG course banners to frontend/public/course-banners/');

// 2. Database update
async function updateCourses() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove courses with long numbers or test courses
    const deleteRes = await client.query(`
      DELETE FROM courses 
      WHERE title ~ '[0-9]{8,}' 
         OR title ILIKE '%Moodle Progress Verification%'
      RETURNING id, title;
    `);
    console.log(`Deleted ${deleteRes.rowCount} test/temporary courses:`, deleteRes.rows.map(r => r.title));

    // Password hash for instructors
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // List of instructors from the screenshot
    const instructorsData = [
      { name: 'Prof. Jyoti Ramteke', email: 'jyoti.ramteke@elms.edu' },
      { name: 'Prof. Prathmesh Lokhande', email: 'prathmesh.lokhande@elms.edu' },
      { name: 'Prof. Yogita Patil', email: 'yogita.patil@elms.edu' },
      { name: 'Prof. Abhijeet Salunke', email: 'abhijeet.salunke@elms.edu' },
      { name: 'Prof. Prasenjit Bhavathankar', email: 'prasenjit.bhavathankar@elms.edu' },
      { name: 'Prof. Anand Godbole', email: 'anand.godbole@elms.edu' },
      { name: 'Prof. Jotsna Bhagat', email: 'jotsna.bhagat@elms.edu' },
      { name: 'Prof. Narendra Bhagat', email: 'narendra.bhagat@elms.edu' },
      { name: 'Dr. Y. S. Rao', email: 'ys.rao@elms.edu' }
    ];

    const instructorMap = {};
    for (const inst of instructorsData) {
      const res = await client.query(`
        INSERT INTO users (name, email, password_hash, role, bio)
        VALUES ($1, $2, $3, 'instructor', 'Faculty member teaching curriculum modules at ELMS.')
        ON CONFLICT (email) DO UPDATE 
        SET name = EXCLUDED.name, role = 'instructor'
        RETURNING id, name;
      `, [inst.name, inst.email, passwordHash]);
      instructorMap[inst.name] = res.rows[0].id;
    }
    console.log('Upserted instructors successfully.');

    // 12 courses from the screenshot
    const coursesToAdd = [
      {
        title: 'AISC-TECOMP-ODD-26-27',
        description: 'Artificial Intelligence and Soft Computing for Third Year Computer Engineering (Odd Semester 2026-27). Fuzzy logic, neural networks, genetic algorithms, and evolutionary computation.',
        instructor: 'Prof. Jyoti Ramteke',
        category: 'Computer Science',
        thumbnail_url: '/course-banners/aisc.svg',
        requires_enrollment_key: true,
        enrollment_key: 'AISC2026',
        modules: [
          {
            title: 'Module 1: Introduction to Soft Computing & Fuzzy Logic',
            description: 'Fuzzy sets, membership functions, fuzzy relations, defuzzification methods, and rule-based systems.',
            materials: [
              { title: 'Syllabus and Course Plan: AISC 2026-27', type: 'text', content: 'Course outcomes, credit structure, recommended textbooks, and evaluation scheme for AISC-TECOMP.' },
              { title: 'Lecture Notes: Classical Sets vs Fuzzy Sets', type: 'text', content: 'Comprehensive comparison between crisp boolean sets and continuous fuzzy membership functions with mathematical proofs.' },
              { title: 'Fuzzy Inference Systems Guide (Mamdani & Sugeno)', type: 'file', file_url: '/course-banners/aisc.svg' }
            ],
            assignments: [
              { title: 'Lab Assignment 1: Fuzzy Temperature Controller Simulation', description: 'Design and implement a fuzzy logic controller in Python/MATLAB with 3 inputs and 1 output rule base.', points: 20 }
            ]
          },
          {
            title: 'Module 2: Artificial Neural Networks (ANN)',
            description: 'Perceptrons, multi-layer feedforward networks, backpropagation algorithms, and gradient descent optimization.',
            materials: [
              { title: 'Backpropagation Algorithm Derivation', type: 'text', content: 'Step-by-step calculus derivation of error backpropagation weights adjustment and learning rates.' }
            ],
            assignments: [
              { title: 'Lab Assignment 2: Multi-layer Perceptron from Scratch', description: 'Implement forward pass and backpropagation without deep learning frameworks.', points: 25 }
            ]
          }
        ]
      },
      {
        title: 'C2-DC-TE-LAB-2026-27',
        description: 'Distributed Computing Laboratory for Third Year Computer Engineering (Academic Year 2026-27). Socket programming, RPC, RMI, distributed algorithms, and consensus.',
        instructor: 'Prof. Prathmesh Lokhande',
        category: 'Computer Engineering',
        thumbnail_url: '/course-banners/c2-dc.svg',
        requires_enrollment_key: true,
        enrollment_key: 'DCLAB26',
        modules: [
          {
            title: 'Module 1: Inter-Process Communication & Remote Procedure Calls',
            description: 'Client-server socket architectures, protocol buffers, gRPC, and Java RMI implementation.',
            materials: [
              { title: 'Lab Manual: Distributed Computing Lab Experiments', type: 'text', content: 'Instructions for experiments 1 through 8, submission formatting, and code evaluation rubrics.' },
              { title: 'Java RMI Registry Setup & Security Policy Guide', type: 'text', content: 'Configuring rmiregistry, defining remote interfaces, stubs, and passing remote objects across networks.' }
            ],
            assignments: [
              { title: 'Experiment 1: Distributed Calculator using Java RMI', description: 'Implement an arithmetic evaluation server with concurrent client connections and exception handling.', points: 15 }
            ]
          }
        ]
      },
      {
        title: 'COA Lab 2025-26',
        description: 'Computer Organization and Architecture Laboratory. Assembly language programming, ALU design, memory hierarchy, cache simulation, and pipelining.',
        instructor: 'Prof. Yogita Patil',
        category: 'Computer Engineering',
        thumbnail_url: '/course-banners/coa-lab.svg',
        requires_enrollment_key: true,
        enrollment_key: 'COALAB25',
        modules: [
          {
            title: 'Module 1: 8086 Assembly & Microprocessor Instructions',
            description: 'Register sets, arithmetic instructions, string manipulation, and interrupts.',
            materials: [
              { title: '8086 Instruction Set Reference Manual', type: 'text', content: 'Detailed register table: AX, BX, CX, DX, SI, DI, BP, SP and flag register modifications.' }
            ],
            assignments: [
              { title: 'Assignment 1: Array Sorting in 8086 Assembly (MASM/TASM)', description: 'Write an assembly program to sort an array of 16-bit signed integers in ascending order.', points: 15 }
            ]
          }
        ]
      },
      {
        title: 'Cryptography and Network Security 2026-27',
        description: 'Modern cryptography, classical ciphers, DES, AES, RSA, Diffie-Hellman key exchange, digital signatures, hashing (SHA-256), and network security protocols.',
        instructor: 'Prof. Abhijeet Salunke',
        category: 'Cybersecurity',
        thumbnail_url: '/course-banners/crypto.svg',
        requires_enrollment_key: true,
        enrollment_key: 'CRYPTO26',
        modules: [
          {
            title: 'Module 1: Symmetric Key Ciphers & Block Encryption',
            description: 'Shannon secrecy, Feistel cipher structures, AES rounds, and Galois field mathematics.',
            materials: [
              { title: 'AES Encryption Algorithm: State Array & S-Box Transformations', type: 'text', content: 'Mathematical breakdown of SubBytes, ShiftRows, MixColumns, and AddRoundKey operations.' }
            ],
            assignments: [
              { title: 'Lab Assignment 1: AES-128 Implementation & Avalanche Effect Analysis', description: 'Compute ciphertext bit difference when flipping a single plaintext bit.', points: 20 }
            ]
          }
        ]
      },
      {
        title: 'DAA_26',
        description: 'Design and Analysis of Algorithms: Asymptotic notations, recurrence relations, divide-and-conquer, greedy techniques, dynamic programming, and NP-completeness.',
        instructor: 'Prof. Prasenjit Bhavathankar',
        category: 'Algorithms',
        thumbnail_url: '/course-banners/daa.svg',
        requires_enrollment_key: true,
        enrollment_key: 'DAA2026',
        modules: [
          {
            title: 'Module 1: Asymptotic Analysis & Divide-and-Conquer',
            description: 'Master theorem, recurrence trees, merge sort, quicksort, and median-of-medians.',
            materials: [
              { title: 'Master Theorem Summary and Proof Techniques', type: 'text', content: 'Cases 1, 2, and 3 of the Master Theorem with worked polynomial-bound verification examples.' }
            ],
            assignments: [
              { title: 'Practical 1: Strassen’s Matrix Multiplication vs Standard O(N^3)', description: 'Benchmark running times and crossover threshold for matrix sizes N=64 to 2048.', points: 20 }
            ]
          }
        ]
      },
      {
        title: 'Data Structures 2025-26 Div B Batch B , and C and D ...',
        description: 'Data Structures and Algorithms: Arrays, linked lists, stacks, queues, binary search trees, AVL trees, B-Trees, graphs, hashing, and sorting algorithms.',
        instructor: 'Prof. Anand Godbole',
        category: 'Computer Science',
        thumbnail_url: '/course-banners/data-structures.svg',
        requires_enrollment_key: true,
        enrollment_key: 'DS2026',
        modules: [
          {
            title: 'Module 1: Linear Data Structures & Applications',
            description: 'Dynamic arrays, singly and doubly linked lists, stack evaluation of infix/postfix expressions.',
            materials: [
              { title: 'Infix to Postfix Conversion using Stacks', type: 'text', content: 'Operator precedence, associativity tables, and step-by-step operand stack simulation.' }
            ],
            assignments: [
              { title: 'Lab Task 1: Doubly Linked List with Iterator Pattern in C++', description: 'Implement insertion, deletion, reversal, and circular linking operations.', points: 15 }
            ]
          }
        ]
      },
      {
        title: 'DBMS_SE_C Div_B Batch(2025-26)',
        description: 'Database Management Systems: Relational model, relational algebra, SQL DDL/DML, normalization (1NF to BCNF), transaction concurrency, and ACID properties.',
        instructor: 'Prof. Jotsna Bhagat',
        category: 'Database Systems',
        thumbnail_url: '/course-banners/dbms.svg',
        requires_enrollment_key: true,
        enrollment_key: 'DBMS2025',
        modules: [
          {
            title: 'Module 1: Relational Database Design & Normalization',
            description: 'Functional dependencies, Armstrong axioms, 3NF synthesis, and lossless join decomposition.',
            materials: [
              { title: 'Normal Forms Cheat Sheet: 1NF through BCNF', type: 'text', content: 'Canonical cover algorithm, candidate keys determination, and decomposition verification.' }
            ],
            assignments: [
              { title: 'Practical Exercise: Database Normalization Case Study', description: 'Normalize an unnormalized university ERP spreadsheet into BCNF tables with foreign key constraints.', points: 20 }
            ]
          }
        ]
      },
      {
        title: '★ DC-TE-2026-27',
        description: 'Distributed Computing Theory: Clocks, Lamport logical timestamps, vector clocks, mutual exclusion (Ricart-Agrawala), election algorithms (Bully/Ring), and Paxos consensus.',
        instructor: 'Prof. Prathmesh Lokhande',
        category: 'Computer Engineering',
        thumbnail_url: '/course-banners/dc-te.svg',
        requires_enrollment_key: true,
        enrollment_key: 'DCTE2026',
        modules: [
          {
            title: 'Module 1: Time, Global State & Mutual Exclusion in Distributed Systems',
            description: 'Physical clocks, NTP, Lamport logical clocks, vector timestamps, and message-ordering guarantees.',
            materials: [
              { title: 'Lamport Timestamps & Vector Clocks Deep Dive', type: 'text', content: 'Total ordering of events, concurrent event identification, and causal delivery invariants.' }
            ],
            assignments: [
              { title: 'Problem Set 1: Distributed Mutual Exclusion Simulation', description: 'Simulate Ricart-Agrawala algorithm with simulated node delays and token passing.', points: 25 }
            ]
          }
        ]
      },
      {
        title: 'Digital Systems 2024-25',
        description: 'Digital System Design: Boolean algebra, Karnaugh maps, Quine-McCluskey, combinational logic (multiplexers, decoders), flip-flops, synchronous state machines, and Verilog HDL.',
        instructor: 'Prof. Narendra Bhagat',
        category: 'Electronics',
        thumbnail_url: '/course-banners/digital-systems.svg',
        requires_enrollment_key: true,
        enrollment_key: 'DSYS2024',
        modules: [
          {
            title: 'Module 1: Combinational Logic & Optimization',
            description: 'K-map minimization with don\'t-care conditions, hazard-free circuit design, and multiplexer synthesis.',
            materials: [
              { title: 'Karnaugh Map Minimization Rules and Race Hazard Prevention', type: 'text', content: 'Grouping rules, essential prime implicants, and static-1 hazard elimination.' }
            ],
            assignments: [
              { title: 'Assignment 1: 4-bit Carry Lookahead Adder in Verilog', description: 'Write structural Verilog module and testbench simulating propagate/generate carry signals.', points: 20 }
            ]
          }
        ]
      },
      {
        title: 'Do not use',
        description: 'Archive course repository - strictly for internal administrative migration (Do not use).',
        instructor: 'Prof. Prathmesh Lokhande',
        category: 'General',
        thumbnail_url: '/course-banners/do-not-use.svg',
        requires_enrollment_key: true,
        enrollment_key: 'ARCHIVE',
        modules: [
          {
            title: 'Archive Notice',
            description: 'Administrative archive for deprecated course records.',
            materials: [
              { title: 'Administrative Notice: Archive Repository', type: 'text', content: 'This repository is kept for database migration historical records only. No student submissions are accepted.' }
            ],
            assignments: []
          }
        ]
      },
      {
        title: 'HSM-1 Law for Engineers (2025-26)',
        description: 'Humanities and Social Sciences: Legal framework for engineering contracts, Indian Contract Act 1872, Intellectual Property Rights (Patents, Trademarks, Copyrights), and cyber law.',
        instructor: 'Dr. Y. S. Rao',
        category: 'Humanities & Law',
        thumbnail_url: '/course-banners/hsm-1.svg',
        requires_enrollment_key: true,
        enrollment_key: 'HSM1LAW',
        modules: [
          {
            title: 'Module 1: Engineering Contracts & Tender Documentation',
            description: 'Essentials of valid contracts, breach of contract, damages, arbitration, and government tendering procedures.',
            materials: [
              { title: 'Indian Contract Act: Section 10 Essentials of Valid Agreements', type: 'text', content: 'Free consent, consideration, lawful object, competency of parties, and void vs voidable agreements.' }
            ],
            assignments: [
              { title: 'Case Study Analysis: Engineering Construction Contract Disputes', description: 'Analyze liquidated damages vs penalty clauses based on Supreme Court precedents.', points: 20 }
            ]
          }
        ]
      },
      {
        title: 'HSM-II – Law for Engineers-II 2025-2026',
        description: 'Humanities and Social Sciences Part II: Corporate law, environmental protection acts, labor welfare laws, consumer protection act 2019, arbitration and ADR mechanisms.',
        instructor: 'Dr. Y. S. Rao',
        category: 'Humanities & Law',
        thumbnail_url: '/course-banners/hsm-2.svg',
        requires_enrollment_key: true,
        enrollment_key: 'HSM2LAW',
        modules: [
          {
            title: 'Module 1: Intellectual Property Rights & Patent Filing',
            description: 'Patentability criteria: novelty, non-obviousness, industrial applicability, prior art search, and patent claims drafting.',
            materials: [
              { title: 'Patent Drafting Guidelines: Provisional vs Complete Specifications', type: 'text', content: 'Step-by-step structure of patent claims: independent claims, dependent claims, and drawing sheets.' }
            ],
            assignments: [
              { title: 'Assignment 1: Prior Art Search Report for Software Inventions', description: 'Conduct a Google Patents / USPTO prior art search and draft patent claims for an engineering invention.', points: 20 }
            ]
          }
        ]
      }
    ];

    // Find student IDs to pre-enroll
    const studentsRes = await client.query(`
      SELECT id, name, email FROM users WHERE role = 'student' ORDER BY id ASC;
    `);
    const studentIds = studentsRes.rows.map(s => s.id);

    for (const c of coursesToAdd) {
      const instId = instructorMap[c.instructor];
      if (!instId) {
        console.warn(`Instructor not found for ${c.instructor}`);
        continue;
      }

      // Check if course already exists by title
      const existingRes = await client.query('SELECT id FROM courses WHERE title = $1', [c.title]);
      let courseId;

      if (existingRes.rows.length > 0) {
        courseId = existingRes.rows[0].id;
        await client.query(`
          UPDATE courses 
          SET description = $1, instructor_id = $2, category = $3, thumbnail_url = $4,
              requires_enrollment_key = $5, enrollment_key = $6, status = 'published'
          WHERE id = $7
        `, [c.description, instId, c.category, c.thumbnail_url, c.requires_enrollment_key, c.enrollment_key, courseId]);
      } else {
        const insertRes = await client.query(`
          INSERT INTO courses (title, description, instructor_id, category, thumbnail_url, status, requires_enrollment_key, enrollment_key, max_capacity, enrollment_deadline)
          VALUES ($1, $2, $3, $4, $5, 'published', $6, $7, 60, CURRENT_TIMESTAMP + INTERVAL '90 days')
          RETURNING id;
        `, [c.title, c.description, instId, c.category, c.thumbnail_url, c.requires_enrollment_key, c.enrollment_key]);
        courseId = insertRes.rows[0].id;
      }

      // Insert modules, materials, assignments if new or empty
      const modCheck = await client.query('SELECT id FROM modules WHERE course_id = $1', [courseId]);
      if (modCheck.rows.length === 0 && c.modules) {
        let mIdx = 1;
        for (const m of c.modules) {
          const modRes = await client.query(`
            INSERT INTO modules (course_id, title, description, order_index)
            VALUES ($1, $2, $3, $4)
            RETURNING id;
          `, [courseId, m.title, m.description, mIdx++]);
          const moduleId = modRes.rows[0].id;

          let matIdx = 1;
          for (const mat of (m.materials || [])) {
            await client.query(`
              INSERT INTO course_materials (module_id, title, material_type, file_url, content, order_index)
              VALUES ($1, $2, $3, $4, $5, $6);
            `, [moduleId, mat.title, mat.type, mat.file_url || null, mat.content || null, matIdx++]);
          }

          for (const a of (m.assignments || [])) {
            const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
            await client.query(`
              INSERT INTO assignments (course_id, module_id, title, description, due_date, max_points, status)
              VALUES ($1, $2, $3, $4, $5, $6, 'published');
            `, [courseId, moduleId, a.title, a.description, dueDate, a.points]);
          }
        }
      }

      // Enroll students in first few courses for active testing
      if (studentIds.length > 0) {
        for (const sId of studentIds) {
          await client.query(`
            INSERT INTO enrollments (student_id, course_id, status, progress_percentage)
            VALUES ($1, $2, 'active', 25)
            ON CONFLICT (student_id, course_id) DO NOTHING;
          `, [sId, courseId]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('Successfully added all 12 courses from the screenshot!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating courses:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

updateCourses().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
