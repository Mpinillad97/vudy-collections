import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';

const AREAS = [
  {
    to: '/customers',
    title: 'Customers',
    description: 'View the customers Collections has on file.',
  },
  {
    to: '/invoices',
    title: 'Invoices',
    description: 'Track invoices issued to your customers.',
  },
  {
    to: '/payment-requests',
    title: 'Payment Requests',
    description: 'See payment requests created through Vudy.',
  },
] as const;

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome to Vudy Collections
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Collections helps you manage customers, issue invoices, and collect payments through
          Vudy — all from one place. Use the sections below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((area) => (
          <Link key={area.to} to={area.to} className="group block">
            <Card className="h-full transition-colors group-hover:border-slate-300 group-hover:bg-slate-50">
              <h2 className="text-base font-semibold text-slate-900">{area.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{area.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-slate-900">
                Go to {area.title} →
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
