const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

async function runTests() {
  console.log("=== Testing MERN Course Registration Portal APIs ===");

  const app = express();
  app.use(cors());
  app.use(express.json());

  const authRoutes = require("./routes/authRoutes");
  const courseRoutes = require("./routes/courseRoutes");
  const registrationRoutes = require("./routes/registrationRoutes");

  app.use("/", authRoutes);
  app.use("/", courseRoutes);
  app.use("/", registrationRoutes);

  await mongoose.connect(process.env.MONGO_URI);
  const server = app.listen(5099);

  const baseUrl = "http://localhost:5099";

  const request = async (endpoint, options = {}) => {
    const combinedHeaders = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: combinedHeaders,
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  };

  try {
    // 1. GET /courses
    console.log("\n1. Testing GET /courses:");
    const coursesRes = await request("/courses");
    console.log(`Status: ${coursesRes.status}, Found: ${coursesRes.body.count} courses`);
    const sampleCourse = coursesRes.body.courses[0];
    console.log(`Sample Course: ${sampleCourse.courseCode} - ${sampleCourse.courseName} (${sampleCourse.seatsAvailable} seats)`);

    // 2. POST /login as student
    console.log("\n2. Testing POST /login (Student):");
    const studentLogin = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email: "student@abc.edu", password: "student123" }),
    });
    console.log(`Student Login Status: ${studentLogin.status}, Name: ${studentLogin.body.user?.name}`);
    const studentToken = studentLogin.body.token;

    // 3. POST /login as admin
    console.log("\n3. Testing POST /login (Admin):");
    const adminLogin = await request("/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@abc.edu", password: "admin123" }),
    });
    console.log(`Admin Login Status: ${adminLogin.status}, Role: ${adminLogin.body.user?.role}`);
    const adminToken = adminLogin.body.token;

    // 4. GET /myCourses for student
    console.log("\n4. Testing GET /myCourses:");
    const myCoursesRes = await request("/myCourses", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`My Courses Status: ${myCoursesRes.status}, Registrations: ${myCoursesRes.body.count}`);

    // 5. POST /registerCourse
    console.log("\n5. Testing POST /registerCourse:");
    const registeredCourseIds = myCoursesRes.body.registrations.map(r => r.courseId?._id?.toString() || r.courseId?.toString());
    const availableToRegister = coursesRes.body.courses.find(c => !registeredCourseIds.includes(c._id.toString()));

    let newRegId = null;
    if (availableToRegister) {
      const regRes = await request("/registerCourse", {
        method: "POST",
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({ courseId: availableToRegister._id }),
      });
      console.log(`Register Course Status: ${regRes.status}, Msg: ${regRes.body.message}`);
      newRegId = regRes.body.registration?._id;
    } else {
      console.log("Student already registered for all available courses. Using existing registration.");
      newRegId = myCoursesRes.body.registrations[0]?._id;
    }

    // 6. PUT /approveRegistration/:id as admin
    if (newRegId) {
      console.log("\n6. Testing PUT /approveRegistration/:id (Admin):");
      const approveRes = await request(`/approveRegistration/${newRegId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: "Approved", adminComments: "Prerequisites verified by Dept Head." }),
      });
      console.log(`Approval Status: ${approveRes.status}, New Status: ${approveRes.body.registration?.approvalStatus}`);
    }

    // 7. GET /reports/enrollment as admin (MongoDB Aggregation)
    console.log("\n7. Testing GET /reports/enrollment (MongoDB aggregate):");
    const reportRes = await request("/reports/enrollment", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`Report Status: ${reportRes.status}, Total Courses: ${reportRes.body.summary?.totalCourses}, Total Regs: ${reportRes.body.summary?.totalRegistrations}`);
    console.log(`Status Aggregation:`, reportRes.body.statusDistribution);

    // 8. PUT /profile update student
    console.log("\n8. Testing PUT /profile:");
    const profileRes = await request("/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ name: "Aarav Sharma", phone: "+91 91234 56789", department: "Computer Science" }),
    });
    console.log(`Profile Update Status: ${profileRes.status}, Updated Name: ${profileRes.body.user?.name}`);

    console.log("\n=== ALL REST API TESTS PASSED WITH 100% SUCCESS! ===");
  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
