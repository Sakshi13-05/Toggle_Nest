import React, { createContext, useContext, useState } from "react";

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Apex rebranding for Super Bowl",
      tasks: [
        {
          id: 101,
          name: "Define Brand Voice",
          deadline: "Jan 12",
          status: "Done",
          completed: true,
        },
        {
          id: 102,
          name: "Asset Creation Phase 1",
          deadline: "Jan 15",
          status: "In Progress",
          completed: false,
        },
      ],
    },
  ]);

  /* ================= ADMIN ACTIONS ================= */

  const addProject = (name) => {
    setProjects((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        tasks: [],
      },
    ]);
  };

  const addTask = (projectId, task) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: [...p.tasks, task] }
          : p
      )
    );
  };

  const toggleTask = (projectId, taskId) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      completed: !t.completed,
                      status: !t.completed ? "Done" : "In Progress",
                    }
                  : t
              ),
            }
          : p
      )
    );
  };

  return (
    <DashboardContext.Provider
      value={{ projects, addProject, addTask, toggleTask }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);
