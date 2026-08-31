/**
 * Translates only the literal status values Vudy documents/returns
 * ("pending"/"completed") into Spanish. Any other value is shown verbatim
 * (capitalized) rather than guessed at — we never invent a translation for
 * a state we haven't actually observed from Vudy.
 */
export function translateVudyStatus(status: string): string {
  if (status === 'pending') return 'Pendiente';
  if (status === 'completed') return 'Completado';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Reflects only the literal status Vudy returned — never an inferred or
 * invented state. Null means the status has never been checked yet, which
 * is deliberately distinct from "pending".
 */
export function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        Sin verificar aún
      </span>
    );
  }

  const className =
    status === 'completed'
      ? 'inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800'
      : 'inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800';

  return <span className={className}>{translateVudyStatus(status)}</span>;
}
