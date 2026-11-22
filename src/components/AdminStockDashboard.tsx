import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  PackageX,
  Search,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../data/mockProducts';

interface AdminStockDashboardProps {
  products: Product[];
  updateProductStock: (productId: string, newStock: number) => Promise<void>;
  onOpenInventory: () => void;
  showToast: (msg: string) => void;
}

type StockFilterTab = 'restock' | 'all' | 'out' | 'healthy';

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  payload?: Record<string, any>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const BarStockTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="bg-slate-900 text-white rounded-lg px-3.5 py-2.5 text-xs shadow-lg border border-slate-800 space-y-1 tabular-nums max-w-xs">
      <div className="font-semibold text-white truncate">{item.fullName}</div>
      <div className="text-[11px] text-slate-400">
        {item.brand} · {item.category}
      </div>
      <div className="pt-1 border-t border-slate-700/80 flex items-center justify-between gap-4">
        <span className="text-slate-300">Stock actuel</span>
        <span className="font-mono font-bold text-white">{item.stock} u.</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-300">Seuil d’alerte</span>
        <span className="font-mono text-amber-300">{item.threshold} u.</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-300">Statut</span>
        <span className="font-semibold text-sky-300">{item.statusLabel}</span>
      </div>
    </div>
  );
};

const PieStatusTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg border border-slate-800 tabular-nums">
      <div className="font-semibold text-white">{item.name}</div>
      <div className="font-mono text-slate-300">
        {item.value} référence(s) ({item.payload?.percent ?? 0}%)
      </div>
    </div>
  );
};

