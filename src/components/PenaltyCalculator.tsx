import { useState, useEffect } from 'react';
import { HelpCircle, ShieldAlert, AlertTriangle, Calculator, Settings, RefreshCw, BadgePercent } from 'lucide-react';
import { RuleConfig } from '../types';
import { REASONS_MAP, ACTIONS_MAP, INITIAL_RULES } from '../data/mockData';

export default function PenaltyCalculator() {
  const [rules, setRules] = useState<RuleConfig[]>(INITIAL_RULES);
  const [selectedReason, setSelectedReason] = useState(REASONS_MAP.DANO_PERDIDA);
  const [selectedAction, setSelectedAction] = useState(ACTIONS_MAP.COBRO_TRANSPORTADOR);
  
  // Custom formula variables
  const [chargePercentage, setChargePercentage] = useState(100);
  const [baseFine, setBaseFine] = useState(50000);
  const [dailyMultiplier, setDailyMultiplier] = useState(10000);
  const [strikePoints, setStrikePoints] = useState(3);
  const [targetSla, setTargetSla] = useState(4);

  // Live calculator simulation variables
  const [simCostoMercancia, setSimCostoMercancia] = useState(250000);
  const [simDiasDemora, setSimDiasDemora] = useState(5);
  const [isSavedRuleApplied, setIsSavedRuleApplied] = useState(true);

  // Load selected rule's config when the reason-action combination shifts
  useEffect(() => {
    const existingRule = rules.find(r => r.motivo === selectedReason && r.accion === selectedAction);
    if (existingRule) {
      setChargePercentage(existingRule.porcentajeCobro);
      setBaseFine(existingRule.tarifaBase * 1000 || 0); // Convert USD-like schema to COP standard
      setDailyMultiplier(existingRule.multaPorDia * 1000 || 0);
      setStrikePoints(existingRule.strikes);
      setTargetSla(existingRule.resolucionSLA);
      setIsSavedRuleApplied(true);
    } else {
      // Default placeholder variables for unmapped combinations
      setChargePercentage(0);
      setBaseFine(0);
      setDailyMultiplier(0);
      setStrikePoints(1);
      setTargetSla(3);
      setIsSavedRuleApplied(false);
    }
  }, [selectedReason, selectedAction, rules]);

  const handleSaveRule = () => {
    const updatedRule: RuleConfig = {
      motivo: selectedReason,
      accion: selectedAction,
      porcentajeCobro: chargePercentage,
      tarifaBase: baseFine / 1000, // normalized scaling
      multaPorDia: dailyMultiplier / 1000,
      strikes: strikePoints,
      resolucionSLA: targetSla
    };

    const existingIndex = rules.findIndex(r => r.motivo === selectedReason && r.accion === selectedAction);
    if (existingIndex >= 0) {
      const copy = [...rules];
      copy[existingIndex] = updatedRule;
      setRules(copy);
    } else {
      setRules([...rules, updatedRule]);
    }
    setIsSavedRuleApplied(true);
  };

  // Perform the live calculation
  const calculatedPenalty = (simCostoMercancia * (chargePercentage / 100)) + baseFine + (simDiasDemora * dailyMultiplier);
  const finalStrikes = strikePoints;

  // Rating impact output
  let severity: 'Bajo' | 'Medio' | 'Alto' = 'Bajo';
  if (calculatedPenalty > 200000 || finalStrikes >= 3) {
    severity = 'Alto';
  } else if (calculatedPenalty > 50000 || finalStrikes >= 1.5) {
    severity = 'Medio';
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="penalty-calculator-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
      
      {/* COLUMN 1: Rule Architect Configuration */}
      <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6">
        <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
          <div>
            <h4 className="text-[10px] uppercase font-extrabold text-blue-600 tracking-widest font-sans">Algoritmos de Control</h4>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-2 font-display" id="rule-config-title">
              <Settings className="w-5 h-5 text-blue-600" />
              Configurar Reglas del Plan de Acción
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
            Regulador SLA
          </span>
        </div>

        <div className="space-y-4">
          {/* Reason SELECT */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
              1. Selecciona Motivo de PQRS
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(REASONS_MAP).map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {/* Action PLAN SELECT */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
              2. Selecciona Acción o Sanción Asociada
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(ACTIONS_MAP).map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mt-2 space-y-4">
            <span className="text-xs font-bold text-blue-700 block mb-1">Parámetros de la Fórmula</span>
            
            {/* Charge percentage slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Cobro por Daño de Mercancía (%)</span>
                <span className="text-blue-600 font-bold">{chargePercentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={chargePercentage}
                onChange={(e) => {
                  setChargePercentage(Number(e.target.value));
                  setIsSavedRuleApplied(false);
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Base fine slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Multa Fija Adicional ($ COP)</span>
                <span className="text-blue-600 font-bold">{formatCurrency(baseFine)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="250000"
                step="5000"
                value={baseFine}
                onChange={(e) => {
                  setBaseFine(Number(e.target.value));
                  setIsSavedRuleApplied(false);
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Daily delay penalty */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Multa Diaria por Demora ($ COP)</span>
                <span className="text-blue-600 font-bold">{formatCurrency(dailyMultiplier)} / día</span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="2000"
                value={dailyMultiplier}
                onChange={(e) => {
                  setDailyMultiplier(Number(e.target.value));
                  setIsSavedRuleApplied(false);
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Strike or Penalty points */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Strikes al Desempeño</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={strikePoints}
                  onChange={(e) => {
                    setStrikePoints(Number(e.target.value));
                    setIsSavedRuleApplied(false);
                  }}
                  className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">SLA Resolución (Días)</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={targetSla}
                  onChange={(e) => {
                    setTargetSla(Number(e.target.value));
                    setIsSavedRuleApplied(false);
                  }}
                  className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSaveRule}
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm cursor-pointer"
              id="btn-save-rule-config"
            >
              Guardar / Actualizar Regla de Cálculo
            </button>
            {isSavedRuleApplied ? (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-3 rounded-xl flex items-center gap-1 shrink-0 select-none">
                ✓ Fórmula Activa
              </span>
            ) : (
              <span className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-3 rounded-xl flex items-center gap-1 shrink-0 select-none">
                ⚠ Modificado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN 2: Fast Penalty Simulator Calculator */}
      <div id="penalty-simulator-card" className="lg:col-span-6 bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
        {/* Background visual detail */}
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white opacity-5 pointer-events-none" />

        <div>
          <div className="border-b border-white/10 pb-3 mb-5">
            <h4 className="text-[10px] uppercase font-extrabold text-blue-400 tracking-widest font-sans">Simulador de Penalidades</h4>
            <h3 className="text-sm font-extrabold mt-1 flex items-center gap-2 font-display" id="sim-calculator-title">
              <Calculator className="w-5 h-5 text-blue-400" />
              Calculadora de Costos e Impacto
            </h3>
          </div>

          <div className="space-y-4">
            {/* Input Costo Mercancia */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5 flex-wrap">
                <span>Costo Declarado de Mercancía</span>
                <span className="text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">{formatCurrency(simCostoMercancia)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000000"
                step="25000"
                value={simCostoMercancia}
                onChange={(e) => setSimCostoMercancia(Number(e.target.value))}
                className="w-full h-1 bg-slate-750 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
              <div className="flex justify-between text-[10px] text-slate-550 font-semibold px-0.5 mt-1">
                <span>$0</span>
                <span>$500 mil</span>
                <span>$1 Millón</span>
              </div>
            </div>

            {/* Input Dias Demora */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5 flex-wrap">
                <span>Días de Retraso de Entrega</span>
                <span className="text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">{simDiasDemora} días</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={simDiasDemora}
                onChange={(e) => setSimDiasDemora(Number(e.target.value))}
                className="w-full h-1 bg-slate-750 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
              <div className="flex justify-between text-[10px] text-slate-550 font-semibold px-0.5 mt-1">
                <span>Exento</span>
                <span>7 días</span>
                <span>15 días hábiles</span>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS SPLASH BANNER */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mt-6 gap-3 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Costo de Sanción Total</span>
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              severity === 'Alto' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
              severity === 'Medio' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {severity === 'Alto' ? <ShieldAlert className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              Riesgo {severity}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight" id="sim-calculated-result">
              {formatCurrency(calculatedPenalty)}
            </span>
            <span className="text-xs text-slate-300">COP</span>
          </div>

          <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Puntuación Penal</span>
              <span className="text-sm font-extrabold text-amber-300 block mt-0.5">+{finalStrikes} Strikes</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">SLA Esperado</span>
              <span className="text-sm font-extrabold text-slate-100 block mt-0.5">{targetSla} días hábiles</span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5 text-[11px] leading-relaxed text-slate-300">
            <strong className="text-indigo-300 block mb-0.5">Procedimiento Establecido:</strong>
            Frente al motivo de <span className="text-white font-medium">"{selectedReason}"</span> se procede con la acción <span className="text-white font-medium">"{selectedAction}"</span>.
            {chargePercentage > 0 && ` Sanción del ${chargePercentage}% sobre la mercancía declarada.`}
            {baseFine > 0 && ` Cobro automático adicional de ${formatCurrency(baseFine)} de multa.`}
            {dailyMultiplier > 0 && simDiasDemora > 0 && ` Cargo por retraso correspondiente de ${formatCurrency(dailyMultiplier * simDiasDemora)}.`}
          </div>
        </div>

      </div>

    </div>
  );
}
