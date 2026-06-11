import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { PqrsRecord } from '../types';

interface DistributionChartProps {
  records: PqrsRecord[];
  selectedMotivo: string | null;
  onSelectMotivo: (motivo: string | null) => void;
}

// Colors from the image / spec
const REASON_COLORS: Record<string, string> = {
  'Novedades en la entrega': '#E11D48', // rose-600 (represented as red in image)
  'Atención del funcionario': '#EF4444', // red-500
  'Demora en la entrega de mercancía': '#F97316', // orange-500
  'Atención y Servicio al Cliente': '#8B5CF6', // violet-500
  'Manipulación deficiente en cargue': '#A78BFA', // purple-400
  'Daño o pérdidas en trayecto': '#EC4899', // pink-500
  'Averia producto no conforme': '#F59E0B', // amber-500
  'Incumplimiento en franja pactada': '#0D9488', // teal-600
  'Entrega parcial': '#3B82F6', // blue-500
  'Incumplimiento franja horaria': '#10B981', // emerald-500
};

const DEFAULT_COLOR = '#94A3B8'; // slate-400 for new raw formats

export default function DistributionChart({ records, selectedMotivo, onSelectMotivo }: DistributionChartProps) {
  // Count by reason
  const counts: Record<string, number> = {};

  records.forEach(r => {
    const m = r.motivo || 'Otro';
    counts[m] = (counts[m] || 0) + (r.cantidad || 1);
  });

  // Convert to ordered data array (highest count first, matching the chart in the image)
  const chartData = Object.entries(counts)
    .map(([motivo, total]) => ({
      motivo,
      total,
      color: REASON_COLORS[motivo] || DEFAULT_COLOR
    }))
    .sort((a, b) => b.total - a.total);

  const handleBarClick = (data: any) => {
    if (!data) return;
    const clickedMotivo = data.motivo;
    if (selectedMotivo === clickedMotivo) {
      onSelectMotivo(null); // Unselect if clicked again
    } else {
      onSelectMotivo(clickedMotivo);
    }
  };

  const truncateLabel = (text: string, length = 18) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    const total = chartData.reduce((sum, item) => sum + (item.total || 0), 0);
    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
    return (
      <text x={x + width / 2} y={y - 8} fill="#475569" fontSize={9} fontWeight="extrabold" textAnchor="middle">
        {value} ({pct}%)
      </text>
    );
  };

  return (
    <div id="distribution-chart-card" className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 mb-6">
      <div className="border-b border-slate-100 pb-3 mb-5">
        <h4 id="dist-chart-main-title" className="text-[10px] uppercase font-extrabold text-blue-600 tracking-widest font-sans">
          Motivos
        </h4>
        <h3 id="dist-chart-sub-title" className="text-sm font-extrabold text-slate-900 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-display">
          <span>DISTRIBUCIÓN DE PQRS POR MOTIVO (CLIC PARA FILTRAR)</span>
          {selectedMotivo && (
            <button
              onClick={() => onSelectMotivo(null)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl transition cursor-pointer self-start sm:self-auto"
              id="btn-clear-reason-filter"
            >
              Quitar filtro ×
            </button>
          )}
        </h3>
      </div>

      {/* Manual Legend Pills */}
      <div id="pills-legend-container" className="flex flex-wrap gap-2 mb-6">
        {chartData.map((item) => {
          const isSelected = selectedMotivo === item.motivo;
          const isNotSelectedFiltered = selectedMotivo !== null && !isSelected;
          const bColor = item.color;

          return (
            <button
              key={item.motivo}
              id={`pill-filter-${item.motivo.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => onSelectMotivo(isSelected ? null : item.motivo)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase transition select-none tracking-tight cursor-pointer ${
                isSelected
                  ? 'bg-slate-950 text-white border-slate-950 shadow-md scale-102'
                  : isNotSelectedFiltered
                  ? 'bg-white text-slate-400 border-slate-150 opacity-40 hover:opacity-100'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: bColor }}
              />
              {truncateLabel(item.motivo, 18)}
              <span className="ml-1 bg-slate-100 px-1 rounded text-slate-500">
                {item.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart Block */}
      <div id="distribution-bar-chart-wrapper" className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm font-semibold text-slate-400">
            Sin datos para graficar distribuciones.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 20 }}
              onClick={(state: any) => {
                if (state && state.activePayload) {
                  handleBarClick(state.activePayload[0].payload);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="motivo"
                tickFormatter={(tick) => truncateLabel(tick, 14)}
                tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  <span className="font-bold text-slate-800">{value} reporte(s)</span>,
                  'Total de Casos'
                ]}
                labelFormatter={(label) => <strong className="text-slate-950 font-bold block mb-1">{label}</strong>}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Bar 
                dataKey="total" 
                radius={[6, 6, 0, 0]} 
                cursor="pointer"
              >
                <LabelList dataKey="total" content={renderCustomLabel} />
                {chartData.map((entry, index) => {
                  const isSelected = selectedMotivo === entry.motivo;
                  const isNoneSelected = selectedMotivo === null;
                  
                  // Highlight: if selected, full strength; if other selected, fade out; if none selected, full color
                  let opacityOpacity = 1;
                  if (!isNoneSelected && !isSelected) {
                    opacityOpacity = 0.25;
                  }

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={opacityOpacity}
                      stroke={isSelected ? '#0F172A' : undefined}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
