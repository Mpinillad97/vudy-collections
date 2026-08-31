import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { ApiError } from '../../lib/api/client';
import { createInvoicePaymentRequest } from '../../lib/api/invoices';
import type { PaymentRequest } from '../../types/payment-request';

const INPUT_CLASSNAME =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400';

interface FieldErrors {
  requestedChain?: string;
  requestedToken?: string;
}

interface CreatePaymentRequestFormProps {
  invoiceId: string;
  onCreated: (paymentRequest: PaymentRequest) => void;
}

/**
 * Deliberately minimal: requestedChain/requestedToken are the only fields
 * POST /invoices/:id/payment-request accepts. Amount and currency are NOT
 * inputs here — the backend derives them from the Invoice itself.
 */
export function CreatePaymentRequestForm({ invoiceId, onCreated }: CreatePaymentRequestFormProps) {
  const [requestedChain, setRequestedChain] = useState('');
  const [requestedToken, setRequestedToken] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!requestedChain.trim()) {
      errors.requestedChain = 'La red es obligatoria.';
    }
    if (!requestedToken.trim()) {
      errors.requestedToken = 'El token es obligatorio.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Defense in depth against double submit — the button is already
    // disabled while submitting, so this should never actually trigger.
    if (submitting) {
      return;
    }
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const paymentRequest = await createInvoicePaymentRequest(invoiceId, {
        requestedChain: requestedChain.trim(),
        requestedToken: requestedToken.trim(),
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
          <input
            id="pr-chain"
            type="text"
            value={requestedChain}
            onChange={(event) => setRequestedChain(event.target.value)}
            placeholder="ethereum"
            disabled={submitting}
            aria-invalid={fieldErrors.requestedChain ? true : undefined}
            aria-describedby={fieldErrors.requestedChain ? 'pr-chain-error' : undefined}
            className={INPUT_CLASSNAME}
          />
          {fieldErrors.requestedChain ? (
            <p id="pr-chain-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.requestedChain}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="pr-token" className="block text-sm font-medium text-slate-700">
            Token de pago
          </label>
          <input
            id="pr-token"
            type="text"
            value={requestedToken}
            onChange={(event) => setRequestedToken(event.target.value)}
            placeholder="USDC"
            disabled={submitting}
            aria-invalid={fieldErrors.requestedToken ? true : undefined}
            aria-describedby={fieldErrors.requestedToken ? 'pr-token-error' : undefined}
            className={INPUT_CLASSNAME}
          />
          {fieldErrors.requestedToken ? (
            <p id="pr-token-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.requestedToken}
            </p>
          ) : null}
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
