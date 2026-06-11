import React, { useState, useMemo } from 'react';
import { PqrsRecord } from '../types';
import { ShieldAlert, BellRing, Settings, Sliders, Mail, MessageSquare, Play, HelpCircle, Check, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';

interface AlertasInteligentesProps {
  records: PqrsRecord[];
}

export default function AlertasInteligentes({ records }: AlertasInteligentesProps) {
  // Settings Interactive thresholds (State)
  const [thresholdDays, setThresholdDays] = useState<number>(3);
  const [thresholdSla, setThresholdSla] = useState<number>(85);
  const [thresholdFine, setThresholdFine] = useState<number>(100000); // 100,000 COP

  // System notification checkboxes simulating corporate integrations
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSlack, setNotifSlack] = useState(false);
  const [notifAutoSac, setNotifAutoSac] = useState(true);

  // Derive active alerts based on user-configured thresholds
  const alertsData = useMemo(() => {
    const criticalDelayCases: PqrsRecord[] = [];
    const highFineCases: PqrsRecord[] = [];
    
    // Group carriers to check overall SLA
    const carrierSlaMap: Record<string, { total: number; closed: number; compliant: number }> = {};

    records.forEach(r => {
      const cant = r.cantidad || 1;
      const days = r.diasTranscurridos !== undefined ? r.diasTranscurridos : r.diasDemora;
      const fine = r.costoPenalizacion || 0;
      const carrier = r.transportadora || 'Otros';

      // 1. Critical Delay alert check
      if (days > thresholdDays && r.estado !== 'Cerrado') {
        criticalDelayCases.push(r);
      }

      // 2. High Fine alert check
      if (fine >= thresholdFine) {
        highFineCases.push(r);
      }

      // Grouping carriers SLA calculation
      if (!carrierSlaMap[carrier]) {
        carrierSlaMap[carrier] = { total: 0, closed: 0, compliant: 0 };
      }
      const cMap = carrierSlaMap[carrier];
      cMap.total += cant;
      if (r.estado === 'Cerrado') {
        cMap.closed += cant;
        const comp = String(r.nivelCumplimiento || '').toLowerCase();
        if (comp.includes('exce') || comp.includes('cumpli') || days <= 3) {
          cMap.compliant += cant;
        }
      }
    });

    // 3. Carrier SLA Breach alerts
    const carrierBreaches: Array<{ name: string; rate: number; count: number }> = [];
    Object.entries(carrierSlaMap).forEach(([name, val]) => {
      const rate = val.closed > 0 ? (val.compliant / val.closed) * 100 : 80;
      if (rate < thresholdSla) {
        carrierBreaches.push({
          name,
          rate,
          count: val.total
        });
      }
    });

    return {
      criticalDelayCases,
      highFineCases,
      carrierBreaches
    };
  }, [records, thresholdDays, thresholdSla, thresholdFine]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="pantalla-alertas-inteligentes" className="animate-fade-in space-y-6">
      
      {/* SECTION HEADER BANNER */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-black text-slate-850 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-500 animate-bounce" /> Motor Predictivo de Alertas y Notificaciones SLA
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configura umbrales de advertencia en tiempo real. Analiza desvíos críticos del proveedor y bloquea sanciones antes de su devengo.
          </p>
        </div>
        <div className="text-xs text-rose-600 font-black bg-rose-50 px-4 py-2 border border-rose-100 rounded-2xl flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-500 animate-ping" /> Alertas Totales: <span className="font-mono">{alertsData.criticalDelayCases.length + alertsData.highFineCases.length + alertsData.carrierBreaches.length} Activas</span>
        </div>
      </div>

      {/* DASHBOARD: LEFT SIDE IS INTERACTIVE SLIDERS, RIGHT SIDE IS ALERTS POOL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* INTERACTIVE CONTROLS / SLIDERS (Linear-style Settings Box) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs lg:col-span-4 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Ajustes de Umbral (Reales)</h3>
            </div>
            
            {/* Range 1: Max allowed delay days */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-705">
                <label htmlFor="input-threshold-days">Retraso Límite Permitido</label>
                <span className="text-blue-600 font-extrabold">{thresholdDays} días hábiles</span>
              </div>
              <input
                id="input-threshold-days"
                type="range"
                min="1"
                max="10"
                value={thresholdDays}
                onChange={(e) => setThresholdDays(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[10px] text-slate-400 font-semibold block">Genera alertas por demoras mayores a este lapso.</span>
            </div>

            {/* Range 2: Min SLA compliance */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-705">
                <label htmlFor="input-threshold-sla">SLA Mínimo Aceptable</label>
                <span className="text-indigo-650 font-extrabold">{thresholdSla}% de Casos</span>
              </div>
              <input
                id="input-threshold-sla"
                type="range"
                min="50"
                max="98"
                value={thresholdSla}
                onChange={(e) => setThresholdSla(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[10px] text-slate-400 font-semibold block">Alerta si la transportadora cae por debajo de este estándar.</span>
            </div>

            {/* Range 3: COP multas warning */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-slate-705">
                <label htmlFor="input-threshold-fine">Monto Alerta Multa Crítica</label>
                <span className="text-rose-600 font-extrabold font-mono">{formatCurrency(thresholdFine)} COP</span>
              </div>
              <input
                id="input-threshold-fine"
                type="range"
                min="20000"
                max="500000"
                step="10000"
                value={thresholdFine}
                onChange={(e) => setThresholdFine(parseInt(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[10px] text-slate-400 font-semibold block">Dispara alerta para multas individuales graves.</span>
            </div>
          </div>

          {/* SIMULATED AUTOMATED ACTION SYSTEM INTEGRATION CHANNELS */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Respuestas Automatizadas
            </h4>

            {/* Trigger 1 Email */}
            <button
              onClick={() => setNotifEmail(!notifEmail)}
              className="w-full text-left p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-between cursor-pointer focus:outline-none select-none hover:bg-slate-55 bg-slate-50 border-slate-100"
            >
              <span className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" /> Correo a Directores logísticos
              </span>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${notifEmail ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                {notifEmail && <Check className="w-2.5 h-2.5" />}
              </span>
            </button>

            {/* Trigger 2 Sla Slack */}
            <button
              onClick={() => setNotifSlack(!notifSlack)}
              className="w-full text-left p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-between cursor-pointer focus:outline-none select-none hover:bg-slate-55 bg-slate-50 border-slate-100"
            >
              <span className="flex items-center gap-2 text-slate-700">
                <MessageSquare className="w-4 h-4 text-slate-400" /> Enviar Alerta a Canal Slack SAC
              </span>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${notifSlack ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                {notifSlack && <Check className="w-2.5 h-2.5" />}
              </span>
            </button>
          </div>
        </div>

        {/* ALERTS POOL / LISTING GRID (STILL REAL FILTERED RECORDS ANALYSIS) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" /> Alertas de Desempeño Operativo en Curso
              </h3>
              <span className="text-[10px] text-slate-400 font-bold font-mono">EN TIEMPO REAL</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-120 pr-1 select-none">
              
              {/* Carrier breach rate alerts */}
              {alertsData.carrierBreaches.map(breach => (
                <div key={breach.name} className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    SLA
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-800">Proveedor en Brecha Crítica</span>
                      <span className="text-[10px] font-mono text-rose-600 bg-rose-100 px-2 py-0.5 rounded-lg font-black">{breach.rate.toFixed(1)}% Cumplido</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                      El transportador <span className="font-bold text-slate-800">{breach.name}</span> registra un índice consolidado inferior al umbral configurado de <span className="font-bold text-slate-800">{thresholdSla}%</span> para un universo de {breach.count} radicados.
                    </p>
                  </div>
                </div>
              ))}

              {/* Critical single delays */}
              {alertsData.criticalDelayCases.slice(0, 10).map((record, index) => {
                const elapsedDays = record.diasTranscurridos !== undefined ? record.diasTranscurridos : record.diasDemora;
                return (
                  <div key={`${record.id}-${index}-delay`} className="p-3 bg-amber-50/40 border border-amber-100 rounded-2xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      {elapsedDays}d
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-800">Demora Severa: Folio {record.id}</span>
                        <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg font-black">Activo</span>
                      </div>
                      <p className="text-[11px] text-slate-550 font-medium mt-0.5">
                        El paquete del cliente <span className="font-bold text-slate-800">{record.cliente}</span> (Guía: <span className="font-mono text-slate-800 font-bold">{record.guia}</span>) a cargo de <span className="font-semibold text-slate-850">{record.transportadora}</span> excede los <span className="font-bold text-slate-800">{thresholdDays} días</span>.
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* High fine risk alerts */}
              {alertsData.highFineCases.slice(0, 5).map((record, index) => (
                <div key={`${record.id}-${index}-fine`} className="p-3 bg-rose-50/20 border border-rose-100/50 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    $
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-850">Impacto Financiero Grave: {record.id}</span>
                      <span className="text-[10px] font-mono text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded-lg font-bold">{formatCurrency(record.costoPenalizacion)}</span>
                    </div>
                    <p className="text-[11px] text-slate-550 font-medium mt-0.5">
                      Sanción por avería acumuladora del cliente <span className="font-bold text-slate-800">{record.cliente}</span> excede el filtro financiero límite de <span className="font-bold text-slate-800">{formatCurrency(thresholdFine)}</span>.
                    </p>
                  </div>
                </div>
              ))}

              {alertsData.criticalDelayCases.length === 0 && alertsData.highFineCases.length === 0 && alertsData.carrierBreaches.length === 0 && (
                <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                  No se detectaron brechas graves de SLA para la parametrización actual.
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
