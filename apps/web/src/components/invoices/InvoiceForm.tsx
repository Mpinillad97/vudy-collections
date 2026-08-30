import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { ApiError } from '../../lib/api/client';
import { createInvoice } from '../../lib/api/invoices';
import type { Customer } from '../../types/customer';
import type { Invoice } from '../../types/invoice';

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
}

export function InvoiceForm({ customers, customersStatus, onCreated }: InvoiceFormProps) {
  const [customerId, setCustomerId] = useState('');
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const noCustomersAvailable = customersStatus === 'success' && customers.length === 0;
  const customerSelectDisabled = customersStatus !== 'success' || noCustomersAvailable;

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!customerId) {
      errors.customerId = 'Select a customer.';
    }
    if (!number.trim()) {
      errors.number = 'Invoice number is required.';
    }

    const numericAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = 'Enter a positive amount.';
    }

    if (!currency.trim()) {
      errors.currency = 'Currency is required.';
    }

    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      errors.dueDate = 'Enter a valid due date.';
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
      setSubmitError(error instanceof ApiError ? error.message : 'Could not create the invoice.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="invoice-customer" className="block text-sm font-medium text-slate-700">
          Customer
        </label>
        <select
          id="invoice-customer"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          disabled={customerSelectDisabled}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">
            {customersStatus === 'loading' ? 'Loading customers…' : 'Select a customer'}
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {fieldErrors.customerId ? (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.customerId}</p>
        ) : null}
        {customersStatus === 'error' ? (
          <p className="mt-1 text-sm text-red-600">
            Could not load customers. Refresh the page and try again.
          </p>
        ) : null}
        {noCustomersAvailable ? (
          <p className="mt-1 text-sm text-slate-500">No customers yet — create one first.</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="invoice-number" className="block text-sm font-medium text-slate-700">
          Invoice number
        </label>
        <input
          id="invoice-number"
          type="text"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="INV-001"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        />
        {fieldErrors.number ? <p className="mt-1 text-sm text-red-600">{fieldErrors.number}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="invoice-amount" className="block text-sm font-medium text-slate-700">
            Amount
          </label>
          <input
            id="invoice-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          {fieldErrors.amount ? <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p> : null}
        </div>

        <div>
          <label htmlFor="invoice-currency" className="block text-sm font-medium text-slate-700">
            Currency
          </label>
          <input
            id="invoice-currency"
            type="text"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            placeholder="USD"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
          {fieldErrors.currency ? (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.currency}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="invoice-due-date" className="block text-sm font-medium text-slate-700">
          Due date
        </label>
        <input
          id="invoice-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        />
        {fieldErrors.dueDate ? <p className="mt-1 text-sm text-red-600">{fieldErrors.dueDate}</p> : null}
      </div>

      <div>
        <Button type="submit" disabled={submitting || customerSelectDisabled}>
          {submitting ? 'Creating…' : 'Create invoice'}
        </Button>
      </div>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
    </form>
  );
}
