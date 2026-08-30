import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { ApiError } from '../lib/api/client';
import { getInvoice } from '../lib/api/invoices';
import { formatAmount, formatDate } from '../lib/format';
import type { InvoiceWithPaymentRequest } from '../types/invoice';

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

  useEffect(() => {
    if (!id) {
      setErrorMessage('No invoice id was provided.');
      setStatus('error');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    getInvoice(id)
      .then((data) => {
        if (cancelled) return;
        setInvoice(data);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : 'Could not load this invoice.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

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
              <div className="mt-4">
                <EmptyState
                  title="No payment request yet"
                  description="This invoice does not have a payment request associated with it."
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
