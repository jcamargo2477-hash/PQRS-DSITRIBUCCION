import React, { useState, useMemo } from 'react';
import { PqrsRecord } from '../types';
import { Search, Filter, ShieldAlert, CheckCircle2, Clock, FileSpreadsheet, Eye, X, HelpCircle, ArrowRight, User } from 'lucide-react';

interface GestionRadicadosProps {
  records: PqrsRecord[];
}

export default function GestionRadicados({ records }: GestionRadicadosProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [carrierFilter, setCarrierFilter] = useState<string>('All');
  const [viewRecord, setViewRecord] = useState<PqrsRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Real-time grouping stats for the header panel (Gestion de Radicados)
  const stats = useMemo(() => {
    const totalRadicados = records.reduce((sum, r) => sum + (r.cantidad || 1), 0);
    
    // Radicados por mes
    const mesCounts: Record<string, number> = {};
    // Radicados por transportadora
    const carrierCounts: Record<string, number> = {};
    // Radicados por estado
    let cerrados = 0;
    let abiertos = 0;
    let enProceso = 0;

    records.forEach(r => {
      const cant = r.cantidad || 1;
      const m = r.mes || 'Otros';
      const c = r.transportadora || 'Otros';

      mesCounts[m] = (mesCounts[m] || 0) + cant;
      carrierCounts[c] = (carrierCounts[c] || 0) + cant;

      if (r.estado === 'Cerrado') cerrados += cant;
      else if (r.estado === 'Abierto') abiertos += cant;
      else if (r.estado === 'En proceso') enProceso += cant;
    });

    return {
      totalRadicados,
      mesCounts,
      carrierCounts,
      cerrados,
      abiertos,
      enProceso
    };
  }, [records]);

  // Filter local dataset
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = 
        record.cliente.toLowerCase().includes(search.toLowerCase()) ||
        record.id.toLowerCase().includes(search.toLowerCase()) ||
        record.guia.toLowerCase().includes(search.toLowerCase()) ||
        (record.responsable && record.responsable.toLowerCase().includes(search.toLowerCase()));

      const matchesCarrier = carrierFilter === 'All' || record.transportadora === carrierFilter;
      const matchesStatus = statusFilter === 'All' || record.estado === statusFilter;

      return matchesSearch && matchesCarrier && matchesStatus;
    });
  }, [records, search, carrierFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredRecords, currentPage]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  const uniqueCarriers = useMemo(() => {
    return Array.from(new Set(records.map(r => r.transportadora).filter(Boolean)));
  }, [records]);

  return (
    <div id="pantalla-gestion-radicados" className="animate-fade-in space-y-6">
      
      {/* 1. COMPACT GROUP SUMMARY CARDS HEADER (Radicados Analysis) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Total Radicados volume */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-4">Total Radicados (Cantidad N)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-blue-450 tracking-tight font-display">{stats.totalRadicados}</span>
              <span className="text-xs text-slate-400 font-bold font-mono">Unidades</span>
            </div>
            <p className="text-[10px] text-slate-350 font-medium mt-1">Suma acumulada del archivo evaluado.</p>
          </div>
          <div className="h-1 bg-blue-600 rounded-full w-3/4 mt-4"></div>
        </div>

        {/* Radicados por Mes */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-3">Radicados por Mes</span>
            <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
              {Object.entries(stats.mesCounts).map(([mes, count]) => {
                const perc = stats.totalRadicados > 0 ? ((count as number) / stats.totalRadicados) * 100 : 0;
                return (
                  <div key={mes} className="space-y-0.5 text-xs">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-extrabold text-slate-650">{mes.toUpperCase()}</span>
                      <span className="font-bold text-slate-900 font-mono">{count as number} ({perc.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${perc}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Radicados por Transportadora */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-3">Por Transportadora</span>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {Object.entries(stats.carrierCounts)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .slice(0, 4)
                .map(([carrier, count]) => {
                  return (
                    <div key={carrier} className="flex justify-between items-center text-[11px] p-1 border-b border-slate-50 last:border-0">
                      <span className="font-bold text-slate-705 truncate max-w-[120px]">{carrier}</span>
                      <span className="font-extrabold text-blue-600 font-mono bg-blue-50/50 px-1.5 py-0.5 rounded text-[10px]">{count as number} uds</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Radicados por Estado */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-3">Estatus de Gestión</span>
            <div className="space-y-2">
              {/* Cerrados */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  ● Cerrado
                </span>
                <span className="font-bold font-mono text-slate-905">{stats.cerrados} radicados</span>
              </div>
              {/* Abiertos */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  ● Abierto
                </span>
                <span className="font-bold font-mono text-slate-905">{stats.abiertos} radicados</span>
              </div>
              {/* En proceso */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  ● En proceso
                </span>
                <span className="font-bold font-mono text-slate-905">{stats.enProceso} radicados</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. ADVANCED DETAIL TABLE EXPLORER */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        
        {/* Table Search Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, Cliente, Guía o Responsable..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Carrier Filter */}
            <select
              value={carrierFilter}
              aria-label="Filtrar por transportadora"
              onChange={(e) => {
                setCarrierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">Todas las Transportadoras</option>
              {uniqueCarriers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Quick Status Filter */}
            <select
              value={statusFilter}
              aria-label="Filtrar por estado del radicado"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">Todos los Estados</option>
              <option value="Cerrado">Cerrado</option>
              <option value="Abierto">Abierto</option>
              <option value="En proceso">En proceso</option>
            </select>
          </div>
        </div>

        {/* DATA TABLE VIEW */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center bg-blue-55/10 text-blue-600">N</th>
                <th className="py-3 px-4">Folio ID</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Transportadora</th>
                <th className="py-3 px-4">Cliente / Guía</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Multa</th>
                <th className="py-3 px-4 text-center">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 font-bold text-slate-400">
                    No se encontraron radicados que correspondan al filtro de búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record, index) => (
                  <tr key={`${record.id}-${index}`} className="hover:bg-slate-50/30 transition">
                    <td className="py-3.5 px-4 font-black text-blue-600 text-center bg-blue-50/10 border-r border-slate-100/50">{record.cantidad || 1}</td>
                    <td className="py-3.5 px-4 font-extrabold text-blue-600 tracking-tight font-mono">{record.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-500">{record.fecha}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-800">{record.transportadora}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-800">{record.cliente}</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">GUÍA: {record.guia}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-600 flex items-center gap-1.5 mt-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black shrink-0 text-indigo-650">SAC</div>
                      <span className="truncate max-w-[130px]">{record.responsable || 'Sin Asignar'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 block max-w-44 truncate" title={record.motivo}>
                        {record.motivo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-xl uppercase tracking-tighter ${
                        record.estado === 'Cerrado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        record.estado === 'En proceso' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {record.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono">
                      {record.costoPenalizacion > 0 ? formatCurrency(record.costoPenalizacion) : '$0'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setViewRecord(record)}
                        className="p-1 px-2.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-650 hover:text-blue-650 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3 h-3" /> Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium select-none">
            <span>Resultados: <strong>{filteredRecords.length}</strong> radicados</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-8 h-8 rounded-lg font-extrabold transition cursor-pointer ${
                    currentPage === i + 1 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-105' 
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-650'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

      </div>

      {/* DETAIL DRAWER / MODAL */}
      {viewRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button 
              onClick={() => setViewRecord(null)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white bg-blue-600 px-3 py-1 rounded-lg">
                  📋 RADICADO DETALLADO
                </span>
                <span className="text-sm font-extrabold text-slate-700 font-mono">
                  {viewRecord.id}
                </span>
              </div>
              
              {/* Type Badge from Column R */}
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                String(viewRecord.tipoRequerimiento || '').toLowerCase().includes('queja')
                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                  : String(viewRecord.tipoRequerimiento || '').toLowerCase().includes('reclamo')
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
              }`}>
                {viewRecord.tipoRequerimiento || 'Reclamo'}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {viewRecord.tipoRequerimiento || 'Reclamo'} de {viewRecord.cliente}
            </h3>

            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
              <div>
                <strong className="text-slate-450 uppercase text-[9px] block font-extrabold">Transportadora</strong>
                <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{viewRecord.transportadora}</span>
              </div>
              <div>
                <strong className="text-slate-450 uppercase text-[9px] block font-extrabold">Código de Guía</strong>
                <span className="font-mono text-slate-800 text-sm mt-0.5 block">{viewRecord.guia}</span>
              </div>
              <div>
                <strong className="text-slate-450 uppercase text-[9px] block font-extrabold">Responsable SAC</strong>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{viewRecord.responsable || 'Alvaro Ruíz'}</span>
              </div>
              <div>
                <strong className="text-slate-450 uppercase text-[9px] block font-extrabold">Fecha de Radicado</strong>
                <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">{viewRecord.fecha}</span>
              </div>

              {viewRecord.region && (
                <div>
                  <strong className="text-slate-450 uppercase text-[9px] block font-extrabold">Región / Ciudad</strong>
                  <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                    {viewRecord.region} {viewRecord.subRegion ? `• ${viewRecord.subRegion}` : ''}
                  </span>
                </div>
              )}
              {viewRecord.cedi && (
                <div>
                  <strong className="text-slate-450 uppercase text-[9px] block font-extrabold">CEDI Origen</strong>
                  <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                    {viewRecord.cedi} {viewRecord.placa ? `([${viewRecord.placa}])` : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <strong className="text-slate-450 uppercase text-[9px] block font-extrabold mb-1">Descripción del Incidente</strong>
              <p className="text-slate-700 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                "{viewRecord.descripcion}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-100 pt-4 text-xs bg-slate-50/60 p-4 rounded-xl">
              <div>
                <strong className="text-slate-450 uppercase text-[9px] block font-extrabold">Plan de Acción</strong>
                <span className="font-bold text-blue-700 text-xs mt-0.5 block">{viewRecord.accion}</span>
              </div>
              <div>
                <strong className="text-slate-450 uppercase text-[9px] block font-extrabold">Sanción Económica COP</strong>
                <span className="font-extrabold text-rose-600 text-xs mt-0.5 block">{formatCurrency(viewRecord.costoPenalizacion)}</span>
              </div>
            </div>

            {/* DYNAMIC EXTRA COLUMNS FROM EXCEL CHOPPED/CLEANED */}
            {(() => {
              const shownKeys = new Set([
                'id', 'fecha', 'cliente', 'responsable', 'transportadora', 'motivo', 'accion', 'estado', 
                'costomercancia', 'diasdemora', 'costopenalizacion', 'guia', 'descripcion', 'region', 
                'subregion', 'zona', 'canal', 'cedi', 'placa', 'causaraizsubtema', 'nivelcumplimiento', 
                'estadogestion', 'mes', 'tiporequerimiento', 'diastranscurridos', 'cantidad'
              ]);
              const extras = Object.entries(viewRecord.rawData || {}).filter(([key, val]) => {
                const kNorm = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                const isShown = shownKeys.has(kNorm);
                const hasValue = val !== undefined && val !== null && String(val).trim() !== '';
                return !isShown && hasValue;
              });

              if (extras.length === 0) return null;

              return (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <strong className="text-slate-450 uppercase text-[9px] block font-extrabold mb-2 text-indigo-650">
                    📊 COLUMNAS ADICIONALES DETECTADAS EN EXCEL
                  </strong>
                  <div className="grid grid-cols-2 gap-2 text-[11px] max-h-40 overflow-y-auto pr-1">
                    {extras.map(([key, value]) => (
                      <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col">
                        <span className="text-slate-400 font-extrabold truncate uppercase text-[8px] leading-tight">{key}</span>
                        <span className="font-bold text-slate-800 break-all mt-0.5">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setViewRecord(null)}
              className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border-none"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
