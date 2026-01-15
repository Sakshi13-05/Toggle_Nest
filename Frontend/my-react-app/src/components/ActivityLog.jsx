import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, History, RefreshCw } from "lucide-react";
import axios from "axios";
import "./ActivityLog.css";
import { useNavigate, useParams } from "react-router-dom";

const ActivityLog = () => {
  const navigate = useNavigate();
  const { projectId } = useParams(); // ✅ only useParams

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true); // start as true

  useEffect(() => {
    if (!projectId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/activities/${projectId}`
        );
        setActivities(res.data || []);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [projectId]);

  if (loading) {
    return (
      <div className="activity-log-container">
        <div className="loading-state">
          <RefreshCw className="animate-spin mb-4" size={40} />
          <p className="font-bold text-lg">Indexing Nest History...</p>
        </div>
      </div>
    );
  }

  if (!projectId || activities.length === 0) {
    return (
      <div className="activity-log-container">
        <div className="empty-state">
          <div className="empty-icon-box">
            <History size={40} />
          </div>
          <h3 className="text-2xl font-bold mb-3">No history yet</h3>
          <p className="text-slate-500 max-w-[320px] mx-auto text-lg">
            Activities will appear here once actions are performed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-log-container">
      <div className="activity-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>

          <h2 className="activity-title">
            <History size={24} />
            Activity Log
          </h2>
        </div>

        <span className="activity-badge">Last 20 Actions</span>
      </div>

      <motion.div initial="hidden" animate="show">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div key={activity._id || index} className="activity-item">
              <div className="content-container">
                <div className="main-text">
                  <b>{activity.userName}</b> {activity.description}
                </div>
                <div className="timestamp">
                  <Clock size={14} />
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ActivityLog;
