import React, { useState, useMemo } from 'react';
import {
  DepartmentConfig,
  DepartmentId,
  QARecord,
  IncidentReport,
  WardResponsible,
  UserProfile,
} from '../types/nursing';
import {
  SubWardDef,
  SubWardStat,
  ALL_SUB_WARDS,
  computeSubWardStats,
} from '../utils/subWards';
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
} from 'recharts';
import {
  Building2,
  Bed,
  HeartPulse,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Download,
  ArrowRight,
  UserCheck,
  Phone,
  Layers,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { exportToCSV } from '../utils/calculations';

interface SubWardDashboardProps {
  records: QARecord[];
  incidents: IncidentReport[];
  departments: DepartmentConfig[];
  wardResponsibles?: Record<string, WardResponsible>;
  currentUser: UserProfile;
  onNavigateToSubWard: (deptId: DepartmentId, subWardId: string) => void;
  onOpenNewRecord?: (deptId: DepartmentId) => void;
}

export const SubWardDashboard: React.FC<SubWardDashboardProps> = ({
  records,
  incidents,
  departments,
  wardResponsibles = {},
  currentUser,
  onNavigateToSubWard,
  onOpenNewRecord,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'IPD' | 'ICU' | 'SPECIAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'WARNING'>('ALL');
  const [sortBy, setSortBy] = useState<'COMPLIANCE_DESC' | 'COMPLIANCE_ASC' | 'NAME'>('COMPLIANCE_DESC');

  // Compute stats for all 21 sub-wards
  const allStats = useMemo(() => {
    return computeSubWardStats(records, incidents, departments, wardResponsibles);
  }, [records, incidents, departments, wardResponsibles]);

  // Filtered and sorted stats
  const filteredStats = useMemo(() => {
    let result = allStats.filter((item) => {
      // Category filter
      if (categoryFilter !== 'ALL' && item.def.category !== categoryFilter) return false;

      // Status filter
      if (statusFilter === 'PASSED' && item.compliancePercent < 85) return false;
      if (statusFilter === 'WARNING' && item.compliancePercent >= 85) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.def.nameTh.toLowerCase().includes(q);
        const matchShort = item.def.shortName.toLowerCase().includes(q);
        const matchLoc = item.def.location.toLowerCase().includes(q);
        const matchHead = (item.responsible.headNurseName || '').toLowerCase().includes(q);
        if (!matchName && !matchShort && !matchLoc && !matchHead) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'COMPLIANCE_DESC') return b.compliancePercent - a.compliancePercent;
      if (sortBy === 'COMPLIANCE_ASC') return a.compliancePercent - b.compliancePercent;
      return a.def.nameTh.localeCompare(b.def.nameTh, 'th');
    });

    return result;
  }, [allStats, categoryFilter, statusFilter, searchQuery, sortBy]);

  // Aggregate KPI summary
  const summaryKPIs = useMemo(() => {
    const total = allStats.length;
    const passed = allStats.filter((s) => s.compliancePercent >= 85).length;
    const warning = allStats.filter((s) => s.compliancePercent < 85 && s.compliancePercent >= 70).length;
    const critical = allStats.filter((s) => s.compliancePercent < 70).length;
    const avgScore = total > 0
      ? Math.round(allStats.reduce((sum, s) => sum + s.compliancePercent, 0) / total)
      : 0;
    const totalIncidents = allStats.reduce((sum, s) => sum + s.incidentCount, 0);

    return { total, passed, warning, critical, avgScore, totalIncidents };
  }, [allStats]);

  // Data for chart
  const chartData = useMemo(() => {
    return filteredStats.map((item) => ({
      id: item.def.id,
      name: item.def.shortName,
      fullName: item.def.nameTh,
      compliance: item.compliancePercent,
      target: 85,
      colorHex: item.def.colorHex,
      passed: item.passedIndicators,
      total: item.totalIndicators,
      critical: item.criticalCount,
      warning: item.warningCount,
      category: item.def.categoryLabelTh,
    }));
  }, [filteredStats]);

  const handleExportCSV = () => {
    const headers = [
      'รหัสตึก/หอผู้ป่วย',
      'ชื่อหอผู้ป่วย/ตึกย่อย',
      'กลุ่มงานหลัก',
      'ที่ตั้ง/ชั้นอาคาร',
      'คะแนนผลงาน (%)',
      'เกณฑ์ HA (85%)',
      'ผ่านเกณฑ์ (ข้อ)',
      'ตัวชี้วัดทั้งหมด (ข้อ)',
      'จุดวิกฤต',
      'จุดเฝ้าระวัง',
      'อุบัติการณ์สะสม (เคส)',
      'หัวหน้าหอผู้ป่วย',
      'เบอร์โทรภายใน',
    ];

    const rows = filteredStats.map((s) => [
      s.def.id,
      s.def.nameTh,
      s.def.parentDeptNameTh,
      s.def.location,
      `${s.compliancePercent}%`,
      s.compliancePercent >= 85 ? 'ผ่านเกณฑ์' : 'เฝ้าระวัง',
      s.passedIndicators,
      s.totalIndicators,
      s.criticalCount,
      s.warningCount,
      s.incidentCount,
      s.responsible.headNurseName || '-',
      s.responsible.phoneInternal || '-',
    ]);

    exportToCSV(`Nursing_SubWards_Dashboard_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // Custom Tooltip for Chart
  const CustomSubWardTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[200px]">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: data.colorHex }} />
            <div>
              <p className="font-bold text-teal-300 leading-tight">{data.fullName}</p>
              <span className="text-[10px] text-slate-400">{data.category}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-slate-300">คะแนนคุณภาพ:</span>
            <span className="text-emerald-400 font-extrabold text-sm">{data.compliance}%</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>ผ่านเกณฑ์:</span>
            <span>{data.passed} / {data.total} ตัวชี้วัด</span>
          </div>
          {data.critical > 0 && (
            <div className="flex justify-between items-center text-rose-400 font-bold">
              <span>จุดวิกฤต:</span>
              <span>{data.critical} จุด</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-6 rounded-2xl shadow-md border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                  Sub-Ward & Building Quality Intelligence
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold font-['Prompt',sans-serif] text-white">
                  แดชบอร์ดติดตามคุณภาพแยกรายตึกย่อยและหอผู้ป่วย (21 ตึก)
                </h2>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              วิเคราะห์และเปรียบเทียบผลลัพธ์คุณภาพการพยาบาลรายหอผู้ป่วย ทั้งตึกผู้ป่วยใน (IPD 15 หอ), หอผู้ป่วยหนัก (ICU 4 หอ) และหน่วยตรวจรักษาพิเศษ (2 หน่วย) พร้อมสีประจำตึกอย่างชัดเจน
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="ส่งออกรายงานข้อมูลรายตึกย่อยเป็นไฟล์ CSV"
            >
              <Download className="w-4 h-4 text-teal-300" />
              <span>ส่งออกข้อมูลตึกย่อย ({filteredStats.length})</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Wards */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">หอผู้ป่วย/ตึกย่อยทั้งหมด</span>
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Prompt',sans-serif]">
              {summaryKPIs.total}
            </span>
            <span className="text-xs font-medium text-slate-500">ตึก/หอผู้ป่วย</span>
          </div>
          <p className="text-[11px] text-teal-700 mt-1 font-medium">
            IPD (15) • ICU (4) • Special (2)
          </p>
        </div>

        {/* Avg Compliance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-800">คะแนนเฉลี่ยรวมทุกตึก</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-900 font-['Prompt',sans-serif]">
              {summaryKPIs.avgScore}%
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              เกณฑ์ &ge; 85%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(summaryKPIs.avgScore, 100)}%` }}
            />
          </div>
        </div>

        {/* Passed Target */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">ตึกที่ผ่านเกณฑ์ HA (&ge;85%)</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-['Prompt',sans-serif]">
              {summaryKPIs.passed}
            </span>
            <span className="text-xs font-medium text-emerald-700">
              จาก {summaryKPIs.total} ตึก ({Math.round((summaryKPIs.passed / summaryKPIs.total) * 100)}%)
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">
            ผลสัมฤทธิ์ผ่านเกณฑ์ระดับยอดเยี่ยม
          </p>
        </div>

        {/* Warning / Needs Attention */}
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">ตึกที่ต้องเฝ้าระวัง (&lt;85%)</span>
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 font-['Prompt',sans-serif]">
              {summaryKPIs.warning + summaryKPIs.critical}
            </span>
            <span className="text-xs font-medium text-amber-700">หอผู้ป่วย</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-1 font-medium truncate">
            {summaryKPIs.warning + summaryKPIs.critical > 0
              ? 'ต้องการการสนับสนุนและติดตามใกล้ชิด'
              : 'ทุกตึกผ่านเกณฑ์มาตรฐานครบ 100%'}
          </p>
        </div>
      </div>

      {/* Interactive Sub-Ward Visual Comparison Graph Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt',sans-serif]">
                กราฟเปรียบเทียบคะแนนคุณภาพรายตึกย่อย (คนละตึกคนละสี)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงผลคะแนนการบรรลุเป้าหมายคุณภาพ (%) รายตึกย่อย พร้อมสีประจำตึกอย่างโดดเด่น
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'ALL'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด (21 ตึก)
            </button>
            <button
              onClick={() => setCategoryFilter('IPD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'IPD'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ผู้ป่วยใน IPD (15 ตึก)
            </button>
            <button
              onClick={() => setCategoryFilter('ICU')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'ICU'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ผู้ป่วยหนัก ICU (4 ตึก)
            </button>
            <button
              onClick={() => setCategoryFilter('SPECIAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'SPECIAL'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตรวจรักษาพิเศษ (2 หน่วย)
            </button>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="mt-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={50}
                />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip content={<CustomSubWardTooltip />} />
                <ReferenceLine
                  y={85}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  label={{ value: 'เกณฑ์ HA 85%', fill: '#059669', fontSize: 10, position: 'insideTopRight' }}
                />
                <Bar dataKey="compliance" radius={[5, 5, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={`cell-sub-${entry.id}`} fill={entry.colorHex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Color Legend Palette */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
          {chartData.map((item) => (
            <span
              key={item.id}
              className="px-2 py-0.5 rounded-md border font-medium flex items-center gap-1.5 bg-slate-50/80 border-slate-200"
              title={item.fullName}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.colorHex }} />
              <span className="font-bold text-slate-800">{item.name}</span>
              <span className="text-slate-500 font-semibold">{item.compliance}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* Sub-Ward Cards Grid Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Controls Bar: Search, Status Filter, Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อตึกย่อย, อาคาร, ชั้น, หรือหัวหน้าหอผู้ป่วย..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Status & Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter('PASSED')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'PASSED' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                ผ่านเกณฑ์ (&ge;85%)
              </button>
              <button
                onClick={() => setStatusFilter('WARNING')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'WARNING' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                เฝ้าระวัง (&lt;85%)
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="COMPLIANCE_DESC">เรียงตาม: คะแนนสูงสุด → ต่ำสุด</option>
              <option value="COMPLIANCE_ASC">เรียงตาม: คะแนนต่ำสุด → สูงสุด</option>
              <option value="NAME">เรียงตาม: ชื่อตึก/หอผู้ป่วย (ก-ฮ)</option>
            </select>
          </div>
        </div>

        {/* Wards Cards Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredStats.map((item) => {
            const isPassed = item.compliancePercent >= 85;
            const isWarning = item.compliancePercent >= 70 && item.compliancePercent < 85;

            return (
              <div
                key={item.def.id}
                className="rounded-2xl border border-slate-200/90 bg-white hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header with Building Color Bar */}
                <div>
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: item.def.colorHex }}
                  />
                  <div className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: item.def.colorHex }}
                        />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-700 border-slate-200">
                          {item.def.categoryLabelTh}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isPassed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isPassed ? 'ผ่านเกณฑ์' : isWarning ? 'เฝ้าระวัง' : 'ต่ำกว่าเกณฑ์'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2 font-['Prompt',sans-serif] group-hover:text-teal-900 transition-colors">
                      {item.def.nameTh}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.def.location}</span>
                    </div>
                  </div>
                </div>

                {/* Score & Indicator Progress Bar */}
                <div className="px-4 py-2 bg-slate-50/60 border-t border-b border-slate-100">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">
                      ผ่าน {item.passedIndicators} / {item.totalIndicators} ตัวชี้วัด
                    </span>
                    <span
                      className={`font-extrabold text-base font-['Prompt',sans-serif] ${
                        isPassed ? 'text-emerald-700' : isWarning ? 'text-amber-700' : 'text-rose-700'
                      }`}
                    >
                      {item.compliancePercent}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(item.compliancePercent, 100)}%`,
                        backgroundColor: item.def.colorHex,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>เกณฑ์เป้าหมาย HA &ge; 85%</span>
                    <div className="flex items-center gap-1.5">
                      {item.criticalCount > 0 && (
                        <span className="text-rose-600 font-bold flex items-center gap-0.5">
                          <ShieldAlert className="w-3 h-3" />
                          {item.criticalCount} วิกฤต
                        </span>
                      )}
                      {item.incidentCount > 0 && (
                        <span className="text-amber-700 font-medium">
                          {item.incidentCount} อุบัติการณ์
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Responsible Person & Navigation Button */}
                <div className="p-3.5 pt-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate max-w-[170px]">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">
                      {item.responsible.headNurseName || item.responsible.headNursePosition || 'หัวหน้าหอผู้ป่วย'}
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigateToSubWard(item.def.parentDeptId, item.def.id)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 hover:translate-x-0.5 transition-all cursor-pointer shrink-0"
                  >
                    <span>ดูตึกนี้</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state if search filters match nothing */}
        {filteredStats.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">ไม่พบข้อมูลตึกย่อยที่ค้นหา</p>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองกลุ่มงานทั้งหมด</p>
          </div>
        )}
      </div>
    </div>
  );
};
