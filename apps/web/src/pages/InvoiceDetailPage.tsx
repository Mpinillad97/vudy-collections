import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CollectionStatusBadge } from '../components/invoices/CollectionStatusBadge';
import { CreatePaymentRequestForm } from '../components/payment-requests/CreatePaymentRequestForm';
import { StatusBadge, translateVudyStatus } from '../components/payment-requests/StatusBadge';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { LoadingState } from '../components/states/LoadingState';
import { SuccessState } from '../components/states/SuccessState';
import { ApiError } from '../lib/api/client';
import { getCustomer } from '../lib/api/customers';
import { checkInvoicePaymentRequestStatus, getInvoice } from '../lib/api/invoices';
import { formatAmount, formatDate } from '../lib/format';
import type { Customer } from '../types/customer';
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
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentRequestMessage, setPaymentRequestMessage] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusCheckMessage, setStatusCheckMessage] = useState<string | null>(null);
  const [statusCheckError, setStatusCheckError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    if (!id) {
      setErrorMessage('No se proporcionó un identificador de factura.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const data = await getInvoice(id);
      setInvoice(data);
      setStatus('success');
      // The customer is a "nice to have" here — this page must still work
      // even if it can't be resolved, so it fails silently and falls back
      // to showing the raw customerId.
      try {
        setCustomer(await getCustomer(data.customerId));
      } catch {
        setCustomer(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'No se pudo cargar esta factura.');
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
    setPaymentRequestMessage('Solicitud de pago creada. Comparte la página de pago con tu cliente.');
    if (!id) return;
    try {
      const fresh = await getInvoice(id);
      setInvoice(fresh);
    } catch {
      setPaymentRequestMessage(
        `La solicitud de pago ${paymentRequest.vudyRequestId} fue creada, pero la página no se pudo actualizar automáticamente. Recarga para verla.`,
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
      const translatedStatus = updated.status ? translateVudyStatus(updated.status) : 'desconocido';
      setStatusCheckMessage(`Estado actualizado: ${translatedStatus}.`);
    } catch (error) {
      setStatusCheckError(
        error instanceof ApiError ? error.message : 'No se pudo actualizar el estado de la solicitud de pago.',
      );
    } finally {
      setCheckingStatus(false);
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Facturas', to: '/invoices' }, { label: invoice?.number ?? 'Factura' }]} />
      <PageHeader
        title={invoice ? `Factura ${invoice.number}` : 'Factura'}
        description="Detalle comercial y estado de cobro de esta factura."
      />

      {status === 'loading' ? <LoadingState /> : null}
      {status === 'error' ? <ErrorState title="No se pudo cargar la factura" message={errorMessage} /> : null}

      {status === 'success' && invoice ? (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Debe</p>
                {customer ? (
                  <Link
                    to={`/customers/${customer.id}`}
                    className="mt-1 block text-lg font-semibold text-slate-900 hover:underline"
                  >
                    {customer.name}
                  </Link>
                ) : (
                  <p className="mt-1 text-lg font-semibold text-slate-900">{invoice.customerId}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Monto adeudado</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatAmount(invoice.amount)} {invoice.currency}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Estado de cobro
              </span>
              <CollectionStatusBadge paymentRequest={invoice.paymentRequest} />
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <Field label="Fecha de vencimiento" value={formatDate(invoice.dueDate)} />
              <Field label="Fecha de factura" value={formatDate(invoice.createdAt)} />
            </dl>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Cobranza</h2>

            {paymentRequestMessage ? (
              <SuccessState message={paymentRequestMessage} className="mt-4" />
            ) : null}

            {statusCheckMessage ? (
              <SuccessState message={statusCheckMessage} className="mt-4" />
            ) : null}

            {statusCheckError ? <p className="mt-4 text-sm text-red-600">{statusCheckError}</p> : null}

            {invoice.paymentRequest ? (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-600">Solicitud de pago creada a través de Vudy.</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Solicitud Vudy: <span className="font-mono">{invoice.paymentRequest.vudyRequestId}</span>
                    </p>
                  </div>
                  <StatusBadge status={invoice.paymentRequest.status} />
                </div>

                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Monto solicitado" value={formatAmount(invoice.paymentRequest.amount)} />
                  <Field label="Red" value={invoice.paymentRequest.requestedChain} />
                  <Field label="Token" value={invoice.paymentRequest.requestedToken} />
                </dl>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={invoice.paymentRequest.vudyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    Abrir página de pago ↗
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                  >
                    {checkingStatus ? 'Actualizando…' : 'Actualizar estado'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <EmptyState
                  title="Esta factura aún no tiene una solicitud de pago"
                  description="Crea una solicitud de pago para gestionar el cobro a través de la infraestructura de Vudy — tu cliente paga a través de Vudy y tú das seguimiento al resultado aquí."
                />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Crear solicitud de pago</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Elige la red y el token que tu cliente usará para pagar.
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
            ← Volver a Facturas
          </Link>
        </div>
      ) : null}
    </div>
  );
}
