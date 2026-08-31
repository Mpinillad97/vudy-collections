import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/states/EmptyState';

export function NotFoundPage() {
  return (
    <div>
      <PageHeader title="Página no encontrada" description="La página que buscas no existe." />
      <EmptyState
        title="404"
        description="Verifica la dirección o vuelve al inicio."
        action={
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
