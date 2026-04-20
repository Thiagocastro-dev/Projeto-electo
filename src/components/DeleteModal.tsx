import { Trash2, X } from 'lucide-react';
import { DailyRecord, formatCurrency, formatDate } from '../types';

interface DeleteModalProps {
  record: DailyRecord;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

export default function DeleteModal({ record, onConfirm, onClose, loading }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Excluir registro?</h3>
          <p className="text-sm text-gray-500 mb-1">
            <span className="font-medium text-gray-700">{record.employee_name}</span>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {formatDate(record.work_date)} — {formatCurrency(record.value)}
          </p>
          <p className="text-xs text-red-500 mb-5">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition disabled:opacity-60"
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
