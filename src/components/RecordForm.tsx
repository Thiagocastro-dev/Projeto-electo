import { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, DollarSign, FileText, ChevronDown } from 'lucide-react';
import { DailyRecord, SHIFT_PRESETS, calcHoursWorked, formatCurrency } from '../types';

interface RecordFormProps {
  record?: DailyRecord | null;
  onSubmit: (data: Omit<DailyRecord, 'id' | 'created_at'>) => Promise<void>;
  onClose: () => void;
}

export default function RecordForm({ record, onSubmit, onClose }: RecordFormProps) {
  const [employeeName, setEmployeeName] = useState(record?.employee_name ?? '');
  const [workDate, setWorkDate] = useState(record?.work_date ?? new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState<DailyRecord['shift_type']>(record?.shift_type ?? 'diurno');
  const [startTime, setStartTime] = useState(record?.start_time?.slice(0, 5) ?? '11:00');
  const [endTime, setEndTime] = useState(record?.end_time?.slice(0, 5) ?? '19:00');
  const [value, setValue] = useState(String(record?.value ?? 120));
  const [notes, setNotes] = useState(record?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hours = calcHoursWorked(startTime, endTime);
  const preset = SHIFT_PRESETS.find(p => p.key === shiftType);

  useEffect(() => {
    if (shiftType !== 'personalizado' && preset) {
      setStartTime(preset.start_time);
      setEndTime(preset.end_time);
      setValue(String(preset.value));
    }
  }, [shiftType]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!employeeName.trim()) errs.employeeName = 'Nome obrigatório';
    if (!workDate) errs.workDate = 'Data obrigatória';
    if (!startTime) errs.startTime = 'Horário inicial obrigatório';
    if (!endTime) errs.endTime = 'Horário final obrigatório';
    if (!value || isNaN(Number(value)) || Number(value) < 0) errs.value = 'Valor inválido';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        employee_name: employeeName.trim(),
        work_date: workDate,
        start_time: startTime,
        end_time: endTime,
        shift_type: shiftType,
        value: Number(value),
        notes: notes.trim(),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {record ? 'Editar Diária' : 'Nova Diária'}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {record ? 'Atualize os dados do registro' : 'Preencha os dados do turno trabalhado'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Employee Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome do Funcionário
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={employeeName}
                onChange={e => { setEmployeeName(e.target.value); setErrors(p => ({ ...p, employeeName: '' })); }}
                placeholder="Ex: João da Silva"
                className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition ${errors.employeeName ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
              />
            </div>
            {errors.employeeName && <p className="text-red-500 text-xs mt-1">{errors.employeeName}</p>}
          </div>

          {/* Work Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Data Trabalhada
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={workDate}
                onChange={e => { setWorkDate(e.target.value); setErrors(p => ({ ...p, workDate: '' })); }}
                className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition ${errors.workDate ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
              />
            </div>
            {errors.workDate && <p className="text-red-500 text-xs mt-1">{errors.workDate}</p>}
          </div>

          {/* Shift Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo de Turno
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SHIFT_PRESETS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setShiftType(p.key)}
                  className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all text-center ${
                    shiftType === p.key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{p.label}</div>
                  {p.key !== 'personalizado' && (
                    <div className="text-xs mt-0.5 opacity-70">{formatCurrency(p.value)}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Início</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={startTime}
                  onChange={e => { setStartTime(e.target.value); setErrors(p => ({ ...p, startTime: '' })); }}
                  disabled={shiftType !== 'personalizado'}
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition ${
                    shiftType !== 'personalizado' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-200 bg-gray-50'
                  } ${errors.startTime ? 'border-red-400' : 'border-gray-200'}`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Término</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={endTime}
                  onChange={e => { setEndTime(e.target.value); setErrors(p => ({ ...p, endTime: '' })); }}
                  disabled={shiftType !== 'personalizado'}
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition ${
                    shiftType !== 'personalizado' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-200 bg-gray-50'
                  } ${errors.endTime ? 'border-red-400' : 'border-gray-200'}`}
                />
              </div>
            </div>
          </div>

          {hours > 0 && (
            <p className="text-xs text-gray-500 -mt-2">
              Total: <span className="font-semibold text-gray-700">{hours.toFixed(1)}h trabalhadas</span>
            </p>
          )}

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Valor da Diária (R$)
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={e => { setValue(e.target.value); setErrors(p => ({ ...p, value: '' })); }}
                disabled={shiftType !== 'personalizado'}
                className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition ${
                  shiftType !== 'personalizado' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-200 bg-gray-50'
                } ${errors.value ? 'border-red-400 bg-red-50' : ''}`}
              />
            </div>
            {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observações <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Alguma observação sobre este turno..."
                rows={2}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : record ? 'Salvar Alterações' : 'Registrar Diária'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
