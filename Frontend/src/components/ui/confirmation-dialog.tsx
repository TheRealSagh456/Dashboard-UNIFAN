import { TriangleAlert, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "./button";
import { Text } from "./typography";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#03060b]/70 backdrop-blur-sm"
        aria-label="Fechar confirmação"
        disabled={loading}
        onClick={onClose}
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
        className="relative w-full max-w-md rounded-3xl border border-line bg-paper p-6 shadow-soft sm:p-7"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          aria-label="Fechar"
          disabled={loading}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
        <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-negative/12 text-negative">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </span>
        <Text id="confirmation-title" as="h2" variant="h2" className="pr-10">
          {title}
        </Text>
        <Text id="confirmation-description" tone="muted" className="mt-3">
          {description}
        </Text>
        {error && (
          <Text role="alert" variant="caption" tone="negative" className="mt-4">
            {error}
          </Text>
        )}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={cancelButtonRef}
            variant="ghost"
            disabled={loading}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {loading ? "Limpando dados..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