export const AdminStockDashboard: React.FC<AdminStockDashboardProps> = ({
  products,
  updateProductStock,
  onOpenInventory,
  showToast
}) => {
  const [threshold, setThreshold] = useState<number>(15);
  const [filterTab, setFilterTab] = useState<StockFilterTab>('restock');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [bulkLoading, setBulkLoading] = useState(false);

  const targetStock = threshold * 2;
  const criticalLimit = Math.max(1, Math.floor(threshold / 3));

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return {
        key: 'out',
        label: 'Rupture',
        color: '#dc2626',
        barClass: 'bg-rose-600',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    if (stock <= criticalLimit) {
      return {
        key: 'critical',
        label: 'Critique',
        color: '#ea580c',
        barClass: 'bg-orange-600',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200'
      };
    }
    if (stock <= threshold) {
      return {
        key: 'low',
        label: 'À réapprovisionner',
        color: '#d97706',
        barClass: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    return {
      key: 'healthy',
      label: 'Optimal',
      color: '#059669',
      barClass: 'bg-emerald-600',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  };

  // Global stock metrics
  const metrics = useMemo(() => {
    let outCount = 0;
    let criticalCount = 0;
    let lowCount = 0;
    let healthyCount = 0;
    let totalUnits = 0;
    let totalValuation = 0;

    for (const p of products) {
      totalUnits += p.stock;
      totalValuation += p.stock * p.price;
      if (p.stock === 0) outCount += 1;
      else if (p.stock <= criticalLimit) criticalCount += 1;
      else if (p.stock <= threshold) lowCount += 1;
      else healthyCount += 1;
    }

    const needRestockCount = outCount + criticalCount + lowCount;
    const availabilityRate = products.length > 0
      ? Math.round((healthyCount / products.length) * 100)
      : 100;

    return {
      outCount,
      criticalCount,
      lowCount,
      healthyCount,
      needRestockCount,
      totalUnits,
      totalValuation,
      availabilityRate
    };
  }, [products, threshold, criticalLimit]);

  // Sorted chart data: lowest stock first so urgent items appear at top
  const barChartData = useMemo(() => {
    return [...products]
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 12)
      .map(p => {
        const st = getStockStatus(p.stock);
        const shortName = p.name.length > 26 ? `${p.name.slice(0, 24)}…` : p.name;
        return {
          id: p.id,
          name: shortName,
          fullName: p.name,
          brand: p.brand,
          category: p.category,
          stock: p.stock,
          threshold,
          color: st.color,
          statusLabel: st.label
        };
      });
  }, [products, threshold, criticalLimit]);

  // Pie status breakdown
  const statusPieData = useMemo(() => {
    const total = products.length;
    const rows = [
      {
        name: 'Rupture (0 u.)',
        value: metrics.outCount,
        color: '#dc2626'
      },
      {
        name: `À réapprovisionner (1–${threshold} u.)`,
        value: metrics.criticalCount + metrics.lowCount,
        color: '#d97706'
      },
      {
        name: `Optimal (> ${threshold} u.)`,
        value: metrics.healthyCount,
        color: '#059669'
      }
    ].map(r => ({
      ...r,
      percent: total > 0 ? Math.round((r.value / total) * 100) : 0
    }));

    return {
      rows,
      activeSlices: rows.filter(r => r.value > 0)
    };
  }, [metrics, products.length, threshold]);

  // Category alerts breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; alerts: number; units: number }>();
    for (const p of products) {
      const entry = map.get(p.category) || { total: 0, alerts: 0, units: 0 };
      entry.total += 1;
      entry.units += p.stock;
      if (p.stock <= threshold) entry.alerts += 1;
      map.set(p.category, entry);
    }
    return Array.from(map.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.alerts - a.alerts || a.units - b.units);
  }, [products, threshold]);

  // Filtered replenishment queue (sorted lowest stock first)
  const filteredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => a.stock - b.stock)
      .filter(p => {
        const matchTab =
          filterTab === 'all'
            ? true
            : filterTab === 'out'
              ? p.stock === 0
              : filterTab === 'restock'
                ? p.stock <= threshold
                : p.stock > threshold;

        const matchCat = categoryFilter === 'Tous' || p.category === categoryFilter;
        const q = search.trim().toLowerCase();
        const matchSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.ean.includes(q);

        return matchTab && matchCat && matchSearch;
      });
  }, [products, filterTab, categoryFilter, search, threshold]);

  const itemsNeedingRestock = useMemo(
    () => products.filter(p => p.stock <= threshold),
    [products, threshold]
  );

  const handleBulkReplenish = async () => {
    if (itemsNeedingRestock.length === 0) return;
    setBulkLoading(true);
    try {
      for (const item of itemsNeedingRestock) {
        const nextStock = Math.max(item.stock + 15, targetStock);
        await updateProductStock(item.id, nextStock);
      }
      showToast(`${itemsNeedingRestock.length} référence(s) réapprovisionnée(s) au niveau cible (${targetStock} u.).`);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>À réapprovisionner</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.needRestockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.needRestockCount}</div>
          <div className="text-[11px] text-slate-600 font-medium">
            Seuil actif : ≤ {threshold} u. · {metrics.criticalCount} critique(s)
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Ruptures de stock</span>
            <PackageX className={`w-4 h-4 ${metrics.outCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`text-2xl font-bold ${metrics.outCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {metrics.outCount}
          </div>
          <div className="text-[11px] text-slate-600 font-medium">
            {metrics.outCount > 0 ? 'Action immédiate requise' : 'Aucune rupture détectée'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Stock total officine</span>
            <PackageCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalUnits} u.</div>
          <div className="text-[11px] text-slate-600 font-medium">
            Valeur catalogue : {metrics.totalValuation.toFixed(2)} €
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Disponibilité optimale</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.availabilityRate} %</div>
          <div className="text-[11px] text-slate-600 font-medium">
            {metrics.healthyCount} / {products.length} référence(s) &gt; {threshold} u.
          </div>
        </div>
      </div>

      {/* Visual Stock Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Horizontal BarChart sorted by urgency */}
        <div className="lg:col-span-7 min-w-0 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-slate-900">
                Niveaux de stock par référence (triés par urgence)
              </h2>
              <p className="text-xs text-slate-500">
                La ligne pointillée marque le seuil de réapprovisionnement ({threshold} unités).
              </p>
            </div>
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg shrink-0">
              {[5, 10, 15, 25].map(val => (
                <button
                  key={val}
                  onClick={() => setThreshold(val)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                    threshold === val
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ≤ {val} u.
                </button>
              ))}
            </div>
          </div>

          {barChartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-slate-400">
              Aucun produit dans le catalogue.
            </div>
          ) : (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 10, fill: '#334155', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<BarStockTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <ReferenceLine
                    x={threshold}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <Bar dataKey="stock" radius={[0, 4, 4, 0]} barSize={16}>
                    {barChartData.map(entry => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" />
                Rupture (0 u.)
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                À réapprovisionner (≤ {threshold} u.)
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                Optimal (&gt; {threshold} u.)
              </span>
            </div>
            <button
              onClick={onOpenInventory}
              className="text-blue-700 hover:underline font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>Éditeur catalogue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 cols: Stock Health Donut + Category Watchlist */}
        <div className="lg:col-span-5 min-w-0 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">État global du stock</h2>
              <p className="text-xs text-slate-500">Répartition par niveau de criticité</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
              {products.length} réf.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="relative h-40 w-full min-w-0">
              {statusPieData.activeSlices.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Catalogue vide
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData.activeSlices}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={64}
                        paddingAngle={statusPieData.activeSlices.length > 1 ? 3 : 0}
                        stroke="none"
                      >
                        {statusPieData.activeSlices.map((entry, idx) => (
                          <Cell key={`${entry.name}-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieStatusTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center tabular-nums">
                    <span className="text-lg font-bold text-slate-900 leading-none">
                      {metrics.needRestockCount}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">alerte(s)</span>
                  </div>
                </>
              )}
            </div>

            <div className="divide-y divide-slate-100 text-xs tabular-nums">
              {statusPieData.rows.map(row => (
                <div key={row.name} className="py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="text-slate-700 font-medium truncate">{row.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Categories Watchlist */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Couverture par catégorie
            </div>
            <div className="divide-y divide-slate-100 text-xs tabular-nums max-h-40 overflow-y-auto">
              {categoryBreakdown.map(cat => (
                <div key={cat.category} className="py-1.5 flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-700 truncate">{cat.category}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-500">{cat.units} u.</span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                        cat.alerts > 0
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {cat.alerts > 0 ? `${cat.alerts} alerte(s)` : 'OK'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Replenishment Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'restock', label: `À réapprovisionner (${metrics.needRestockCount})` },
              { id: 'out', label: `Ruptures (${metrics.outCount})` },
              { id: 'healthy', label: `Stock optimal (${metrics.healthyCount})` },
              { id: 'all', label: `Tout le catalogue (${products.length})` }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilterTab(t.id as StockFilterTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  filterTab === t.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Produit, marque, EAN..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {itemsNeedingRestock.length > 0 && (
              <button
                onClick={handleBulkReplenish}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${bulkLoading ? 'animate-spin' : ''}`} />
                <span>Réapprovisionner tout ({itemsNeedingRestock.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Article / EAN</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 w-64">Niveau visuel (cible {targetStock} u.)</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Besoin estimé</th>
                <th className="py-3 px-4 text-right">Réapprovisionnement rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => {
                const status = getStockStatus(p.stock);
                const maxScale = Math.max(targetStock, p.stock, 30);
                const fillPct = Math.min(100, Math.round((p.stock / maxScale) * 100));
                const thresholdPct = Math.min(100, Math.round((threshold / maxScale) * 100));
                const missingUnits = Math.max(0, targetStock - p.stock);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate max-w-[230px]">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {p.brand} · <span className="font-mono">{p.ean}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{p.category}</td>

                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-900">{p.stock} u.</span>
                          <span className="text-slate-400">Seuil {threshold} u.</span>
                        </div>
                        <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${status.barClass}`}
                            style={{ width: `${fillPct}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-900/50"
                            style={{ left: `${thresholdPct}%` }}
                            title={`Seuil d’alerte : ${threshold} u.`}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                      {missingUnits > 0 ? `+${missingUnits} u.` : '—'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => updateProductStock(p.id, p.stock + 5)}
                          className="px-2 py-1 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded text-[11px]"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => updateProductStock(p.id, p.stock + 15)}
                          className="px-2 py-1 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded text-[11px]"
                        >
                          +15
                        </button>
                        {missingUnits > 0 && (
                          <button
                            onClick={() => updateProductStock(p.id, targetStock)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-blue-700 text-white font-semibold rounded text-[11px] transition-colors"
                          >
                            Compléter ({targetStock} u.)
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center space-y-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                    <div className="text-sm font-semibold text-slate-800">
                      {filterTab === 'restock'
                        ? `Aucun article sous le seuil de ${threshold} unités`
                        : 'Aucun article ne correspond à ces filtres'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {filterTab === 'restock'
                        ? 'Tous les produits filtrés disposent d’un niveau de stock satisfaisant.'
                        : 'Essayez de modifier votre recherche ou de sélectionner tout le catalogue.'}
                    </div>
                    {filterTab !== 'all' && (
                      <button
                        onClick={() => {
                          setFilterTab('all');
                          setSearch('');
                          setCategoryFilter('Tous');
                        }}
                        className="mt-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Afficher tout le catalogue
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
