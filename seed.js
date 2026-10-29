const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const Course = require("./models/Course");
const User = require("./models/User");
const Registration = require("./models/Registration");

const seedCourses = [
  {
    courseId: "CS101",
    courseCode: "CS101",
    courseName: "Programming in C",
    semester: 1,
    facultyName: "Dr. Anita Rao",
    credits: 4,
    seatsAvailable: 58,
    totalSeats: 60,
    description: "Fundamentals of programming, control flow, functions, pointers and memory management.",
  },
  {
    courseId: "CS102",
    courseCode: "CS102",
    courseName: "Discrete Mathematics",
    semester: 2,
    facultyName: "Prof. Rahul Menon",
    credits: 3,
    seatsAvailable: 55,
    totalSeats: 60,
    description: "Logic, set theory, graph theory, combinatorics and relations for computation.",
  },
  {
    courseId: "CS201",
    courseCode: "CS201",
    courseName: "Data Structures & Algorithms",
    semester: 3,
    facultyName: "Dr. Meera Iyer",
    credits: 4,
    seatsAvailable: 59,
    totalSeats: 60,
    description: "Linked lists, stacks, queues, binary search trees, heaps, graph traversal and hashing.",
  },
  {
    courseId: "CS202",
    courseCode: "CS202",
    courseName: "Object Oriented Programming (Java)",
    semester: 3,
    facultyName: "Prof. Kiran Kumar",
    credits: 3,
    seatsAvailable: 50,
    totalSeats: 50,
    description: "Classes, polymorphism, inheritance, exception handling and design patterns.",
  },
  {
    courseId: "CS301",
    courseCode: "CS301",
    courseName: "Database Management Systems",
    semester: 4,
    facultyName: "Dr. Sunita Sharma",
    credits: 4,
    seatsAvailable: 44,
    totalSeats: 45,
    description: "Relational algebra, SQL, normal forms, indexing, ACID transactions and NoSQL MongoDB.",
  },
  {
    courseId: "CS302",
    courseCode: "CS302",
    courseName: "Operating Systems",
    semester: 4,
    facultyName: "Prof. Vikram Singh",
    credits: 3,
    seatsAvailable: 50,
    totalSeats: 50,
    description: "Process scheduling, thread synchronization, deadlocks, paging and virtual memory.",
  },
  {
    courseId: "CS303",
    courseCode: "CS303",
    courseName: "Computer Networks",
    semester: 5,
    facultyName: "Dr. Neha Gupta",
    credits: 3,
    seatsAvailable: 40,
    totalSeats: 40,
    description: "OSI architecture, TCP/UDP sockets, routing algorithms, DNS, HTTP and network security.",
  },
  {
    courseId: "CS401",
    courseCode: "CS401",
    courseName: "Full Stack Web Technologies (MERN)",
    semester: 5,
    facultyName: "Prof. Arjun Reddy",
    credits: 4,
    seatsAvailable: 39,
    totalSeats: 40,
    description: "Building production full-stack web applications with React, Express and MongoDB.",
  },
  {
    courseId: "CS402",
    courseCode: "CS402",
    courseName: "Machine Learning & AI",
    semester: 6,
    facultyName: "Dr. Priya Nair",
    credits: 4,
    seatsAvailable: 35,
    totalSeats: 35,
    description: "Supervised & unsupervised learning, regression, classification, clustering and neural networks.",
  },
  {
    courseId: "CS403",
    courseCode: "CS403",
    courseName: "Cloud Computing & DevOps",
    semester: 6,
    facultyName: "Prof. Sanjay Patel",
    credits: 3,
    seatsAvailable: 30,
    totalSeats: 30,
    description: "Cloud infrastructure, Docker containers, Kubernetes, CI/CD pipelines and AWS/GCP basics.",
  },
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI not specified in .env");
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // 1. Seed Courses
    for (const c of seedCourses) {
      await Course.findOneAndUpdate({ courseCode: c.courseCode }, c, { upsert: true, new: true });
    }
    console.log(`Seeded ${seedCourses.length} courses.`);

    // 2. Seed Default Admin
    const adminEmail = "admin@abc.edu";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        userId: "ADM2025001",
        name: "Admin Officer",
        email: adminEmail,
        password: "admin123",
        role: "admin",
        department: "Academic Affairs",
        semester: 1,
        phone: "+91 98765 43210",
      });
      console.log("Created Admin account: admin@abc.edu / admin123");
    } else {
      admin.role = "admin";
      await admin.save();
    }

    // 3. Seed Sample Student
    const studentEmail = "student@abc.edu";
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      student = await User.create({
        userId: "STU2025101",
        name: "Aarav Sharma",
        email: studentEmail,
        password: "student123",
        role: "student",
        department: "Computer Science",
        semester: 5,
        phone: "+91 91234 56789",
      });
      console.log("Created Sample Student account: student@abc.edu / student123");
    }

    // 4. Seed another student for admin report demo
    const student2Email = "ananya@abc.edu";
    let student2 = await User.findOne({ email: student2Email });
    if (!student2) {
      student2 = await User.create({
        userId: "STU2025102",
        name: "Ananya Patel",
        email: student2Email,
        password: "student123",
        role: "student",
        department: "Information Technology",
        semester: 3,
        phone: "+91 99887 66554",
      });
      console.log("Created Sample Student 2: ananya@abc.edu / student123");
    }

    // 5. Seed initial registrations
    const mernCourse = await Course.findOne({ courseCode: "CS401" });
    const dsaCourse = await Course.findOne({ courseCode: "CS201" });
    const cCourse = await Course.findOne({ courseCode: "CS101" });

    if (student && mernCourse) {
      const reg1 = await Registration.findOne({ studentId: student._id, courseId: mernCourse._id });
      if (!reg1) {
        await Registration.create({
          registrationId: "REG-2025001",
          studentId: student._id,
          courseId: mernCourse._id,
          approvalStatus: "Approved",
          registrationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          adminComments: "Pre-requisite criteria verified.",
        });
      }
    }

    if (student && cCourse) {
      const reg2 = await Registration.findOne({ studentId: student._id, courseId: cCourse._id });
      if (!reg2) {
        await Registration.create({
          registrationId: "REG-2025002",
          studentId: student._id,
          courseId: cCourse._id,
          approvalStatus: "Pending",
          registrationDate: new Date(),
        });
      }
    }

    if (student2 && dsaCourse) {
      const reg3 = await Registration.findOne({ studentId: student2._id, courseId: dsaCourse._id });
      if (!reg3) {
        await Registration.create({
          registrationId: "REG-2025003",
          studentId: student2._id,
          courseId: dsaCourse._id,
          approvalStatus: "Pending",
          registrationDate: new Date(),
        });
      }
    }

    console.log("Seeding finished successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
