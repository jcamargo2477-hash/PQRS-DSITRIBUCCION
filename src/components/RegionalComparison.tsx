import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, LineChart, Line, LabelList
} from 'recharts';
import { 
  Map, TrendingUp, Coins, Award, Activity, CheckCircle2, 
  AlertTriangle, Compass, ShieldAlert, BarChart3, PieChart as PieIcon, MapPin
} from 'lucide-react';
import { PqrsRecord } from '../types';

interface RegionalComparisonProps {
  records: PqrsRecord[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const LIGHT_COLORS = ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FEE2E2', '#EDE9FE', '#FCE7F3', '#CFFAFE', '#FFEDD5'];

export default function RegionalComparison({ records }: RegionalComparisonProps) {
  const [activeTab, setActiveTab] = useState<'ranking' | 'charts'>('ranking');
  const [regionSortBy, setRegionSortBy] = useState<'total' | 'penalties' | 'sla'>('total');

  // --- 1. COMPUTE STATISTICS ---
  const stats = useMemo(() => {
    const regionMap: Record<string, {
      name: string;
      total: number;
      cerrados: number;
      abiertos: number;
      costoPenalizacion: number;
      costoMercancia: number;
      diasTranscurridosSum: number;
      diasTranscurridosCount: number;
      excelenteCount: number;
      cumplidoCount: number;
      pendienteCount: number;
      subregionesMap: Record<string, number>;
      cedisMap: Record<string, number>;
    }> = {};

    let totalZonaCubierta = 0;
    let totalZonaNoCubierta = 0;
    const canalCounts: Record<string, number> = {};
    const cediCounts: Record<string, number> = {};
    const complianceCounts: Record<string, number> = {};

    records.forEach(r => {
      // Clean values
      const reg = r.region || 'Sin Región';
      const subReg = r.subRegion || 'Otras';
      const z = r.zona || 'Desconocida';
      const c = r.canal || 'Otro';
      const cediVal = r.cedi || 'Otro Cedi';
      const compliance = r.nivelCumplimiento || 'Pendiente / Observación';
      
      const cantVal = r.cantidad || 1;

      // General counts
      if (z.toLowerCase().includes('cubier') && !z.toLowerCase().includes('no')) {
        totalZonaCubierta += cantVal;
      } else if (z.toLowerCase().includes('no')) {
        totalZonaNoCubierta += cantVal;
      } else {
        // Fallback or neutral
        totalZonaCubierta += cantVal; 
      }

      canalCounts[c] = (canalCounts[c] || 0) + cantVal;
      cediCounts[cediVal] = (cediCounts[cediVal] || 0) + cantVal;
      complianceCounts[compliance] = (complianceCounts[compliance] || 0) + cantVal;

      // Group by Region
      if (!regionMap[reg]) {
        regionMap[reg] = {
          name: reg,
          total: 0,
          cerrados: 0,
          abiertos: 0,
          costoPenalizacion: 0,
          costoMercancia: 0,
          diasTranscurridosSum: 0,
          diasTranscurridosCount: 0,
          excelenteCount: 0,
          cumplidoCount: 0,
          pendienteCount: 0,
          subregionesMap: {},
          cedisMap: {}
        };
      }

      const rStat = regionMap[reg];
      rStat.total += cantVal;
      if (r.estado === 'Cerrado') {
        rStat.cerrados += cantVal;
      } else {
        rStat.abiertos += cantVal;
      }

      rStat.costoPenalizacion += r.costoPenalizacion || 0;
      rStat.costoMercancia += r.costoMercancia || 0;

      const dt = r.diasTranscurridos !== undefined ? r.diasTranscurridos : r.diasDemora;
      if (dt > 0) {
        rStat.diasTranscurridosSum += dt * cantVal;
        rStat.diasTranscurridosCount += cantVal;
      }

      if (compliance.toLowerCase().includes('excel')) rStat.excelenteCount += cantVal;
      else if (compliance.toLowerCase().includes('cumpli')) rStat.cumplidoCount += cantVal;
      else rStat.pendienteCount += cantVal;

      rStat.subregionesMap[subReg] = (rStat.subregionesMap[subReg] || 0) + cantVal;
      rStat.cedisMap[cediVal] = (rStat.cedisMap[cediVal] || 0) + cantVal;
    });

    const regionsList = Object.values(regionMap).map(r => {
      const avgSla = r.diasTranscurridosCount > 0 ? r.diasTranscurridosSum / r.diasTranscurridosCount : 0;
      const resRate = r.total > 0 ? (r.cerrados / r.total) * 100 : 0;
      
      const subregionesSorted = Object.entries(r.subregionesMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a,b) => b.qty - a.qty);

      const cedisSorted = Object.entries(r.cedisMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a,b) => b.qty - a.qty);

      return {
        ...r,
        avgSla,
         resRate,
        subregionesSorted,
        cedisSorted
      };
    });

    return {
      regionsList,
      zonaCubierta: totalZonaCubierta,
      zonaNoCubierta: totalZonaNoCubierta,
      canalCounts,
      cediCounts,
      complianceCounts,
      totalCount: records.reduce((sum, r) => sum + (r.cantidad || 1), 0)
    };
  }, [records]);

