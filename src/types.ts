export interface DailyRecord {
  id: string;
  employee_name: string;
  work_date: string;
  start_time: string;
  end_time: string;
  shift_type: 'diurno' | 'noturno' | 'personalizado';
  value: number;
  notes: string;
  created_at: string;
}

export interface ShiftPreset {
  key: 'diurno' | 'noturno' | 'personalizado';
  label: string;
  start_time: string;
  end_time: string;
  value: number;
  description: string;
}

export const SHIFT_PRESETS: ShiftPreset[] = [
  {
    key: 'diurno',
    label: 'Diurno',
    start_time: '11:00',
    end_time: '19:00',
    value: 120,
    description: '11h às 19h — R$ 120,00',
  },
  {
    key: 'noturno',
    label: 'Noturno',
    start_time: '12:00',
    end_time: '00:00',
    value: 200,
    description: '12h às 00h — R$ 200,00',
  },
  {
    key: 'personalizado',
    label: 'Personalizado',
    start_time: '',
    end_time: '',
    value: 0,
    description: 'Defina horário e valor manualmente',
  },
];

export function calcHoursWorked(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  return (endMinutes - startMinutes) / 60;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}
