import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { ApiError } from '../../lib/api/client';
import { createInvoice } from '../../lib/api/invoices';
import type { Customer } from '../../types/customer';
import type { Invoice } from '../../types/invoice';

const INPUT_CLASSNAME =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400';

interface FieldErrors {
  customerId?: string;
  number?: string;
  amount?: string;
  currency?: string;
  dueDate?: string;
}

type CustomersStatus = 'loading' | 'success' | 'error';

interface InvoiceFormProps {
  customers: Customer[];
  customersStatus: CustomersStatus;
  onCreated: (invoice: Invoice) => void;
  /** Pre-selects the customer, e.g. when arriving from that customer's detail page. */
  initialCustomerId?: string;
}

export function InvoiceForm({
  customers,
  customersStatus,
  onCreated,
  initialCustomerId = '',
}: InvoiceFormProps) {
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const noCustomersAvailable = customersStatus === 'success' && customers.length === 0;
  const customerSelectDisabled = submitting || customersStatus !== 'success' || noCustomersAvailable;

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!customerId) {
      errors.customerId = 'Selecciona un cliente.';
    }
    if (!number.trim()) {
      errors.number = 'El número de factura es obligatorio.';
    }

    const numericAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = 'Ingresa un monto positivo.';
    }

    if (!currency.trim()) {
      errors.currency = 'La moneda es obligatoria.';
    }

    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      errors.dueDate = 'Ingresa una fecha de vencimiento válida.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const invoice = await createInvoice({
        customerId,
        number: number.trim(),
        amount: Number(amount),
        currency: currency.trim(),
        dueDate,
      });
      setCustomerId('');
      setNumber('');
      setAmount('');
      setCurrency('');
      setDueDate('');
      setFieldErrors({});
      onCreated(invoice);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'No se pudo crear la factura.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="invoice-customer" className="block text-sm font-medium text-slate-700">
          Cliente
        </label>
        <select
          id="invoice-customer"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          disabled={customerSelectDisabled}
          aria-invalid={fieldErrors.customerId ? true : undefined}
          aria-describedby={fieldErrors.customerId ? 'invoice-customer-error' : undefined}
          className={INPUT_CLASSNAME}
        >
          <option value="">
            {customersStatus === 'loading' ? 'Cargando clientes…' : 'Selecciona un cliente'}
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {fieldErrors.customerId ? (
          <p id="invoice-customer-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.customerId}
          </p>
        ) : null}
        {customersStatus === 'error' ? (
          <p className="mt-1 text-sm text-red-600">
            No se pudieron cargar los clientes. Actualiza la página e inténtalo de nuevo.
          </p>
        ) : null}
        {noCustomersAvailable ? (
          <p className="mt-1 text-sm text-slate-500">Aún no hay clientes — crea uno primero.</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="invoice-number" className="block text-sm font-medium text-slate-700">
          Número de factura
        </label>
        <input
          id="invoice-number"
          type="text"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="FAC-001"
          disabled={submitting}
          aria-invalid={fieldErrors.number ? true : undefined}
          aria-describedby={fieldErrors.number ? 'invoice-number-error' : undefined}
          className={INPUT_CLASSNAME}
        />
        {fieldErrors.number ? (
          <p id="invoice-number-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.number}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="invoice-amount" className="block text-sm font-medium text-slate-700">
            Monto
          </label>
          <input
            id="invoice-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={submitting}
            aria-invalid={fieldErrors.amount ? true : undefined}
            aria-describedby={fieldErrors.amount ? 'invoice-amount-error' : undefined}
            className={INPUT_CLASSNAME}
          />
          {fieldErrors.amount ? (
            <p id="invoice-amount-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.amount}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="invoice-currency" className="block text-sm font-medium text-slate-700">
            Moneda
          </label>
          <input
            id="invoice-currency"
            type="text"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            placeholder="USD"
            disabled={submitting}
            aria-invalid={fieldErrors.currency ? true : undefined}
            aria-describedby={fieldErrors.currency ? 'invoice-currency-error' : undefined}
            className={INPUT_CLASSNAME}
          />
          {fieldErrors.currency ? (
            <p id="invoice-currency-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.currency}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="invoice-due-date" className="block text-sm font-medium text-slate-700">
          Fecha de vencimiento
        </label>
        <input
          id="invoice-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          disabled={submitting}
          aria-invalid={fieldErrors.dueDate ? true : undefined}
          aria-describedby={fieldErrors.dueDate ? 'invoice-due-date-error' : undefined}
          className={INPUT_CLASSNAME}
        />
        {fieldErrors.dueDate ? (
          <p id="invoice-due-date-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.dueDate}
          </p>
        ) : null}
      </div>

      <div>
        <Button type="submit" disabled={submitting || customerSelectDisabled}>
          {submitting ? 'Creando…' : 'Crear factura'}
        </Button>
      </div>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
    </form>
  );
}
