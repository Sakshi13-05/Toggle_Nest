import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Progress from './Progress';
import './Progress.css';
import axios from 'axios';
import {
  Layers, Plus, Check, Briefcase, User, ArrowLeft, Clock,
  MoreHorizontal, Search, Copy, MessageSquare, X, Loader2, LogOut, BarChart3, History as HistoryIcon, ShieldCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import ActivityLog from '../components/ActivityLog';

const Dashboard = ({ user: passedUser }) => {
  const navigate = useNavigate();

  // ------------------- STATE -------------------
  const [dashboardData, setDashboardData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [queries, setQueries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Task Board");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newQueryText, setNewQueryText] = useState("");

  const tabs = [
    "Task Board",
    "Progress Dashboard",
    "Activity Log",
  ];

  // ------------------- AUTH & INITIAL DATA -------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser?.role === "admin") return;
      setCurrentUser(user);
      try {
        const res = await axios.get(`http://localhost:5000/api/dashboard/${user.email}`);
        setDashboardData(res.data);
        const pid = res.data.activeProjectId;
        if (!pid) return;
        fetchTeamMembers(pid);
        fetchQueries(pid);
        fetchTasksMember(pid);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchTasksMember = async (projectId, silent = false) => {
    if (!projectId) return;
    if (!silent) setIsSyncing(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/tasks/${projectId}`);
      setTasks(res.data);
    } catch (err) {
      if (!silent) toast.error("Failed to sync tasks.");
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  const fetchQueries = async (projectId) => {
    if (!projectId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/queries/${projectId}`);
      setQueries(res.data || []);
    } catch (err) {
      console.error("Failed to fetch queries", err);
    }
  };

  const fetchTeamMembers = async (projectId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/team/${projectId}`);
      setTeamMembers(res.data.teamMembers || []);
    } catch (err) {
      console.error("Failed to fetch team members");
    }
  };

  useEffect(() => {
    const pid = dashboardData?.activeProjectId;
    if (!pid || activeTab !== "Task Board") return;
    const interval = setInterval(() => {
      fetchTasksMember(pid, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [dashboardData?.activeProjectId, activeTab]);

  // ------------------- FUNCTIONS -------------------
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('user');
    navigate("/");
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied! ✅");
  };

  const handleCreateQuery = async (e) => {
    if (e) e.preventDefault();
    const pid = dashboardData?.activeProjectId;
    if (!newQueryText.trim() || !pid) return;
    try {
      const res = await axios.post("http://localhost:5000/api/queries", {
        projectId: pid,
        text: newQueryText,
        senderEmail: currentUser?.email,
        userName: currentUser?.email?.split('@')[0]
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
      const res = await axios.patch(`http://localhost:5000/api/queries/${id}/resolve`, {
        userName: currentUser?.email?.split('@')[0]
      });
      setQueries(prev => prev.map(q => q._id === id ? res.data : q));
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'Done' ? 'To-Do' : 'Done';
    try {
      const res = await axios.patch(`http://localhost:5000/api/tasks/${taskId}`, {
        status: newStatus,
        userName: currentUser?.email?.split('@')[0],
        userEmail: currentUser?.email
      });
      setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
      if (newStatus === 'Done') toast.success("Task moved to Done! 🎯");
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser && !passedUser) {
    return <div className="flex items-center justify-center min-vh-100 bg-white"><Loader2 className="animate-spin text-black" size={48} /></div>;
  }

  return (
    <div className="dashboard-container relative">
      <Toaster position="top-center" />
      <AnimatePresence>
        {isSyncing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-xl border border-gray-100">
              <Loader2 className="animate-spin text-black" size={20} /><span className="font-semibold text-black">Syncing Hub...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="sidebar">
        <div className="logo-section" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Layers className="logo-icon" color="#000000" />
          <span className="logo-text">ToggleNest <span className="admin-pill-badge bg-black">MEMBER</span></span>
        </div>
        <div className="search-container">
          <Search className="search-icon" size={16} />
          <input className="search-input" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="team-contacts-section">
          <h4 className="section-title">TEAM CONTACTS</h4>
          <div className="contacts-list">
            {teamMembers?.map((member) => (
              <div key={member.email} className="contact-item group">
                <div className="avatar-circle">{member.fullName?.charAt(0).toUpperCase()}</div>
                <div className="contact-info">
                  <p className="contact-name">{member.fullName} {member.email === currentUser.email && "(Me)"}</p>
                  <div className="email-wrapper" onClick={() => handleCopyEmail(member.email)}>
                    <span className="contact-email">{member.email}</span>
                    <Copy size={12} className="copy-icon" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <span className="section-title">ACTIVE NEST</span>
          <div className="projects-menu">
            <div className="project-item active"><Briefcase size={16} /><span className="project-name">{dashboardData?.activeProjectName || "Current Nest"}</span><div className="active-dot"></div></div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h1>{dashboardData?.activeProjectName || "Current Nest"}</h1>
          <div className="header-actions">
            <button className="btn-back" onClick={() => navigate("/onboarding")}><ArrowLeft size={16} /> Back</button>
            <div className="relative">
              <button className="btn-add-query-main flex items-center gap-2" onClick={() => setShowMoreOptions(!showMoreOptions)}><Plus size={16} /> More Options</button>
              <AnimatePresence>
                {showMoreOptions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreOptions(false)} />
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="dropdown-card z-50">
                      <button onClick={() => { setShowMoreOptions(false); setActiveTab("Task Board"); }} className="dropdown-item"><Layers size={18} /> View Board</button>
                      <button onClick={() => { setShowMoreOptions(false); setActiveTab("Query Hub"); }} className="dropdown-item"><MessageSquare size={18} /> 💬 Query Hub</button>
                      <button onClick={() => { setShowMoreOptions(false); const pid = dashboardData?.activeProjectId; if (pid) navigate(`/history/${pid}`); }} className="dropdown-item"><HistoryIcon size={18} /> View History</button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="user-profile-badge ring-2 ring-black/5 hover:ring-black transition-all" onClick={() => setShowDropdown(!showDropdown)}>
              {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="User" /> : <div className="w-full h-full bg-black text-white flex items-center justify-center font-bold">{currentUser?.email?.charAt(0).toUpperCase()}</div>}
            </div>
            {showDropdown && (
              <div className="profile-dropdown shadow-2xl"><p className="user-email text-xs border-b pb-2 mb-2">{currentUser.email}</p><button onClick={handleLogout} className="logout-btn flex items-center justify-center gap-2"><LogOut size={14} /> Logout</button></div>
            )}
          </div>
        </header>

        <div className="tabs-container">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>{tab}</button>
          ))}
        </div>

        <div className="dashboard-body py-8 px-12">
          {activeTab === "Task Board" ? (
            <>
              <div className="task-header mb-6"><div className="flex items-center gap-2"><Layers size={18} /><h2 className="text-lg font-bold">Active Nest Tasks</h2></div><span className="text-xs font-bold bg-black text-white px-3 py-1 rounded-full">{filteredTasks.length} ASSIGNED</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task) => (
                  <motion.div key={task._id} className={`task-card-white group ${task.status === 'Done' ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${task.status === 'Done' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 group-hover:border-black'}`} onClick={() => handleToggleTask(task._id, task.status)}>{task.status === 'Done' ? <Check size={18} className="text-green-600" /> : <div className="w-3 h-3 rounded-sm border border-gray-300"></div>}</div>
                      <div className="flex flex-col items-end gap-1"><span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-blue-50 text-blue-500">MEDIUM</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${task.status === 'Done' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>{task.status.toUpperCase()}</span></div>
                    </div>
                    <h4 className={`font-bold text-lg mb-2 truncate ${task.status === 'Done' ? 'line-through text-gray-400' : 'text-black'}`}>{task.title}</h4>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50"><div className="flex items-center gap-2 text-gray-400"><Clock size={14} /><span className="text-xs font-semibold">{task.deadline || 'No deadline'}</span></div><div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">{task.assigneeInitial || 'U'}</div></div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : activeTab === "Query Hub" ? (
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
          ) : activeTab === "Progress Dashboard" ? (
            <Progress tasks={tasks} />
          ) : activeTab === "Activity Log" ? (
            <ActivityLog projectId={dashboardData?.activeProjectId} />
          ) : (
            <div className="construction-msg">Coming Soon...</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;