interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-6 py-16 text-center"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"
      />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
