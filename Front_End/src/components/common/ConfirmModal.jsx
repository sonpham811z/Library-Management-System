import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * ConfirmModal — thay thế window.confirm()
 * Props:
 *   isOpen, onClose, onConfirm  — required
 *   title    — tiêu đề modal (default: "Xác nhận")
 *   message  — nội dung xác nhận
 *   confirmLabel  — nhãn nút xác nhận (default: "Xác nhận")
 *   variant  — "danger" | "warning" (default: "danger")
 *   loading  — trạng thái loading nút xác nhận
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xác nhận',
  variant = 'danger',
  loading = false,
}) => {
  const iconColor  = variant === 'warning' ? 'text-amber-500' : 'text-red-500';
  const iconBg     = variant === 'warning' ? 'bg-amber-50'    : 'bg-red-50';
  const btnVariant = variant === 'warning' ? 'warning'        : 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
          <AlertTriangle size={24} className={iconColor} />
        </div>
        {message && (
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{message}</p>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={onConfirm}
          loading={loading}
          className={
            variant === 'warning'
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
