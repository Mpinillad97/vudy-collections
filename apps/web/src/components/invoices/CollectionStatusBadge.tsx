import { StatusBadge } from '../payment-requests/StatusBadge';
import type { PaymentRequest } from '../../types/payment-request';

/**
 * The invoice-level view of collection status: "Awaiting collection" until a
 * Payment Request exists, then the real Vudy status (via StatusBadge) —
 * same visual system used everywhere else, never a separately invented state.
 */
export function CollectionStatusBadge({ paymentRequest }: { paymentRequest: PaymentRequest | null }) {
  if (!paymentRequest) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        Pendiente de cobro
      </span>
    );
  }

  return <StatusBadge status={paymentRequest.status} />;
}
