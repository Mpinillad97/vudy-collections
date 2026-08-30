import { Link } from 'react-router-dom';
import { formatAmount, formatDate } from '../../lib/format';
import type { PaymentRequest } from '../../types/payment-request';

interface PaymentRequestListProps {
  paymentRequests: PaymentRequest[];
}

export function PaymentRequestList({ paymentRequests }: PaymentRequestListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Vudy request ID</th>
            <th className="px-4 py-3">Invoice</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Currency</th>
            <th className="px-4 py-3">Chain / token</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paymentRequests.map((paymentRequest) => (
            <tr key={paymentRequest.id}>
              <td className="break-all px-4 py-3 font-medium text-slate-900">
                {paymentRequest.vudyRequestId}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {paymentRequest.invoiceId ? (
                  <Link to={`/invoices/${paymentRequest.invoiceId}`} className="hover:underline">
                    {paymentRequest.invoiceId}
                  </Link>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatAmount(paymentRequest.amount)}</td>
              <td className="px-4 py-3 text-slate-600">{paymentRequest.currencyToken}</td>
              <td className="px-4 py-3 text-slate-600">
                {paymentRequest.requestedChain} / {paymentRequest.requestedToken}
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDate(paymentRequest.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
