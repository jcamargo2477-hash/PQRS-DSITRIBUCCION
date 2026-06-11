import React, { useState, useRef } from 'react';
import { Upload, FileDown, Link, FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PqrsRecord } from '../types';
import { parseSheetBuffer, parseCsvText } from '../utils/parser';
import IntelligentMappingMatrix from './IntelligentMappingMatrix';

interface ExcelLoaderProps {
  onDataLoaded: (records: PqrsRecord[]) => void;
  onResetToDemo: () => void;
  currentRecordsCount: number;
}

export default function ExcelLoader({ onDataLoaded, onResetToDemo, currentRecordsCount }: ExcelLoaderProps) {
  const [excelUrl, setExcelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const reader = new FileReader();
      
      if (file.name.endsWith('.csv')) {
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const records = parseCsvText(text);
            if (records.length === 0) {
              throw new Error('No se encontraron registros con la columna A diligenciada.');
            }
            onDataLoaded(records);
            setSuccessMsg(`¡Archivo CSV cargado y procesado con éxito! Se cargaron ${records.length} registros (basados en columna A).`);
          } catch (err: any) {
            setError(err.message || 'Error al procesar el CSV.');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer;
            const records = parseSheetBuffer(buffer);
            if (records.length === 0) {
              throw new Error('No se encontraron registros o la columna A no tiene datos diligenciados.');
            }
            onDataLoaded(records);
            setSuccessMsg(`¡Libro Excel cargado y procesado con éxito! Se cargaron ${records.length} registros (basados en columna A).`);
          } catch (err: any) {
            setError(err.message || 'Error al procesar el Excel.');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        throw new Error('Formato no soportado. Cargue un archivo .xlsx, .xls o .csv');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo.');
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelUrl.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let fetchUrl = excelUrl;
      if (excelUrl.includes('docs.google.com/spreadsheets')) {
        const match = excelUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          fetchUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error('No se pudo acceder al enlace. Asegúrate de que el enlace sea público y permita descargas directas.');
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('csv') || fetchUrl.endsWith('.csv') || excelUrl.includes('export?format=csv')) {
        const text = await response.text();
        const records = parseCsvText(text);
        if (records.length === 0) {
          throw new Error('No se encontraron registros con la columna A diligenciada.');
        }
        onDataLoaded(records);
        setSuccessMsg(`¡CSV cargado y procesado con éxito! Se cargaron ${records.length} registros.`);
      } else {
        const buffer = await response.arrayBuffer();
        const records = parseSheetBuffer(buffer);
        if (records.length === 0) {
          throw new Error('No se encontraron registros con la columna A diligenciada.');
        }
        onDataLoaded(records);
        setSuccessMsg(`¡Hoja de cálculo cargada y procesada con éxito! Se cargaron ${records.length} registros.`);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        'Error de conexión o de formato. Asegúrate de publicar la hoja en la web como CSV o subir el archivo descargado.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="excel-loader-container" className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 id="excel-loader-title" className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <FileDown className="w-5 h-5 text-blue-600" />
            Cargar Datos de Control y Planillas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sube planillas de despacho o ingresa un enlace público para actualizar el tablero de control de forma interactiva.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            id="btn-load-sample-data"
            onClick={onResetToDemo}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cargar Datos de Muestra (Preestablecido)
          </button>
          <div className="text-xs font-bold px-3 py-1.5 bg-slate-50 rounded-xl text-slate-600 border border-slate-200">
            Registros Activos: <strong className="text-slate-800 font-extrabold">{currentRecordsCount}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Excel Card */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition cursor-pointer bg-slate-50/50 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition duration-200">
            <Upload className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm text-slate-800">Seleccionar o Arrastrar Archivo de Excel (.xlsx, .xls) o CSV</span>
          <span className="text-xs text-slate-400 mt-1">Arrastra tu planilla de PQRS aquí de forma segura</span>
        </div>

        {/* Load URL Form */}
        <div className="bg-slate-50/40 rounded-2xl border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <span className="font-bold text-sm text-slate-800 block mb-2 flex items-center gap-1.5 font-display">
              <Link className="w-4 h-4 text-slate-400" />
              Ejecutar Enlace de Google Sheets o Archivo Web
            </span>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed font-sans">
              Puedes sincronizar con una hoja de cálculo. En Google Sheets, ve a <strong>Archivo &gt; Compartir &gt; Publicar en la Web</strong>, selecciona formato <em>Valores separados por comas (.csv)</em>, copia el enlace y pégalo abajo.
            </p>
          </div>

          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input
              type="url"
              value={excelUrl}
              onChange={(e) => setExcelUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
              className="flex-1 text-xs bg-white border border-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm font-semibold"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !excelUrl.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 font-extrabold text-xs text-white transition flex items-center gap-1.5 select-none shadow-md shadow-blue-100 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Ejecutar
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 mt-4 text-xs font-bold text-slate-500 animate-pulse bg-slate-50 p-3 rounded-xl">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          Procesando planilla de control... por favor espera.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 mt-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Error al procesar planilla:</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 mt-4 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
