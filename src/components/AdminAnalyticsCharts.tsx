import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Order, AdminUserSummary } from '../types';

interface AdminAnalyticsChartsProps {
  orders: Order[];
  adminUsers: AdminUserSummary[];
}

type DateRangeDays = 7 | 14 | 30;
type AreaMetricMode = 'sales' | 'loyalty' | 'both';
type PieViewMode = 'tiers' | 'categories' | 'promos';

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  dataKey?: string;
  color?: string;
  payload?: Record<string, any>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CATEGORY_COLORS = ['#1d4ed8', '#0284c7', '#059669', '#d97706', '#6366f1', '#64748b'];

const parseOrderDateKey = (rawDate: string): string => {
  if (!rawDate) return '';
  const match = rawDate.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
};

const formatShortDateFr = (isoDate: string): string => {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  }).format(dateObj);
};

const AreaCustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="bg-slate-900 text-white rounded-lg px-3.5 py-2.5 text-xs shadow-lg border border-slate-800 space-y-1.5 tabular-nums">
      <div className="font-semibold text-slate-200 border-b border-slate-700/80 pb-1">
        {row.fullLabel}
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="text-slate-300">Chiffre d’affaires</span>
        <span className="font-mono font-bold text-sky-300">{Number(row.revenue).toFixed(2)} €</span>
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="text-slate-300">Points fidélité</span>
        <span className="font-mono font-bold text-amber-300">+{row.loyaltyPoints} pts</span>
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="text-slate-300">Commandes</span>
        <span className="font-mono font-semibold text-white">{row.ordersCount}</span>
      </div>
    </div>
  );
};

const PieCustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const unit = item.payload?.unit || '';
  const pct = item.payload?.percent ?? 0;

  return (
    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg border border-slate-800 tabular-nums space-y-0.5">
      <div className="font-semibold text-white">{item.name}</div>
      <div className="font-mono text-slate-200">
        {item.value} {unit} ({pct}%)
      </div>
    </div>
  );
};

