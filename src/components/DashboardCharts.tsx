import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { BarChart3, TrendingUp, Layers, Building2, PieChart as PieChartIcon, Bed, ArrowRight } from 'lucide-react';
import { DepartmentConfig, DepartmentId, IncidentReport, QARecord, WardResponsible } from '../types/nursing';
import { FiscalYearOption, FiscalQuarterInfo, getMonthsOfFiscalYear, filterByFiscalPeriod } from '../utils/fiscalYear';
import { evaluateIndicatorSeverity } from '../utils/calculations';
import { computeSubWardStats } from '../utils/subWards';

interface DashboardChartsProps {
  departments: DepartmentConfig[];
  records: QARecord[];
  incidents: IncidentReport[];
  selectedFiscalYear: FiscalYearOption;
  selectedQuarter: number | 'ALL';
  quartersPerformance: {
    quarter: number;
    info: FiscalQuarterInfo;
    recordsCount: number;
    compliance: number;
    incidentsCount: number;
    criticalCount: number;
    hasData: boolean;
  }[];
  dimensionStats: {
    id: string;
    number: string;
    shortTitle: string;
    badgeColor: string;
    barColor: string;
    totalIndicators: number;
    passedIndicators: number;
    compliancePercent: number;
    criticalCount: number;
    warningCount: number;
  }[];
  departmentStats: {
    department: DepartmentConfig;
    latestRecord?: QARecord;
    criticalCount: number;
    warningCount: number;
    compliancePercent: number;
  }[];
  riskDistribution: {
    nearMiss: { count: number; percent: number };
    noHarm: { count: number; percent: number };
    moderate: { count: number; percent: number };
    severe: { count: number; percent: number };
    totalCount: number;
  };
  wardResponsibles?: Record<string, WardResponsible>;
  onNavigateToSubWard?: (deptId: DepartmentId, subWardId: string) => void;
}

