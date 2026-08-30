import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { ApiError } from '../../lib/api/client';
import { createCustomer } from '../../lib/api/customers';
import type { Customer } from '../../types/customer';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
}

interface CustomerFormProps {
  onCreated: (customer: Customer) => void;
}

export function CustomerForm({ onCreated }: CustomerFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = 'Name is required.';
    }
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
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
      const customer = await createCustomer({ name: name.trim(), email: email.trim() });
      setName('');
      setEmail('');
      setFieldErrors({});
      onCreated(customer);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Could not create the customer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="customer-name" className="block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="customer-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        />
        {fieldErrors.name ? <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p> : null}
      </div>

      <div>
        <label htmlFor="customer-email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="customer-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
        />
        {fieldErrors.email ? <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p> : null}
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create customer'}
        </Button>
      </div>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
    </form>
  );
}
