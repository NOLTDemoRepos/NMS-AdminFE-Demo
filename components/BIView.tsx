
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, Sector
} from 'recharts';
import { 
  Download, ChevronDown, Zap, Turtle, BarChart3, PieChart as PieChartIcon, 
  TrendingUp, Users, Clock, Filter, Calendar
} from 'lucide-react';

const COLORS = ['#f0c040', '#3b82f6', '#34d399', '#a78bfa', '#fb923c', '#f87171'];

const TAT_DATA = [
  { name: 'Sales', value: 5.55 },
  { name: 'Cust. Experience', value: 3.67 },
  { name: 'Credit Check 1', value: 2.64 },
  { name: 'Credit Check 2', value: 2.76 },
  { name: 'Internal Audit', value: 0.61 },
];

const STATUS_DATA = [
  { name: 'Approved', value: 102 },
  { name: 'Pending', value: 13 },
];

const DAILY_DATA = [
  { name: '23 Mar', new: 19, spillover: 6 },
  { name: '24 Mar', new: 20, spillover: 0 },
  { name: '25 Mar', new: 17, spillover: 0 },
  { name: '26 Mar', new: 23, spillover: 0 },
  { name: '27 Mar', new: 17, spillover: 0 },
];

const LOAN_TYPE_DATA = [
  { name: 'New', value: 79 },
  { name: 'Top-Up', value: 19 },
  { name: 'Re-App', value: 4 },
];

const STAGES = [
  { name: 'Sales', count: 160, color: '#f0c040' },
  { name: 'Customer Experience', count: 112, color: '#3b82f6' },
  { name: 'Credit Check 1', count: 127, color: '#34d399' },
  { name: 'Credit Check 2', count: 108, color: '#a78bfa' },
  { name: 'Internal Audit', count: 103, color: '#fb923c' },
  { name: 'Finance', count: 102, color: '#f87171' },
];

const FASTEST = [
  { ref: 'APP-714', name: 'STEPHEN LYDIA MAKULATA', type: 'Top-Up', start: '24/03 13:09', end: '24/03 14:23', hours: 1.23 },
  { ref: 'APP-713', name: 'ADAMU HUZAIFA', type: 'Top-Up', start: '24/03 13:00', end: '24/03 14:26', hours: 1.43 },
  { ref: 'APP-791', name: 'HASSAN AGYER HANNATU', type: 'Top-Up', start: '27/03 12:03', end: '27/03 13:47', hours: 1.73 },
];

const SLOWEST = [
  { ref: 'APP-609', name: 'GBAKO THERISA PATU', amount: '₦200,000', start: '17/03 12:06', end: '23/03 15:14', hours: 147.13, days: '6.1 days' },
  { ref: 'APP-632', name: 'JAMES LADI RITA OKORO', amount: '₦200,000', start: '17/03 13:53', end: '23/03 15:24', hours: 145.52, days: '6.1 days' },
  { ref: 'APP-662', name: 'BELLO ABDULKADIR', amount: '₦500,000', start: '18/03 13:09', end: '23/03 15:41', hours: 122.53, days: '5.1 days' },
];

const REPORT_VIEWS = [
  'TAT Report',
  'Trend Analysis',
  'Demography',
  'Portfolio Quality',
  'Officer Performance',
  'Channel Analysis'
];

const DATE_OPTIONS = [
  'Last 7 Days',
  'Last 30 Days',
  'This Month',
  'Last Quarter',
  'Custom Range'
];

const PRODUCT_OPTIONS = [
  'All Products',
  'Public Sector Loan',
  'Working Capital',
  'Personal Loan',
  'Business Loan'
];