export const DEPARTMENT_COLORS: Record<string, { hex: string; label: string }> = {
  NSO: { hex: '#10b981', label: 'สำนักการพยาบาล (NSO)' },
  ICU: { hex: '#f43f5e', label: 'ผู้ป่วยหนัก (ICU)' },
  IPD: { hex: '#0284c7', label: 'ผู้ป่วยใน (IPD)' },
  ER: { hex: '#f59e0b', label: 'อุบัติเหตุฉุกเฉิน (ER)' },
  OPD: { hex: '#06b6d4', label: 'ผู้ป่วยนอก (OPD)' },
  ANC: { hex: '#ec4899', label: 'ฝากครรภ์ (ANC)' },
  OR: { hex: '#2563eb', label: 'ห้องผ่าตัด (OR)' },
  LR: { hex: '#8b5cf6', label: 'ห้องคลอด (LR)' },
  IC: { hex: '#14b8a6', label: 'ควบคุมการติดเชื้อ (IC)' },
  ANESTHESIA: { hex: '#a855f7', label: 'งานวิสัญญี (ANESTHESIA)' },
  SPECIAL_TREATMENT: { hex: '#6366f1', label: 'ตรวจรักษาพิเศษ (SPECIAL)' },
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  departments,
  records,
  incidents,
  selectedFiscalYear,
  selectedQuarter,
  quartersPerformance,
  dimensionStats,
  departmentStats,
  riskDistribution,
  wardResponsibles = {},
  onNavigateToSubWard,
}) => {
  const [activeTab, setActiveTab] = useState<'TREND' | 'DIMENSION' | 'DEPT' | 'SUB_WARD' | 'RISK'>('TREND');
  const [deptColorMode, setDeptColorMode] = useState<'BUILDING' | 'STATUS'>('BUILDING');
  const [subWardCategoryFilter, setSubWardCategoryFilter] = useState<'ALL' | 'IPD' | 'ICU' | 'SPECIAL'>('ALL');

  // 1. Data for Quarterly / Monthly Trend Chart
  const trendChartData = useMemo(() => {
    if (selectedFiscalYear === 'ALL') {
      return quartersPerformance.map((q) => ({
        label: `Q${q.quarter} (${q.info.rangeTh})`,
        compliance: q.compliance,
        target: 85,
        incidents: q.incidentsCount,
        criticalIncidents: q.criticalCount,
      }));
    }

    const months = getMonthsOfFiscalYear(selectedFiscalYear);
    const filteredMonths = selectedQuarter === 'ALL'
      ? months
      : months.filter((m) => m.quarter === selectedQuarter);

    return filteredMonths.map((m) => {
      const mRecords = filterByFiscalPeriod(records, {
        fiscalYear: selectedFiscalYear,
        quarter: selectedQuarter,
        month: m.value,
      });
      const mIncidents = filterByFiscalPeriod(incidents, {
        fiscalYear: selectedFiscalYear,
        quarter: selectedQuarter,
        month: m.value,
      });

      let totalPassed = 0;
      let totalIndicators = 0;

      departments.forEach((dept) => {
        const dRecs = mRecords.filter((r) => r.departmentId === dept.id);
        const latest = dRecs.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        dept.indicators.forEach((ind) => {
          totalIndicators++;
          const val = latest?.values[ind.id];
          if (val !== undefined) {
            if (evaluateIndicatorSeverity(ind, val) === 'NORMAL') totalPassed++;
          } else {
            totalPassed++; // baseline
          }
        });
      });

      const compliance = totalIndicators > 0 ? Math.round((totalPassed / totalIndicators) * 100) : 92;

      return {
        label: m.shortLabelTh,
        monthKey: m.value,
        quarterLabel: `Q${m.quarter}`,
        compliance,
        target: 85,
        incidents: mIncidents.length,
        criticalIncidents: mIncidents.filter((i) => ['G', 'H', 'I'].includes(i.riskLevel)).length,
      };
    });
  }, [quartersPerformance, selectedFiscalYear, selectedQuarter, records, incidents, departments]);

  // 2. Data for 6 Dimensions (Radar & Bar)
  const dimensionChartData = useMemo(() => {
    return dimensionStats.map((dim) => ({
      name: `มิติที่ ${dim.number}`,
      fullTitle: dim.shortTitle,
      compliance: dim.compliancePercent,
      target: 85,
      passed: dim.passedIndicators,
      total: dim.totalIndicators,
      critical: dim.criticalCount,
    }));
  }, [dimensionStats]);

  // 3. Data for Department Comparison with distinctive building colors
  const departmentChartData = useMemo(() => {
    const defaultColors = ['#10b981', '#f43f5e', '#0284c7', '#f59e0b', '#06b6d4', '#ec4899', '#2563eb', '#8b5cf6', '#14b8a6', '#a855f7', '#6366f1'];
    return departmentStats.map((ds, idx) => {
      const deptId = ds.department.id;
      const deptColorCfg = DEPARTMENT_COLORS[deptId];
      const colorHex = deptColorCfg ? deptColorCfg.hex : defaultColors[idx % defaultColors.length];

      return {
        deptId,
        shortName: ds.department.shortName || deptId,
        fullName: ds.department.nameTh,
        compliance: ds.compliancePercent,
        target: 85,
        critical: ds.criticalCount,
        warning: ds.warningCount,
        colorHex,
      };
    });
  }, [departmentStats]);

  // 4. Data for Incident Risk Pie / Donut
  const pieRiskData = useMemo(() => {
    return [
      { name: 'ระดับ A-B (Near Miss)', value: riskDistribution.nearMiss.count, color: '#10b981' },
      { name: 'ระดับ C-D (No Harm)', value: riskDistribution.noHarm.count, color: '#0ea5e9' },
      { name: 'ระดับ E-F (Moderate)', value: riskDistribution.moderate.count, color: '#f59e0b' },
      { name: 'ระดับ G-H-I (Severe)', value: riskDistribution.severe.count, color: '#f43f5e' },
    ];
  }, [riskDistribution]);

  // 5. Data for Sub-Wards (21 ตึกย่อย)
  const subWardStats = useMemo(() => {
    return computeSubWardStats(records, incidents, departments, wardResponsibles);
  }, [records, incidents, departments, wardResponsibles]);

  const filteredSubWardChartData = useMemo(() => {
    return subWardStats
      .filter((s) => subWardCategoryFilter === 'ALL' || s.def.category === subWardCategoryFilter)
      .map((s) => ({
        id: s.def.id,
        shortName: s.def.shortName,
        fullName: s.def.nameTh,
        parentDeptId: s.def.parentDeptId,
        compliance: s.compliancePercent,
        target: 85,
        colorHex: s.def.colorHex,
        category: s.def.categoryLabelTh,
        location: s.def.location,
        passed: s.passedIndicators,
        total: s.totalIndicators,
        critical: s.criticalCount,
        warning: s.warningCount,
      }));
  }, [subWardStats, subWardCategoryFilter]);

  // Custom Tooltip for Sub-Ward Bar Chart
  const CustomSubWardChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700 min-w-[190px]">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: data.colorHex }} />
            <p className="font-bold text-teal-300">{data.fullName}</p>
          </div>
          <p className="text-emerald-400 font-bold pt-0.5">คะแนนคุณภาพ: {data.compliance}%</p>
          <p className="text-slate-300">ผ่าน {data.passed} จาก {data.total} ตัวชี้วัด</p>
          <p className="text-slate-400 text-[10px]">{data.category} • {data.location}</p>
          {data.critical > 0 && <p className="text-rose-400 font-bold">จุดวิกฤต: {data.critical} จุด</p>}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip Component for Trend Chart
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
          <p className="font-bold border-b border-slate-700 pb-1 text-teal-300">{label}</p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-300">ดัชนีคุณภาพ (Compliance):</span>
            <span className="font-bold text-emerald-400">{data.compliance}%</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-300">เกณฑ์เป้าหมาย HA:</span>
            <span className="font-semibold text-slate-400">{data.target}%</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-300">อุบัติการณ์ทั้งหมด:</span>
            <span className="font-bold text-amber-300">{data.incidents} รายการ</span>
          </p>
          {data.criticalIncidents > 0 && (
            <p className="flex justify-between gap-4 text-rose-400 font-bold">
              <span>ความเสี่ยงวิกฤต (G-I):</span>
              <span>{data.criticalIncidents} เคส</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Dimensions Bar Chart
  const CustomDimensionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-bold text-teal-300">{data.name}: {data.fullTitle}</p>
          <p className="text-emerald-400 font-bold">ผลการประเมิน: {data.compliance}%</p>
          <p className="text-slate-300">ผ่าน {data.passed} จาก {data.total} ตัวชี้วัด</p>
          {data.critical > 0 && (
            <p className="text-rose-400 font-bold">พบจุดวิกฤต: {data.critical} ตัวชี้วัด</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Department Bar Chart with Distinct Building Color Indicator
  const CustomDeptTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.colorHex }} />
            <p className="font-bold text-teal-300">{data.fullName} ({data.shortName})</p>
          </div>
          <p className="text-emerald-400 font-bold pt-0.5">คะแนนคุณภาพรวม: {data.compliance}%</p>
          <p className="text-slate-400">เกณฑ์เป้าหมาย HA: &ge; {data.target}%</p>
          {data.critical > 0 && <p className="text-rose-400 font-bold">พบจุดวิกฤต: {data.critical} จุด</p>}
          {data.warning > 0 && <p className="text-amber-300 font-semibold">พบจุดเฝ้าระวัง: {data.warning} จุด</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt',sans-serif]">
              กราฟและวิเคราะห์ภาพรวมเชิงลึก (Interactive Quality Analytics)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            แสดงผลเปรียบเทียบเชิงสถิติ แนวโน้มรายงบประมาณ มิติคุณภาพมาตรฐาน และสัดส่วนอุบัติการณ์ทางคลินิก
          </p>
        </div>

        {/* Controls / Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('TREND')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'TREND'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>แนวโน้ม (Trend)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DIMENSION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'DIMENSION'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>6 มิติ HA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DEPT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'DEPT'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-sky-600" />
            <span>เปรียบเทียบกลุ่มงาน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SUB_WARD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'SUB_WARD'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bed className="w-3.5 h-3.5 text-emerald-600" />
            <span>ตึกย่อย (21 หอผู้ป่วย)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RISK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'RISK'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5 text-rose-600" />
            <span>สัดส่วนความเสี่ยง</span>
          </button>
        </div>
      </div>

      {/* CHART CONTENT AREA */}
      <div className="mt-5">
        {/* TAB 1: TREND CHART */}
        {activeTab === 'TREND' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-slate-700">
                กราฟแสดงอัตราการบรรลุเป้าหมายคุณภาพ (%) รายงบประมาณ
              </span>
              <span className="text-slate-500">
                เส้นสีเขียวประ: เกณฑ์เป้าหมาย HA (85%)
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip content={<CustomTrendTooltip />} />
                  <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'เป้าหมาย 85%', fill: '#059669', fontSize: 11, position: 'insideTopRight' }} />
                  <Area
                    type="monotone"
                    dataKey="compliance"
                    stroke="#0d9488"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#complianceGradient)"
                    dot={{ r: 5, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7, fill: '#0f766e', strokeWidth: 3, stroke: '#ffffff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: 6 QUALITY DIMENSIONS */}
        {activeTab === 'DIMENSION' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Bar Chart for Dimensions */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                คะแนนความสำเร็จแต่ละมิติ (HA 6 Dimensions)
              </h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dimensionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip content={<CustomDimensionTooltip />} />
                    <ReferenceLine y={85} stroke="#10b981" strokeDasharray="4 4" />
                    <Bar dataKey="compliance" radius={[6, 6, 0, 0]}>
                      {dimensionChartData.map((entry, index) => {
                        const colors = ['#10b981', '#14b8a6', '#6366f1', '#0284c7', '#f59e0b', '#e11d48'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart for Dimensions */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                เรดาร์โปรไฟล์สมรรถนะ 6 มิติการพยาบาล
              </h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dimensionChartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Radar
                      name="ความสำเร็จ (%)"
                      dataKey="compliance"
                      stroke="#0d9488"
                      fill="#14b8a6"
                      fillOpacity={0.4}
                    />
                    <Tooltip content={<CustomDimensionTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEPARTMENT BENCHMARK */}
        {activeTab === 'DEPT' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 text-xs gap-2">
              <span className="font-semibold text-slate-700">
                เปรียบเทียบอัตราผ่านเกณฑ์คุณภาพ (%) แยกตามกลุ่มงานและหอผู้ป่วย
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px] hidden sm:inline">รูปแบบสี:</span>
                <button
                  type="button"
                  onClick={() => setDeptColorMode('BUILDING')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    deptColorMode === 'BUILDING'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🎨 คนละตึกคนละสี (Building Colors)
                </button>
                <button
                  type="button"
                  onClick={() => setDeptColorMode('STATUS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    deptColorMode === 'STATUS'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🚦 สีตามเกณฑ์ HA
                </button>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip content={<CustomDeptTooltip />} />
                  <ReferenceLine y={85} stroke="#059669" strokeDasharray="4 4" label={{ value: 'เป้าหมาย 85%', fill: '#059669', fontSize: 10, position: 'insideTopRight' }} />
                  <Bar dataKey="compliance" radius={[6, 6, 0, 0]}>
                    {departmentChartData.map((entry, index) => {
                      const color =
                        deptColorMode === 'BUILDING'
                          ? entry.colorHex
                          : entry.compliance >= 85
                          ? '#10b981'
                          : entry.compliance >= 70
                          ? '#f59e0b'
                          : '#f43f5e';
                      return <Cell key={`cell-dept-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Building Color Legend Pills */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
              {departmentChartData.map((d) => (
                <span
                  key={d.deptId}
                  className="px-2 py-0.5 rounded-md border font-medium flex items-center gap-1.5 bg-slate-50/80 border-slate-200"
                  title={d.fullName}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: d.colorHex }}
                  />
                  <span className="font-bold text-slate-800">{d.shortName}</span>
                  <span className="text-slate-500 font-semibold">{d.compliance}%</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3.5: SUB-WARD BENCHMARK (แดชบอร์ดแยกตึกย่อย 21 หอผู้ป่วย) */}
        {activeTab === 'SUB_WARD' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 text-xs gap-2">
              <div>
                <span className="font-semibold text-slate-700">
                  กราฟเปรียบเทียบผลงานคุณภาพแยกรายตึกย่อยและหอผู้ป่วย ({filteredSubWardChartData.length} ตึก)
                </span>
                <p className="text-[11px] text-slate-400">
                  แสดงผลคะแนนผ่านเกณฑ์ (%) คนละตึกคนละสีอย่างชัดเจน
                </p>
              </div>

              {/* Sub-Ward category switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSubWardCategoryFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    subWardCategoryFilter === 'ALL'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด (21)
                </button>
                <button
                  type="button"
                  onClick={() => setSubWardCategoryFilter('IPD')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    subWardCategoryFilter === 'IPD'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  IPD (15)
                </button>
                <button
                  type="button"
                  onClick={() => setSubWardCategoryFilter('ICU')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    subWardCategoryFilter === 'ICU'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ICU (4)
                </button>
                <button
                  type="button"
                  onClick={() => setSubWardCategoryFilter('SPECIAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    subWardCategoryFilter === 'SPECIAL'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  พิเศษ (2)
                </button>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredSubWardChartData} margin={{ top: 10, right: 10, left: -20, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip content={<CustomSubWardChartTooltip />} />
                  <ReferenceLine
                    y={85}
                    stroke="#059669"
                    strokeDasharray="4 4"
                    label={{ value: 'เป้าหมาย 85%', fill: '#059669', fontSize: 10, position: 'insideTopRight' }}
                  />
                  <Bar dataKey="compliance" radius={[5, 5, 0, 0]}>
                    {filteredSubWardChartData.map((entry) => (
                      <Cell key={`cell-sub-${entry.id}`} fill={entry.colorHex} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sub-Ward Color Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
              {filteredSubWardChartData.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onNavigateToSubWard?.(d.parentDeptId, d.id)}
                  className="px-2 py-0.5 rounded-md border font-medium flex items-center gap-1.5 bg-slate-50/80 border-slate-200 hover:border-teal-400 cursor-pointer transition-colors"
                  title={`${d.fullName} (${d.category}) - คลิกเพื่อดูรายละเอียดตึกนี้`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: d.colorHex }}
                  />
                  <span className="font-bold text-slate-800">{d.shortName}</span>
                  <span className="text-slate-500 font-semibold">{d.compliance}%</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RISK DISTRIBUTION */}
        {activeTab === 'RISK' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Pie / Donut Chart */}
            <div className="h-72 w-full flex flex-col items-center justify-center">
              <h4 className="text-xs font-bold text-slate-700 mb-1 text-center">
                สัดส่วนระดับความเสี่ยงอุบัติการณ์ทางคลินิก (NRLS Risk Donut)
              </h4>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={pieRiskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieRiskData.map((entry, index) => (
                      <Cell key={`cell-risk-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} เคส`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#ffffff', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Breakdown Summary Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700">สรุปการเฝ้าระวังความเสี่ยงอุบัติการณ์</h4>
              {pieRiskData.map((risk) => (
                <div key={risk.name} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: risk.color }} />
                    <span className="text-xs font-bold text-slate-800">{risk.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 font-['Prompt',sans-serif]">
                      {risk.value} เคส
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({riskDistribution.totalCount > 0 ? Math.round((risk.value / riskDistribution.totalCount) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
