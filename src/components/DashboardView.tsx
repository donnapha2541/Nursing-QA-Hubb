import React, { useState, useMemo } from 'react';
import {
  DepartmentConfig,
  DepartmentId,
  QARecord,
  IncidentReport,
  RealtimeAlert,
  UserProfile,
} from '../types/nursing';
import {
  evaluateIndicatorSeverity,
  formatThaiDate,
  RISK_LEVELS,
  exportToCSV,
} from '../utils/calculations';
import {
  FiscalYearOption,
  AVAILABLE_FISCAL_YEARS,
  FISCAL_QUARTERS,
  getMonthsOfFiscalYear,
  filterByFiscalPeriod,
  formatFiscalYearLabel,
  getFiscalYear,
  getFiscalQuarter,
} from '../utils/fiscalYear';

import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Download,
  PlusCircle,
  FileText,
  Activity,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  Target,
  ShieldCheck,
  CheckSquare,
  Pencil,
  Bed,
  Building,
  Building2,
} from 'lucide-react';
import { NSODimensionView } from './NSODimensionView';
import { ICUDimensionView } from './ICUDimensionView';
import { IPDDimensionView } from './IPDDimensionView';
import { ERDimensionView } from './ERDimensionView';
import { ANCDimensionView } from './ANCDimensionView';
import { OPDDimensionView } from './OPDDimensionView';
import { AnesthesiaDimensionView } from './AnesthesiaDimensionView';
import { OrDimensionView } from './OrDimensionView';
import { LrDimensionView } from './LrDimensionView';
import { IcDimensionView } from './IcDimensionView';
import { SpecialTreatmentDimensionView } from './SpecialTreatmentDimensionView';
import { DashboardCharts } from './DashboardCharts';
import { SubWardDashboard } from './SubWardDashboard';

import { WardResponsible } from '../types/nursing';

