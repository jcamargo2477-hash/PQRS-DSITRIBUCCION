import React, { useMemo, useState } from 'react';
import { PqrsRecord } from '../types';
import { ClipboardList, Award, Percent, ChevronRight, ChevronDown, Check, Sparkles, FolderTree, BarChart, ListChecks, HelpCircle, Filter, RotateCcw } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface AnalisisMotivosProps {
  records: PqrsRecord[];
  filters?: any;
  setFilters?: React.Dispatch<React.SetStateAction<any>>;
}

export default function AnalisisMotivos({ records, filters, setFilters }: AnalisisMotivosProps) {
  const [selectedTreeMotif, setSelectedTreeMotif] = useState<string | null>(null);
  const [selectedTreeSubmotif, setSelectedTreeSubmotif] = useState<string | null>(null);
  const [selectedViewPanel, setSelectedViewPanel] = useState<'actions' | 'submotifs'>('actions');

  // Compute Top Motifs, Submotifs, and Actions
  const data = useMemo(() => {
    const totalRadicados = records.reduce((sum, r) => sum + (r.cantidad || 1), 0);

    // 1. Motifs Grouping
    const motifsMap: Record<string, number> = {};
    records.forEach(r => {
      const m = r.motivo || 'Otro Motivo';
      motifsMap[m] = (motifsMap[m] || 0) + (r.cantidad || 1);
    });

    const motifsSorted = Object.entries(motifsMap)
      .map(([name, value]) => ({ name, value, participation: totalRadicados > 0 ? (value / totalRadicados) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    // 2. Submotifs Grouping
    const submotifsMap: Record<string, number> = {};
    records.forEach(r => {
      const sm = r.causaRaizSubtema || 'No especificado (Observación)';
      submotifsMap[sm] = (submotifsMap[sm] || 0) + (r.cantidad || 1);
    });

    const submotifsSorted = Object.entries(submotifsMap)
      .map(([name, value]) => ({ name, value, participation: totalRadicados > 0 ? (value / totalRadicados) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    // 2b. Actions Grouping (Plan de Acción)
    const actionsMap: Record<string, number> = {};
    records.forEach(r => {
      const act = r.accion || 'Sin Acción Definida';
      actionsMap[act] = (actionsMap[act] || 0) + (r.cantidad || 1);
    });

    const actionsSorted = Object.entries(actionsMap)
      .map(([name, value]) => ({ name, value, participation: totalRadicados > 0 ? (value / totalRadicados) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    // 3. Pareto Chart formulation (Top motifs list)
    let runningSum = 0;
    const paretoDataset = motifsSorted.map((item, idx) => {
      runningSum += item.value;
      const cumulativePercentage = totalRadicados > 0 ? (runningSum / totalRadicados) * 105 : 100;
      return {
        name: item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name,
        'Frecuencia': item.value,
        'Acumulado (%)': parseFloat(Math.min(cumulativePercentage, 100).toFixed(1)),
      };
    });

    // 4. Incident Tree structure
    const motifTree: Record<string, { total: number; subthemes: Record<string, number> }> = {};
    records.forEach(r => {
      const m = r.motivo || 'Otro Motivo';
      const sm = r.causaRaizSubtema || 'No Especificado';
      const cant = r.cantidad || 1;

      if (!motifTree[m]) {
        motifTree[m] = { total: 0, subthemes: {} };
      }
      motifTree[m].total += cant;
      motifTree[m].subthemes[sm] = (motifTree[m].subthemes[sm] || 0) + cant;
    });

    return {
      totalRadicados,
      motifsSorted: motifsSorted.slice(0, 10),
      submotifsSorted: submotifsSorted.slice(0, 10),
      actionsSorted: actionsSorted.slice(0, 10),
      paretoDataset,
      motifTree,
    };
  }, [records]);

  // Dynamic statistics focused on active Tree selections
  const selectedFocusData = useMemo(() => {
    let focusRecords = records;
    let label = 'Nivel Nacional (Todos)';

    if (selectedTreeSubmotif) {
      focusRecords = records.filter(r => 
        (r.motivo || 'Otro Motivo') === selectedTreeMotif && 
        (r.causaRaizSubtema || 'No Especificado') === selectedTreeSubmotif
      );
      label = `Submotivo: ${selectedTreeSubmotif}`;
    } else if (selectedTreeMotif) {
      focusRecords = records.filter(r => (r.motivo || 'Otro Motivo') === selectedTreeMotif);
      label = `Motivo: ${selectedTreeMotif}`;
    }

    const totalFiltered = focusRecords.reduce((sum, r) => sum + (r.cantidad || 1), 0);

    // Group Actions specifically for this scope
    const actionsMap: Record<string, number> = {};
    focusRecords.forEach(r => {
      const act = r.accion || 'Sin Acción Definida';
      actionsMap[act] = (actionsMap[act] || 0) + (r.cantidad || 1);
    });

    const focusActionsSorted = Object.entries(actionsMap)
      .map(([name, value]) => ({ 
        name, 
        value, 
        participation: totalFiltered > 0 ? (value / totalFiltered) * 100 : 0 
      }))
      .sort((a, b) => b.value - a.value);

    // Group Submotivos specifically for this scope
    const submotifsMap: Record<string, number> = {};
    focusRecords.forEach(r => {
      const sm = r.causaRaizSubtema || 'No especificado (Observación)';
      submotifsMap[sm] = (submotifsMap[sm] || 0) + (r.cantidad || 1);
    });

    const focusSubmotifsSorted = Object.entries(submotifsMap)
      .map(([name, value]) => ({ 
        name, 
        value, 
        participation: totalFiltered > 0 ? (value / totalFiltered) * 100 : 0 
      }))
      .sort((a, b) => b.value - a.value);

    return {
      currentActionsSorted: focusActionsSorted.slice(0, 10),
      currentSubmotifsSorted: focusSubmotifsSorted.slice(0, 10),
      activeFilterLabel: label,
      isFilteredByTree: !!(selectedTreeMotif || selectedTreeSubmotif),
    };
  }, [records, selectedTreeMotif, selectedTreeSubmotif]);

  // Set default expanding tree motif to the first top motif on load
  React.useEffect(() => {
    if (data.motifsSorted.length > 0 && !selectedTreeMotif) {
      setSelectedTreeMotif(data.motifsSorted[0].name);
    }
  }, [data, selectedTreeMotif]);

  const handleToggleSubreasonFilter = (subreasonName: string) => {
    if (!setFilters) return;
    setFilters((prev: any) => ({
      ...prev,
      subreason: prev.subreason === subreasonName ? '' : subreasonName
    }));
  };

  const handleToggleActionFilter = (actionName: string) => {
    if (!setFilters) return;
    setFilters((prev: any) => ({
      ...prev,
      action: prev.action === actionName ? '' : actionName
    }));
  };

  const COLORS = ['#2563eb', '#3b82f6', '#4f46e5', '#6366f1', '#10b981', '#14b8a6', '#f59e0b', '#ec4899', '#f43f5e', '#64748b'];

  return (
    <div id="pantalla-analisis-motivos" className="animate-fade-in space-y-6">
      
      {/* SECTION BANNER HERO */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-black text-slate-850 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-650" /> Análisis Avanzado de Motivos y Categorización
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Identifica el Pareto de incidencias, desglosa submotivos operacionales de alta recurrencia y explora el árbol integrado de reclamaciones.
          </p>
        </div>
        <div className="text-xs text-slate-550 font-bold bg-indigo-50/50 px-4 py-2 border border-indigo-100/50 rounded-2xl flex items-center gap-1.5 text-indigo-700">
          <Sparkles className="w-3.5 h-3.5 animate-bounce" /> Incidencias Totales: <span className="font-extrabold font-mono">{data.totalRadicados}</span>
        </div>
      </div>

      {/* TOP GRID: PARETO CHART AND TOP MOTIVES LISTING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* PARETO DIAGRAM (Composed Dual-Axis chart) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Percent className="w-4 h-4 text-indigo-500" /> Curva de Pareto (80/20 de Incidencias)
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mb-4">
              Identifica el 20% de los motivos que generan el 80% del volumen logístico de reclamos.
            </p>
          </div>

          <div className="h-72 w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.paretoDataset} margin={{ top: 20, right: -15, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: '#4f46e5', fontWeight: 'bold' }} stroke="#cbd5e1" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Bar yAxisId="left" dataKey="Frecuencia" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={22} name="Freq. Casos">
                  <LabelList dataKey="Frecuencia" content={(props: any) => {
                    const { x, y, width, value } = props;
                    if (value === undefined || value === null || value === 0) return null;
                    const total = data.totalRadicados || 1;
                    const pct = ((value / total) * 100).toFixed(0);
                    return (
                      <text x={x + width / 2} y={y - 8} fill="#1d4ed8" fontSize={8} fontWeight="extrabold" textAnchor="middle">
                        {value} ({pct}%)
                      </text>
                    );
                  }} />
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="Acumulado (%)" stroke="#e11d48" strokeWidth={3} dot={{ fill: '#e11d48', r: 4 }} activeDot={{ r: 6 }} name="Porcentaje Acumulado" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP MOTIFS PERCENTAGE BREAKDOWN LIST */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Award className="w-4 h-4 text-emerald-500" /> Distribución Porcentual
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mb-3">Participación relativa de motivos principales.</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-76 pr-1">
            {data.motifsSorted.map((item, idx) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700 truncate max-w-[200px]">{idx+1}. {item.name}</span>
                  <span className="font-bold text-slate-900 font-mono">{item.participation.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${item.participation}%`,
                      backgroundColor: COLORS[idx % COLORS.length]
                    }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold font-mono">
                  <span>VOLUMEN: {item.value} Radicados</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* LOWER ROW: TOP 10 SUBMOTIVOS & DIGITAL INCIDENT TREE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* INTERACTIVE BREAKDOWN TREE BOX */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs lg:col-span-7 flex flex-col">
          <div className="mb-4">
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-blue-500" /> Árbol Dinámico de Incidencias Operativas
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Haz clic sobre un motivo principal a la izquierda para inspeccionar la cascada de submotivos relacionados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 items-stretch">
            {/* Left motifs column select (2/5 width) */}
            <div className="md:col-span-2 border-r border-slate-100 pr-2 space-y-1 overflow-y-auto max-h-76">
              {/* Consolidado Nacional selection button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTreeMotif(null);
                  setSelectedTreeSubmotif(null);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 border select-none cursor-pointer mb-2 ${
                  !selectedTreeMotif 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">Consolidado Nacional</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-extrabold font-mono rounded ${
                  !selectedTreeMotif ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600 font-black'
                }`}>
                  {data.totalRadicados}
                </span>
              </button>

              {data.motifsSorted.map((item) => {
                const isSelected = selectedTreeMotif === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTreeMotif(null);
                        setSelectedTreeSubmotif(null);
                      } else {
                        setSelectedTreeMotif(item.name);
                        setSelectedTreeSubmotif(null);
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 border select-none cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                        : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate max-w-[125px]">{item.name}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-extrabold font-mono rounded ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-slate-250 text-slate-600 font-black'
                    }`}>
                      {item.value}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right submotifs output (3/5 width) */}
            <div className="md:col-span-3 pl-2 flex flex-col justify-start space-y-3 overflow-y-auto max-h-76">
              {selectedTreeMotif && data.motifTree[selectedTreeMotif] ? (
                <>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-widest">Motivo Raíz Evaluado</span>
                    <span className="text-xs font-extrabold text-blue-600 block mt-0.5">{selectedTreeMotif}</span>
                    <span className="text-[10px] text-slate-550 font-bold block mt-1 font-mono">Volumen Acumulado: {data.motifTree[selectedTreeMotif].total} casos</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Subtemas Registrados (Hijos)</span>
                      {selectedTreeSubmotif && (
                        <button
                          type="button"
                          onClick={() => setSelectedTreeSubmotif(null)}
                          className="text-[8px] font-bold text-rose-600 uppercase tracking-wider cursor-pointer"
                        >
                          Limpiar Subtema
                        </button>
                      )}
                    </div>
                    {Object.entries(data.motifTree[selectedTreeMotif].subthemes)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([subName, subVal]) => {
                        const totalM = data.motifTree[selectedTreeMotif!].total;
                        const subShare = totalM > 0 ? ((subVal as number) / (totalM as number)) * 100 : 0;
                        const isSubActive = selectedTreeSubmotif === subName;

                        return (
                          <button
                            key={subName}
                            type="button"
                            onClick={() => setSelectedTreeSubmotif(prev => prev === subName ? null : subName)}
                            className={`w-full text-left p-2 border rounded-xl text-xs font-bold transition flex items-center justify-between gap-3 select-none cursor-pointer ${
                              isSubActive 
                                ? 'border-indigo-600 bg-indigo-50/70 hover:bg-indigo-50 text-indigo-950 ring-1 ring-indigo-500/20' 
                                : 'border-slate-50 bg-white/70 hover:border-slate-200 hover:bg-slate-50 text-slate-705 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`}></div>
                              <span className="truncate max-w-[170px]">{subName}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono shrink-0">
                              <span className={`px-1.5 py-0.5 text-[9px] font-extrabold font-mono rounded ${
                                isSubActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>{subVal}</span>
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                                isSubActive ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-50 text-blue-500'
                              }`}>{subShare.toFixed(0)}%</span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs p-8 text-center border-2 border-dashed border-slate-150 rounded-2xl">
                  <FolderTree className="w-8 h-8 text-slate-350 mb-2 animate-bounce" />
                  <span className="font-semibold">Bielas y Conexiones Logísticas</span>
                  <p className="text-[10px] text-slate-400 mt-1">Selecciona un motivo de la columna izquierda para desplegar sus componentes hijos y analizar sus planes de acción.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP 10 PLANES DE ACCIÓN / SUBMOTIVOS CON FILTRADO INTERACTIVO */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
                {selectedViewPanel === 'actions' ? (
                  <>
                    <ListChecks className="w-4 h-4 text-indigo-600 animate-pulse" /> Top Planes de Acción
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-4 h-4 text-purple-600 animate-pulse" /> Top Submotivos Nacionales
                  </>
                )}
              </h3>
              
              {/* High precision Toggle buttons */}
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedViewPanel('actions')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    selectedViewPanel === 'actions' 
                      ? 'bg-white text-indigo-700 shadow-xs font-extrabold' 
                      : 'text-slate-505 hover:text-slate-800'
                  }`}
                >
                  Planes de Acción
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedViewPanel('submotifs')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    selectedViewPanel === 'submotifs' 
                      ? 'bg-white text-purple-700 shadow-xs font-extrabold' 
                      : 'text-slate-505 hover:text-slate-800'
                  }`}
                >
                  Submotivos
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-450 font-semibold mb-3 leading-normal">
              {selectedViewPanel === 'actions' 
                ? 'Listado de planes y medidas administrativas de mayor recurrencia. Haz clic para filtrar el tablero.'
                : 'Suma acumulada de causas secundarias de alto dolor operativo. Haz clic para filtrar el tablero.'
              }
            </p>

            {/* Active Enfoque Context band */}
            <div className="mb-3.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider shrink-0">Enfoque:</span>
                <span className="text-[10px] font-extrabold text-indigo-750 truncate max-w-[150px] md:max-w-[200px]" title={selectedFocusData.activeFilterLabel}>
                  {selectedFocusData.activeFilterLabel}
                </span>
              </div>
              {selectedFocusData.isFilteredByTree && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTreeMotif(null);
                    setSelectedTreeSubmotif(null);
                  }}
                  className="text-[8px] font-black text-rose-600 hover:text-rose-700 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded transition shrink-0 cursor-pointer"
                >
                  Ver Todo
                </button>
              )}
            </div>          <div className="space-y-2 overflow-y-auto max-h-76 pr-1">
            {selectedViewPanel === 'actions' && (
              selectedFocusData.currentActionsSorted.length > 0 ? (
                <>
                  {selectedFocusData.currentActionsSorted.map((item, idx) => {
                    const isActive = filters?.action === item.name;
                    return (
                      <div 
                        key={item.name} 
                        onClick={() => handleToggleActionFilter?.(item.name)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isActive 
                            ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 shadow-xs' 
                            : 'border-slate-50 bg-slate-55/20 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isActive ? <Check className="w-3 h-3" /> : idx+1}
                          </span>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-700 block truncate" title={item.name}>{item.name}</span>
                            {isActive && <span className="text-[8px] text-indigo-600 font-extrabold uppercase tracking-widest block">Filtro Activo</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="text-[10px] font-extrabold text-slate-900 bg-slate-100 group-hover:bg-white px-1.5 py-0.5 rounded transition">{item.value}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.participation.toFixed(1)}%</span>
                          <Filter className={`w-3.5 h-3.5 transition shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl">
                  No hay planes de acción para esta selección.
                </div>
              )
            )}

            {selectedViewPanel === 'submotifs' && (
              selectedFocusData.currentSubmotifsSorted.length > 0 ? (
                <>
                  {selectedFocusData.currentSubmotifsSorted.map((item, idx) => {
                    const isActive = filters?.subreason === item.name;
                    return (
                      <div 
                        key={item.name} 
                        onClick={() => handleToggleSubreasonFilter?.(item.name)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isActive 
                            ? 'border-purple-300 bg-purple-50/50 hover:bg-purple-50 shadow-xs' 
                            : 'border-slate-50 bg-slate-55/20 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isActive ? 'bg-purple-600 text-white' : 'bg-slate-105 text-slate-600'
                          }`}>
                            {isActive ? <Check className="w-3 h-3" /> : idx+1}
                          </span>
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-700 block truncate" title={item.name}>{item.name}</span>
                            {isActive && <span className="text-[8px] text-purple-600 font-extrabold uppercase tracking-widest block">Filtro Activo</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="text-[10px] font-extrabold text-slate-900 bg-slate-100 group-hover:bg-white px-1.5 py-0.5 rounded transition">{item.value}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.participation.toFixed(1)}%</span>
                          <Filter className={`w-3.5 h-3.5 transition shrink-0 ${isActive ? 'text-purple-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl">
                  No hay submotivos registrados para esta selección.
                </div>
              )
            )}
          </div>
        </div>

          {/* Active items indicator and Clear button */}
          {((selectedViewPanel === 'actions' && filters?.action) || (selectedViewPanel === 'submotifs' && filters?.subreason)) && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtro aplicado en cascada</span>
              <button
                type="button"
                onClick={() => {
                  if (setFilters) {
                    setFilters(prev => ({
                      ...prev,
                      ...(selectedViewPanel === 'actions' ? { action: '' } : { subreason: '' })
                    }));
                  }
                }}
                className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 hover:text-rose-700 tracking-wider uppercase cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Quitar Filtro
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