  // --- 2. REGIONAL SCOREBOARD RANKING ---
  const sortedRegions = useMemo(() => {
    return [...stats.regionsList].sort((a, b) => {
      if (regionSortBy === 'penalties') {
        return b.costoPenalizacion - a.costoPenalizacion;
      }
      if (regionSortBy === 'sla') {
        return b.avgSla - a.avgSla;
      }
      return b.total - a.total; // defaults to volume
    });
  }, [stats.regionsList, regionSortBy]);

  // --- 3. DYNAMIC INSIGHTS GENERATION (The requested Graph Analyst) ---
  const analystInsights = useMemo(() => {
    if (records.length === 0) return [];

    const insightsList: string[] = [];
    const regs = stats.regionsList;

    if (regs.length > 0) {
      // Find region with highest volume
      const maxVolumeRegion = [...regs].sort((a, b) => b.total - a.total)[0];
      insightsList.push(`La regional **${maxVolumeRegion.name}** lidera el volumen nacional con **${maxVolumeRegion.total} reclamaciones** (${Math.round((maxVolumeRegion.total/records.length)*100)}% del total general), requiriendo atención prioritaria.`);
      
      // Find region with highest penalties
      const maxPenaltyRegion = [...regs].sort((a, b) => b.costoPenalizacion - a.costoPenalizacion)[0];
      if (maxPenaltyRegion.costoPenalizacion > 0) {
        insightsList.push(`Financieramente, **${maxPenaltyRegion.name}** representa el mayor impacto económico con **${new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0}).format(maxPenaltyRegion.costoPenalizacion)}** acumulados en penalizaciones administrativas.`);
      }

      // Find region with highest SLA delays
      const maxSlaRegion = [...regs].filter(r => r.avgSla > 0).sort((a, b) => b.avgSla - a.avgSla)[0];
      if (maxSlaRegion) {
        insightsList.push(`El mayor cuello de botella operativo está en la regional **${maxSlaRegion.name}**, registrando un promedio de **${maxSlaRegion.avgSla.toFixed(1)} días de retraso** en distribuciones.`);
      }
    }

    // Zone Cubierta vs No Cubierta insight
    const cubiertaPct = stats.totalCount > 0 ? Math.round((stats.zonaCubierta / stats.totalCount) * 100) : 0;
    if (stats.zonaNoCubierta > 0) {
      insightsList.push(`Se detecta que el **${100 - cubiertaPct}% de los casos** se originaron en **Zonas No Cubiertas**, lo que incrementa el riesgo de incidentes por falta de transportadores estables.`);
    }

    // Level of compliance insight
    const excCount = stats.complianceCounts['Excelente'] || 0;
    const cumCount = stats.complianceCounts['Cumplido'] || 0;
    const pendCount = stats.complianceCounts['Pendiente / Observación'] || 0;
    const complianceTotal = excCount + cumCount + pendCount;
    if (complianceTotal > 0) {
      const positivePct = Math.round(((excCount + cumCount) / complianceTotal) * 100);
      insightsList.push(`El **${positivePct}% de los despachos** cumplen de forma satisfactoria (Excelente/Cumplido); sin embargo, un **${Math.round((pendCount/complianceTotal)*100)}%** permanece bajo observación operativa.`);
    }

    return insightsList;
  }, [records, stats]);

  // Prepare chart formats
  const regionChartData = stats.regionsList.map(r => ({
    name: r.name,
    'Total PQRS': r.total,
    'Multas (k$)': Math.round(r.costoPenalizacion / 1000),
    'SLA Promedio': parseFloat(r.avgSla.toFixed(1))
  }));

