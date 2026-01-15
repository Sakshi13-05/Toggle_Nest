import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import API from '../api/config';
import {
  Plus, Briefcase, Layers, ArrowLeft, Clock,
  CheckCircle, Loader2, LogOut, User, Hash, Calendar, Check, BarChart3, History as HistoryIcon, ShieldCheck, Copy, MessageSquare
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useLocation } from "react-router-dom";
import ActivityLog from "../components/ActivityLog";

const AdminDashboard = ({ user: passedUser }) => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser || passedUser;

  const [taskView, setTaskView] = useState("ACTIVE");
  const [activeView, setActiveView] = useState("board"); // "board" | "queries"
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // State for data
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [queries, setQueries] = useState([]);
  const [newQueryText, setNewQueryText] = useState("");

  // Form States
  const [newProjectName, setNewProjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  // --- DERIVED TASK STATS ---
  const completedTasks = tasks.filter(t => t.status === "Done");
  const pendingTasks = tasks.filter(t => t.status !== "Done");
  const nearestDeadlineTask = tasks
    .filter(t => t.deadline && t.status !== "Done")
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  // --- FETCHING ---
  useEffect(() => {
    if (currentUser?.email) {
      fetchAdminProfile();
      fetchProjects();
    }
  }, [currentUser]);

  useEffect(() => {
    const pid = selectedProject?.projectId || adminProfile?.projectId;
    if (pid) {
      if (activeView === "board") fetchTasks(pid);
      if (activeView === "queries") fetchQueries(pid);
    }
  }, [activeView, selectedProject, adminProfile]);

  const fetchAdminProfile = async () => {
    try {
      const res = await API.get(`/api/onboarding/user/${currentUser.email}`);
      setAdminProfile(res.data.user);
    } catch (err) {
      console.error("Failed to load admin profile");
    }
  };

  const fetchProjects = async () => {
    setIsSyncing(true);
    try {
      const res = await API.get(`/api/projects/${currentUser.email}`);
      setProjects(res.data);
      if (res.data.length > 0 && !selectedProject) {
        setSelectedProject(res.data[0]);
      }
    } catch (err) {
      toast.error("Failed to sync projects.");
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchTasks = async (projectId) => {
    setIsSyncing(true);
    try {
      const res = await API.get(`/api/tasks/${projectId}`);
      setTasks(res.data);
    } catch (err) {
      toast.error("Failed to fetch project tasks.");
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchQueries = async (projectId) => {
    if (!projectId) return;
    try {
      const res = await API.get(`/api/queries/${projectId}`);
      setQueries(res.data || []);
    } catch (err) {
      console.error("Failed to fetch queries", err);
    }
  };

  const fetchTeamMembers = async (projectId) => {
    if (!projectId) return;
    try {
      const res = await API.get(`/api/team/${projectId}`);
      setTeamMembers(res.data.teamMembers || []);
    } catch (err) {
      console.error("❌ Failed to fetch team members", err);
    }
  };

  useEffect(() => {
    const pid = selectedProject?.projectId || adminProfile?.projectId;
    if (pid) fetchTeamMembers(pid);
  }, [selectedProject, adminProfile]);

  // --- ACTIONS ---
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error("Project name required.");
      return;
    }
    setIsSyncing(true);
    const targetPID = adminProfile?.projectId || "DEFAULT_NEST";
    try {
      const res = await API.post("/api/projects", {
        projectId: targetPID,
        projectName: newProjectName.trim(),
        adminEmail: currentUser.email
      });
      setProjects([res.data, ...projects]);
      setSelectedProject(res.data);
      setNewProjectName("");
      toast.success("Project Nested!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Creation failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDeadline) {
      toast.error("Set title and deadline.");
      return;
    }
    const finalPID = adminProfile?.projectId || selectedProject?.projectId;
    if (!finalPID) return;
    setIsSyncing(true);
    try {
      const res = await API.post("/api/tasks", {
        projectId: String(finalPID),
        title: taskTitle.trim(),
        deadline: taskDeadline,
        userName: adminProfile?.fullName || currentUser?.email?.split('@')[0],
        userEmail: currentUser?.email
      });
      setTaskTitle("");
      setTaskDeadline("");
      toast.success("Task Assigned! 🚀");
      fetchTasks(finalPID);
    } catch (err) {
      toast.error("Failed to assign task.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateQuery = async (e) => {
    if (e) e.preventDefault();
    const pid = selectedProject?.projectId || adminProfile?.projectId;
    if (!newQueryText.trim() || !pid) return;
    try {
      const res = await API.post("/api/queries", {
        projectId: pid,
        text: newQueryText,
        senderEmail: currentUser?.email,
        userName: adminProfile?.fullName || currentUser?.email?.split('@')[0]
      });
      setQueries([res.data, ...queries]);
      setNewQueryText("");
      toast.success("Query pinned to Hub!");
    } catch (err) {
      toast.error("Failed to post query");
    }
  };

  const handleResolveQuery = async (id) => {
    try {
      const res = await API.patch(`/api/queries/${id}/resolve`, {
        userName: adminProfile?.fullName || currentUser?.email?.split('@')[0]
      });
      setQueries(prev => prev.map(q => q._id === id ? res.data : q));
    } catch (err) {
      toast.error("Error resolving query");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast.success("Email copied! ✅", {
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  };

  const sortedTeam = [...teamMembers].sort((a, b) => {
    const isAAdmin = a.role === 'admin' || a.email === currentUser?.email;
    const isBAdmin = b.role === 'admin' || b.email === currentUser?.email;
    if (isAAdmin && !isBAdmin) return -1;
    if (!isAAdmin && isBAdmin) return 1;
    return 0;
  });

  const filteredTasks = tasks.filter(task => {
    if (taskView === "ACTIVE") return task.status !== "Done";
    if (taskView === "COMPLETED") return task.status === "Done";
    return true;
  });

  return (
    <div className="dashboard-container relative">
      <Toaster position="top-center" />
      <AnimatePresence>
        {isSyncing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-xl border border-gray-100">
              <Loader2 className="animate-spin text-black" size={20} />
              <span className="font-semibold text-black">Syncing Hub...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="sidebar">
        <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Layers className="logo-icon text-[#000000]" />
          <span className="logo-text">ToggleNest <span className="admin-pill-badge">ADMIN</span></span>
        </div>

        <div className="team-contacts-section">
          <h4 className="section-title">TEAM CONTACTS</h4>
          <div className="contacts-list">
            {sortedTeam.map((member, index) => {
              const displayName = member.fullName || member.name || member.userName || member.email?.split("@")[0] || "Member";
              return (
                <div key={member.email || index} className="contact-item">
                  <div className="avatar-circle">{displayName.charAt(0).toUpperCase()}</div>
                  <div className="contact-info flex-1">
                    <p className="contact-name">
                      {displayName}
                      {(member.role === 'admin' || member.email === currentUser?.email) && (
                        <span className="admin-small-badge ml-2 flex items-center gap-1 inline-flex"><ShieldCheck size={10} /> Lead</span>
                      )}
                    </p>
                    <div className="contact-email-wrapper group" onClick={() => handleCopyEmail(member.email)}>
                      <span className="contact-email-text">{member.email}</span>
                      <Copy size={11} className="copy-icon opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sidebar-section">
          <span className="section-title">NEST A NEW PROJECT</span>
          <form onSubmit={handleCreateProject} className="flex flex-col gap-2">
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" className="query-input !pl-9" placeholder="Project Name..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
            </div>
            <button type="submit" className="btn-add-query-main !w-full flex items-center justify-center gap-2"><Plus size={16} /> Add project</button>
          </form>
        </div>

        <div className="sidebar-section mt-6">
          <span className="section-title">MANAGED PROJECTS</span>
          <div className="projects-menu">
            {projects.map((p) => (
              <div key={p.projectId} className={`project-item ${selectedProject?.projectId === p.projectId ? 'active ring-1 ring-black' : 'muted opacity-60'}`} onClick={() => setSelectedProject(p)}>
                <div className="flex items-center gap-3 w-full">
                  <Briefcase size={16} /><span className="project-name truncate">{p.projectName}</span>
                  {selectedProject?.projectId === p.projectId && <div className="active-dot"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h1 className="flex items-center gap-3">{selectedProject?.projectName || adminProfile?.projectName || "Select Project"}</h1>
          <div className="header-actions">
            <button className="btn-back" onClick={() => navigate("/onboarding")}><ArrowLeft size={16} /> Back</button>
            <div className="relative">
              <button className="btn-add-query-main flex items-center gap-2" onClick={() => setShowMoreOptions(!showMoreOptions)}><Plus size={16} /> More Options</button>
              <AnimatePresence>
                {showMoreOptions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreOptions(false)} />
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="dropdown-card z-50">
                      <button onClick={() => { setShowMoreOptions(false); setActiveView("board"); }} className="dropdown-item"><Layers size={18} /> View Board</button>
                      <button onClick={() => { setShowMoreOptions(false); navigate("/progress", { state: { completedCount: completedTasks.length, pendingCount: pendingTasks.length, nearestDeadline: nearestDeadlineTask, allTasks: tasks } }); }} className="dropdown-item"><BarChart3 size={18} /> View Progress</button>
                      <button onClick={() => { setShowMoreOptions(false); setActiveView("queries"); }} className="dropdown-item"><MessageSquare size={18} /> 💬 Query Hub</button>
                      <button onClick={() => { setShowMoreOptions(false); const pid = selectedProject?.projectId || adminProfile?.projectId; if (pid) navigate(`/history/${pid}`); }} className="dropdown-item"><HistoryIcon size={18} /> View History</button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-black/5 hover:ring-black cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
              {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black text-white flex items-center justify-center text-sm font-bold">{currentUser?.email?.charAt(0).toUpperCase()}</div>}
            </div>
            {showDropdown && (
              <div className="profile-dropdown shadow-2xl border-gray-100">
                <p className="user-email text-xs border-b pb-2 mb-2">{currentUser?.email}</p>
                <button onClick={handleLogout} className="logout-btn flex items-center justify-center gap-2"><LogOut size={14} /> Logout</button>
              </div>
            )}
          </div>
        </header>

        <div className="dashboard-body py-8 px-12">
          {(selectedProject || adminProfile?.projectId) ? (
            <div className="flex flex-col gap-10">
              {activeView === "board" ? (
                <>
                  <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm max-w-2xl">
                    <div className="flex items-center gap-3 mb-8"><CheckCircle className="text-black" size={24} /><h2 className="text-xl font-bold">Assign New Task</h2></div>
                    <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2"><label className="text-xs font-bold text-gray-400 uppercase ml-1 mt-[24px]">Task Description</label><input type="text" className="query-input !rounded-2xl" placeholder="What needs to be done?" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} /></div>
                        <div className="flex flex-col gap-2"><label className="text-xs font-bold text-gray-400 uppercase ml-1 mt-[24px]">Deadline Date</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="date" className="query-input !rounded-2xl !pl-10" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} /></div></div>
                      </div>
                      <button type="submit" className="btn-add-query-main !mt-[20px] !w-fit !px-10"><Plus size={18} /> Assign Task</button>
                    </form>
                  </section>
                  <section>
                    <div className="task-header mb-6"><div className="flex items-center gap-3"><Layers size={20} /><h2 className="text-lg font-bold uppercase tracking-tight">Current Task Board</h2><span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-bold">{filteredTasks.length} ACTIVE</span></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tasks.map((task) => (
                        <motion.div key={task._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`task-card bg-white p-6 rounded-[1.5rem] border border-gray-100 hover:shadow-lg transition-all ${task.status === "Done" ? "opacity-60" : ""}`}>
                          <div className="flex justify-between items-start mb-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${task.status === "Done" ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}><CheckCircle size={18} className={task.status === "Done" ? "text-green-600" : "text-gray-300"} /></div><div className="flex flex-col items-end gap-1"><span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-blue-50 text-blue-500">{task.priority || "MEDIUM"}</span><span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${task.status === "Done" ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>{task.status?.toUpperCase() || "TO-DO"}</span></div></div>
                          <h4 className={`font-bold text-lg mb-2 truncate ${task.status === "Done" ? "line-through text-gray-400" : "text-black"}`}>{task.title}</h4>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50"><p className="text-xs text-gray-400 flex items-center gap-2 font-medium"><Calendar size={14} />{task.deadline}</p><div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">{task.assigneeInitial || "S"}</div></div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <div className="flex flex-col gap-8 max-w-4xl">
                  <div className="flex flex-col gap-1"><h2 className="text-3xl font-black text-black">Project Queries</h2><p className="text-gray-500 font-medium">Collaborative workspace for team alignment.</p></div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <textarea placeholder="Ask the team a question..." className="modal-textarea !h-24 !mb-4 !border-gray-100 focus:!border-black transition-all" value={newQueryText} onChange={(e) => setNewQueryText(e.target.value)} />
                    <button onClick={handleCreateQuery} className="btn-add-query-main !rounded-full !px-8"><Plus size={18} /> Add to Nest</button>
                  </div>
                  <div className="flex flex-col gap-4">
                    {[...queries].sort((a, b) => a.isResolved - b.isResolved).map((q) => (
                      <motion.div key={q._id} className={`bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between transition-all ${q.isResolved ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-5 flex-1"><div onClick={() => handleResolveQuery(q._id)} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border ${q.isResolved ? 'bg-black border-black text-white' : 'hover:border-black border-gray-100 text-transparent'}`}><Check size={16} /></div><p className={`text-lg font-semibold ${q.isResolved ? 'line-through text-gray-400' : 'text-gray-900'}`}>{q.text}</p></div>
                        <div className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{new Date(q.createdAt).toLocaleDateString()}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400"><Layers size={64} strokeWidth={1} className="mb-4 opacity-20" /><h2 className="text-xl font-bold text-gray-300">Select or Nest a Project to Begin</h2></div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;