export const AdminAnalyticsCharts: React.FC<AdminAnalyticsChartsProps> = ({ orders, adminUsers }) => {
  const [rangeDays, setRangeDays] = useState<DateRangeDays>(14);
  const [areaMode, setAreaMode] = useState<AreaMetricMode>('both');
  const [pieMode, setPieMode] = useState<PieViewMode>('tiers');

  // Build continuous daily time series from real orders
  const dailySeries = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const orderKeys = orders
      .map(o => parseOrderDateKey(o.date))
      .filter(Boolean)
      .sort();
    const latestOrderKey = orderKeys.length > 0 ? orderKeys[orderKeys.length - 1] : todayKey;
    const anchorKey = latestOrderKey > todayKey ? latestOrderKey : todayKey;

    const byDate = new Map<string, { revenue: number; loyaltyPoints: number; ordersCount: number }>();
    for (const o of orders) {
      const key = parseOrderDateKey(o.date);
      if (!key) continue;
      const existing = byDate.get(key) || { revenue: 0, loyaltyPoints: 0, ordersCount: 0 };
      existing.revenue += Number(o.totalAmount) || 0;
      existing.loyaltyPoints += Number(o.loyaltyPointsEarned ?? Math.floor(Number(o.totalAmount) || 0));
      existing.ordersCount += 1;
      byDate.set(key, existing);
    }

    const [ay, am, ad] = anchorKey.split('-').map(Number);
    const anchorUtc = new Date(Date.UTC(ay, am - 1, ad));

    const result: {
      dateKey: string;
      label: string;
      fullLabel: string;
      revenue: number;
      loyaltyPoints: number;
      ordersCount: number;
    }[] = [];

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(anchorUtc);
      d.setUTCDate(d.getUTCDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const bucket = byDate.get(dateKey) || { revenue: 0, loyaltyPoints: 0, ordersCount: 0 };
      result.push({
        dateKey,
        label: formatShortDateFr(dateKey),
        fullLabel: new Intl.DateTimeFormat('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC'
        }).format(d),
        revenue: Number(bucket.revenue.toFixed(2)),
        loyaltyPoints: bucket.loyaltyPoints,
        ordersCount: bucket.ordersCount
      });
    }

    return result;
  }, [orders, rangeDays]);

  const periodTotals = useMemo(() => {
    return dailySeries.reduce(
      (acc, d) => ({
        revenue: acc.revenue + d.revenue,
        loyaltyPoints: acc.loyaltyPoints + d.loyaltyPoints,
        ordersCount: acc.ordersCount + d.ordersCount
      }),
      { revenue: 0, loyaltyPoints: 0, ordersCount: 0 }
    );
  }, [dailySeries]);

  // Loyalty tiers & program breakdown computed from real users & orders
  const pieData = useMemo(() => {
    if (pieMode === 'tiers') {
      const customers = adminUsers.filter(u => u.role === 'customer');
      let bronze = 0;
      let silver = 0;
      let gold = 0;

      for (const c of customers) {
        const pts = Math.floor(Number(c.totalSpent) || 0);
        if (pts >= 500) gold += 1;
        else if (pts >= 200) silver += 1;
        else bronze += 1;
      }

      const total = customers.length;
      const rows = [
        { name: 'Bronze (< 200 pts)', value: bronze, color: '#b45309', unit: 'membre(s)' },
        { name: 'Silver (200–499 pts)', value: silver, color: '#64748b', unit: 'membre(s)' },
        { name: 'Gold (500+ pts)', value: gold, color: '#d97706', unit: 'membre(s)' }
      ].map(item => ({
        ...item,
        percent: total > 0 ? Math.round((item.value / total) * 100) : 0
      }));

      return {
        rows,
        activeSlices: rows.filter(r => r.value > 0),
        centerValue: `${total}`,
        centerLabel: total > 1 ? 'Membres' : 'Membre'
      };
    }

    if (pieMode === 'categories') {
      const catMap = new Map<string, number>();
      let totalPts = 0;
      for (const o of orders) {
        for (const item of o.items) {
          const cat = item.product?.category || 'Autres';
          const pts = Math.round((Number(item.product?.price) || 0) * (Number(item.quantity) || 1));
          catMap.set(cat, (catMap.get(cat) || 0) + pts);
          totalPts += pts;
        }
      }

      const sorted = Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const rows = sorted.map(([name, value], idx) => ({
        name,
        value,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        unit: 'pts',
        percent: totalPts > 0 ? Math.round((value / totalPts) * 100) : 0
      }));

      return {
        rows,
        activeSlices: rows.filter(r => r.value > 0),
        centerValue: `${totalPts}`,
        centerLabel: 'Points émis'
      };
    }

    // pieMode === 'promos'
    let withPromo = 0;
    let standardLoyalty = 0;
    for (const o of orders) {
      if (o.promoCode) withPromo += 1;
      else standardLoyalty += 1;
    }
    const total = orders.length;
    const rows = [
      {
        name: 'Avec code promo',
        value: withPromo,
        color: '#1d4ed8',
        unit: 'cmd',
        percent: total > 0 ? Math.round((withPromo / total) * 100) : 0
      },
      {
        name: 'Fidélité standard',
        value: standardLoyalty,
        color: '#0ea5e9',
        unit: 'cmd',
        percent: total > 0 ? Math.round((standardLoyalty / total) * 100) : 0
      }
    ];

    return {
      rows,
      activeSlices: rows.filter(r => r.value > 0),
      centerValue: `${total}`,
      centerLabel: total > 1 ? 'Commandes' : 'Commande'
    };
  }, [pieMode, adminUsers, orders]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 8 cols: Daily Sales & Loyalty Area Chart */}
      <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900">
              Ventes quotidiennes &amp; points fidélité
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span>
                CA période : <strong className="text-slate-900">{periodTotals.revenue.toFixed(2)} €</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Points émis : <strong className="text-amber-700">+{periodTotals.loyaltyPoints} pts</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {periodTotals.ordersCount} commande(s)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Metric Toggle */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg">
              {[
                { id: 'both', label: 'Mixte' },
                { id: 'sales', label: 'Ventes (€)' },
                { id: 'loyalty', label: 'Fidélité (pts)' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setAreaMode(m.id as AreaMetricMode)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    areaMode === m.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Period Toggle */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg">
              {([7, 14, 30] as const).map(days => (
                <button
                  key={days}
                  onClick={() => setRangeDays(days)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap shrink-0 tabular-nums transition-colors ${
                    rangeDays === days
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {days}j
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="myrlanSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="myrlanLoyaltyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                minTickGap={16}
              />
              {(areaMode === 'sales' || areaMode === 'both') && (
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}€`}
                />
              )}
              {(areaMode === 'loyalty' || areaMode === 'both') && (
                <YAxis
                  yAxisId={areaMode === 'loyalty' ? 'left' : 'right'}
                  orientation={areaMode === 'loyalty' ? 'left' : 'right'}
                  tick={{ fontSize: 11, fill: '#b45309' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v} pts`}
                />
              )}
              <Tooltip content={<AreaCustomTooltip />} />

              {(areaMode === 'sales' || areaMode === 'both') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Chiffre d’affaires (€)"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  fill="url(#myrlanSalesGrad)"
                  activeDot={{ r: 4, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {(areaMode === 'loyalty' || areaMode === 'both') && (
                <Area
                  yAxisId={areaMode === 'loyalty' ? 'left' : 'right'}
                  type="monotone"
                  dataKey="loyaltyPoints"
                  name="Points fidélité"
                  stroke="#d97706"
                  strokeWidth={2}
                  fill="url(#myrlanLoyaltyGrad)"
                  activeDot={{ r: 4, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-4">
            {(areaMode === 'sales' || areaMode === 'both') && (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-700 inline-block" />
                Ventes quotidiennes (€)
              </span>
            )}
            {(areaMode === 'loyalty' || areaMode === 'both') && (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-600 inline-block" />
                Points fidélité attribués (1 € = 1 pt)
              </span>
            )}
          </div>
          <span className="hidden sm:inline text-slate-400">Données officinales en temps réel</span>
        </div>
      </div>

      {/* Right 4 cols: Loyalty Program Trends Pie Chart */}
      <div className="lg:col-span-4 min-w-0 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-3 border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Tendances fidélité</h2>
            <span className="text-[11px] text-slate-400 font-medium">Club Myrlan</span>
          </div>

          <div className="grid grid-cols-3 p-0.5 bg-slate-100 rounded-lg text-[11px] font-semibold">
            {[
              { id: 'tiers', label: 'Paliers' },
              { id: 'categories', label: 'Catégories' },
              { id: 'promos', label: 'Codes Promo' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPieMode(tab.id as PieViewMode)}
                className={`py-1 px-2 rounded-md whitespace-nowrap truncate transition-colors ${
                  pieMode === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Donut Chart */}
        {pieData.activeSlices.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-xs text-slate-400 text-center px-4">
            Aucune donnée disponible pour cette vue pour le moment.
          </div>
        ) : (
          <div className="relative h-44 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.activeSlices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={pieData.activeSlices.length > 1 ? 3 : 0}
                  stroke="none"
                >
                  {pieData.activeSlices.map((entry, idx) => (
                    <Cell key={`${entry.name}-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieCustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center tabular-nums">
              <span className="text-lg font-bold text-slate-900 leading-none">{pieData.centerValue}</span>
              <span className="text-[10px] text-slate-500 mt-1">{pieData.centerLabel}</span>
            </div>
          </div>
        )}

        {/* Tabular Breakdown Legend */}
        <div className="divide-y divide-slate-100 text-xs tabular-nums pt-1">
          {pieData.rows.map((row) => (
            <div key={row.name} className="py-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                <span className="text-slate-700 font-medium truncate">{row.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-bold text-slate-900">
                  {row.value} {row.unit}
                </span>
                <span className="text-[11px] text-slate-400 w-9 text-right">
                  {row.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
