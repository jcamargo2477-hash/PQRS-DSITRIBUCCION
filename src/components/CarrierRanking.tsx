import React, { useState } from 'react';
import { Star, Truck, ShieldAlert, CheckCircle, TrendingDown, ClipboardList } from 'lucide-react';
import { PqrsRecord, TransportadoraStats } from '../types';

interface CarrierRankingProps {
  records: PqrsRecord[];
  selectedCarrier: string | null;
  onSelectCarrier: (carrier: string | null) => void;
}

export default function CarrierRanking({ records, selectedCarrier, onSelectCarrier }: CarrierRankingProps) {
  const [sortBy, setSortBy] = useState<'totalPqrs' | 'tasaResolucion' | 'penalizacionTotal' | 'rating'>('totalPqrs');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Group and compute stats by transportadora
  const carriersMap: Record<string, {
    total: number;
    cerrados: number;
    abiertos: number;
    retrasosSum: number;
    retrasosCount: number;
    finesSum: number;
  }> = {};

  records.forEach(r => {
    const mainC = r.transportadora || 'Otros';
    const cantVal = r.cantidad || 1;
    if (!carriersMap[mainC]) {
      carriersMap[mainC] = { total: 0, cerrados: 0, abiertos: 0, retrasosSum: 0, retrasosCount: 0, finesSum: 0 };
    }
    carriersMap[mainC].total += cantVal;
    if (r.estado === 'Cerrado') {
      carriersMap[mainC].cerrados += cantVal;
    } else {
      carriersMap[mainC].abiertos += cantVal;
    }
    
    if (r.diasDemora > 0) {
      carriersMap[mainC].retrasosSum += r.diasDemora * cantVal;
      carriersMap[mainC].retrasosCount += cantVal;
    }
    carriersMap[mainC].finesSum += r.costoPenalizacion || 0;
  });

  const statsList: TransportadoraStats[] = Object.entries(carriersMap).map(([name, data]) => {
    const tasaResolucion = data.total > 0 ? (data.cerrados / data.total) * 100 : 0;
    const slaPromedio = data.retrasosCount > 0 ? data.retrasosSum / data.retrasosCount : 0;
    
    // Star rating algorithm (out of 5):
    // Start with 5 stars
    // - Deduct based on resolution rate: (100 - tasaResolucion) * 0.03
    // - Deduct based on average delays: slaPromedio * 0.2
    // - Deduct based on fine index (relative to total cases): (finesSum / total) / 25000 COP
    let rating = 5;
    rating -= (100 - tasaResolucion) * 0.025;
    rating -= slaPromedio * 0.15;
    rating -= (data.finesSum / data.total) / 40000;
    rating = Math.max(1, Math.min(5, rating)); // Clamp between 1 and 5

    return {
      nombre: name,
      totalPqrs: data.total,
      resueltas: data.cerrados,
      pendientes: data.abiertos,
      tasaResolucion,
      slaPromedio,
      penalizacionTotal: data.finesSum,
      rating: parseFloat(rating.toFixed(1))
    };
  });

  // Sort logic
  const sortedStats = [...statsList].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortOrder === 'desc') {
      return bVal - aVal;
    } else {
      return aVal - bVal;
    }
  });

  const handleSort = (field: 'totalPqrs' | 'tasaResolucion' | 'penalizacionTotal' | 'rating') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.4;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />);
      } else if (i === fullStars + 1 && halfStar) {
        stars.push(
          <div key={i} className="relative inline-block text-amber-300">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
        );
      } else {
        stars.push(<Star key={i} className="w-3.5 h-3.5 text-slate-200 fill-slate-50" />);
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div id="carrier-ranking-card" className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-3">
        <div>
          <h4 id="carrier-rank-main-title" className="text-[10px] uppercase font-extrabold text-blue-600 tracking-widest font-sans">
            Logística y Distribución
          </h4>
          <h3 id="carrier-rank-sub-title" className="text-sm font-extrabold text-slate-900 mt-1 uppercase flex items-center gap-2 font-display">
            <Truck className="w-5 h-5 text-blue-600" />
            RANKING DE DESEMPEÑO POR TRANSPORTADORA
          </h3>
        </div>
        {selectedCarrier && (
          <button
            onClick={() => onSelectCarrier(null)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl transition cursor-pointer"
            id="btn-clear-carrier-filter"
          >
            Quitar filtro ×
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 font-bold text-slate-500">Transportadora</th>
              
              <th 
                className="py-3 px-4 font-bold text-slate-500 cursor-pointer hover:bg-slate-50 select-none transition"
                onClick={() => handleSort('totalPqrs')}
              >
                <span className="flex items-center gap-1.5 justify-end">
                  <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                  Total PQRS {sortBy === 'totalPqrs' && (sortOrder === 'desc' ? '▼' : '▲')}
                </span>
              </th>

              <th 
                className="py-3 px-4 font-bold text-slate-500 cursor-pointer hover:bg-slate-50 select-none transition"
                onClick={() => handleSort('tasaResolucion')}
              >
                <span className="flex items-center gap-1.5 justify-end">
                  <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                  Resolución % {sortBy === 'tasaResolucion' && (sortOrder === 'desc' ? '▼' : '▲')}
                </span>
              </th>

              <th className="py-3 px-4 text-right font-bold text-slate-500">SLA Demora Prom.</th>

              <th 
                className="py-3 px-4 font-bold text-slate-500 cursor-pointer hover:bg-slate-50 select-none transition"
                onClick={() => handleSort('penalizacionTotal')}
              >
                <span className="flex items-center gap-1.5 justify-end">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  Penalización {sortBy === 'penalizacionTotal' && (sortOrder === 'desc' ? '▼' : '▲')}
                </span>
              </th>

              <th 
                className="py-3 px-4 font-bold text-slate-500 cursor-pointer hover:bg-slate-50 select-none transition"
                onClick={() => handleSort('rating')}
              >
                <span className="flex items-center gap-1.5 justify-end">
                  Calificación {sortBy === 'rating' && (sortOrder === 'desc' ? '▼' : '▲')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {sortedStats.map((carrier, index) => {
              const isSelected = selectedCarrier === carrier.nombre;
              
              return (
                <tr 
                  key={carrier.nombre}
                  id={`carrier-row-${index}`}
                  onClick={() => onSelectCarrier(isSelected ? null : carrier.nombre)}
                  className={`group transition duration-150 cursor-pointer hover:bg-slate-50/75 ${
                    isSelected ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  {/* Carrier name with medal badges */}
                  <td className="py-3.5 px-4 font-semibold text-slate-700 flex items-center gap-3">
                    <div className="flex items-center justify-center shrink-0">
                      {index === 0 && sortOrder === 'desc' && sortBy === 'rating' ? (
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-black flex items-center justify-center">1🥇</div>
                      ) : index === 1 && sortOrder === 'desc' && sortBy === 'rating' ? (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-xs font-black flex items-center justify-center">2🥈</div>
                      ) : index === 2 && sortOrder === 'desc' && sortBy === 'rating' ? (
                        <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-black flex items-center justify-center">3🥉</div>
                      ) : (
                        <span className="w-6 text-center text-slate-400 text-xs font-bold leading-none">{index + 1}</span>
                      )}
                    </div>
                    <span className="group-hover:text-blue-600 transition truncate max-w-44">{carrier.nombre}</span>
                  </td>

                  {/* Total PQRS */}
                  <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                    <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs">
                      {carrier.totalPqrs} casos
                    </span>
                  </td>

                  {/* Resolution Rate */}
                  <td className="py-3.5 px-4 text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      carrier.tasaResolucion >= 80 ? 'bg-emerald-50 text-emerald-700' :
                      carrier.tasaResolucion >= 50 ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {carrier.tasaResolucion.toFixed(1)}%
                    </span>
                  </td>

                  {/* Average delay days */}
                  <td className="py-3.5 px-4 text-right text-slate-600 font-semibold text-xs">
                    {carrier.slaPromedio > 0 ? (
                      <span className="text-orange-600">{carrier.slaPromedio.toFixed(1)} días</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">¡Sin retrasos!</span>
                    )}
                  </td>

                  {/* Total penalties */}
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-xs">
                    {carrier.penalizacionTotal > 0 ? (
                      <span className="text-rose-600 flex items-center gap-1 justify-end">
                        <TrendingDown className="w-3 h-3" />
                        {formatCurrency(carrier.penalizacionTotal)}
                      </span>
                    ) : (
                      <span className="text-slate-400">$0</span>
                    )}
                  </td>

                  {/* Calculated Stars rating */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      {renderStars(carrier.rating)}
                      <span className="text-[10px] text-slate-400 font-bold">{carrier.rating} / 5</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-slate-400 mt-4 leading-normal">
        * Nota: La calificación es formulada de forma analítica cruzando tasa de resolución, demoras de entrega frente a acuerdos SLA y sumatoria de penalizaciones económicas aplicadas.
      </p>
    </div>
  );
}
