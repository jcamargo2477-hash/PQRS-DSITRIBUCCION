import React, { useState, useMemo } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp, Calendar, MapPin, Truck, CheckCircle2, User, Smile, SlidersHorizontal, Tag } from 'lucide-react';
import { PqrsRecord, GlobalFiltersState } from '../types';

interface GlobalFiltersBarProps {
  records: PqrsRecord[];
  filters: GlobalFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFiltersState>>;
  onReset: () => void;
}

export default function GlobalFiltersBar({ records, filters, setFilters, onReset }: GlobalFiltersBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to extract week of month from date string (YYYY-MM-DD)
  const getWeekOfMonth = (fechaStr: string) => {
    if (!fechaStr) return '';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return '';
      const day = d.getDate();
      if (day <= 7) return 'Semana 1';
      if (day <= 14) return 'Semana 2';
      if (day <= 21) return 'Semana 3';
      if (day <= 28) return 'Semana 4';
      return 'Semana 5';
    } catch {
      return '';
    }
  };

  // Helper to extract year
  const getYear = (fechaStr: string) => {
    if (!fechaStr) return '';
    return fechaStr.substring(0, 4);
  };

  // Dynamically computing unique option lists based on active records
  const options = useMemo(() => {
    const listYears = new Set<string>();
    const listMonths = new Set<string>();
    const listWeeks = new Set<string>();
    const listCities = new Set<string>();
    const listRegionals = new Set<string>();
    const listCarriers = new Set<string>();
    const listStatuses = new Set<string>();
    const listReasons = new Set<string>();
    const listSubreasons = new Set<string>();
    const listAssignees = new Set<string>();
    const listClients = new Set<string>();
    const listActions = new Set<string>();

    records.forEach((r) => {
      const yr = getYear(r.fecha);
      if (yr) listYears.add(yr);
      if (r.mes) listMonths.add(r.mes.toUpperCase());
      const wk = getWeekOfMonth(r.fecha);
      if (wk) listWeeks.add(wk);
      if (r.subRegion) listCities.add(r.subRegion);
      if (r.region) listRegionals.add(r.region);
      if (r.transportadora) listCarriers.add(r.transportadora);
      if (r.estado) listStatuses.add(r.estado);
      if (r.motivo) listReasons.add(r.motivo);
      if (r.causaRaizSubtema) listSubreasons.add(r.causaRaizSubtema);
      if (r.responsable) listAssignees.add(r.responsable);
      if (r.cliente) listClients.add(r.cliente);
      if (r.accion) listActions.add(r.accion);
    });

    return {
      years: Array.from(listYears).sort(),
      months: Array.from(listMonths).sort(),
      weeks: Array.from(listWeeks).sort(),
      cities: Array.from(listCities).sort(),
      regionals: Array.from(listRegionals).sort(),
      carriers: Array.from(listCarriers).sort(),
      statuses: Array.from(listStatuses).sort(),
      reasons: Array.from(listReasons).sort(),
      subreasons: Array.from(listSubreasons).sort(),
      assignees: Array.from(listAssignees).sort(),
      clients: Array.from(listClients).sort((a, b) => a.localeCompare(b)),
      actions: Array.from(listActions).sort(),
    };
  }, [records]);

  // Handle single filter change
  const handleChange = (key: keyof GlobalFiltersState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Counting active filters
  const activeFiltersCount = Object.values(filters).filter((val) => val !== '').length;

  return (
    <div id="global-filters-container" className="bg-white border border-slate-100 rounded-3xl p-5 mb-6 shadow-sm flex flex-col transition duration-300">
      {/* Short view - Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Filter className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-800 leading-none">Filtros Operativos Globales</h3>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center font-extrabold rounded-full transition leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Refina el análisis de toda la suite en tiempo real</p>
          </div>
        </div>

        {/* Quick Main Filter Toggles (Month, Carrier & Status) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Carrier select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <select
              title="Filtrar por transportadora importante"
              role="listbox"
              value={filters.carrier}
              onChange={(e) => handleChange('carrier', e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer min-w-[120px]"
            >
              <option value="">Transportadora: Todas</option>
              {options.carriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Status select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-xl text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              title="Filtrar por estado del caso"
              role="listbox"
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer min-w-[100px]"
            >
              <option value="">Estado: Todos</option>
              {options.statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Expand advanced filters button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              isExpanded || activeFiltersCount > 2
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros Avanzados</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onReset}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-100 transition cursor-pointer self-stretch flex items-center justify-center"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Filters Grid */}
      {isExpanded && (
        <div id="advanced-filters-panel" className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
          {/* Year select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400" /> Año
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleChange('year', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">Todos los años</option>
              {options.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400" /> Mes del Año
            </label>
            <select
              value={filters.month}
              onChange={(e) => handleChange('month', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">Todos los meses</option>
              {options.months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Week select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400" /> Semana del Mes
            </label>
            <select
              value={filters.week}
              onChange={(e) => handleChange('week', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">Todas las semanas</option>
              {options.weeks.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Regional select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400" /> Regional
            </label>
            <select
              value={filters.regional}
              onChange={(e) => handleChange('regional', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">Todas las regionales</option>
              {options.regionals.map((rList) => (
                <option key={rList} value={rList}>
                  {rList}
                </option>
              ))}
            </select>
          </div>

          {/* City select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Ciudad (Sub-Región)
            </label>
            <select
              value={filters.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">Todas las ciudades</option>
              {options.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Transportadora select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-slate-400" /> Transportadora
            </label>
            <select
              value={filters.carrier}
              onChange={(e) => handleChange('carrier', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">Todas las transportadoras</option>
              {options.carriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-slate-400" /> Motivo Principal
            </label>
            <select
              value={filters.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition max-w-full"
            >
              <option value="">Todos los motivos</option>
              {options.reasons.map((mr) => (
                <option key={mr} value={mr}>
                  {mr.length > 36 ? mr.substring(0, 36) + '...' : mr}
                </option>
              ))}
            </select>
          </div>

          {/* Submotivo select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-slate-400" /> Submotivo (Subtema)
            </label>
            <select
              value={filters.subreason}
              onChange={(e) => handleChange('subreason', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">Todos los submotivos</option>
              {options.subreasons.map((sr) => (
                <option key={sr} value={sr}>
                  {sr}
                </option>
              ))}
            </select>
          </div>

          {/* Responsable select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3 h-3 text-slate-400" /> Asesor Responsable
            </label>
            <select
              value={filters.assignee}
              onChange={(e) => handleChange('assignee', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">Todos los responsables</option>
              {options.assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Action (Plan de accion) select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-indigo-500" /> Plan de Acción
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleChange('action', e.target.value)}
              className="text-xs font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-105 border border-indigo-100 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="" className="text-slate-500 font-bold">Todos los planes</option>
              {options.actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente select */}
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Smile className="w-3 h-3 text-slate-400" /> Cliente / Destinatario
            </label>
            <select
              value={filters.client}
              onChange={(e) => handleChange('client', e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 transition"
            >
              <option value="">Todos los clientes</option>
              {options.clients.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
