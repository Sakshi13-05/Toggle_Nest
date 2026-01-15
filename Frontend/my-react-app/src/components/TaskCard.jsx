export default function TaskCard({ task }) {
return (
<div className="bg-[#1f2430] border border-gray-700 rounded-lg p-3 hover:border-green-400 transition">
<p className="text-sm mb-3">{task.title}</p>


<div className="flex justify-between items-center text-xs">
<span className="px-2 py-1 rounded bg-[#2a303d] text-gray-300">
{task.priority}
</span>
<span className="text-gray-400">{task.due}</span>
</div>
</div>
);
}