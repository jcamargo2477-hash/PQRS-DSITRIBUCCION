import React, { useState } from 'react';
import { Search, Filter, ShieldAlert, CheckCircle2, Clock, FileSpreadsheet, Eye, X } from 'lucide-react';
import { PqrsRecord } from '../types';
import { CARRIERS } from '../data/mockData';

interface PqrsTableProps {
  records: PqrsRecord[];
  selectedCarrier: string | null;
  onSelectCarrier: (carrier: string | null) => void;
  selectedMotivo: string | null;
  onSelectMotivo: (motivo: string | null) => void;
}

export default function PqrsTable({
  records,
  selectedCarrier,
  onSelectCarrier,
  selectedMotivo,
  onSelectMotivo
}: PqrsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [actionFilter, setActionFilter] = useState<string>('All');

  // Detailed Modal view state
  const [viewRecord, setViewRecord] = useState<PqrsRecord | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter the records based on active criteria
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.cliente.toLowerCase().includes(search.toLowerCase()) ||
      record.id.toLowerCase().includes(search.toLowerCase()) ||
      record.guia.toLowerCase().includes(search.toLowerCase());

    const matchesCarrier = !selectedCarrier || record.transportadora === selectedCarrier;
    const matchesMotivo = !selectedMotivo || record.motivo === selectedMotivo;
    
    const matchesStatus = statusFilter === 'All' || record.estado === statusFilter;
    const matchesAction = actionFilter === 'All' || record.accion === actionFilter;

    return matchesSearch && matchesCarrier && matchesMotivo && matchesStatus && matchesAction;
  });

  // Calculate pages
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  // Get unique actions for filtering drop down
  const uniqueActions = Array.from(new Set(records.map(r => r.accion).filter(Boolean)));

  return (
    <div id="pqrs-table-container" className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 mb-6">
      
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-105">
        <div>
          <h4 className="text-[10px] uppercase font-extrabold text-blue-600 tracking-widest font-sans">Planilla de Control</h4>
          <h3 className="text-sm font-extrabold text-slate-900 mt-1 uppercase flex items-center gap-2 font-display" id="table-main-title">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Explorar Registro Detallado de Casos
          </h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedCarrier && (
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-lg flex items-center gap-1.5 select-none">
              Transportadora: {selectedCarrier}
              <button onClick={() => onSelectCarrier(null)} className="hover:text-blue-900 font-extrabold cursor-pointer">×</button>
            </span>
          )}
          {selectedMotivo && (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-150 px-2.5 py-1 rounded-lg flex items-center gap-1.5 select-none font-display">
              Motivo: {selectedMotivo.substring(0, 20)}...
              <button onClick={() => onSelectMotivo(null)} className="hover:text-rose-900 font-extrabold cursor-pointer">×</button>
            </span>
          )}
        </div>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div id="table-filters-panel" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, ID o Guía..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Carrier Select Dropdown */}
        <div className="relative">
          <select
            value={selectedCarrier || 'All'}
            onChange={(e) => {
              onSelectCarrier(e.target.value === 'All' ? null : e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="All">Todas las Transportadoras</option>
            {CARRIERS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-3 flex items-center text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Status Select Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="All">Todos los Estados</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Abierto">Abierto</option>
            <option value="En proceso">En proceso</option>
          </select>
          <div className="pointer-events-none absolute right-3.5 top-3 flex items-center text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Action Select Dropdown */}
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="All">Todas las Acciones Aplicadas</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-3 flex items-center text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* DATA TABLE BLOCK */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 font-extrabold text-blue-600 bg-blue-50/30 text-center">N</th>
              <th className="py-3 px-4 font-extrabold text-slate-650">Folio ID</th>
              <th className="py-3 px-4 font-extrabold text-slate-650">Fecha</th>
              <th className="py-3 px-4 font-extrabold text-slate-650">Transportadora</th>
              <th className="py-3 px-4 font-extrabold text-slate-650">Cliente / Guía</th>
              <th className="py-3 px-4 font-extrabold text-slate-650">Motivo del Reclamo</th>
              <th className="py-3 px-4 font-extrabold text-slate-650">Acción Ejecutada</th>
              <th className="py-3 px-4 font-extrabold text-slate-650">Estado</th>
              <th className="py-3 px-4 font-extrabold text-slate-650 text-right">Multa</th>
              <th className="py-3 px-4 font-extrabold text-slate-650 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10 font-medium text-slate-400">
                  No se encontraron casos que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record, index) => {
                return (
                  <tr key={`${record.id}-${index}-${currentPage}`} id={`pqrs-row-${index}`} className="hover:bg-slate-50/50 transition">
                    {/* Quantity N */}
                    <td className="py-3 px-4 font-extrabold text-blue-600 text-center bg-blue-50/10 border-r border-slate-100/50">{record.cantidad || 1}</td>

                    {/* Folio ID */}
                    <td className="py-3 px-4 font-extrabold text-blue-600 tracking-tight font-mono">{record.id}</td>
                    
                    {/* Date */}
                    <td className="py-3 px-4 font-medium text-slate-500">{record.fecha}</td>
                    
                    {/* Carrier */}
                    <td className="py-3 px-4 font-semibold text-slate-700">{record.transportadora}</td>
                    
                    {/* Customer Code */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{record.cliente}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Guía: {record.guia}</div>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 block max-w-48 truncate" title={record.motivo}>
                        {record.motivo}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span className="text-slate-600 font-semibold">{record.accion}</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        record.estado === 'Cerrado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        record.estado === 'En proceso' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {record.estado === 'Cerrado' ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> :
                         record.estado === 'En proceso' ? <Clock className="w-2.5 h-2.5 shrink-0" /> :
                         <ShieldAlert className="w-2.5 h-2.5 shrink-0" />}
                        {record.estado}
                      </span>
                    </td>

                    {/* Fine Penalty */}
                    <td className="py-3 px-4 text-right">
                      {record.costoPenalizacion > 0 ? (
                        <span className="font-bold text-rose-600">{formatCurrency(record.costoPenalizacion)}</span>
                      ) : (
                        <span className="text-slate-400">$0</span>
                      )}
                    </td>

                    {/* Detail Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setViewRecord(record)}
                        className="p-1 px-2.5 border border-slate-200 hover:border-blue-400 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition text-[11px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                        id={`btn-view-${record.id}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div id="table-pagination" className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium select-none">
          <span>Mostrando página <strong>{currentPage}</strong> de {totalPages}</span>
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

      {/* DETAILED DIALOG MODAL */}
      {viewRecord && (
        <div id="record-details-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="record-details-modal" className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button 
              onClick={() => setViewRecord(null)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              id="btn-close-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white bg-indigo-600 px-3 py-1 rounded-lg">
                  📋 EXPEDIENTE DETALLADO
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
                <strong className="text-slate-400 uppercase text-[10px] block font-bold">Transportadora</strong>
                <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{viewRecord.transportadora}</span>
              </div>
              <div>
                <strong className="text-slate-400 uppercase text-[10px] block font-bold">Código de Guía</strong>
                <span className="font-mono text-slate-800 text-sm mt-0.5 block">{viewRecord.guia}</span>
              </div>
              <div>
                <strong className="text-slate-400 uppercase text-[10px] block font-bold">Fecha del Suceso</strong>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{viewRecord.fecha}</span>
              </div>
              <div>
                <strong className="text-slate-400 uppercase text-[10px] block font-bold">Estado de Resolución</strong>
                <span className="inline-block mt-0.5 font-extrabold text-slate-800">{viewRecord.estado}</span>
              </div>

              {/* High Fidelity Fields from Excel Upload */}
              {viewRecord.region && (
                <div>
                  <strong className="text-slate-400 uppercase text-[10px] block font-bold">Región y Subregión</strong>
                  <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                    {viewRecord.region} {viewRecord.subRegion ? `• ${viewRecord.subRegion}` : ''}
                  </span>
                </div>
              )}
              {viewRecord.cedi && (
                <div>
                  <strong className="text-slate-400 uppercase text-[10px] block font-bold">Origen CEDI y Placas</strong>
                  <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                    {viewRecord.cedi} {viewRecord.placa ? `• [${viewRecord.placa}]` : ''}
                  </span>
                </div>
              )}
              {viewRecord.canal && (
                <div>
                  <strong className="text-slate-400 uppercase text-[10px] block font-bold">Canal e Infraestructura</strong>
                  <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                    {viewRecord.canal} {viewRecord.zona ? `(${viewRecord.zona})` : ''}
                  </span>
                </div>
              )}
              {viewRecord.nivelCumplimiento && (
                <div>
                  <strong className="text-slate-400 uppercase text-[10px] block font-bold">Nivel de Cumplimiento</strong>
                  <span className={`font-black text-[11px] mt-0.5 inline-block px-2 py-0.5 rounded-md ${
                    viewRecord.nivelCumplimiento.toLowerCase().includes('exce') || viewRecord.nivelCumplimiento.toLowerCase().includes('cumpli')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-orange-50 text-orange-700'
                  }`}>
                    {viewRecord.nivelCumplimiento}
                  </span>
                </div>
              )}
              {viewRecord.causaRaizSubtema && (
                <div className="col-span-2">
                  <strong className="text-slate-400 uppercase text-[10px] block font-bold">Causa Raíz Detallada (Subtema)</strong>
                  <span className="font-medium text-slate-700 text-xs mt-0.5 block bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                    {viewRecord.causaRaizSubtema}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <strong className="text-slate-450 uppercase text-[10px] block font-extrabold mb-1">Descripción de la Reclamación</strong>
              <p className="text-slate-700 text-xs bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed italic">
                "{viewRecord.descripcion}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-100 pt-4 text-xs bg-slate-50/50 p-4 rounded-xl">
              <div>
                <strong className="text-slate-450 uppercase text-[10px] block font-bold">Acción Tomada</strong>
                <span className="font-extrabold text-blue-700 text-sm mt-0.5 block">{viewRecord.accion}</span>
              </div>
              <div>
                <strong className="text-slate-450 uppercase text-[10px] block font-bold">Impacto / Penalización COP</strong>
                <span className="font-extrabold text-rose-650 text-sm mt-0.5 block">{formatCurrency(viewRecord.costoPenalizacion)}</span>
              </div>
              {viewRecord.diasDemora > 0 && (
                <div className="col-span-2 text-[11px] text-orange-600 font-bold mt-1">
                  ⚠ El paquete reportó {viewRecord.diasDemora} días hábiles de demora acumulada.
                </div>
              )}
            </div>

            {/* DYNAMIC EXTRA COLUMNS FROM EXCEL CHOPPED/CLEANED */}
            {(() => {
              const shownKeys = new Set([
                'id', 'fecha', 'cliente', 'responsable', 'transportadora', 'motivo', 'accion', 'estado', 
                'costomercancia', 'diasdemora', 'costopenalizacion', 'guia', 'descripcion', 'region', 
                'subregion', 'zona', 'canal', 'cedi', 'placa', 'causaraizsubtema', 'nivelcumplimiento', 
                'estadogestion', 'mes', 'diastranscurridos', 'cantidad'
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
                  <strong className="text-slate-450 uppercase text-[10px] block font-bold mb-2 text-indigo-650">
                    📊 COLUMNAS ADICIONALES DETECTADAS EN EXCEL
                  </strong>
                  <div className="grid grid-cols-2 gap-2 text-[11px] max-h-40 overflow-y-auto pr-1">
                    {extras.map(([key, value]) => (
                      <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col">
                        <span className="text-slate-405 font-bold truncate uppercase text-[8px] leading-tight">{key}</span>
                        <span className="font-bold text-slate-800 break-all mt-0.5">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setViewRecord(null)}
              className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Cerrar Expediente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
