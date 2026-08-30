import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { CreatePaymentRequestForm } from '../components/payment-requests/CreatePaymentRequestForm';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { ApiError } from '../lib/api/client';
import { getInvoice } from '../lib/api/invoices';
import { formatAmount, formatDate } from '../lib/format';
import type { InvoiceWithPaymentRequest } from '../types/invoice';
import type { PaymentRequest } from '../types/payment-request';

type Status = 'loading' | 'success' | 'error';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [invoice, setInvoice] = useState<InvoiceWithPaymentRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentRequestMessage, setPaymentRequestMessage] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    if (!id) {
      setErrorMessage('No invoice id was provided.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const data = await getInvoice(id);
      setInvoice(data);
      setStatus('success');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this invoice.');
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  // Re-fetches the invoice from the backend after a successful creation
  // instead of fabricating the merged object locally, per M3.3 guidance —
  // GET /invoices/:id is the definitive source of truth.
  async function handlePaymentRequestCreated(paymentRequest: PaymentRequest) {
    setPaymentRequestMessage(`Payment request ${paymentRequest.vudyRequestId} was created.`);
    if (!id) return;
    try {
      const fresh = await getInvoice(id);
      setInvoice(fresh);
    } catch {
      setPaymentRequestMessage(
        `Payment request ${paymentRequest.vudyRequestId} was created, but the page could not refresh automatically. Reload to see it.`,
      );
    }
  }

  return (
    <div>
      <PageHeader title="Invoice detail" description="Details for a single invoice." />

      {status === 'loading' ? <LoadingState /> : null}
      {status === 'error' ? <ErrorState title="Could not load invoice" message={errorMessage} /> : null}

      {status === 'success' && invoice ? (
        <div className="flex flex-col gap-4">
          <Card>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Invoice number" value={invoice.number} />
              <Field label="Customer ID" value={invoice.customerId} />
              <Field label="Amount" value={formatAmount(invoice.amount)} />
              <Field label="Currency" value={invoice.currency} />
              <Field label="Due date" value={formatDate(invoice.dueDate)} />
              <Field label="Created" value={formatDate(invoice.createdAt)} />
            </dl>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Payment request</h2>

            {paymentRequestMessage ? (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {paymentRequestMessage}
              </div>
            ) : null}

            {invoice.paymentRequest ? (
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Vudy request ID" value={invoice.paymentRequest.vudyRequestId} />
                <Field
                  label="Chain / token"
                  value={`${invoice.paymentRequest.requestedChain} / ${invoice.paymentRequest.requestedToken}`}
                />
                <Field label="Amount" value={formatAmount(invoice.paymentRequest.amount)} />
                <Field label="Currency" value={invoice.paymentRequest.currencyToken} />
                <div className="sm:col-span-2">
                  <Field label="Payment URL" value={invoice.paymentRequest.vudyUrl} />
                </div>
                <Field label="Created" value={formatDate(invoice.paymentRequest.createdAt)} />
              </dl>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <EmptyState
                  title="No payment request yet"
                  description="Create one below using this invoice's amount and currency."
                />
                <CreatePaymentRequestForm
                  invoiceId={invoice.id}
                  onCreated={handlePaymentRequestCreated}
                />
              </div>
            )}
          </Card>

          <Link to="/invoices" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Back to invoices
          </Link>
        </div>
      ) : null}
    </div>
  );
}
