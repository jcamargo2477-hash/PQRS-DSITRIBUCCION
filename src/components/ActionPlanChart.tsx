import { PqrsRecord } from '../types';

interface ActionPlanChartProps {
  records: PqrsRecord[];
}

// Colors from the image / spec
const ACTION_COLORS: Record<string, string> = {
  'Llamado de Atencion': 'bg-[#DF2525]', // red
  'Cobro al Transportador': 'bg-[#009B62]', // green
  'No Aplica': 'bg-[#1F69FF]', // blue
  'Reinducción': 'bg-[#D47A00]', // orange/amber
  'Capacitacion de Procesos': 'bg-[#D12E7B]', // deep pink/magenta
  'Gestion Interna SAC': 'bg-[#7D3CFF]', // purple
  'suspension': 'bg-[#8E8E8E]' // gray
};

export default function ActionPlanChart({ records }: ActionPlanChartProps) {
  // We only count cases where "estado === 'Cerrado'" as indicated in the image: "PLANES APLICADOS (CASOS CERRADOS)"
  const closedCases = records.filter(r => r.estado === 'Cerrado');
  const totalClosed = closedCases.reduce((sum, r) => sum + (r.cantidad || 1), 0);

  // Group by action
  const actionCounts: Record<string, number> = {};
  closedCases.forEach(r => {
    const act = r.accion || 'Otros';
    actionCounts[act] = (actionCounts[act] || 0) + (r.cantidad || 1);
  });

  // Sort them so they match the order: top to lowest (just like the image)
  const sortedActions = Object.entries(actionCounts)
    .map(([name, count]) => {
      const percentage = totalClosed > 0 ? (count / totalClosed) * 100 : 0;
      return {
        name,
        count,
        percentage,
        colorClass: ACTION_COLORS[name] || 'bg-slate-400'
      };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div id="action-plan-card" className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 mb-6 font-sans">
      <div className="border-b border-slate-100 pb-3 mb-5">
        <h4 id="action-plan-main-title" className="text-[10px] uppercase font-extrabold text-blue-600 tracking-widest font-sans">
          Plan de Acción
        </h4>
        <h3 id="action-plan-sub-title" className="text-sm font-extrabold text-slate-900 mt-1 uppercase font-display">
          PLANES APLICADOS (CASOS CERRADOS)
        </h3>
      </div>

      {totalClosed === 0 ? (
        <div className="py-12 text-center text-sm font-semibold text-slate-400">
          No hay casos cerrados disponibles para calcular planes de acción.
        </div>
      ) : (
        <div id="action-bars-wrapper" className="space-y-4">
          {sortedActions.map((action, index) => {
            return (
              <div key={action.name} id={`action-item-${index}`} className="flex flex-col sm:flex-row sm:items-center gap-2">
                {/* Action Name */}
                <div className="w-full sm:w-48 text-right pr-4 text-xs font-semibold text-slate-600 truncate" title={action.name}>
                  {action.name}
                </div>

                {/* Progress bar container */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-3.5 bg-slate-100 rounded-sm overflow-hidden flex items-center">
                    <div
                      className={`h-full ${action.colorClass} rounded-r-sm transition-all duration-500`}
                      style={{ width: `${action.percentage}%` }}
                    />
                  </div>

                  {/* Count & Percentage label */}
                  <div className="w-16 flex items-baseline justify-end gap-1.5 shrink-0 text-right">
                    <span className="text-xs font-extrabold text-slate-800">
                      {action.count}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {Math.round(action.percentage)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
