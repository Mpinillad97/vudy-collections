import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { ApiError } from '../../lib/api/client';
import { createCustomer } from '../../lib/api/customers';
import type { Customer } from '../../types/customer';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_CLASSNAME =
  'mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700 disabled:bg-stone-100 disabled:text-stone-400';

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
      errors.name = 'El nombre es obligatorio.';
    }
    if (!email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Ingresa un correo electrónico válido.';
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
      setSubmitError(error instanceof ApiError ? error.message : 'No se pudo crear el cliente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="customer-name" className="block text-sm font-medium text-slate-700">
          Nombre
        </label>
        <input
          id="customer-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={submitting}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? 'customer-name-error' : undefined}
          className={INPUT_CLASSNAME}
        />
        {fieldErrors.name ? (
          <p id="customer-name-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="customer-email" className="block text-sm font-medium text-slate-700">
          Correo electrónico
        </label>
        <input
          id="customer-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? 'customer-email-error' : undefined}
          className={INPUT_CLASSNAME}
        />
        {fieldErrors.email ? (
          <p id="customer-email-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creando…' : 'Crear cliente'}
        </Button>
      </div>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
    </form>
  );
}