  const zonePieData = [
    { name: 'Zona Cubierta', value: stats.zonaCubierta, color: '#3B82F6' },
    { name: 'Zona No Cubierta', value: stats.zonaNoCubierta, color: '#F59E0B' }
  ].filter(d => d.value > 0);

  const cediChartData = Object.entries(stats.cediCounts)
    .map(([name, qty]) => ({ name, qty: qty as number }))
    .sort((a,b) => (b.qty as number) - (a.qty as number))
    .slice(0, 6);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="regional-comparison-card" className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 mb-6">
      
      {/* Header section with tab switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
        <div>
          <h4 className="text-[10px] uppercase font-extrabold text-blue-600 tracking-widest flex items-center gap-1.5 font-sans">
            <Compass className="w-4 h-4 text-blue-600" />
            Análisis de Cobertura Geográfica
          </h4>
          <h3 className="text-base font-extrabold text-slate-900 mt-1 uppercase font-display">
            ESTADÍSTICAS COMPARATIVAS Y DESEMPEÑO REGIONAL
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare el comportamiento de reclamos por regionales, zonas de entrega (Cubierta vs No Cubierta), y CEDIs emisores.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
              activeTab === 'ranking' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Scorecard Regional
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
              activeTab === 'charts' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Comparativas Avanzadas
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="py-8 text-center text-slate-400 font-semibold text-sm">
          No hay registros disponibles para generar análisis regional.
        </div>
      ) : (
        <>
          {activeTab === 'ranking' ? (
            <div>
              {/* Scorecard Control options */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <span className="text-xs font-bold text-slate-500">
                  Total de Regionales Monitoreadas: <strong className="text-slate-800">{stats.regionsList.length}</strong>
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Ordenar Scorecard por:</span>
                  <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded-lg">
                    <button
                      onClick={() => setRegionSortBy('total')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        regionSortBy === 'total' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Volumen de Casos
                    </button>
                    <button
                      onClick={() => setRegionSortBy('penalties')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        regionSortBy === 'penalties' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Costo Penalización
                    </button>
                    <button
                      onClick={() => setRegionSortBy('sla')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        regionSortBy === 'sla' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      SLA Retraso
                    </button>
                  </div>
                </div>
              </div>

              {/* Scorecard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {sortedRegions.map((region, idx) => {
                  return (
                    <div 
                      key={region.name}
                      className="border border-slate-100 hover:border-blue-200 rounded-2xl bg-slate-50/50 p-4 transition duration-200 shadow-xs relative overflow-hidden group hover:bg-white"
                    >
                      {/* Top ribbon color based on volume / performance */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {region.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">
                              CEDI Primario: {region.cedisSorted[0]?.name || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {idx === 0 && regionSortBy === 'total' && (
                          <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            🚨 Mayor Reclamo
                          </span>
                        )}
                        {region.costoPenalizacion > 100000 && regionSortBy === 'penalties' && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            💸 Mayor Penalización
                          </span>
                        )}
                      </div>

                      {/* Stats Grid inside card */}
                      <div className="grid grid-cols-2 gap-3 mb-3 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total PQRS</span>
                          <span className="font-extrabold text-slate-800 text-sm">{region.total} casos</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">SLA Demora</span>
                          <span className={`${region.avgSla > 3 ? 'text-orange-600' : 'text-emerald-600'} font-extrabold text-sm`}>
                            {region.avgSla > 0 ? `${region.avgSla.toFixed(1)} días` : '0.0 (Excelente)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Costo Penalidades</span>
                          <span className="font-extrabold text-rose-600 text-sm">
                            {region.costoPenalizacion > 0 ? formatCurrency(region.costoPenalizacion) : '$0'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Tasa Resolución</span>
                          <span className="font-extrabold text-slate-700 text-sm">
                            {region.resRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Sub-regions breakdown pill list */}
                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subregiones Principales:</span>
                        <div className="flex flex-wrap gap-1">
                          {region.subregionesSorted.slice(0, 3).map((sr) => (
                            <span 
                              key={sr.name} 
                              className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-semibold"
                            >
                              {sr.name} ({sr.qty})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Primary Chart: Recharts Regional Volume vs Fines */}
              <div className="lg:col-span-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-1.5 uppercase font-sans">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Métricas Geográficas de Impacto (Casos vs Costos por Regional)
                </h4>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                      <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#EF4444" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                        labelStyle={{ fontWeight: 'bold', color: '#0F172A' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      
                      <Bar yAxisId="left" dataKey="Total PQRS" fill="#3B82F6" name="Total PQRS (Cant.)" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Total PQRS" content={(props: any) => {
                          const { x, y, width, value } = props;
                          if (value === undefined || value === null || value === 0) return null;
                          const total = regionChartData.reduce((acc: number, curr: any) => acc + curr['Total PQRS'], 0) || 1;
                          const pct = ((value / total) * 100).toFixed(0);
                          return (
                            <text x={x + width / 2} y={y - 8} fill="#1d4ed8" fontSize={9} fontWeight="extrabold" textAnchor="middle">
                              {value} ({pct}%)
                            </text>
                          );
                        }} />
                      </Bar>
                      <Bar yAxisId="right" dataKey="Multas (k$)" fill="#EF4444" name="Penalizaciones (k$ COP)" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Multas (k$)" content={(props: any) => {
                          const { x, y, width, value } = props;
                          if (value === undefined || value === null || value === 0) return null;
                          const total = regionChartData.reduce((acc: number, curr: any) => acc + curr['Multas (k$)'], 0) || 1;
                          const pct = ((value / total) * 100).toFixed(0);
                          return (
                            <text x={x + width / 2} y={y - 8} fill="#b91c1c" fontSize={9} fontWeight="extrabold" textAnchor="middle">
                              {value}k ({pct}%)
                            </text>
                          );
                        }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side Panels: Donut of zone & Bar of CEDI */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* A. Zone coverage (Cubierta vs No Cubierta) */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex-1">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 uppercase font-sans">
                    <PieIcon className="w-4 h-4 text-orange-500" />
                    Cobertura de Zona
                  </h4>
                  
                  {zonePieData.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">Sin datos de zona</div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 h-36">
                      <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={zonePieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={45}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {zonePieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="w-1/2 space-y-1.5">
                        {zonePieData.map((d) => (
                          <div key={d.name} className="text-xs">
                            <span className="font-bold text-slate-800 block flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: d.color }} />
                              {d.value} Casos
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* B. CEDI performance */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex-1">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 uppercase font-sans">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Top CEDI Emisor
                  </h4>
                  
                  {cediChartData.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">Sin datos de CEDI</div>
                  ) : (
                    <div className="space-y-2">
                      {cediChartData.map((cedi, idx) => {
                        const maxVal = Math.max(...cediChartData.map(c => c.qty as number));
                        const pctRow = maxVal > 0 ? ((cedi.qty as number) / maxVal) * 100 : 0;
                        return (
                          <div key={cedi.name} className="text-xs">
                            <div className="flex justify-between font-bold text-slate-700">
                              <span>{cedi.name}</span>
                              <span>{cedi.qty} PQRS</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pctRow}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* DYNAMIC REPORT ANALYSIS BOX (The requested Graph Analyst) */}
          <div id="graph-analyst" className="mt-6 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
            <h4 className="text-xs font-black text-blue-700 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <span>📊 INFORME ANALÍTICO GENERADO</span>
              <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-sm font-bold">ANALISTA DE CONTROL DE CALIDAD</span>
            </h4>
            
            <div className="space-y-2">
              {analystInsights.map((insight, index) => {
                // Parse basic bold symbols in markdown fashion
                const textNodes: React.ReactNode[] = [];
                const regex = /\*\*([^*]+)\*\*/g;
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(insight)) !== null) {
                  // Add previous plain text
                  if (match.index > lastIndex) {
                    textNodes.push(insight.substring(lastIndex, match.index));
                  }
                  // Add bold match
                  textNodes.push(<strong key={match.index} className="font-extrabold text-blue-900">{match[1]}</strong>);
                  lastIndex = regex.lastIndex;
                }
                
                if (lastIndex < insight.length) {
                  textNodes.push(insight.substring(lastIndex));
                }

                return (
                  <div key={index} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{textNodes.length > 0 ? textNodes : insight}</p>
                  </div>
                );
              })}

              {analystInsights.length === 0 && (
                <p className="text-xs text-slate-500 italic">No hay suficientes variables cargadas en la planilla para generar comentarios analíticos detallados.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
