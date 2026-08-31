/**
 * Reflects only the literal status Vudy returned ("pending"/"completed", or
 * whatever else it may send) — never an inferred or invented state. Null
 * means the status has never been checked yet, which is deliberately
 * distinct from "pending".
 */
export function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        Not checked yet
      </span>
    );
  }

  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const className =
    status === 'completed'
      ? 'inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800'
      : 'inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800';

  return <span className={className}>{label}</span>;
}
