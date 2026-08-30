interface SuccessStateProps {
  message: string;
  className?: string;
}

export function SuccessState({ message, className = 'mb-4' }: SuccessStateProps) {
  return (
    <div
      role="status"
      className={`rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ${className}`}
    >
      {message}
    </div>
  );
}
