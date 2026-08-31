import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CreatePaymentRequestForm } from '../components/payment-requests/CreatePaymentRequestForm';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { SuccessState } from '../components/states/SuccessState';
import { ApiError } from '../lib/api/client';
import { checkInvoicePaymentRequestStatus, getInvoice } from '../lib/api/invoices';
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

/**
 * Reflects only the literal status Vudy returned ("pending"/"completed", or
 * whatever else it may send) — never an inferred or invented state. Null
 * means the status has never been checked yet, which is deliberately
 * distinct from "pending".
 */
function StatusBadge({ status }: { status: string | null }) {
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
      : 'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700';

  return <span className={className}>Payment Request — {label}</span>;
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [invoice, setInvoice] = useState<InvoiceWithPaymentRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentRequestMessage, setPaymentRequestMessage] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusCheckMessage, setStatusCheckMessage] = useState<string | null>(null);
  const [statusCheckError, setStatusCheckError] = useState<string | null>(null);

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

  // On-demand only — queries Vudy fresh via the backend and persists
  // whatever it returns. Never inferred/defaulted on error: a failed check
  // must never be shown as "Pending" or "Completed".
  async function handleCheckStatus() {
    if (!id) return;

    setCheckingStatus(true);
    setStatusCheckError(null);
    setStatusCheckMessage(null);
    try {
      const updated = await checkInvoicePaymentRequestStatus(id);
      setInvoice((current) => (current ? { ...current, paymentRequest: updated } : current));
      setStatusCheckMessage(`Status checked: ${updated.status ?? 'unknown'}.`);
    } catch (error) {
      setStatusCheckError(
        error instanceof ApiError ? error.message : 'Could not check the payment request status.',
      );
    } finally {
      setCheckingStatus(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={invoice ? `Invoice ${invoice.number}` : 'Invoice detail'}
        description="Details for a single invoice."
      />

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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">Payment request</h2>
              {invoice.paymentRequest ? (
                <div className="flex items-center gap-3">
                  <StatusBadge status={invoice.paymentRequest.status} />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                  >
                    {checkingStatus ? 'Checking…' : 'Check Status'}
                  </Button>
                </div>
              ) : null}
            </div>

            {paymentRequestMessage ? (
              <SuccessState message={paymentRequestMessage} className="mt-4" />
            ) : null}

            {statusCheckMessage ? (
              <SuccessState message={statusCheckMessage} className="mt-4" />
            ) : null}

            {statusCheckError ? <p className="mt-4 text-sm text-red-600">{statusCheckError}</p> : null}

            {invoice.paymentRequest ? (
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Amount" value={formatAmount(invoice.paymentRequest.amount)} />
                <Field
                  label="Requested chain / token"
                  value={`${invoice.paymentRequest.requestedChain} / ${invoice.paymentRequest.requestedToken}`}
                />
                <Field label="Currency" value={invoice.paymentRequest.currencyToken} />
                <Field label="Vudy request ID" value={invoice.paymentRequest.vudyRequestId} />
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Payer-facing payment
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={invoice.paymentRequest.vudyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      Open Payment Request ↗
                    </a>
                  </dd>
                </div>
                <Field label="Created" value={formatDate(invoice.paymentRequest.createdAt)} />
              </dl>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <EmptyState
                  title="No payment request yet"
                  description="Initiate a collection by creating a real Vudy Payment Request for this invoice's amount and currency."
                />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Create Payment Request</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose the blockchain and token the payer will use to pay this invoice.
                  </p>
                  <div className="mt-3">
                    <CreatePaymentRequestForm
                      invoiceId={invoice.id}
                      onCreated={handlePaymentRequestCreated}
                    />
                  </div>
                </div>
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
