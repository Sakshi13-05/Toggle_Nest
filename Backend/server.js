import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);

// 1. User Schema Definition
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'member'] },
  position: String,
  teamName: String,
  teamSize: String,
  projectName: String,
  projectId: { type: String }, // New Field for verification
  memberRole: String, // Matches 'jobFunction' or 'memberRole' from frontend
  onboardingComplete: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

// 2. Onboarding Logic Route
// 2. Onboarding Logic Route
app.post('/api/onboarding', async (req, res) => {
  try {
    // console.log("INCOMING ONBOARDING REQUEST:", req.body);

    const {
      email,
      role,
      position,
      teamName,
      teamSize,
      projectName,
      projectId,
      jobFunction
    } = req.body;

    if (!email) {
      console.log("Error: Email missing");
      return res.status(400).json({ message: "Email is required" });
    }

    // Prepare search ID (if exists)
    const searchId = projectId ? projectId.toString().trim() : "";

    // --- Role-Based Verification Logic ---
    if (role === 'Member') {
      // console.log(`Verifying Member for Project ID: '${searchId}'`);

      if (!searchId) {
        return res.status(400).json({ message: "Project ID is required for members." });
      }

      // Case Insensitive Search
      const adminOwner = await User.findOne({
        role: 'admin',
        projectId: { $regex: new RegExp(`^${searchId}$`, 'i') }
      });

      if (!adminOwner) {
        console.log("❌ Admin NOT found for Project ID:", searchId);
        return res.status(404).json({ message: `Project ID "${projectId}" not found. Please verify with your Admin.` });
      }

      // console.log("✅ Admin FOUND:", adminOwner.email);

      // Log member joined
      await logActivity({
        projectId: searchId,
        userName: email.split('@')[0],
        userEmail: email,
        actionType: 'MEMBER_JOINED',
        description: `Joined the project team.`
      });
    }

    // --- Data Persistence ---
    const updateData = {
      role: role.toLowerCase(),
      position,
      teamName,
      teamSize,
      projectName,
      projectId: searchId || undefined, // Store trimmed ID
      memberRole: jobFunction,
      onboardingComplete: true
    };

    // console.log("Updating User with Data:", updateData);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // console.log("Onboarding Success for:", updatedUser.email);

    res.status(200).json({
      message: "Workspace details saved successfully!",
      user: updatedUser
    });

  } catch (error) {
    console.error("🔥 Onboarding Server Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Fetch User Profile by Email
app.get('/api/onboarding/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });

    if (!user) {
      // New user! 
      return res.status(200).json({
        user: {
          email,
          role: null,
          onboardingComplete: false
        }
      });
    }

    // Ensure role is consistent and only sent if onboarding is complete
    // If onboarding is NOT complete, we might still have a partial user object, 
    // but the frontend should know onboarding is pending.
    res.status(200).json({
      user: {
        ...user._doc,
        role: user.onboardingComplete ? user.role : null,
        onboardingComplete: user.onboardingComplete || false
      }
    });
  } catch (error) {
    console.error("Fetch User Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 3. Project Schema Definition
const ProjectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true, index: true },
  projectName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  members: [{ type: String }] // Array of member emails
}, { timestamps: true });

const Project = mongoose.model("Project", ProjectSchema);

// 4. Dashboard Sync Route
app.get("/api/dashboard/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // 1. Find Current User
    const currentUser = await User.findOne({ email });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { projectId: activeProjectId, projectName: activeProjectName, role } = currentUser;

    // 2. Teammates Logic
    // Find users with the same projectId, excluding the current user
    const teammates = await User.find({
      projectId: activeProjectId,
      email: { $ne: email }
    }).select("email role position"); // Select only necessary fields

    // 3. Project History Logic
    // Find projects where user is a member OR admin, excluding the active one
    const history = await Project.find({
      $and: [
        {
          $or: [
            { members: email },
            { adminEmail: email }
          ]
        },
        { projectId: { $ne: activeProjectId } }
      ]
    });

    // 4. Return Data
    res.status(200).json({
      activeProjectName: activeProjectName || "No Functioning Project",
      activeProjectId: activeProjectId ? String(activeProjectId) : null,
      teammates: teammates.map(t => ({
        name: t.email.split('@')[0],
        email: t.email,
        role: t.role
      })),
      history: history.map(p => ({
        name: p.name || p.projectName,
        id: String(p.id || p.projectId)
      }))
    });

  } catch (error) {
    console.error("Dashboard Sync Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// 5. Query Schema & Routes
const QuerySchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  text: { type: String, required: true },
  senderEmail: { type: String },
  isResolved: { type: Boolean, default: false }
}, { timestamps: true });

const Query = mongoose.model("Query", QuerySchema);

// Add New Query
app.post("/api/queries", async (req, res) => {
  try {
    const { projectId, text, senderEmail, userName } = req.body;
    const newQuery = new Query({ projectId, text, senderEmail });
    await newQuery.save();

    await logActivity({
      projectId,
      userName: userName || senderEmail.split('@')[0],
      userEmail: senderEmail,
      actionType: 'QUERY_ADDED',
      description: `Added a new query: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
    });

    res.status(201).json(newQuery);
  } catch (error) {
    res.status(500).json({ message: "Error saving query" });
  }
});

// Get Queries for Project
app.get("/api/queries/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const queries = await Query.find({ projectId }).sort({ createdAt: -1 });
    res.status(200).json(queries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching queries" });
  }
});

// Resolve/Unresolve Query
app.patch("/api/queries/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const { userName } = req.body;
    const query = await Query.findById(id);
    if (!query) return res.status(404).json({ message: "Query not found" });

    query.isResolved = !query.isResolved;
    await query.save();

    if (query.isResolved) {
      await logActivity({
        projectId: query.projectId,
        userName: userName || "Someone",
        userEmail: query.senderEmail, // This might not be the resolver's email, but we'll use it if nothing else is provided
        actionType: 'QUERY_RESOLVED',
        description: `Resolved query: "${query.text.substring(0, 30)}..."`
      });
    }

    res.status(200).json(query);
  } catch (error) {
    res.status(500).json({ message: "Error updating query" });
  }
});

// 6. team member contact
app.get("/api/team/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const teamMembers = await User.find({ projectId });
    res.status(200).json({ teamMembers });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "error in fetching team details" });
  }
});

// 7. TASK SCHEMA & ROUTES
const TaskSchema = new mongoose.Schema({
  projectId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  deadline: { type: String },
  status: { type: String, default: 'To-Do' },
  priority: { type: String, default: 'Medium' },
  assigneeName: { type: String },
  assigneeInitial: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model("Task", TaskSchema);

// 8. ACTIVITY SCHEMA & LOGGING
const ActivitySchema = new mongoose.Schema({
  projectId: String,
  userName: String,
  userEmail: String,
  actionType: { type: String, enum: ['TASK_CREATED', 'TASK_UPDATED', 'QUERY_ADDED', 'QUERY_RESOLVED', 'MEMBER_JOINED'] },
  description: String,
  timestamp: { type: Date, default: Date.now }
});

const Activity = mongoose.model("Activity", ActivitySchema);

const logActivity = async (data) => {
  try {
    const activity = new Activity(data);
    await activity.save();
    // console.log("Activity Logged:", data.actionType);
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

// CREATE PROJECT
app.post("/api/projects", async (req, res) => {
  try {
    const { projectId, projectName, adminEmail } = req.body;

    // Check if projectId exists
    const existing = await Project.findOne({ projectId });
    if (existing) return res.status(400).json({ message: "Project ID already exists" });

    const newProject = new Project({ projectId, projectName, adminEmail, members: [adminEmail] });
    await newProject.save();

    // Also update Admin user's projectId and projectName if it's their first or current
    await User.findOneAndUpdate({ email: adminEmail }, { projectId, projectName });

    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: "Error creating project", error: error.message });
  }
});

// GET ADMIN PROJECTS
app.get("/api/projects/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const projects = await Project.find({ adminEmail: email }).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects" });
  }
});

// CREATE TASK (ADMIN)
app.post("/api/tasks", async (req, res) => {
  try {
    const { projectId, title, deadline, userName, userEmail } = req.body;

    const newTask = new Task({
      projectId: String(projectId).trim(),
      title,
      deadline,
      status: 'To-Do'
    });

    await newTask.save();

    await logActivity({
      projectId: String(projectId).trim(),
      userName: userName || "Admin",
      userEmail: userEmail,
      actionType: 'TASK_CREATED',
      description: `Created task: "${title}"`
    });

    // console.log("Success: Task saved to MongoDB for Project:", req.body.projectId);
    res.status(201).json(newTask);
  } catch (error) {
    console.error("🔥 Error saving task:", error);
    res.status(500).json({ message: "Error creating task" });
  }
});

// GET PROJECT TASKS (MEMBER/ADMIN)
app.get("/api/tasks/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const targetProjectId = String(projectId).trim();
    console.log("🔍 [BACKEND] Fetching tasks for exact ID:", targetProjectId);

    const tasks = await Task.find({ projectId: targetProjectId }).sort({ createdAt: -1 });

    console.log(`✅ [BACKEND] Found ${tasks.length} tasks for ID: ${targetProjectId}`);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("🔥 [BACKEND] Fetch Tasks Error:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
});

// UPDATE TASK STATUS (MEMBER TOGGLE)
app.patch("/api/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, userName, userEmail } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    );
    if (!updatedTask) return res.status(404).json({ message: "Task not found" });

    await logActivity({
      projectId: updatedTask.projectId,
      userName: userName || "Member",
      userEmail: userEmail,
      actionType: 'TASK_UPDATED',
      description: `${status === 'Done' ? 'Completed' : 'Updated'} task: "${updatedTask.title}"`
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Error updating task status" });
  }
});

// GET PROJECT ACTIVITIES
app.get("/api/activities/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const activities = await Activity.find({ projectId })
      .sort({ timestamp: -1 })
      .limit(20);
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: "Error fetching activities" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend running ");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});