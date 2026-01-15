export default function StatCard({ title, value }) {
return (
<div className="bg-[#161a23] rounded-xl p-6">
<p className="text-gray-400 text-sm">{title}</p>
<h2 className="text-3xl font-bold mt-2">{value}</h2>
</div>
);
}