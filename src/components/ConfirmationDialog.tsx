interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold text-white">
            {title}
          </h3>

          <div className="space-y-3">
            <p className="text-slate-300 leading-relaxed">
              {message}
            </p>

            <p className="text-slate-200 font-medium">
              Would you like to continue?
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              No
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
