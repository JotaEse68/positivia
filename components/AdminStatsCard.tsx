type Props = {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "green" | "red" | "neutral";
};

export default function AdminStatsCard({ label, value, hint, accent = "neutral" }: Props) {
  const color =
    accent === "green"
      ? "text-green-600"
      : accent === "red"
        ? "text-red-600"
        : "text-neutral-900";
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