const BIView: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState(REPORT_VIEWS[0]);
  const [selectedDate, setSelectedDate] = useState(DATE_OPTIONS[0]);
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_OPTIONS[0]);
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const handleExport = () => {
    console.log(`Exporting raw data for ${selectedReport}...`);
    // Mock export logic
    const data = JSON.stringify({ report: selectedReport, timestamp: new Date().toISOString() });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.toLowerCase().replace(/ /g, '_')}_export.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-[#e8eaf0] font-sans p-8 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-end border-b border-[#2a3140] pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[#f0c040] tracking-tight leading-tight uppercase">
            Loan TAT Report
          </h1>
        </div>
        
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3">
            {/* Report Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
                className="flex items-center gap-2 bg-[#161a20] border border-[#2a3140] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#1c2128] transition-colors text-[#6b7585]"
              >
                <Filter className="w-3 h-3" />
                {selectedReport}
                <ChevronDown className={`w-3 h-3 transition-transform ${isReportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isReportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#161a20] border border-[#2a3140] rounded-xl shadow-2xl z-50 overflow-hidden">
                  {REPORT_VIEWS.map((view) => (
                    <button
                      key={view}
                      onClick={() => {
                        setSelectedReport(view);
                        setIsReportDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#1c2128] transition-colors ${selectedReport === view ? 'text-[#f0c040] bg-[#1c2128]' : 'text-[#6b7585]'}`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                className="flex items-center gap-2 bg-[#161a20] border border-[#2a3140] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#1c2128] transition-colors text-[#6b7585]"
              >
                <BarChart3 className="w-3 h-3" />
                {selectedProduct}
                <ChevronDown className={`w-3 h-3 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProductDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#161a20] border border-[#2a3140] rounded-xl shadow-2xl z-50 overflow-hidden">
                  {PRODUCT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSelectedProduct(opt);
                        setIsProductDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#1c2128] transition-colors ${selectedProduct === opt ? 'text-[#f0c040] bg-[#1c2128]' : 'text-[#6b7585]'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="flex items-center gap-2 bg-[#161a20] border border-[#2a3140] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#1c2128] transition-colors text-[#6b7585]"
              >
                <Calendar className="w-3 h-3" />
                {selectedDate}
                <ChevronDown className={`w-3 h-3 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDateDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#161a20] border border-[#2a3140] rounded-xl shadow-2xl z-50 overflow-hidden">
                  {DATE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSelectedDate(opt);
                        setIsDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#1c2128] transition-colors ${selectedDate === opt ? 'text-[#f0c040] bg-[#1c2128]' : 'text-[#6b7585]'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right font-mono text-[10px] text-[#6b7585] leading-relaxed">
            115 Applications &nbsp;·&nbsp; 23 Mar – 27 Mar 2026
          </div>
        </div>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Approved (Finance)', value: '102', sub: '96 new · 6 spillover', color: '#34d399' },
          { label: 'Pending', value: '13', sub: '11.3% in progress', color: '#3b82f6' },
          { label: 'Rejected', value: '0', sub: '0.0% rejection rate', color: '#34d399' },
          { label: 'Total Portfolio Value', value: '₦35.3M', sub: 'Approved: ₦29.9M', color: '#f0c040' },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#161a20] border border-[#2a3140] rounded-xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: kpi.color }} />
            <div className="text-[10px] font-mono text-[#6b7585] uppercase tracking-[1.5px] mb-2">{kpi.label}</div>
            <div className="text-3xl font-bold text-[#e8eaf0]">{kpi.value}</div>
            <div className="text-[10px] font-mono text-[#6b7585] mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#161a20] border border-[#2a3140] rounded-xl p-6">
          <h2 className="text-[10px] font-mono text-[#6b7585] uppercase tracking-[2px] mb-6">Average Stage Turnaround Time (Hours) — Excl. Finance</h2>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TAT_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3140" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7585', fontSize: 10, fontFamily: 'monospace' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7585', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161a20', border: '1px solid #2a3140', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#e8eaf0' }}
                  cursor={{ fill: '#1c2128' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {TAT_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.7} stroke={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#161a20] border border-[#2a3140] rounded-xl p-6">
          <h2 className="text-[10px] font-mono text-[#6b7585] uppercase tracking-[2px] mb-6">Application Status</h2>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={STATUS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#34d399" fillOpacity={0.8} stroke="#34d399" />
                  <Cell fill="#3b82f6" fillOpacity={0.8} stroke="#3b82f6" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161a20', border: '1px solid #2a3140', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#161a20] border border-[#2a3140] rounded-xl p-6">
          <h2 className="text-[10px] font-mono text-[#6b7585] uppercase tracking-[2px] mb-6">Daily Approvals Reaching Finance — 23–27 Mar 2026</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3140" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7585', fontSize: 10, fontFamily: 'monospace' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7585', fontSize: 10, fontFamily: 'monospace' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161a20', border: '1px solid #2a3140', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  iconType="rect"
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingBottom: '20px' }}
                />
                <Bar dataKey="new" stackId="a" fill="#34d399" fillOpacity={0.75} stroke="#34d399" />
                <Bar dataKey="spillover" stackId="a" fill="#f0c040" fillOpacity={0.75} stroke="#f0c040" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#161a20] border border-[#2a3140] rounded-xl p-6">
          <h2 className="text-[10px] font-mono text-[#6b7585] uppercase tracking-[2px] mb-6">Loan Type Mix</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={LOAN_TYPE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {LOAN_TYPE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} stroke={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161a20', border: '1px solid #2a3140', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Speed Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#161a20] border border-[#2a3140] rounded-xl p-6">
          <h2 className="text-[10px] font-mono text-[#6b7585] uppercase tracking-[2px] mb-6 flex items-center gap-2">
            <Zap className="w-3 h-3 text-[#34d399]" /> Fastest Approvals — Sales to Finance
          </h2>
          <div className="space-y-6">
            {FASTEST.map((d, i) => {
              const maxH = FASTEST[2].hours;
              const minH = FASTEST[0].hours;
              const pct = (1 - (d.hours - minH) / (maxH - minH + 0.01)) * 100;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#34d399]">{d.ref}</span>
                      <span className="text-sm font-semibold">{d.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#34d399]">{d.hours.toFixed(2)}h</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#2a3140] rounded-full overflow-hidden">
                      <div className="h-full bg-[#34d399] opacity-80 transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-[9px] text-[#6b7585] whitespace-nowrap">
                      {d.type} · {d.start} → {d.end}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-[#2a3140] font-mono text-[9px] text-[#6b7585]">
            Measured: First Sales entry → Finance stage entry
          </div>
        </div>

        <div className="bg-[#161a20] border border-[#2a3140] rounded-xl p-6">
          <h2 className="text-[10px] font-mono text-[#6b7585] uppercase tracking-[2px] mb-6 flex items-center gap-2">
            <Turtle className="w-3 h-3 text-[#f87171]" /> Slowest Approvals — Sales to Finance
          </h2>
          <div className="space-y-6">
            {SLOWEST.map((d, i) => {
              const maxH = SLOWEST[0].hours;
              const pct = (d.hours / maxH) * 100;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#f87171]">{d.ref}</span>
                      <span className="text-sm font-semibold">{d.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#f87171]">{d.days || `${d.hours.toFixed(0)}h`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#2a3140] rounded-full overflow-hidden">
                      <div className="h-full bg-[#f87171] opacity-80 transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono text-[9px] text-[#6b7585] whitespace-nowrap">
                      {d.amount} · {d.start} → {d.end}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-[#2a3140] font-mono text-[9px] text-[#6b7585]">
            All 3 are spillover apps that started prior week (Mar 17–18)
          </div>
        </div>
      </div>

      {/* Row 4: Stage Volume */}
      <div className="bg-[#161a20] border border-[#2a3140] rounded-xl p-6">
        <h2 className="text-[10px] font-mono text-[#6b7585] uppercase tracking-[2px] mb-8">Stage Volume — Total Passes Through Each Stage</h2>
        <div className="space-y-4">
          {STAGES.map((s, i) => {
            const maxCount = STAGES[0].count;
            const pct = (s.count / maxCount) * 100;
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-40 flex-shrink-0 text-right font-mono text-[10px] text-[#6b7585]">{s.name}</div>
                <div className="flex-1 flex items-center gap-4">
                  <div className="h-6 rounded-sm opacity-80 transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  <div className="font-mono text-[10px] text-[#e8eaf0] whitespace-nowrap">{s.count} passes</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Button - Bottom Right */}
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-[#f0c040] text-[#0d0f12] px-6 py-3 rounded-full font-bold shadow-2xl hover:bg-[#d9ac3a] transition-all hover:scale-105 active:scale-95"
        >
          <Download className="w-5 h-5" />
          Export {selectedReport} Data
        </button>
      </div>
    </div>
  );
};

export default BIView;
