import React, { useState } from "react";
import { Search, Plus, Check, MessageSquare, Briefcase, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ searchQuery, setSearchQuery, queries, setQueries }) {
  const [newQuery, setNewQuery] = useState("");

  const handleAddQuery = () => {
    if (newQuery.trim()) {
      setQueries([...queries, { id: Date.now(), text: newQuery, solved: false }]);
      setNewQuery("");
    }
  };

  const handleResolveQuery = (id) => {
    setQueries(queries.map(q => q.id === id ? { ...q, solved: true } : q));
  };

  return (
    <aside className="w-80 bg-[#FAFAFA] border-r border-gray-200 flex flex-col h-screen font-sans text-black shadow-sm overflow-y-auto">
      {/* 1. Header & Logo */}
      <div className="p-6 pb-4">
        <h1 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2">
          <span className="text-blue-600">⚡</span>
          <span>ToggleNest</span>
        </h1>

        {/* 2. Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-black focus:ring-0 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 3. Team Contacts */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Team Contacts</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">AS</div>
            <div>
              <p className="text-sm font-medium">Alice Smith</p>
              <p className="text-xs text-slate-500">alice@edu.global</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">JD</div>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-slate-500">john@edu.global</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Projects Menu */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Projects</h3>
        <div className="space-y-1">
          <div className="flex justify-between items-center group cursor-pointer">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-black" />
              <span className="text-sm font-bold">Apex Rebrand</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div className="flex items-center gap-2 py-2 text-slate-500 hover:text-black transition-colors cursor-pointer">
            <span className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-[10px] text-transparent group-hover:text-slate-500">#</span>
            <span className="text-sm">Q1 Marketing</span>
          </div>
          <div className="flex items-center gap-2 py-1 text-slate-500 hover:text-black transition-colors cursor-pointer">
            <span className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-[10px]">#</span>
            <span className="text-sm">Website Overhaul</span>
          </div>
        </div>
      </div>

      {/* 5. Query Box (New Feature) */}
      <div className="px-6 py-4 border-t border-gray-100 flex-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          Tasks & Queries
        </h3>

        <div className="mb-4">
          <label className="text-xs font-medium mb-2 block">Drop a Query</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              placeholder="Type here..."
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-black outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddQuery()}
            />
            <button
              onClick={handleAddQuery}
              className="bg-black text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {queries.map((q) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-start gap-2 text-sm group"
              >
                <button
                  onClick={() => handleResolveQuery(q.id)}
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${q.solved ? 'bg-black border-black text-white' : 'border-gray-300 hover:border-black'}`}
                >
                  {q.solved && <Check size={10} />}
                </button>
                <span className={`flex-1 transition-all ${q.solved ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {q.text}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {queries.length === 0 && <p className="text-xs text-slate-400 italic">No active queries.</p>}
        </div>
      </div>

      {/* 6. Core Team */}
      <div className="px-6 py-4 border-t border-gray-100 bg-[#F8F8F8]">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Core Team</h3>
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-[10px] text-slate-600 font-bold overflow-hidden">
              <User size={16} className="mt-2" />
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-white bg-white flex items-center justify-center text-xs text-slate-500 font-medium">
            +4
          </div>
        </div>
      </div>

    </aside>
  );
}
