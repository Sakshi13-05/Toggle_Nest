import React from "react";
import "./Progress.css";

import {
    CheckCircle,
    Clock,
    TrendingUp,
    CalendarDays,
} from "lucide-react";


const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year, month) =>
    new Date(year, month, 1).getDay();

const Progress = ({ tasks = [] }) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const todoTasks = tasks.filter(t => t.status === 'To-Do' || !t.status).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Find nearest upcoming deadline
    const upcomingDeadlineTask = tasks
        .filter(t => t.deadline && new Date(t.deadline) >= new Date())
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

    const today = new Date();
    const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
    const [currentYear, setCurrentYear] = React.useState(today.getFullYear());

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const monthName = new Date(currentYear, currentMonth).toLocaleString(
        "default",
        { month: "long" }
    );

    // Distribution data for the bar chart
    const distributionData = [
        { label: "Done", value: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0, count: completedTasks, color: "#000000" },
        { label: "Active", value: totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0, count: inProgressTasks, color: "#4B5563" },
        { label: "To-Do", value: totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0, count: todoTasks, color: "#9CA3AF" },
    ];

    return (
        <div className="progress-container">

            {/* TOP STATS */}
            <div className="stats-grid">
                <div className="stat-card">
                    <CheckCircle size={20} className="text-black" />
                    <div>
                        <h4>Completed</h4>
                        <p>{completedTasks}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <Clock size={20} className="text-black" />
                    <div>
                        <h4>In Progress</h4>
                        <p>{inProgressTasks}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <TrendingUp size={20} className="text-black" />
                    <div>
                        <h4>Efficiency</h4>
                        <p>{completionRate}%</p>
                    </div>
                </div>

                <div className="stat-card">
                    <CalendarDays size={20} className="text-black" />
                    <div>
                        <h4>Nearest Deadline</h4>
                        <p>
                            {upcomingDeadlineTask
                                ? new Date(upcomingDeadlineTask.deadline).toLocaleDateString()
                                : "None"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ANALYTICS + CALENDAR */}
            <div className="analytics-grid">

                {/* BAR CHART */}
                <div className="analytics-card">
                    <div className="card-header">
                        <h3>Project Health</h3>
                        <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded">REAL-TIME</span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-4">
                        <h2 className="text-4xl font-black">{totalTasks}</h2>
                        <span className="text-gray-400 font-bold">TOTAL TASKS</span>
                    </div>

                    <div className="bar-chart-container mt-8">
                        <div className="bar-chart">
                            {distributionData.map((d) => (
                                <div key={d.label} className="bar-wrapper">
                                    <div
                                        className="bar"
                                        style={{
                                            height: `${Math.max(d.value, 5)}%`,
                                            backgroundColor: d.color,
                                        }}
                                    >
                                        <span className="bar-value">{d.count}</span>
                                    </div>
                                    <span>{d.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CALENDAR */}
                <div className="analytics-card calendar">
                    <div className="card-header">
                        <h3>Calendar</h3>
                        <div className="flex gap-2">
                            <button
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() =>
                                    currentMonth === 0
                                        ? (setCurrentMonth(11), setCurrentYear(y => y - 1))
                                        : setCurrentMonth(m => m - 1)
                                }
                            >
                                ◀
                            </button>
                            <button
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() =>
                                    currentMonth === 11
                                        ? (setCurrentMonth(0), setCurrentYear(y => y + 1))
                                        : setCurrentMonth(m => m + 1)
                                }
                            >
                                ▶
                            </button>
                        </div>
                    </div>

                    <h4 className="mt-4 font-bold">{monthName} {currentYear}</h4>

                    <div className="calendar-grid">
                        {["S", "M", "T", "W", "T", "F", "S"].map(d => (
                            <span key={d} className="day-label">{d}</span>
                        ))}

                        {/* Empty slots before first day */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <span key={`empty-${i}`} />
                        ))}

                        {/* Dates */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const date = i + 1;
                            const isToday =
                                date === today.getDate() &&
                                currentMonth === today.getMonth() &&
                                currentYear === today.getFullYear();

                            return (
                                <span
                                    key={date}
                                    className={`date ${isToday ? "active" : ""}`}
                                >
                                    {date}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Progress;