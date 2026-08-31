import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { ApiError } from '../../lib/api/client';
import { createInvoicePaymentRequest } from '../../lib/api/invoices';
import { NETWORK_OPTIONS, TOKEN_OPTIONS } from '../../lib/vudyOptions';
import type { PaymentRequest } from '../../types/payment-request';

const INPUT_CLASSNAME =
  'mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700 disabled:bg-stone-100 disabled:text-stone-400';

interface CreatePaymentRequestFormProps {
  invoiceId: string;
  onCreated: (paymentRequest: PaymentRequest) => void;
}

/**
 * Deliberately minimal: requestedChain/requestedToken are the only fields
 * POST /invoices/:id/payment-request accepts. Amount and currency are NOT
 * inputs here — the backend derives them from the Invoice itself. Both
 * fields are selects (not free text) so the user can't guess at an
 * unsupported network/token identifier.
 */
export function CreatePaymentRequestForm({ invoiceId, onCreated }: CreatePaymentRequestFormProps) {
  const [requestedChain, setRequestedChain] = useState(NETWORK_OPTIONS[0].value);
  const [requestedToken, setRequestedToken] = useState(TOKEN_OPTIONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Defense in depth against double submit — the button is already
    // disabled while submitting, so this should never actually trigger.
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const paymentRequest = await createInvoicePaymentRequest(invoiceId, {
        requestedChain,
        requestedToken,
      });
      onCreated(paymentRequest);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'No se pudo crear la solicitud de pago.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pr-chain" className="block text-sm font-medium text-slate-700">
            Red de pago
          </label>
          <select
            id="pr-chain"
            value={requestedChain}
            onChange={(event) => setRequestedChain(event.target.value)}
            disabled={submitting}
            className={INPUT_CLASSNAME}
          >
            {NETWORK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pr-token" className="block text-sm font-medium text-slate-700">
            Token de pago
          </label>
          <select
            id="pr-token"
            value={requestedToken}
            onChange={(event) => setRequestedToken(event.target.value)}
            disabled={submitting}
            className={INPUT_CLASSNAME}
          >
            {TOKEN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enviando…' : 'Crear solicitud de pago'}
        </Button>
      </div>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
    </form>
  );
}
