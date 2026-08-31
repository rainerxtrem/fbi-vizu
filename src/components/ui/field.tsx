import { cn } from "@/lib/cn";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required ? <span className="text-federal-accent"> *</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-navy-400">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-federal-accent">{error}</p> : null}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("field-input", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={4}
      {...props}
      className={cn("field-input resize-y", props.className)}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn("field-input pr-8", props.className)}>
      {props.children}
    </select>
  );
}
