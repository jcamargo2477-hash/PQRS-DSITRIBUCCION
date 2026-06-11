import { AlertTriangle, CheckSquare, Clock, ShieldAlert, TrendingUp } from 'lucide-react';
import { PqrsRecord } from '../types';

interface KPICardsProps {
  records: PqrsRecord[];
}

export default function KPICards({ records }: KPICardsProps) {
  const total = records.reduce((acc, r) => acc + (r.cantidad || 1), 0);
  const cerrados = records.filter(r => r.estado === 'Cerrado').reduce((acc, r) => acc + (r.cantidad || 1), 0);
  const abiertos = records.filter(r => r.estado === 'Abierto').reduce((acc, r) => acc + (r.cantidad || 1), 0);
  const enProceso = records.filter(r => r.estado === 'En proceso').reduce((acc, r) => acc + (r.cantidad || 1), 0);

  const tasaResolucion = total > 0 ? (cerrados / total) * 100 : 0;
  
  const penalizacionTotal = records.reduce((acc, r) => acc + (r.costoPenalizacion || 0), 0);
  const promedioDemora = records.filter(r => r.diasDemora > 0);
  const diasPromedio = promedioDemora.length > 0 
    ? promedioDemora.reduce((acc, r) => acc + r.diasDemora, 0) / promedioDemora.length 
    : 0;

  // Format amount as currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="kpi-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {/* Total PQRS */}
      <div id="kpi-total-pqrs" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 flex items-center justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/30 hover:-translate-y-0.5">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-widest font-sans">Total PQRS Registrados</span>
          <span className="text-3xl font-extrabold text-slate-900 block mt-1.5 font-display tracking-tight">{total}</span>
          <div className="flex gap-2 mt-3 text-[10px]">
            <span className="text-rose-600 font-extrabold bg-rose-50/70 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
              ● {abiertos} Abiertos
            </span>
            <span className="text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
              ● {enProceso} En proceso
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* Tasa de Resolución */}
      <div id="kpi-resolution-rate" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 flex items-center justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/30 hover:-translate-y-0.5">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-widest font-sans">Tasa de Resolución</span>
          <span className="text-3xl font-extrabold text-slate-900 block mt-1.5 font-display tracking-tight">{tasaResolucion.toFixed(1)}%</span>
          <div className="flex items-center gap-2 mt-4.5">
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${tasaResolucion}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{cerrados} Resueltos</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckSquare className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* Penalizaciones Totales */}
      <div id="kpi-penalties" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 flex items-center justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/30 hover:-translate-y-0.5">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-widest font-sans">Sanciones Aplicadas</span>
          <span className="text-2xl font-black text-rose-600 block mt-2 font-display tracking-tight">{formatCurrency(penalizacionTotal)}</span>
          <p className="text-[10px] text-slate-500 font-semibold mt-3 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
            Por incumplimientos de SLA
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* Demora Promedio */}
      <div id="kpi-delay-avg" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 flex items-center justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/30 hover:-translate-y-0.5">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-widest font-sans">SLA / Retraso Prom.</span>
          <span className="text-3xl font-extrabold text-slate-900 block mt-1.5 font-display tracking-tight whitespace-nowrap">{diasPromedio.toFixed(1)} días</span>
          <p className="text-[10px] text-slate-500 font-semibold mt-3.5">
            En casos con demora logística
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-5.5 h-5.5" />
        </div>
      </div>
    </div>
  );
}
