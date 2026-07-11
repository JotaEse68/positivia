type Props = {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "green" | "red" | "neutral";
};

export default function AdminStatsCard({ label, value, hint, accent = "neutral" }: Props) {
  const color =
    accent === "green"
      ? "text-[#27765B]"
      : accent === "red"
        ? "text-[#EF735C]"
        : "text-[#102D2A]";
  return (
    <div className="rounded-2xl border border-[#102D2A]/10 bg-white p-5">
      <p className="text-sm text-[#53655E]">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-[#8A6B3E]">{hint}</p>}
    </div>
  );
}
