import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, TrendingUp, Users, Calendar, DollarSign, CreditCard as Edit2, Trash2, Sun, Moon, Clock, X, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';
import { DailyRecord, formatCurrency, formatDate, formatTime, calcHoursWorked } from './types';
import RecordForm from './components/RecordForm';
import DeleteModal from './components/DeleteModal';

const SHIFT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  diurno: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  noturno: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  personalizado: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-400' },
};

const SHIFT_LABELS: Record<string, string> = {
  diurno: 'Diurno',
  noturno: 'Noturno',
  personalizado: 'Personalizado',
};

export default function App() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<DailyRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<DailyRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'value_desc' | 'name_asc'>('date_desc');
  const [error, setError] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .order('work_date', { ascending: false });
    if (error) {
      setError('Erro ao carregar registros.');
    } else {
      setRecords(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  async function handleSubmit(data: Omit<DailyRecord, 'id' | 'created_at'>) {
    setError('');
    if (editRecord) {
      const { error } = await supabase
        .from('daily_records')
        .update(data)
        .eq('id', editRecord.id);
      if (error) { setError('Erro ao atualizar registro.'); return; }
    } else {
      const { error } = await supabase.from('daily_records').insert(data);
      if (error) { setError('Erro ao criar registro.'); return; }
    }
    setShowForm(false);
    setEditRecord(null);
    fetchRecords();
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleteLoading(true);
    const { error } = await supabase.from('daily_records').delete().eq('id', deleteRecord.id);
    if (error) setError('Erro ao excluir registro.');
    setDeleteLoading(false);
    setDeleteRecord(null);
    fetchRecords();
  }

  const filtered = records
    .filter(r => {
      const matchName = !searchName || r.employee_name.toLowerCase().includes(searchName.toLowerCase());
      const matchMonth = !filterMonth || r.work_date.startsWith(filterMonth);
      const matchShift = !filterShift || r.shift_type === filterShift;
      return matchName && matchMonth && matchShift;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return b.work_date.localeCompare(a.work_date);
      if (sortBy === 'date_asc') return a.work_date.localeCompare(b.work_date);
      if (sortBy === 'value_desc') return b.value - a.value;
      return a.employee_name.localeCompare(b.employee_name);
    });

  const totalValue = filtered.reduce((s, r) => s + Number(r.value), 0);
  const uniqueEmployees = new Set(filtered.map(r => r.employee_name)).size;
  const totalHours = filtered.reduce((s, r) => s + calcHoursWorked(r.start_time, r.end_time), 0);

  const allEmployees = [...new Set(records.map(r => r.employee_name))].sort();
  const employeeSummary = allEmployees.map(name => {
    const emp = records.filter(r => r.employee_name === name);
    return {
      name,
      count: emp.length,
      total: emp.reduce((s, r) => s + Number(r.value), 0),
    };
  }).sort((a, b) => b.total - a.total).slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-tight">Gestão de Diárias</h1>
                <p className="text-xs text-slate-400 leading-tight">Controle de funcionários</p>
              </div>
            </div>
            <button
              onClick={() => { setEditRecord(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nova Diária</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign size={20} className="text-emerald-600" />}
            bg="bg-emerald-50"
            label="Total em Diárias"
            value={formatCurrency(totalValue)}
            sub={`${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`}
          />
          <StatCard
            icon={<Users size={20} className="text-blue-600" />}
            bg="bg-blue-50"
            label="Funcionários"
            value={String(uniqueEmployees)}
            sub="nos resultados"
          />
          <StatCard
            icon={<Clock size={20} className="text-slate-600" />}
            bg="bg-slate-100"
            label="Horas Totais"
            value={`${totalHours.toFixed(1)}h`}
            sub="horas trabalhadas"
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-amber-600" />}
            bg="bg-amber-50"
            label="Média por Diária"
            value={filtered.length > 0 ? formatCurrency(totalValue / filtered.length) : 'R$ 0'}
            sub="valor médio"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="xl:col-span-3 space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-44">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    placeholder="Buscar funcionário..."
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-slate-50 transition"
                  />
                </div>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-slate-50 text-slate-600 transition"
                />
                <select
                  value={filterShift}
                  onChange={e => setFilterShift(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-slate-50 text-slate-600 transition"
                >
                  <option value="">Todos os turnos</option>
                  <option value="diurno">Diurno</option>
                  <option value="noturno">Noturno</option>
                  <option value="personalizado">Personalizado</option>
                </select>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-slate-50 text-slate-600 transition"
                >
                  <option value="date_desc">Mais recente</option>
                  <option value="date_asc">Mais antigo</option>
                  <option value="value_desc">Maior valor</option>
                  <option value="name_asc">Nome A-Z</option>
                </select>
                {(searchName || filterMonth || filterShift) && (
                  <button
                    onClick={() => { setSearchName(''); setFilterMonth(''); setFilterShift(''); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                  >
                    <X size={14} /> Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={24} className="text-blue-500 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar size={28} className="text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">Nenhum registro encontrado</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {records.length === 0
                      ? 'Clique em "Nova Diária" para começar.'
                      : 'Tente ajustar os filtros.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Funcionário</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Horário</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Turno</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
                          <th className="px-4 py-3 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map(r => {
                          const shift = SHIFT_COLORS[r.shift_type] ?? SHIFT_COLORS.personalizado;
                          const hours = calcHoursWorked(r.start_time, r.end_time);
                          return (
                            <tr key={r.id} className="hover:bg-slate-50 transition group">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {r.employee_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{r.employee_name}</p>
                                    {r.notes && (
                                      <p className="text-xs text-slate-400 truncate max-w-36">{r.notes}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="text-sm text-slate-700">{formatDate(r.work_date)}</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="text-sm text-slate-700 font-mono">
                                  {formatTime(r.start_time)} – {formatTime(r.end_time)}
                                </p>
                                <p className="text-xs text-slate-400">{hours.toFixed(1)}h</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${shift.bg} ${shift.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${shift.dot}`} />
                                  {SHIFT_LABELS[r.shift_type]}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <span className="text-sm font-bold text-emerald-600">{formatCurrency(r.value)}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition justify-end">
                                  <button
                                    onClick={() => { setEditRecord(r); setShowForm(true); }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                    title="Editar"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteRecord(r)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                                    title="Excluir"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {filtered.map(r => {
                      const shift = SHIFT_COLORS[r.shift_type] ?? SHIFT_COLORS.personalizado;
                      const hours = calcHoursWorked(r.start_time, r.end_time);
                      return (
                        <div key={r.id} className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                {r.employee_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{r.employee_name}</p>
                                <p className="text-xs text-slate-500">{formatDate(r.work_date)}</p>
                              </div>
                            </div>
                            <span className="text-base font-bold text-emerald-600">{formatCurrency(r.value)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="font-mono">{formatTime(r.start_time)} – {formatTime(r.end_time)}</span>
                              <span>{hours.toFixed(1)}h</span>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${shift.bg} ${shift.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${shift.dot}`} />
                              {SHIFT_LABELS[r.shift_type]}
                            </span>
                          </div>
                          {r.notes && <p className="text-xs text-slate-400">{r.notes}</p>}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => { setEditRecord(r); setShowForm(true); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition"
                            >
                              <Edit2 size={13} /> Editar
                            </button>
                            <button
                              onClick={() => setDeleteRecord(r)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition"
                            >
                              <Trash2 size={13} /> Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      Total: <span className="text-emerald-600">{formatCurrency(totalValue)}</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Funcionários</h3>
              {employeeSummary.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum registro ainda.</p>
              ) : (
                <div className="space-y-3">
                  {employeeSummary.map(emp => (
                    <div key={emp.name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.count} diária{emp.count !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">
                        {formatCurrency(emp.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Tabela de Turnos</h3>
              <div className="space-y-2.5">
                <ShiftInfo
                  icon={<Sun size={15} className="text-amber-500" />}
                  bg="bg-amber-50 border-amber-100"
                  title="Diurno"
                  sub="11:00 – 19:00"
                  value="R$ 120"
                  valueColor="text-amber-700"
                />
                <ShiftInfo
                  icon={<Moon size={15} className="text-blue-500" />}
                  bg="bg-blue-50 border-blue-100"
                  title="Noturno"
                  sub="12:00 – 00:00"
                  value="R$ 200"
                  valueColor="text-blue-700"
                />
                <ShiftInfo
                  icon={<Clock size={15} className="text-teal-500" />}
                  bg="bg-teal-50 border-teal-100"
                  title="Personalizado"
                  sub="Horário livre"
                  value="Variável"
                  valueColor="text-teal-700"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {showForm && (
        <RecordForm
          record={editRecord}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditRecord(null); }}
        />
      )}
      {deleteRecord && (
        <DeleteModal
          record={deleteRecord}
          onConfirm={handleDelete}
          onClose={() => setDeleteRecord(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  sub: string;
}

function StatCard({ icon, bg, label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
      <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

interface ShiftInfoProps {
  icon: React.ReactNode;
  bg: string;
  title: string;
  sub: string;
  value: string;
  valueColor: string;
}

function ShiftInfo({ icon, bg, title, sub, value, valueColor }: ShiftInfoProps) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-xl border ${bg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="text-xs font-semibold text-slate-700">{title}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </div>
      <span className={`text-sm font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}
