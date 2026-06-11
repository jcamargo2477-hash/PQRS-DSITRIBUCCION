import React, { useMemo } from 'react';
import { PqrsRecord } from '../types';
import { AlertCircle, ShieldAlert, Award, TrendingUp, Sparkles, AlertTriangle, ListFilter, HelpCircle } from 'lucide-react';

interface AnalisisCausaRaizProps {
  records: PqrsRecord[];
}

export default function AnalisisCausaRaiz({ records }: AnalisisCausaRaizProps) {
  const rootCauses = useMemo(() => {
    const totalRadicados = records.reduce((sum, r) => sum + (r.cantidad || 1), 0);
    const totalCost = records.reduce((sum, r) => sum + (r.costoPenalizacion || 0), 0);

    // 1. Worst Motifs
    const motifsMap: Record<string, { count: number; cost: number }> = {};
    records.forEach(r => {
      const m = r.motivo || 'Otro';
      const cant = r.cantidad || 1;
      if (!motifsMap[m]) motifsMap[m] = { count: 0, cost: 0 };
      motifsMap[m].count += cant;
      motifsMap[m].cost += r.costoPenalizacion || 0;
    });
    const worstMotif = Object.entries(motifsMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)[0] || { name: 'Novedades de Entrega', count: 0, cost: 0 };

    // 2. Worst Transportadoras
    const carriersMap: Record<string, { count: number; cost: number }> = {};
    records.forEach(r => {
      const c = r.transportadora || 'Otros';
      const cant = r.cantidad || 1;
      if (!carriersMap[c]) carriersMap[c] = { count: 0, cost: 0 };
      carriersMap[c].count += cant;
      carriersMap[c].cost += r.costoPenalizacion || 0;
    });
    const worstCarrier = Object.entries(carriersMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)[0] || { name: 'Ninguno', count: 0, cost: 0 };

    // 3. Worst Cities / regions
    const citiesMap: Record<string, { count: number; cost: number }> = {};
    records.forEach(r => {
      const city = r.subRegion || r.region || 'Desconocida';
      const cant = r.cantidad || 1;
      if (!citiesMap[city]) citiesMap[city] = { count: 0, cost: 0 };
      citiesMap[city].count += cant;
      citiesMap[city].cost += r.costoPenalizacion || 0;
    });
    const worstCity = Object.entries(citiesMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)[0] || { name: 'Bogotá', count: 0, cost: 0 };

    // 4. Incident Risk Quadrants
    // Group motives and determine risk tier: High risk if frequency > 15% and cost > 15% of total
    const risks = Object.entries(motifsMap).map(([name, data]) => {
      const freqShare = totalRadicados > 0 ? (data.count / totalRadicados) * 100 : 0;
      const costShare = totalCost > 0 ? (data.cost / totalCost) * 100 : 0;
      
      let riskTier: 'ALTO' | 'MEDIO' | 'BAJO' = 'BAJO';
      let riskColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
      
      if (freqShare > 20 || costShare > 20) {
        riskTier = 'ALTO';
        riskColor = 'text-rose-600 bg-rose-50 border-rose-100 font-extrabold';
      } else if (freqShare > 8 || costShare > 8) {
        riskTier = 'MEDIO';
        riskColor = 'text-amber-700 bg-amber-50 border-amber-100 font-bold';
      }

      return {
        name,
        count: data.count,
        cost: data.cost,
        freqShare,
        costShare,
        riskTier,
        riskColor
      };
    }).sort((a, b) => b.count - a.count);

    return {
      totalRadicados,
      totalCost,
      worstMotif,
      worstCarrier,
      worstCity,
      risks
    };
  }, [records]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="pantalla-analisis-causa-raiz" className="animate-fade-in space-y-6">
      
      {/* HEADER BANNER OF DIAGNOSTICS */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-black text-slate-850 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" /> Inteligencia Causa Raíz (Fisheye Diagnostic)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Evaluación automatizada de fricciones críticas. Diagnostica cuellos de botella geográficos, de motivo y de portador alterno.
          </p>
        </div>
        <div className="text-xs text-rose-600 font-bold bg-rose-50 px-4 py-2 border border-rose-100 rounded-2xl">
          Fallas Financieras Sancionables: <span className="font-extrabold font-mono">{formatCurrency(rootCauses.totalCost)} COP</span>
        </div>
      </div>

      {/* THREE OFFENDERS BENTO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* WORST MOTIF CARD */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="space-y-1.5">
            <span className="text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-extrabold tracking-widest uppercase">Motivo Ofensor Principal</span>
            <h4 className="text-sm font-extrabold text-slate-800 leading-snug line-clamp-2">"{rootCauses.worstMotif.name}"</h4>
            <p className="text-[11px] text-slate-400 font-semibold">Causa general que concentra la mayor frecuencia de reclamos organizacionales.</p>
          </div>
          
          <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold font-mono">Frecuencia (Radicados)</span>
              <span className="text-lg font-black text-slate-800">{rootCauses.worstMotif.count} incidencias</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold font-mono">Costo del Impacto</span>
              <span className="text-sm font-bold text-rose-600">{formatCurrency(rootCauses.worstMotif.cost)}</span>
            </div>
          </div>
        </div>

        {/* WORST CARRIER CARD */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="space-y-1.5">
            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-extrabold tracking-widest uppercase">Transportadora de Mayor Falla</span>
            <h4 className="text-sm font-extrabold text-slate-800 leading-snug">"{rootCauses.worstCarrier.name}"</h4>
            <p className="text-[11px] text-slate-400 font-semibold">Proveedor logístico con mayor volumen de folios de PQRS abiertos en el periodo.</p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold font-mono">Frecuencia (Radicados)</span>
              <span className="text-lg font-black text-slate-800">{rootCauses.worstCarrier.count} guías</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold font-mono text-indigo-700">Porcentaje Incumplido</span>
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg inline-block mt-0.5">
                {rootCauses.totalRadicados > 0 ? ((rootCauses.worstCarrier.count / rootCauses.totalRadicados)*100).toFixed(0) : 0}% del Total
              </span>
            </div>
          </div>
        </div>

        {/* WORST CITY CARD */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="space-y-1.5">
            <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-extrabold tracking-widest uppercase">Foco de Concentración Geográfico</span>
            <h4 className="text-sm font-extrabold text-slate-800 leading-snug">"{rootCauses.worstCity.name}"</h4>
            <p className="text-[11px] text-slate-400 font-semibold">Ciudad / Regional de destino que reporta la mayor severidad de averías o demoras.</p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold font-mono">Frecuencia (Radicados)</span>
              <span className="text-lg font-black text-slate-850">{rootCauses.worstCity.count} reclamados</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold font-mono">Impacto Financiero</span>
              <span className="text-sm font-bold text-rose-600">{formatCurrency(rootCauses.worstCity.cost)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* RISK TIERS DETAILS AND MATRICES */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
        <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 mb-2">
          <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" /> Matriz Consolidada de Causa Raíz, Impacto y Riesgo
        </h3>
        <p className="text-[11px] text-slate-400 font-semibold mb-4">
          Categorización automatizada de motivos según el riesgo financiero e impacto volumétrico en la operación de transportadores.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Motivo Raíz Evaluado</th>
                <th className="py-2.5 px-4 text-center">Frecuencia (N)</th>
                <th className="py-2.5 px-4 text-center">Porcentaje de Volumen</th>
                <th className="py-2.5 px-4 text-center">Costo de Impacto</th>
                <th className="py-2.5 px-4 text-center">Porcentaje del Costo</th>
                <th className="py-2.5 px-4 text-center">Nivel de Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rootCauses.risks.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 font-extrabold text-slate-805 truncate max-w-[280px]" title={item.name}>{item.name}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono">{item.count}</td>
                  <td className="py-3 px-4 text-center text-slate-550 font-bold font-mono">{item.freqShare.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-center text-rose-600 font-extrabold font-mono">{formatCurrency(item.cost)}</td>
                  <td className="py-3 px-4 text-center text-slate-550 font-bold font-mono">{item.costShare.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] border uppercase font-extrabold tracking-wider ${item.riskColor}`}>
                      {item.riskTier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
