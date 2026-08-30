interface ErrorStateProps {
  title?: string;
  message: string;
}

export function ErrorState({ title = 'Something went wrong', message }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-6 py-16 text-center"
    >
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      <p className="max-w-sm text-sm text-red-700">{message}</p>
    </div>
  );
}