interface DashboardViewProps {
  departments: DepartmentConfig[];
  selectedDepartment: DepartmentId | 'ALL';
  onSelectDepartment: (id: DepartmentId | 'ALL') => void;
  records: QARecord[];
  incidents: IncidentReport[];
  alerts: RealtimeAlert[];
  currentUser: UserProfile;
  wardResponsibles?: Record<string, WardResponsible>;
  fiscalYear?: FiscalYearOption;
  onSelectFiscalYear?: (fy: FiscalYearOption) => void;
  fiscalQuarter?: number | 'ALL';
  onSelectFiscalQuarter?: (q: number | 'ALL') => void;
  onOpenNewRecord: (deptId?: DepartmentId) => void;
  onOpenNewIncident: (deptId?: DepartmentId) => void;
  onViewIncidentDetail: (incident: IncidentReport) => void;
  onUpdateResponsiblePerson?: (indicatorId: string, name: string) => void;
  onUpdateWardResponsible?: (wardId: string, data: WardResponsible) => void;
  onOpenWardDirectory?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  departments,
  selectedDepartment,
  onSelectDepartment,
  records,
  incidents,
  alerts,
  currentUser,
  wardResponsibles = {},
  fiscalYear,
  onSelectFiscalYear,
  fiscalQuarter,
  onSelectFiscalQuarter,
  onOpenNewRecord,
  onOpenNewIncident,
  onViewIncidentDetail,
  onUpdateResponsiblePerson,
  onUpdateWardResponsible,
  onOpenWardDirectory,
}) => {
  const [internalFiscalYear, setInternalFiscalYear] = useState<FiscalYearOption>(2569);
  const [internalQuarter, setInternalQuarter] = useState<number | 'ALL'>('ALL');
  const selectedFiscalYear = fiscalYear !== undefined ? fiscalYear : internalFiscalYear;
  const setSelectedFiscalYear = onSelectFiscalYear || setInternalFiscalYear;
  const selectedQuarter = fiscalQuarter !== undefined ? fiscalQuarter : internalQuarter;
  const setSelectedFiscalQuarter = onSelectFiscalQuarter || setInternalQuarter;

  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [editingIndId, setEditingIndId] = useState<string | null>(null);

  // Sub-ward dashboard mode and target sub-ward for drilldown
  const [overviewSubMode, setOverviewSubMode] = useState<'DEPARTMENTS' | 'SUB_WARDS'>('DEPARTMENTS');
  const [targetSubWard, setTargetSubWard] = useState<string>('ALL');

  const handleNavigateToSubWard = (deptId: DepartmentId, subWardId: string) => {
    setTargetSubWard(subWardId);
    onSelectDepartment(deptId);
  };

  // Available months for the chosen Fiscal Year
  const availableMonths = useMemo(() => {
    if (selectedFiscalYear === 'ALL') return [];
    const allMonths = getMonthsOfFiscalYear(selectedFiscalYear);
    if (selectedQuarter !== 'ALL') {
      return allMonths.filter((m) => m.quarter === selectedQuarter);
    }
    return allMonths;
  }, [selectedFiscalYear, selectedQuarter]);

  // Filtered records by Fiscal Year, Quarter, and Month
  const currentMonthRecords = useMemo(() => {
    return filterByFiscalPeriod(records, {
      fiscalYear: selectedFiscalYear,
      quarter: selectedQuarter,
      month: selectedMonth,
    });
  }, [records, selectedFiscalYear, selectedQuarter, selectedMonth]);

  // Filtered incidents by Fiscal Year, Quarter, and Month
  const periodIncidents = useMemo(() => {
    return filterByFiscalPeriod(incidents, {
      fiscalYear: selectedFiscalYear,
      quarter: selectedQuarter,
      month: selectedMonth,
    });
  }, [incidents, selectedFiscalYear, selectedQuarter, selectedMonth]);

  // Executive 4-Quarter Performance Matrix for the current fiscal year
  const quartersPerformance = useMemo(() => {
    const targetFY = selectedFiscalYear === 'ALL' ? 2569 : selectedFiscalYear;
    return [1, 2, 3, 4].map((q) => {
      const qRecords = filterByFiscalPeriod(records, { fiscalYear: targetFY, quarter: q });
      const qIncidents = filterByFiscalPeriod(incidents, { fiscalYear: targetFY, quarter: q });
      const qCriticalIncidents = qIncidents.filter((i) => ['G', 'H', 'I'].includes(i.riskLevel));

      let totalPassed = 0;
      let totalIndicators = 0;
      departments.forEach((dept) => {
        const dRecs = qRecords.filter((r) => r.departmentId === dept.id);
        const latest = dRecs.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        if (latest) {
          dept.indicators.forEach((ind) => {
            totalIndicators++;
            const val = latest.values[ind.id];
            if (val !== undefined && evaluateIndicatorSeverity(ind, val) === 'NORMAL') {
              totalPassed++;
            }
          });
        }
      });

      const compliance = totalIndicators > 0 ? Math.round((totalPassed / totalIndicators) * 100) : 0;
      return {
        quarter: q,
        info: FISCAL_QUARTERS[q],
        recordsCount: qRecords.length,
        compliance,
        incidentsCount: qIncidents.length,
        criticalCount: qCriticalIncidents.length,
        hasData: qRecords.length > 0 || qIncidents.length > 0,
      };
    });
  }, [records, incidents, selectedFiscalYear, departments]);

  const displayedDepartments =
    selectedDepartment === 'ALL'
      ? departments
      : departments.filter((d) => d.id === selectedDepartment);

  // Compute departmental latest values within selected fiscal period
  const departmentStats = departments.map((dept) => {
    const deptRecords = currentMonthRecords.filter((r) => r.departmentId === dept.id);
    const latestRecord = deptRecords.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    const deptAlerts = alerts.filter((a) => a.departmentId === dept.id);
    const criticalCount = deptAlerts.filter((a) => a.severity === 'CRITICAL').length;
    const warningCount = deptAlerts.filter((a) => a.severity === 'WARNING').length;

    // Calculate indicator passing rate
    let passedIndicators = 0;
    const totalIndicators = dept.indicators.length;

    dept.indicators.forEach((ind) => {
      const val = latestRecord?.values[ind.id];
      if (val !== undefined) {
        const severity = evaluateIndicatorSeverity(ind, val);
        if (severity === 'NORMAL') passedIndicators++;
      } else {
        passedIndicators++; // Assume normal if not recorded yet
      }
    });

    const compliancePercent =
      totalIndicators > 0 ? Math.round((passedIndicators / totalIndicators) * 100) : 100;

    return {
      department: dept,
      latestRecord,
      criticalCount,
      warningCount,
      totalAlerts: deptAlerts.length,
      compliancePercent,
      hasRecord: !!latestRecord,
    };
  });

  // Hospital-wide aggregates
  const totalCriticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const totalWarningAlerts = alerts.filter((a) => a.severity === 'WARNING').length;
  const averageCompliance = Math.round(
    departmentStats.reduce((acc, curr) => acc + curr.compliancePercent, 0) /
      (departmentStats.length || 1)
  );
  const severeIncidents = periodIncidents.filter((i) => ['G', 'H', 'I'].includes(i.riskLevel));

  // Dynamic metrics: hospital-wide if 'ALL', department-focused if selected
  const activeDeptStat =
    selectedDepartment !== 'ALL'
      ? departmentStats.find((d) => d.department.id === selectedDepartment)
      : null;

  const currentCriticalAlerts =
    selectedDepartment === 'ALL'
      ? totalCriticalAlerts
      : alerts.filter((a) => a.departmentId === selectedDepartment && a.severity === 'CRITICAL').length;

  const currentWarningAlerts =
    selectedDepartment === 'ALL'
      ? totalWarningAlerts
      : alerts.filter((a) => a.departmentId === selectedDepartment && a.severity === 'WARNING').length;

  const currentCompliance =
    selectedDepartment === 'ALL'
      ? averageCompliance
      : activeDeptStat?.compliancePercent ?? 100;

  const currentSevereIncidents =
    selectedDepartment === 'ALL'
      ? severeIncidents
      : periodIncidents.filter(
          (i) => i.departmentId === selectedDepartment && ['G', 'H', 'I'].includes(i.riskLevel)
        );

  const displayedIncidents =
    selectedDepartment === 'ALL'
      ? periodIncidents
      : periodIncidents.filter((i) => i.departmentId === selectedDepartment);

  const activeDeptConfig =
    selectedDepartment !== 'ALL'
      ? departments.find((d) => d.id === selectedDepartment)
      : null;

  // 6 Quality Dimensions aggregated data for Executive Overview
  const dimensionDefinitions = [
    {
      id: 'DIM_1',
      number: '1',
      title: 'มิติที่ 1: การบริหารจัดการและความปลอดภัยของผู้ป่วย',
      shortTitle: 'การบริหารและความปลอดภัย',
      desc: 'ระบบบริหารคุณภาพ, Patient Safety Goals, การคัดกรองความเสี่ยง และกระบวนการ RCA',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      barColor: 'bg-teal-600',
    },
    {
      id: 'DIM_2',
      number: '2',
      title: 'มิติที่ 2: มาตรฐานการพยาบาลทางคลินิก',
      shortTitle: 'มาตรฐานการพยาบาลคลินิก',
      desc: 'การดูแลผู้ป่วยวิกฤต, Early Warning Signs, CPR และมาตรฐานหัตถการทางการพยาบาล',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      barColor: 'bg-blue-600',
    },
    {
      id: 'DIM_3',
      number: '3',
      title: 'มิติที่ 3: การป้องกันและควบคุมการติดเชื้อ (IC)',
      shortTitle: 'การป้องกันการติดเชื้อ (IC)',
      desc: 'CAUTI, VAP, CLABSI, SSI, การล้างมือ และการสวมใส่อุปกรณ์คุ้มครองส่วนบุคคล PPE',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-600',
    },
    {
      id: 'DIM_4',
      number: '4',
      title: 'มิติที่ 4: ความปลอดภัยด้านยาและภาวะวิกฤต',
      shortTitle: 'ความปลอดภัยด้านยา',
      desc: 'High-Alert Drugs, Medication Error, การบริหารยาเสพติด และการเฝ้าระวังอาการไม่พึงประสงค์ (ADR)',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      barColor: 'bg-amber-600',
    },
    {
      id: 'DIM_5',
      number: '5',
      title: 'มิติที่ 5: การพัฒนาสมรรถนะและความพร้อมของทีม',
      shortTitle: 'สมรรถนะและความพร้อมบุคลากร',
      desc: 'CPR/ACLS certification, อัตรากำลังพยาบาลตามเกณฑ์ภาระงาน, ทักษะเฉพาะทางและความพร้อมเวร',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      barColor: 'bg-indigo-600',
    },
    {
      id: 'DIM_6',
      number: '6',
      title: 'มิติที่ 6: ผลลัพธ์ทางการพยาบาลและความพึงพอใจ',
      shortTitle: 'ผลลัพธ์และความพึงพอใจ',
      desc: 'ความพึงพอใจผู้ป่วยและญาติ, อัตราข้อร้องเรียน, การจำหน่ายผู้ป่วย และการประสานส่งต่อ',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      barColor: 'bg-purple-600',
    },
  ];

  const dimensionStats = useMemo(() => {
    return dimensionDefinitions.map((dim) => {
      let total = 0;
      let passed = 0;
      let critical = 0;
      let warning = 0;

      departments.forEach((dept) => {
        const deptRecords = currentMonthRecords.filter((r) => r.departmentId === dept.id);
        const latestRecord = deptRecords.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        dept.indicators.forEach((ind) => {
          let indDim = ind.dimensionId;
          if (!indDim) {
            switch (ind.category) {
              case 'SAFETY': indDim = 'DIM_1'; break;
              case 'CLINICAL': indDim = 'DIM_2'; break;
              case 'INFECTION': indDim = 'DIM_3'; break;
              case 'DOCUMENTATION': indDim = 'DIM_5'; break;
              case 'SATISFACTION': indDim = 'DIM_6'; break;
              default: indDim = 'DIM_1';
            }
          }

          if (indDim === dim.id) {
            total++;
            const val = latestRecord?.values[ind.id];
            if (val !== undefined) {
              const sev = evaluateIndicatorSeverity(ind, val);
              if (sev === 'NORMAL') passed++;
              else if (sev === 'CRITICAL') critical++;
              else if (sev === 'WARNING') warning++;
            } else {
              passed++; // Assume normal baseline
            }
          }
        });
      });

      const compliance = total > 0 ? Math.round((passed / total) * 100) : 100;
      return {
        ...dim,
        totalIndicators: total,
        passedIndicators: passed,
        compliancePercent: compliance,
        criticalCount: critical,
        warningCount: warning,
      };
    });
  }, [departments, currentMonthRecords]);

  const riskDistribution = useMemo(() => {
    const nearMiss = periodIncidents.filter((i) => ['A', 'B'].includes(i.riskLevel)).length;
    const noHarm = periodIncidents.filter((i) => ['C', 'D'].includes(i.riskLevel)).length;
    const moderate = periodIncidents.filter((i) => ['E', 'F'].includes(i.riskLevel)).length;
    const severe = periodIncidents.filter((i) => ['G', 'H', 'I'].includes(i.riskLevel)).length;
    const total = periodIncidents.length || 1;

    return {
      nearMiss: { count: nearMiss, percent: Math.round((nearMiss / total) * 100) },
      noHarm: { count: noHarm, percent: Math.round((noHarm / total) * 100) },
      moderate: { count: moderate, percent: Math.round((moderate / total) * 100) },
      severe: { count: severe, percent: Math.round((severe / total) * 100) },
      totalCount: periodIncidents.length,
    };
  }, [periodIncidents]);

  const handleExportCSV = () => {
    const headers = [
      'ปีงบประมาณ (Fiscal Year)',
      'ไตรมาส (Quarter)',
      'กลุ่มงาน (Department)',
      'วันที่บันทึก (Date)',
      'เวร (Shift)',
      'จำนวนเคส/วันนอน (Denominator)',
      'ตัวชี้วัด (Indicator)',
      'ค่าที่ได้ (Value)',
      'เกณฑ์มาตรฐาน (Benchmark)',
      'สถานะความเสี่ยง (Status)',
      'ผู้บันทึก (Recorded By)',
    ];

    const rows: (string | number)[][] = [];

    currentMonthRecords.forEach((rec) => {
      const dept = departments.find((d) => d.id === rec.departmentId);
      const fy = rec.fiscalYear || getFiscalYear(rec.date);
      const q = rec.fiscalQuarter || getFiscalQuarter(rec.date);
      dept?.indicators.forEach((ind) => {
        const val = rec.values[ind.id] ?? '-';
        const severity =
          typeof val === 'number' ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';
        rows.push([
          `ปีงบ ${fy}`,
          `ไตรมาส ${q}`,
          dept.shortName,
          rec.date,
          rec.shift,
          rec.patientCount,
          ind.name,
          `${val} ${ind.unit}`,
          `${ind.benchmarkType === 'MIN' ? '>=' : '<='} ${ind.targetBenchmark} ${ind.unit}`,
          severity,
          rec.recordedBy,
        ]);
      });
    });

    const fyLabel = selectedFiscalYear === 'ALL' ? 'AllYears' : `FY${selectedFiscalYear}`;
    const qLabel = selectedQuarter === 'ALL' ? 'AllQuarters' : `Q${selectedQuarter}`;
    const mLabel = selectedMonth === 'ALL' ? 'AllMonths' : selectedMonth;
    exportToCSV(`Nursing_QA_Report_${fyLabel}_${qLabel}_${mLabel}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls & Month Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Prompt',sans-serif] flex items-center gap-2">
              <span>
                {selectedDepartment === 'ALL'
                  ? 'แดชบอร์ดคุณภาพและบริหารความเสี่ยง (ภาพรวมทุกกลุ่มงาน)'
                  : `ข้อมูลคุณภาพเฉพาะกลุ่มงาน: ${activeDeptConfig?.nameTh}`}
              </span>
            </h2>

            {selectedDepartment !== 'ALL' && (
              <button
                onClick={() => onSelectDepartment('ALL')}
                className="text-xs text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                &larr; ดูภาพรวมทุกกลุ่มงาน
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedDepartment === 'ALL'
              ? `สรุปข้อมูลตัวชี้วัดและการเฝ้าระวังความเสี่ยง ${formatFiscalYearLabel(selectedFiscalYear)} ${selectedQuarter !== 'ALL' ? FISCAL_QUARTERS[selectedQuarter].nameTh : 'รอบ 12 เดือน'} เทียบเกณฑ์มาตรฐาน HA`
              : `แสดงข้อมูลตัวชี้วัดและการเฝ้าระวังความเสี่ยงเฉพาะของกลุ่มงาน ${activeDeptConfig?.shortName}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="ALL">
                {selectedQuarter !== 'ALL' ? `ทุกเดือนใน${FISCAL_QUARTERS[selectedQuarter].nameTh}` : 'ทุกเดือนในปีงบประมาณ (สรุปรวม)'}
              </option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.labelTh} ({m.quarterNameTh})
                </option>
              ))}
            </select>
          </div>

          {/* Export Report Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="ดาวน์โหลดรายงานเป็นไฟล์ Excel / CSV ตามปีงบประมาณและไตรมาสที่เลือก"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>ส่งออก CSV ({currentMonthRecords.length} บันทึก)</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards (Responsive for Mobile, iPad and Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Compliance Card */}
        <div className="bg-gradient-to-br from-teal-500/10 via-white to-white p-4 rounded-xl border border-teal-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-800">
              {selectedDepartment === 'ALL'
                ? 'ดัชนีคุณภาพการพยาบาลรวม'
                : `ดัชนีคุณภาพ ${activeDeptConfig?.shortName}`}
            </span>
            <div className="p-2 rounded-lg bg-teal-100/70 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-950 font-['Prompt',sans-serif]">
              {currentCompliance}%
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              เกณฑ์เป้าหมาย &ge; 85%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(currentCompliance, 100)}%` }}
            />
          </div>
        </div>

        {/* Critical Alerts Card */}
        <div
          className={`p-4 rounded-xl border shadow-xs relative overflow-hidden transition-all ${
            currentCriticalAlerts > 0
              ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">ความเสี่ยงวิกฤต (Critical Alerts)</span>
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-900 font-['Prompt',sans-serif]">
              {currentCriticalAlerts}
            </span>
            <span className="text-xs text-rose-600 font-medium">จุดที่ต้องแก้ไขด่วน</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-2 font-medium truncate">
            {selectedDepartment === 'ALL'
              ? (totalCriticalAlerts > 0 ? 'ICU (UE 1 ราย) และ LR (PPH 5.8%)' : 'ไม่มีความเสี่ยงวิกฤต')
              : (currentCriticalAlerts > 0 ? `พบ ${currentCriticalAlerts} จุดวิกฤตในกลุ่มงานนี้` : 'ไม่มีความเสี่ยงวิกฤตในกลุ่มงานนี้')}
          </p>
        </div>

        {/* Warning Alerts Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">จุดเฝ้าระวัง (Warning)</span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-['Prompt',sans-serif]">
              {currentWarningAlerts}
            </span>
            <span className="text-xs text-amber-600 font-medium">ตัวชี้วัดเฉียดเกณฑ์</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium truncate">
            {selectedDepartment === 'ALL'
              ? 'IPD (พลัดตกหกล้ม 2.3) และ OR (แผลติดเชื้อ 1.8%)'
              : (currentWarningAlerts > 0 ? `พบ ${currentWarningAlerts} ตัวชี้วัดเฝ้าระวัง` : 'ตัวชี้วัดทุกตัวอยู่ในเกณฑ์ปกติ')}
          </p>
        </div>

        {/* Sentinel Events (Level G-I) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">อุบัติการณ์รุนแรง (Level G-I)</span>
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Prompt',sans-serif]">
              {currentSevereIncidents.length}
            </span>
            <span className="text-xs text-slate-500">เหตุการณ์ในเดือนนี้</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium truncate">
            {currentSevereIncidents.length > 0
              ? 'เข้าสู่กระบวนการ RCA ภายใน 24 ชม.'
              : 'ผ่านเกณฑ์เป้าหมาย 0 เคส'}
          </p>
        </div>
      </div>

      {/* 4-Quarter Progress & Comparative Bar (ความก้าวหน้าตามไตรมาสปีงบประมาณ) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt',sans-serif]">
                ความก้าวหน้าและการติดตามคุณภาพ 4 ไตรมาส ({formatFiscalYearLabel(selectedFiscalYear)})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามผลการประเมินตัวชี้วัดรายไตรมาส (ต.ค. - ก.ย.) ตามรอบงบประมาณกระทรวงสาธารณสุข • คลิกที่ไตรมาสเพื่อกรองข้อมูล
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px]">เลือกดูรายไตรมาส:</span>
            <button
              onClick={() => setSelectedFiscalQuarter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedQuarter === 'ALL'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ทั้ง 4 ไตรมาส
            </button>
          </div>
        </div>

        {/* 4 Quarter Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3.5">
          {quartersPerformance.map((qp) => {
            const isSelected = selectedQuarter === qp.quarter;
            return (
              <div
                key={qp.quarter}
                onClick={() => setSelectedFiscalQuarter(qp.quarter === selectedQuarter ? 'ALL' : qp.quarter)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-teal-50/90 border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-teal-50/30 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 font-['Prompt',sans-serif]">
                    {qp.info.nameTh}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {qp.info.rangeTh}
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-black text-slate-900 font-['Prompt',sans-serif]">
                      {qp.hasData ? `${qp.compliance}%` : '-'}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">ผ่านเกณฑ์</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      !qp.hasData
                        ? 'bg-slate-100 text-slate-500'
                        : qp.compliance >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {!qp.hasData ? 'ยังไม่มีข้อมูล' : qp.compliance >= 85 ? 'ผ่านเกณฑ์' : 'เฝ้าระวัง'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      qp.compliance >= 85 ? 'bg-teal-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${qp.hasData ? Math.min(qp.compliance, 100) : 0}%` }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>บันทึก {qp.recordsCount} ชุด</span>
                  <span>ความเสี่ยง {qp.incidentsCount} เคส</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW MODE: Executive Analytics, Comparison Graphs, and 6-Dimension Summaries (ONLY SHOWN IN ALL OVERVIEW) */}
      {selectedDepartment === 'ALL' ? (
        <div className="space-y-6">
          {/* Executive Overview Switcher: 11 Main Departments vs 21 Sub-Wards */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-100 text-teal-800">
                <Building className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-['Prompt',sans-serif]">
                  เลือกมุมมองแดชบอร์ดการวิเคราะห์
                </h3>
                <p className="text-[11px] text-slate-500">
                  สลับดูภาพรวมระดับ 11 กลุ่มงานหลัก หรือเจาะลึกผลงานแยกรายตึกย่อยและหอผู้ป่วย
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto font-['Prompt',sans-serif]">
              <button
                type="button"
                onClick={() => setOverviewSubMode('DEPARTMENTS')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  overviewSubMode === 'DEPARTMENTS'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-teal-700" />
                <span>ภาพรวม 11 กลุ่มงานหลัก</span>
              </button>

              <button
                type="button"
                onClick={() => setOverviewSubMode('SUB_WARDS')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  overviewSubMode === 'SUB_WARDS'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bed className="w-4 h-4 text-teal-200" />
                <span>แดชบอร์ดแยกตึกย่อย (21 ตึก)</span>
                <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                  ใหม่
                </span>
              </button>
            </div>
          </div>

          {overviewSubMode === 'SUB_WARDS' ? (
            <SubWardDashboard
              records={currentMonthRecords}
              incidents={periodIncidents}
              departments={departments}
              wardResponsibles={wardResponsibles}
              currentUser={currentUser}
              onNavigateToSubWard={handleNavigateToSubWard}
              onOpenNewRecord={onOpenNewRecord}
            />
          ) : (
            <>
              {/* Section 1: Comparative Hospital-Wide Bar Chart across 11 Departments */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt',sans-serif] flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-teal-600" />
                      <span>แผนภูมิเปรียบเทียบคะแนนคุณภาพการพยาบาล 11 กลุ่มงาน</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      เปรียบเทียบความสอดคล้องคุณภาพการพยาบาล (Nursing QA Compliance %) กับเกณฑ์เป้าหมายมาตรฐาน HA (≥ 85%)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
                    <button
                      type="button"
                      onClick={() => setOverviewSubMode('SUB_WARDS')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Bed className="w-3.5 h-3.5 text-teal-600" />
                      <span>ดูตึกย่อย (21 ตึก) &rarr;</span>
                    </button>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                      <Target className="w-3.5 h-3.5 text-teal-600" />
                      เกณฑ์เป้าหมาย ≥ 85%
                    </span>
                  </div>
                </div>

            {/* Horizontal Bar Chart */}
            <div className="mt-5 space-y-3.5">
              {departmentStats.map((stat) => {
                const { department, compliancePercent, criticalCount, warningCount, hasRecord } = stat;
                const isPassed = compliancePercent >= 85;
                const isWarning = compliancePercent >= 70 && compliancePercent < 85;

                return (
                  <div
                    key={department.id}
                    onClick={() => onSelectDepartment(department.id)}
                    className="group cursor-pointer p-2 sm:p-2.5 rounded-xl hover:bg-teal-50/40 transition-all border border-transparent hover:border-teal-200"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-teal-600 group-hover:text-white text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors font-['Prompt',sans-serif]">
                          {department.shortName}
                        </span>
                        <span className="font-bold text-slate-800 group-hover:text-teal-900 truncate">
                          {department.nameTh}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                          ({department.indicators.length} ตัวชี้วัด)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {criticalCount > 0 ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-0.5 animate-pulse">
                            <ShieldAlert className="w-3 h-3" />
                            {criticalCount} วิกฤต
                          </span>
                        ) : warningCount > 0 ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            {warningCount} เฝ้าระวัง
                          </span>
                        ) : null}

                        <span
                          className={`font-extrabold text-xs sm:text-sm font-['Prompt',sans-serif] min-w-[42px] text-right ${
                            isPassed
                              ? 'text-emerald-700'
                              : isWarning
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {compliancePercent}%
                        </span>

                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                      </div>
                    </div>

                    {/* Bar visualization with 85% guideline */}
                    <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      {/* 85% Target Guideline */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-400/70 z-10"
                        style={{ left: '85%' }}
                        title="เกณฑ์มาตรฐาน HA (85%)"
                      />
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${
                          isPassed
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
                            : isWarning
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : 'bg-gradient-to-r from-rose-500 to-rose-600'
                        }`}
                        style={{ width: `${Math.min(compliancePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Quality Analytics Charts */}
          <DashboardCharts
            departments={departments}
            records={records}
            incidents={incidents}
            selectedFiscalYear={selectedFiscalYear}
            selectedQuarter={selectedQuarter}
            quartersPerformance={quartersPerformance}
            dimensionStats={dimensionStats}
            departmentStats={departmentStats}
            riskDistribution={riskDistribution}
            wardResponsibles={wardResponsibles}
            onNavigateToSubWard={handleNavigateToSubWard}
          />

          {/* Section 2: Executive Summary of the 6 Nursing Quality Dimensions (สรุปผลสัมฤทธิ์ 6 มิติ) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt',sans-serif] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <span>สรุปผลสัมฤทธิ์ 6 มิติคุณภาพการพยาบาล (HA 6 Quality Dimensions)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ผลการประเมินตัวชี้วัดคุณภาพการพยาบาลจำแนกตาม 6 มิติมาตรฐานโรงพยาบาลและบริการสุขภาพ
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                เปรียบเทียบมาตรฐาน HA พยาบาล
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dimensionStats.map((dim) => {
                const isPassed = dim.compliancePercent >= 85;
                const isWarning = dim.compliancePercent >= 70 && dim.compliancePercent < 85;

                return (
                  <div
                    key={dim.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${dim.badgeColor}`}
                        >
                          มิติที่ {dim.number}
                        </span>

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

                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 mt-2 line-clamp-1 font-['Prompt',sans-serif]">
                        {dim.shortTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {dim.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-baseline justify-between text-xs mb-1">
                        <span className="text-[11px] text-slate-500">
                          ผ่าน {dim.passedIndicators} / {dim.totalIndicators} ตัวชี้วัด
                        </span>
                        <span
                          className={`font-extrabold text-sm font-['Prompt',sans-serif] ${
                            isPassed
                              ? 'text-emerald-700'
                              : isWarning
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {dim.compliancePercent}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isPassed ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(dim.compliancePercent, 100)}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>เกณฑ์เป้าหมาย ≥ 85%</span>
                        {dim.criticalCount > 0 && (
                          <span className="text-rose-600 font-bold">
                            {dim.criticalCount} วิกฤต
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Incident Risk Distribution Chart (แผนภาพสัดส่วนระดับความเสี่ยงอุบัติการณ์) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt',sans-serif] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>การกระจายระดับความเสี่ยงอุบัติการณ์ทางคลินิก (NRLS Risk Distribution)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  จำแนกตามมาตรฐานสถาบันรับรองคุณภาพสถานพยาบาล (HA Thailand) ประจำเดือนนี้ ({riskDistribution.totalCount} รายการ)
                </p>
              </div>

              <button
                onClick={() => onOpenNewIncident()}
                className="text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ รายงานอุบัติการณ์</span>
              </button>
            </div>

            {/* Proportional Stacked Bar */}
            <div className="mt-4">
              <div className="w-full bg-slate-100 rounded-xl h-4 overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${riskDistribution.nearMiss.percent}%` }}
                  title={`ระดับ A-B: ${riskDistribution.nearMiss.count} เคส (${riskDistribution.nearMiss.percent}%)`}
                />
                <div
                  className="bg-sky-500 transition-all"
                  style={{ width: `${riskDistribution.noHarm.percent}%` }}
                  title={`ระดับ C-D: ${riskDistribution.noHarm.count} เคส (${riskDistribution.noHarm.percent}%)`}
                />
                <div
                  className="bg-amber-500 transition-all"
                  style={{ width: `${riskDistribution.moderate.percent}%` }}
                  title={`ระดับ E-F: ${riskDistribution.moderate.count} เคส (${riskDistribution.moderate.percent}%)`}
                />
                <div
                  className="bg-rose-600 transition-all animate-pulse"
                  style={{ width: `${riskDistribution.severe.percent}%` }}
                  title={`ระดับ G-H-I: ${riskDistribution.severe.count} เคส (${riskDistribution.severe.percent}%)`}
                />
              </div>

              {/* 4 Risk Category Legend Cards */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800">ระดับ A - B</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-emerald-950 font-['Prompt',sans-serif]">
                      {riskDistribution.nearMiss.count}
                    </span>
                    <span className="text-[11px] text-emerald-700">เคส ({riskDistribution.nearMiss.percent}%)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Near Miss (ตรวจพบก่อนเกิด)</p>
                </div>

                <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-800">ระดับ C - D</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-sky-950 font-['Prompt',sans-serif]">
                      {riskDistribution.noHarm.count}
                    </span>
                    <span className="text-[11px] text-sky-700">เคส ({riskDistribution.noHarm.percent}%)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">No Harm (เกิดแต่ไม่บาดเจ็บ)</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-800">ระดับ E - F</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-amber-950 font-['Prompt',sans-serif]">
                      {riskDistribution.moderate.count}
                    </span>
                    <span className="text-[11px] text-amber-700">เคส ({riskDistribution.moderate.percent}%)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Temporary Harm (อันตรายชั่วคราว)</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-800">ระดับ G - H - I</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-rose-950 font-['Prompt',sans-serif]">
                      {riskDistribution.severe.count}
                    </span>
                    <span className="text-[11px] text-rose-700">เคส ({riskDistribution.severe.percent}%)</span>
                  </div>
                  <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Sentinel Events (อันตรายถาวร/วิกฤต)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Quick Navigation Department Directory */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt',sans-serif] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <span>สารบบกลุ่มงานการพยาบาล 11 กลุ่มงาน (เลือกเพื่อกรอกข้อมูล / ตรวจสอบ 6 มิติ)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  การกรอกข้อมูล QA ละเอียด 6 มิติ จะดำเนินการในหน้ารายกลุ่มงานโดยเฉพาะ
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {departmentStats.map((stat) => {
                const { department, compliancePercent, criticalCount, warningCount, hasRecord } = stat;

                return (
                  <div
                    key={department.id}
                    onClick={() => onSelectDepartment(department.id)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/40 hover:bg-white transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-900 text-xs font-bold flex items-center justify-center font-['Prompt',sans-serif] shrink-0">
                          {department.shortName}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-900 leading-tight">
                            {department.nameTh.split('(')[0]}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {department.indicators.length} ตัวชี้วัด QA
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold font-['Prompt',sans-serif] ${
                          compliancePercent >= 85 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {compliancePercent}%
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 truncate max-w-[140px]">
                        {hasRecord ? 'บันทึกแล้ว' : 'รอลงข้อมูลเวรนี้'}
                      </span>
                      <span className="text-teal-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        เข้าสู่กลุ่มงาน <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            </>
          )}
        </div>
      ) : (
        /* DEPARTMENT FOCUSED MODE: Detailed 6-dimension indicators and data entry strictly for the selected department */
        <div className="space-y-4">
          {displayedDepartments.map((dept) => {
            const deptRecords = currentMonthRecords.filter((r) => r.departmentId === dept.id);
            const latestRecord = deptRecords.sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0];

            // Use specialized 6-dimension standard view for NSO
            if (dept.id === 'NSO') {
              return (
                <NSODimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  currentUser={currentUser}
                  onOpenNewRecord={() => onOpenNewRecord('NSO')}
                  onOpenNewIncident={() => onOpenNewIncident('NSO')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                />
              );
            }

            // Use specialized 6-dimension standard view for ICU
            if (dept.id === 'ICU') {
              return (
                <ICUDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  icuRecords={currentMonthRecords.filter((r) => r.departmentId === 'ICU')}
                  currentUser={currentUser}
                  wardResponsibles={wardResponsibles}
                  initialSubDepartment={targetSubWard}
                  onOpenNewRecord={() => onOpenNewRecord('ICU')}
                  onOpenNewIncident={() => onOpenNewIncident('ICU')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                  onUpdateWardResponsible={onUpdateWardResponsible}
                />
              );
            }

            // Use specialized 6-dimension standard view for IPD
            if (dept.id === 'IPD') {
              return (
                <IPDDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  ipdRecords={currentMonthRecords.filter((r) => r.departmentId === 'IPD')}
                  currentUser={currentUser}
                  wardResponsibles={wardResponsibles}
                  initialSubDepartment={targetSubWard}
                  onOpenNewRecord={() => onOpenNewRecord('IPD')}
                  onOpenNewIncident={() => onOpenNewIncident('IPD')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                  onUpdateWardResponsible={onUpdateWardResponsible}
                  onOpenWardDirectory={onOpenWardDirectory}
                />
              );
            }

            // Use specialized 6-dimension standard view for ER
            if (dept.id === 'ER') {
              return (
                <ERDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  currentUser={currentUser}
                  onOpenNewRecord={() => onOpenNewRecord('ER')}
                  onOpenNewIncident={() => onOpenNewIncident('ER')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                />
              );
            }

            // Use specialized 6-dimension standard view for ANC
            if (dept.id === 'ANC') {
              return (
                <ANCDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  currentUser={currentUser}
                  onOpenNewRecord={() => onOpenNewRecord('ANC')}
                  onOpenNewIncident={() => onOpenNewIncident('ANC')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                />
              );
            }

            // Use specialized 6-dimension standard view for OPD
            if (dept.id === 'OPD') {
              return (
                <OPDDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  currentUser={currentUser}
                  onOpenNewRecord={() => onOpenNewRecord('OPD')}
                  onOpenNewIncident={() => onOpenNewIncident('OPD')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                />
              );
            }

            // Use specialized 6-dimension standard view for Anesthesia
            if (dept.id === 'ANESTHESIA') {
              return (
                <AnesthesiaDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  currentUser={currentUser}
                  onOpenNewRecord={() => onOpenNewRecord('ANESTHESIA')}
                  onOpenNewIncident={() => onOpenNewIncident('ANESTHESIA')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                />
              );
            }

            // Use specialized 6-dimension standard view for OR (Operating Room)
            if (dept.id === 'OR') {
              return (
                <OrDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  currentUser={currentUser}
                  onOpenNewRecord={() => onOpenNewRecord('OR')}
                  onOpenNewIncident={() => onOpenNewIncident('OR')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                />
              );
            }

            // Use specialized 6-dimension standard view for LR (Labor Room)
            if (dept.id === 'LR') {
              return (
                <LrDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  currentUser={currentUser}
                  onOpenNewRecord={() => onOpenNewRecord('LR')}
                  onOpenNewIncident={() => onOpenNewIncident('LR')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                />
              );
            }

            // Use specialized 6-dimension standard view for IC (Infection Control)
            if (dept.id === 'IC') {
              return (
                <IcDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  currentUser={currentUser}
                  onOpenNewRecord={() => onOpenNewRecord('IC')}
                  onOpenNewIncident={() => onOpenNewIncident('IC')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                />
              );
            }

            // Use specialized 6-dimension standard view for Special Treatment (การตรวจรักษาพิเศษ)
            if (dept.id === 'SPECIAL_TREATMENT') {
              return (
                <SpecialTreatmentDimensionView
                  key={dept.id}
                  indicators={dept.indicators}
                  latestRecord={latestRecord}
                  specRecords={currentMonthRecords.filter((r) => r.departmentId === 'SPECIAL_TREATMENT')}
                  currentUser={currentUser}
                  wardResponsibles={wardResponsibles}
                  initialSubDepartment={targetSubWard}
                  onOpenNewRecord={() => onOpenNewRecord('SPECIAL_TREATMENT')}
                  onOpenNewIncident={() => onOpenNewIncident('SPECIAL_TREATMENT')}
                  onUpdateResponsiblePerson={onUpdateResponsiblePerson}
                  onUpdateWardResponsible={onUpdateWardResponsible}
                />
              );
            }

            // Standard department indicator view with QA entry buttons
            return (
              <div
                key={dept.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Department Header Bar */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-teal-800 text-white font-bold text-xs font-['Prompt',sans-serif]">
                      {dept.shortName}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{dept.nameTh}</h4>
                      <p className="text-xs text-slate-500">{dept.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenNewIncident(dept.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                    >
                      + รายงานความเสี่ยง
                    </button>
                    <button
                      onClick={() => onOpenNewRecord(dept.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-600 hover:bg-teal-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>บันทึก QA</span>
                    </button>
                  </div>
                </div>

                {/* Indicators Table / Touch Cards */}
                <div className="divide-y divide-slate-100">
                  {dept.indicators.map((ind) => {
                    const currentValue = latestRecord?.values[ind.id];
                    const hasValue = currentValue !== undefined;
                    const severity = hasValue
                      ? evaluateIndicatorSeverity(ind, currentValue)
                      : 'NORMAL';

                    return (
                      <div
                        key={ind.id}
                        className={`p-3.5 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors ${
                          severity === 'CRITICAL'
                            ? 'bg-rose-50/40'
                            : severity === 'WARNING'
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {ind.dimensionId && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                                มิติที่ {ind.dimensionId.replace('DIM_', '')}
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-800">{ind.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {ind.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{ind.description}</p>

                          {/* Responsible Person Field */}
                          <div className="mt-1">
                            {editingIndId === ind.id ? (
                              <input
                                type="text"
                                defaultValue={ind.responsiblePerson || ''}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onUpdateResponsiblePerson?.(ind.id, (e.target as HTMLInputElement).value);
                                    setEditingIndId(null);
                                  }
                                  if (e.key === 'Escape') setEditingIndId(null);
                                }}
                                onBlur={(e) => {
                                  onUpdateResponsiblePerson?.(ind.id, e.target.value);
                                  setEditingIndId(null);
                                }}
                                className="px-2 py-0.5 text-xs border border-teal-400 rounded-md bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-500 max-w-xs shadow-2xs"
                                placeholder="พิมพ์ผู้รับผิดชอบ..."
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingIndId(ind.id)}
                                className="group/resp inline-flex items-center gap-1 text-[11px] text-teal-800 hover:text-teal-900 transition-colors py-0.5 px-1.5 rounded-md bg-teal-50/80 hover:bg-teal-100 cursor-pointer"
                                title="คลิกเพื่อระบุผู้รับผิดชอบ"
                              >
                                <span>👤 {ind.responsiblePerson || '+ ระบุผู้รับผิดชอบ'}</span>
                                <Pencil className="w-3 h-3 text-teal-500 opacity-60 group-hover/resp:opacity-100 transition-opacity shrink-0" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Values & Target comparison */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          {/* Target Benchmark */}
                          <div className="text-left sm:text-right">
                            <span className="block text-[10px] text-slate-400 font-medium">
                              เกณฑ์มาตรฐาน
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {ind.benchmarkType === 'MIN' ? '≥' : '≤'} {ind.targetBenchmark}{' '}
                              {ind.unit}
                            </span>
                          </div>

                          {/* Current Result */}
                          <div className="text-right min-w-[90px]">
                            <span className="block text-[10px] text-slate-400 font-medium">
                              ผลงานจริง
                            </span>
                            {hasValue ? (
                              <span
                                className={`text-sm sm:text-base font-extrabold font-['Prompt',sans-serif] ${
                                  severity === 'CRITICAL'
                                    ? 'text-rose-600 animate-pulse'
                                    : severity === 'WARNING'
                                    ? 'text-amber-600'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {currentValue} {ind.unit}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">รอการบันทึก</span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="w-24 text-right">
                            {severity === 'CRITICAL' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                เกินเกณฑ์วิกฤต
                              </span>
                            ) : severity === 'WARNING' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                เฝ้าระวัง
                              </span>
                            ) : hasValue ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ผ่านเกณฑ์
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                ไม่มีข้อมูล
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Department Footer Note */}
                {latestRecord && (
                  <div className="bg-slate-50/80 px-4 py-2 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
                    <span>
                      ข้อมูลล่าสุด: เวร{latestRecord.shift} วันที่ {formatThaiDate(latestRecord.date)}{' '}
                      โดย {latestRecord.recordedBy}
                    </span>
                    {latestRecord.notes && (
                      <span className="text-slate-600 italic">"{latestRecord.notes}"</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Incidents & Risk Containment Feed */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt',sans-serif] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>
                {selectedDepartment === 'ALL'
                  ? 'รายการอุบัติการณ์ความเสี่ยงล่าสุด (ภาพรวมโรงพยาบาล)'
                  : `รายการอุบัติการณ์ความเสี่ยง: ${activeDeptConfig?.nameTh}`}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDepartment === 'ALL'
                ? 'จำแนกตามมาตรฐาน HA Thailand (ระดับความรุนแรง NRLS Level A - I)'
                : `รายงานอุบัติการณ์และความเสี่ยงที่เกิดขึ้นเฉพาะในกลุ่มงาน ${activeDeptConfig?.shortName}`}
            </p>
          </div>

          <button
            onClick={() => onOpenNewIncident(selectedDepartment !== 'ALL' ? selectedDepartment : undefined)}
            className="text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>รายงานอุบัติการณ์ใหม่</span>
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {displayedIncidents.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              ไม่พบรายงานอุบัติการณ์ความเสี่ยงในกลุ่มงานนี้ (ผ่านเกณฑ์ความปลอดภัย)
            </div>
          ) : (
            displayedIncidents.slice(0, 5).map((incident) => {
              const riskInfo = RISK_LEVELS[incident.riskLevel];
            return (
              <div
                key={incident.id}
                onClick={() => onViewIncidentDetail(incident)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`shrink-0 px-2 py-0.5 text-xs font-bold rounded border ${riskInfo.badgeBg}`}
                  >
                    {riskInfo.level}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 hover:text-teal-700">
                        {incident.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {incident.departmentId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {incident.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs shrink-0">
                  <span className="text-slate-400 text-[11px]">
                    {formatThaiDate(incident.date)} {incident.time} น.
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      incident.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : incident.status === 'INVESTIGATING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {incident.status === 'RESOLVED'
                      ? 'แก้ไขเรียบร้อย'
                      : incident.status === 'INVESTIGATING'
                      ? 'กำลังสืบสวนหาสาเหตุ (RCA)'
                      : 'รอตรวจสอบ'}
                  </span>

                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
};
