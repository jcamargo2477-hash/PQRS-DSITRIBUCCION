import React, { useMemo, useState } from 'react';
import { PqrsRecord } from '../types';
import { Truck, Award, AlertTriangle, CheckSquare, Clock, ArrowUpDown, ShieldAlert, BarChart3, TrendingUp, Grid, ListChecks, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, AreaChart, Area, LabelList } from 'recharts';

interface AnalisisTransportadorProps {
  records: PqrsRecord[];
  filters?: any;
  setFilters?: React.Dispatch<React.SetStateAction<any>>;
}

export default function AnalisisTransportador({ records, filters, setFilters }: AnalisisTransportadorProps) {
  const [sortField, setSortField] = useState<'total' | 'tasa' | 'avgSla' | 'penalties'>('total');
  const [sortAsc, setSortAsc] = useState(false);

  // Compute Carrier Statistics
  const carrierStats = useMemo(() => {
    const statsMap: Record<string, {
      nombre: string;
      total: number;
      cerrados: number;
      abiertos: number;
      enProceso: number;
      sumSla: number;
      countSla: number;
      sumCierre: number;
      countCierre: number;
      penalties: number;
      cumplidoExcel: number;
      cumplidoOk: number;
      cumplidoPend: number;
    }> = {};

    records.forEach(r => {
      const name = r.transportadora || 'Otros';
      const cant = r.cantidad || 1;

      if (!statsMap[name]) {
        statsMap[name] = {
          nombre: name,
          total: 0,
          cerrados: 0,
          abiertos: 0,
          enProceso: 0,
          sumSla: 0,
          countSla: 0,
          sumCierre: 0,
          countCierre: 0,
          penalties: 0,
          cumplidoExcel: 0,
          cumplidoOk: 0,
          cumplidoPend: 0
        };
      }

      const cs = statsMap[name];
      cs.total += cant;

      if (r.estado === 'Cerrado') {
        cs.cerrados += cant;
        // closure days
        const days = r.diasTranscurridos !== undefined ? r.diasTranscurridos : r.diasDemora;
        if (days > 0) {
          cs.sumCierre += days * cant;
          cs.countCierre += cant;
        }
      } else if (r.estado === 'Abierto') {
        cs.abiertos += cant;
      } else if (r.estado === 'En proceso') {
        cs.enProceso += cant;
      }

      // general SLA days
      const days = r.diasTranscurridos !== undefined ? r.diasTranscurridos : r.diasDemora;
      if (days > 0) {
        cs.sumSla += days * cant;
        cs.countSla += cant;
      }

      cs.penalties += r.costoPenalizacion || 0;

      // compliance mapping
      const comp = String(r.nivelCumplimiento || '').toLowerCase();
      if (comp.includes('excel')) cs.cumplidoExcel += cant;
      else if (comp.includes('cumpli')) cs.cumplidoOk += cant;
      else cs.cumplidoPend += cant;
    });

    const list = Object.values(statsMap).map(c => {
      const avgSla = c.countSla > 0 ? c.sumSla / c.countSla : 1.5;
      const avgCierre = c.countCierre > 0 ? c.sumCierre / c.countCierre : 2.1;
      const tasa = c.total > 0 ? (c.cerrados / c.total) * 100 : 0;

      // level de cumplimiento label
      let compliance = 'Bajo / Crítico';
      if (tasa >= 85) compliance = 'Excelente';
      else if (tasa >= 65) compliance = 'Cumple SLA';
      else if (tasa >= 50) compliance = 'En Observación';

      return {
        ...c,
        avgSla,
        avgCierre,
        tasa,
        compliance
      };
    });

    // sorting
    return list.sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (sortField === 'total') {
        valA = a.total;
        valB = b.total;
      } else if (sortField === 'tasa') {
        valA = a.tasa;
        valB = b.tasa;
      } else if (sortField === 'avgSla') {
        valA = a.avgSla;
        valB = b.avgSla;
      } else if (sortField === 'penalties') {
        valA = a.penalties;
        valB = b.penalties;
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [records, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Chart dataset
  const chartData = useMemo(() => {
    return carrierStats.map(c => ({
      name: c.nombre,
      'Total PQRS': c.total,
      'Cerrados': c.cerrados,
      'Pendientes': c.abiertos + c.enProceso,
      'Sanciones (COP)': c.penalties,
      'Promedio Cierre (Días)': parseFloat(c.avgCierre.toFixed(1))
    }));
  }, [carrierStats]);

  // Cedi - CxD dataset
  const cediChartData = useMemo(() => {
    const countsMap: Record<string, number> = {};
    records.forEach(r => {
      const cediName = r.cedi || 'Sin Asignar / Otro';
      const cant = r.cantidad || 1;
      countsMap[cediName] = (countsMap[cediName] || 0) + cant;
    });

    return Object.entries(countsMap).map(([name, total]) => ({
      name,
      'Volumen PQRS': total
    })).sort((a, b) => b['Volumen PQRS'] - a['Volumen PQRS']);
  }, [records]);

  // Root Causes vs Actions dataset
  const rootCausesStats = useMemo(() => {
    const map: Record<string, {
      motivo: string;
      total: number;
      cerrados: number;
      penalties: number;
      acciones: Record<string, number>;
    }> = {};

    records.forEach(r => {
      const mot = r.motivo || 'Otra Causa';
      const acc = r.accion || 'Sin Acción Definida';
      const cant = r.cantidad || 1;

      if (!map[mot]) {
        map[mot] = {
          motivo: mot,
          total: 0,
          cerrados: 0,
          penalties: 0,
          acciones: {}
        };
      }

      const item = map[mot];
      item.total += cant;
      if (r.estado === 'Cerrado') {
        item.cerrados += cant;
      }
      item.penalties += r.costoPenalizacion || 0;
      item.acciones[acc] = (item.acciones[acc] || 0) + cant;
    });

    const totalRecords = records.reduce((sum, r) => sum + (r.cantidad || 1), 0) || 1;

    return Object.values(map).map(item => {
      const sortedAccs = Object.entries(item.acciones)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

      const percentage = (item.total / totalRecords) * 105; // slightly scaled but we want exactly real percentage:
      const realPercentage = (item.total / totalRecords) * 100;
      const tasaResolucion = item.total > 0 ? (item.cerrados / item.total) * 100 : 0;

      return {
        ...item,
        percentage: realPercentage,
        tasaResolucion,
        topAcciones: sortedAccs
      };
    }).sort((a, b) => b.total - a.total);
  }, [records]);

  // Sum of Cedi volumen to compute exact percentages in bar labels
  const totalCediCount = useMemo(() => {
    return cediChartData.reduce((acc, curr) => acc + curr['Volumen PQRS'], 0);
  }, [cediChartData]);

  // Labels for columns and bars
  const renderCarrierBarLabel = (dataKey: 'Cerrados' | 'Pendientes') => (props: any) => {
    const { x, y, width, value, index } = props;
    if (value === undefined || value === null || value === 0) return null;
    const entry = chartData[index];
    if (!entry) return null;
    const total = (entry['Cerrados'] || 0) + (entry['Pendientes'] || 0);
    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
    const color = dataKey === 'Cerrados' ? '#059669' : '#d97706';
    return (
      <text x={x + width / 2} y={y - 6} fill={color} fontSize={9} fontWeight="extrabold" textAnchor="middle">
        {value} ({pct}%)
      </text>
    );
  };

  const renderCediBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const pct = totalCediCount > 0 ? ((value / totalCediCount) * 100).toFixed(0) : '0';
    return (
      <text x={x + width / 2} y={y - 6} fill="#4f46e5" fontSize={9} fontWeight="extrabold" textAnchor="middle">
        {value} ({pct}%)
      </text>
    );
  };

  // Color mapping palette for carriers
  const COLORS = ['#2563eb', '#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#8b5cf6'];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="pantalla-analisis-transportadora" className="animate-fade-in space-y-6">
      
      {/* SECTION BANNER HERO */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-black text-slate-850 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" /> Scorecard y Auditoría de Proveedores de Carga
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Analiza el cumplimiento de entrega, sancionamientos, tiempos de resolución e índices MoM para cada transportadora asociada.
          </p>
        </div>
        <div className="text-xs text-slate-550 font-bold bg-white/70 px-4 py-2 border border-slate-100/80 rounded-2xl">
          Volumen Evaluado: <span className="text-blue-600 font-black font-mono">{records.reduce((sum, r) => sum + (r.cantidad || 1), 0)} Guías</span>
        </div>
      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: COMPARATIVO DE VOLUMEN (BARRA) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <BarChart3 className="w-4 h-4 text-blue-500" /> Volumen de Reclamos por Transportadora
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mb-4">Muestra la proporción de casos abiertos vs cerrados por transportador.</p>
          </div>

          <div className="h-68 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: '500' }}
                  labelStyle={{ fontWeight: 'black', color: '#2563eb' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="Cerrados" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20}>
                  <LabelList dataKey="Cerrados" content={renderCarrierBarLabel('Cerrados')} />
                </Bar>
                <Bar dataKey="Pendientes" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20}>
                  <LabelList dataKey="Pendientes" content={renderCarrierBarLabel('Pendientes')} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: VOLUMEN POR CEDI - CxD */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Grid className="w-4 h-4 text-indigo-500" /> Distribución por Cedi - CxD
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mb-4">Cantidad de reclamos y volumen consolidado de entregas por CEDI / CxD.</p>
          </div>

          <div className="h-68 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cediChartData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="Volumen PQRS" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={25}>
                  <LabelList dataKey="Volumen PQRS" content={renderCediBarLabel} />
                  {cediChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* COMPARTIVO DE CAUSAS RAIZ Y ACCION APLICADA */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
        <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 mb-1">
          <ListChecks className="w-4 h-4 text-indigo-600" /> Comparativo de Causas Raíz vs. Plan de Acción Ejecutado
        </h3>
        <p className="text-[11px] text-slate-400 font-semibold mb-4">
          Análisis pormenorizado de motivos de reclamos cruzados con las acciones de mitigación aplicadas del sistema.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-[25%]">Causa Raíz (Motivo)</th>
                <th className="py-2.5 px-4 text-center w-[15%]">Volumen Casos</th>
                <th className="py-2.5 px-4 w-[40%]">Plan de Acción (Principales Medidas Ejecutadas)</th>
                <th className="py-2.5 px-4 text-center w-[10%]">Resolución</th>
                <th className="py-2.5 px-4 text-right w-[10%]">Penalizaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 select-none">
              {rootCausesStats.map((item) => {
                return (
                  <tr key={item.motivo} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-800">{item.motivo}</div>
                      <div className="text-[9px] text-slate-400 font-bold tracking-tight">PARTICIPACIÓN: {item.percentage.toFixed(1)}%</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-slate-700 font-mono">{item.total}</div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1 max-w-[80px] mx-auto">
                        <div className="h-full bg-slate-400 rounded-full" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.topAcciones.slice(0, 3).map((act, i) => (
                          <span 
                            key={`${act.name}-${i}`} 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold text-[10px]"
                          >
                            <span className="max-w-[140px] truncate">{act.name}</span>
                            <span className="bg-indigo-200/50 text-indigo-800 text-[8px] px-1 rounded font-black">x{act.count}</span>
                          </span>
                        ))}
                        {item.topAcciones.length === 0 && (
                          <span className="text-[10px] text-slate-400 italic">No diligenciado</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded font-black text-[9px] font-mono ${
                        item.tasaResolucion >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        item.tasaResolucion >= 50 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {item.tasaResolucion.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 font-mono">
                      {item.penalties > 0 ? (
                        <span className="text-rose-600 font-black">{formatCurrency(item.penalties)}</span>
                      ) : (
                        <span className="text-slate-400 font-medium">$0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCORECARD CARRIERS AUDIT TABLE */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-500" /> Historial Consolidado de Desempeño
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Haz clic sobre las cabeceras para reordenar la tabla comparativa de transportistas.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="py-3 px-4">Transportadora</th>
                
                {/* SORTABLE HEADERS */}
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800 transition" onClick={() => toggleSort('total')}>
                  <div className="flex items-center justify-center gap-1.5">
                    Volumen TOTAL <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Finalizados / Abiertos</th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800 transition" onClick={() => toggleSort('tasa')}>
                  <div className="flex items-center justify-center gap-1.5">
                    Tasa Resolución <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800 transition" onClick={() => toggleSort('avgSla')}>
                  <div className="flex items-center justify-center gap-1.5">
                    Resp. Prom (Días) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800 transition" onClick={() => toggleSort('penalties')}>
                  <div className="flex items-center justify-center gap-1.5">
                    Penalización <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Nivel SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {carrierStats.map((item, idx) => {
                const badgeColor = 
                  item.compliance === 'Excelente' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  item.compliance === 'Cumple SLA' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  item.compliance === 'En Observación' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-rose-50 text-rose-700 border-rose-100';

                return (
                  <tr key={item.nombre} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-black text-slate-850 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">0{idx+1}</span>
                      <span>{item.nombre}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">{item.total}</td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-500 font-mono">
                      <span className="text-emerald-600 font-bold">{item.cerrados}</span> / <span className="text-amber-600 font-bold">{item.abiertos + item.enProceso}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">{item.tasa.toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-semibold font-mono">{item.avgSla.toFixed(2)} días</td>
                    <td className="py-3.5 px-4 text-center text-rose-600 font-bold font-mono">{formatCurrency(item.penalties)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider ${badgeColor}`}>
                        {item.compliance}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
