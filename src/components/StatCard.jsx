export default function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100">
      <div className="flex justify-between">
        <div>
          <p className="text-slate-500 text-sm">{title}</p>

          <h2 className={`text-5xl font-bold mt-5 ${color}`}>{value}</h2>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
