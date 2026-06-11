import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, ClipboardList, CheckCircle2, ShieldAlert, Award, FileText, 
  BarChart3, RefreshCw, Trash2, Calendar, LayoutDashboard, Sliders, 
  BellRing, Grid, FolderHeart, Sparkles 
} from 'lucide-react';
import { PqrsRecord, GlobalFiltersState } from './types';
import { generateSampleData } from './data/mockData';
import ExcelLoader from './components/ExcelLoader';
import GlobalFiltersBar from './components/GlobalFiltersBar';

// 6 Premium Module Views
import CentroControl from './components/CentroControl';
import AnalisisTransportador from './components/AnalisisTransportador';
import AnalisisMotivos from './components/AnalisisMotivos';
import AnalisisCausaRaiz from './components/AnalisisCausaRaiz';
import GestionRadicados from './components/GestionRadicados';
import AlertasInteligentes from './components/AlertasInteligentes';

export default function App() {
  const [records, setRecords] = useState<PqrsRecord[]>([]);
  
  // Navigation: Monday/Stripe executive tabs (1-6)
  const [activeTab, setActiveTab] = useState<'control' | 'carrier' | 'reasons' | 'causa' | 'radicados' | 'alertas'>('control');

  // Unified Multi-Dimension Global Filters State
  const [filters, setFilters] = useState<GlobalFiltersState>({
    year: '',
    month: '',
    week: '',
    city: '',
    regional: '',
    carrier: '',
    status: '',
    reason: '',
    subreason: '',
    assignee: '',
    client: '',
    action: '',
  });

  // Load records from localstorage or demo generator
  useEffect(() => {
    const saved = localStorage.getItem('pqrs_dashboard_records');
    const demoAudit = {
      totalRadicados: 165,
      unicosRadicados: 165,
      filasSinRadicado: 0,
      sheetNameUsed: "GENERAL [Muestra]"
    };
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
        if (!localStorage.getItem('pqrs_excel_audit')) {
          localStorage.setItem('pqrs_excel_audit', JSON.stringify(demoAudit));
        }
      } catch (e) {
        const demo = generateSampleData();
        setRecords(demo);
        localStorage.setItem('pqrs_dashboard_records', JSON.stringify(demo));
        localStorage.setItem('pqrs_excel_audit', JSON.stringify(demoAudit));
      }
    } else {
      const demo = generateSampleData();
      setRecords(demo);
      localStorage.setItem('pqrs_dashboard_records', JSON.stringify(demo));
      localStorage.setItem('pqrs_excel_audit', JSON.stringify(demoAudit));
    }
  }, []);

  const handleDataLoaded = (newRecords: PqrsRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('pqrs_dashboard_records', JSON.stringify(newRecords));
    handleResetFilters();
  };

  const handleResetToDemo = () => {
    const demo = generateSampleData();
    setRecords(demo);
    localStorage.setItem('pqrs_dashboard_records', JSON.stringify(demo));
    const demoAudit = {
      totalRadicados: 165,
      unicosRadicados: 165,
      filasSinRadicado: 0,
      sheetNameUsed: "GENERAL [Muestra]"
    };
    localStorage.setItem('pqrs_excel_audit', JSON.stringify(demoAudit));
    handleResetFilters();
  };

  const handleClearAll = () => {
    setRecords([]);
    localStorage.setItem('pqrs_dashboard_records', JSON.stringify([]));
    localStorage.removeItem('pqrs_excel_audit');
    handleResetFilters();
  };

  const handleResetFilters = () => {
    setFilters({
      year: '',
      month: '',
      week: '',
      city: '',
      regional: '',
      carrier: '',
      status: '',
      reason: '',
      subreason: '',
      assignee: '',
      client: '',
      action: '',
    });
  };

  // Helper mapping week of month
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

  // Comprehensive multi-dimension Global Filtering Function
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filters.year && !r.fecha.startsWith(filters.year)) return false;
      if (filters.month && r.mes?.toUpperCase() !== filters.month.toUpperCase()) return false;
      if (filters.week && getWeekOfMonth(r.fecha) !== filters.week) return false;
      if (filters.city && r.subRegion !== filters.city) return false;
      if (filters.regional && r.region !== filters.regional) return false;
      if (filters.carrier && r.transportadora !== filters.carrier) return false;
      if (filters.status && r.estado !== filters.status) return false;
      if (filters.reason && r.motivo !== filters.reason) return false;
      if (filters.subreason && r.causaRaizSubtema !== filters.subreason) return false;
      if (filters.assignee && r.responsable !== filters.assignee) return false;
      if (filters.client && r.cliente !== filters.client) return false;
      if (filters.action && r.accion !== filters.action) return false;
      return true;
    });
  }, [records, filters]);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased flex flex-col lg:flex-row">
      
      {/* DESKTOP SIDEBAR RAIL */}
      <aside className="hidden lg:flex w-24 bg-slate-900 flex-col items-center py-8 justify-between shrink-0 sticky top-0 h-screen text-slate-400 border-r border-slate-800 z-40">
        <div className="flex flex-col items-center gap-10 w-full">
          {/* Stylized Floating Logo matching Spring Brand */}
          <div className="flex flex-col items-center select-none" title="Spring® Cambia tu Vida">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-650 flex flex-col items-center justify-center text-white shadow-md shadow-red-500/20 hover:scale-105 transition duration-200 cursor-pointer">
              <span className="text-xl font-black italic tracking-tighter leading-none mt-1" style={{ fontFamily: '"Outfit", "Impact", "Inter", sans-serif' }}>S</span>
              <span className="text-[6px] font-black tracking-widest leading-none mb-1">SPRING</span>
            </div>
          </div>
          
          {/* Action Quick Hotlinks */}
          <nav className="flex flex-col gap-6 w-full items-center select-none">
            <button 
              onClick={() => setActiveTab('control')}
              className={`p-3 rounded-xl transition group relative cursor-pointer ${activeTab === 'control' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'}`}
              title="Centro de Control"
            >
              <LayoutDashboard className="w-5.5 h-5.5" />
            </button>
            <button 
              onClick={() => setActiveTab('carrier')}
              className={`p-3 rounded-xl transition group relative cursor-pointer ${activeTab === 'carrier' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'}`}
              title="Operación Transportadoras"
            >
              <Truck className="w-5.5 h-5.5" />
            </button>
            <button 
              onClick={() => setActiveTab('reasons')}
              className={`p-3 rounded-xl transition group relative cursor-pointer ${activeTab === 'reasons' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'}`}
              title="Análisis de Motivos"
            >
              <ClipboardList className="w-5.5 h-5.5" />
            </button>
            <button 
              onClick={() => setActiveTab('causa')}
              className={`p-3 rounded-xl transition group relative cursor-pointer ${activeTab === 'causa' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'}`}
              title="Causa Raíz"
            >
              <Grid className="w-5.5 h-5.5" />
            </button>
            <button 
              onClick={() => setActiveTab('radicados')}
              className={`p-3 rounded-xl transition group relative cursor-pointer ${activeTab === 'radicados' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'}`}
              title="Historial de Radicados"
            >
              <FileText className="w-5.5 h-5.5" />
            </button>
            <button 
              onClick={() => setActiveTab('alertas')}
              className={`p-3 rounded-xl transition group relative cursor-pointer ${activeTab === 'alertas' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 hover:text-white'}`}
              title="Alertas Críticas"
            >
              <BellRing className="w-5.5 h-5.5" />
            </button>
          </nav>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-700/60 flex items-center justify-center text-xs font-black text-blue-400 select-none">
          IQ
        </div>
      </aside>

      {/* CORE VIEWPORT */}
      <div className="flex-1 min-h-screen flex flex-col pb-12 overflow-x-hidden">
        
        {/* PREMIUM ENTERPRISE HEADER */}
        <header id="app-main-header" className="bg-white border-b border-slate-100 py-5 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Official Corporate Logo block from image 3 */}
              <div className="flex flex-col items-start leading-none select-none bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 shadow-2xs shrink-0">
                <div className="flex items-baseline leading-none">
                  <span className="text-[28px] font-black italic tracking-tighter text-[#ff1a3c]" style={{ fontFamily: '"Outfit", "Impact", "Helvetica Neue", sans-serif' }}>
                    Spring
                  </span>
                  <span className="text-[10px] font-bold text-[#ff1a3c] ml-0.5 align-super">®</span>
                </div>
                <span className="text-[8px] font-black tracking-[0.24em] text-slate-705 uppercase mt-1" style={{ fontFamily: '"Inter", sans-serif' }}>
                  CAMBIA TU VIDA.
                </span>
              </div>
              
              <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

              <div>
                <h1 className="text-lg font-extrabold font-display tracking-tight text-slate-900 leading-tight">
                  LogiControl™ PQRS Executive Center
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Consola corporativa avanzada de auditoría logística y penalidades
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAll}
                disabled={records.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-rose-100 hover:border-rose-200 bg-rose-50/50 hover:bg-rose-55 text-rose-600 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-xs font-bold transition cursor-pointer"
                title="Eliminar todos los datos activos de memoria"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar Memoria
              </button>
              <div className="text-[10px] bg-slate-900 text-blue-450 font-black px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-1.5 font-mono select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                CONEXIÓN SEGURA
              </div>
            </div>

          </div>
        </header>

        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-1">
          
          {/* UPLOAD PANEL EXCEL/CSV */}
          <div id="section-upload" className="scroll-mt-24 mb-6">
            <ExcelLoader 
              onDataLoaded={handleDataLoaded} 
              onResetToDemo={handleResetToDemo}
              currentRecordsCount={records.length}
            />
          </div>

          {records.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-12 text-center max-w-xl mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-850">Carga tu set de datos operativos</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Suelta un archivo Excel de PQRS en el cargador superior, o pulsa "Cargar demo" para inicializar la consola corporativa en menos de 10 segundos.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleResetToDemo}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer border-none"
                >
                  Inicializar Datos de Muestra
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* UNIFIED MULTI-DIMENSIONAL GLOBAL FILTERS BAR */}
              <GlobalFiltersBar 
                records={records} 
                filters={filters} 
                setFilters={setFilters} 
                onReset={handleResetFilters} 
              />

              {/* 6 EXECUTIVE NAVIGATION TABS DECK (Inspired by Monday/Stripe) */}
              <div id="executive-navigation-tabs" className="bg-slate-100 p-1.5 rounded-2xl mb-6 flex flex-wrap gap-1 select-none">
                
                {/* Tab 1: Control Center */}
                <button
                  onClick={() => setActiveTab('control')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer border-none ${
                    activeTab === 'control'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-600" />
                  <span>Control Center</span>
                </button>

                {/* Tab 2: Carrier scorecard */}
                <button
                  onClick={() => setActiveTab('carrier')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer border-none ${
                    activeTab === 'carrier'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Truck className="w-4 h-4 text-indigo-650" />
                  <span>Transportadoras</span>
                </button>

                {/* Tab 3: Reasons breakdown */}
                <button
                  onClick={() => setActiveTab('reasons')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer border-none ${
                    activeTab === 'reasons'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  <span>Motivos</span>
                </button>

                {/* Tab 4: Root cause */}
                <button
                  onClick={() => setActiveTab('causa')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer border-none ${
                    activeTab === 'causa'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Grid className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>Causa Raíz</span>
                </button>

                {/* Tab 5: Record log list */}
                <button
                  onClick={() => setActiveTab('radicados')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer border-none ${
                    activeTab === 'radicados'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Gestión Radicados</span>
                </button>

                {/* Tab 6: Smart Alerts */}
                <button
                  onClick={() => setActiveTab('alertas')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 cursor-pointer border-none ${
                    activeTab === 'alertas'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <BellRing className="w-4 h-4 text-purple-600 animate-bounce" />
                  <span>Alertas Inteligentes</span>
                </button>

              </div>

              {/* RENDER ACTIVE MODULE PORT WITH GLOBAL HOOK */}
              <div id="active-dynamic-module-viewport" className="mt-4 duration-300 transition-all font-sans">
                {activeTab === 'control' && <CentroControl records={filteredRecords} />}
                {activeTab === 'carrier' && <AnalisisTransportador records={filteredRecords} filters={filters} setFilters={setFilters} />}
                {activeTab === 'reasons' && <AnalisisMotivos records={filteredRecords} filters={filters} setFilters={setFilters} />}
                {activeTab === 'causa' && <AnalisisCausaRaiz records={filteredRecords} />}
                {activeTab === 'radicados' && <GestionRadicados records={filteredRecords} />}
                {activeTab === 'alertas' && <AlertasInteligentes records={filteredRecords} />}
              </div>
            </>
          )}

        </main>

        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-150 text-center select-none">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
            LogiControl™ System • Empresa Líder en Auditoría de Entrega y Despacho
          </p>
          <p className="text-[9px] text-slate-400 font-medium mt-1">
            Los desvíos de tiempo e imprecisiones de entrega calculan penalizaciones automáticas sujetas a los acuerdos de servicio (SLA) suscritos.
          </p>
        </footer>

      </div>
    </div>
  );
}
