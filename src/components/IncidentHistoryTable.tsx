import React, { useState } from 'react';
import {
  DepartmentConfig,
  DepartmentId,
  QARecord,
  IncidentReport,
  UserProfile,
  ICU_SUB_DEPARTMENTS,
  SPECIAL_TREATMENT_SUB_DEPARTMENTS,
  IPD_SUB_DEPARTMENTS,
} from '../types/nursing';
import {
  formatThaiDate,
  RISK_LEVELS,
  exportToCSV,
  canUserApproveRecords,
} from '../utils/calculations';
import {
  FiscalYearOption,
  AVAILABLE_FISCAL_YEARS,
  FISCAL_QUARTERS,
  getFiscalYear,
  getFiscalQuarter,
  filterByFiscalPeriod,
  formatFiscalYearLabel,
} from '../utils/fiscalYear';
import {
  Search,
  Filter,
  Download,
  Printer,
  ShieldAlert,
  FileCheck2,
  Calendar,
  CheckCircle,
  Eye,
  PlusCircle,
  Layers,
} from 'lucide-react';

interface IncidentHistoryTableProps {
  records: QARecord[];
  incidents: IncidentReport[];
  departments: DepartmentConfig[];
  currentUser: UserProfile;
  fiscalYear?: FiscalYearOption;
  onSelectFiscalYear?: (fy: FiscalYearOption) => void;
  fiscalQuarter?: number | 'ALL';
  onSelectFiscalQuarter?: (q: number | 'ALL') => void;
  onViewIncident: (incident: IncidentReport) => void;
  onApproveRecord: (recordId: string) => void;
  onOpenNewRecord: () => void;
  onOpenNewIncident: () => void;
}

export const IncidentHistoryTable: React.FC<IncidentHistoryTableProps> = ({
  records,
  incidents,
  departments,
  currentUser,
  fiscalYear,
  onSelectFiscalYear,
  fiscalQuarter,
  onSelectFiscalQuarter,
  onViewIncident,
  onApproveRecord,
  onOpenNewRecord,
  onOpenNewIncident,
}) => {
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'INCIDENTS'>('RECORDS');
  const [internalFY, setInternalFY] = useState<FiscalYearOption>('ALL');
  const [internalQ, setInternalQ] = useState<number | 'ALL'>('ALL');
  const activeFY = fiscalYear !== undefined ? fiscalYear : internalFY;
  const setActiveFY = onSelectFiscalYear || setInternalFY;
  const activeQ = fiscalQuarter !== undefined ? fiscalQuarter : internalQ;
  const setActiveQ = onSelectFiscalQuarter || setInternalQ;

  const [filterDept, setFilterDept] = useState<DepartmentId | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const canApprove = canUserApproveRecords(currentUser.role);

  // Filter records by Fiscal Year, Quarter, Department, and Search
  const filteredRecords = React.useMemo(() => {
    const periodFiltered = filterByFiscalPeriod(records, {
      fiscalYear: activeFY,
      quarter: activeQ,
    });

    return periodFiltered.filter((r) => {
      if (filterDept !== 'ALL' && r.departmentId !== filterDept) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchDept = r.departmentId.toLowerCase().includes(q);
        const matchAuthor = r.recordedBy.toLowerCase().includes(q);
        const matchNotes = (r.notes || '').toLowerCase().includes(q);
        if (!matchDept && !matchAuthor && !matchNotes) return false;
      }
      return true;
    });
  }, [records, activeFY, activeQ, filterDept, searchQuery]);

  // Filter incidents by Fiscal Year, Quarter, Department, Severity, and Search
  const filteredIncidents = React.useMemo(() => {
    const periodFiltered = filterByFiscalPeriod(incidents, {
      fiscalYear: activeFY,
      quarter: activeQ,
    });

    return periodFiltered.filter((inc) => {
      if (filterDept !== 'ALL' && inc.departmentId !== filterDept) return false;
      if (filterSeverity !== 'ALL') {
        if (filterSeverity === 'SENTINEL' && !['G', 'H', 'I'].includes(inc.riskLevel)) return false;
        if (filterSeverity === 'MODERATE' && !['E', 'F'].includes(inc.riskLevel)) return false;
        if (filterSeverity === 'NEAR_MISS' && !['A', 'B'].includes(inc.riskLevel)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = inc.title.toLowerCase().includes(q);
        const matchDesc = inc.description.toLowerCase().includes(q);
        const matchReporter = inc.reportedBy.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchReporter) return false;
      }
      return true;
    });
  }, [incidents, activeFY, activeQ, filterDept, filterSeverity, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportRecords = () => {
    const headers = [
      'ID',
      'ปีงบประมาณ',
      'ไตรมาส',
      'กลุ่มงาน',
      'วันที่',
      'เวร',
      'จำนวนผู้รับบริการ',
      'สถานะ',
      'ผู้บันทึก',
    ];
    const rows = filteredRecords.map((r) => [
      r.id,
      `ปีงบ ${r.fiscalYear || getFiscalYear(r.date)}`,
      `ไตรมาส ${r.fiscalQuarter || getFiscalQuarter(r.date)}`,
      r.departmentId,
      r.date,
      r.shift,
      r.patientCount,
      r.status,
      r.recordedBy,
    ]);
    const fyName = activeFY === 'ALL' ? 'AllYears' : `FY${activeFY}`;
    exportToCSV(`Nursing_QA_Records_Log_${fyName}`, headers, rows);
  };

  const handleExportIncidents = () => {
    const headers = [
      'ID',
      'ปีงบประมาณ',
      'ไตรมาส',
      'กลุ่มงาน',
      'ระดับความเสี่ยง (NRLS)',
      'ชื่อเหตุการณ์',
      'วันที่',
      'เวลา',
      'การแก้ไขเบื้องต้น',
      'สถานะ',
      'ผู้รายงาน',
    ];
    const rows = filteredIncidents.map((i) => [
      i.id,
      `ปีงบ ${i.fiscalYear || getFiscalYear(i.date)}`,
      `ไตรมาส ${i.fiscalQuarter || getFiscalQuarter(i.date)}`,
      i.departmentId,
      i.riskLevel,
      i.title,
      i.date,
      i.time,
      i.immediateAction,
      i.status,
      i.reportedBy,
    ]);
    const fyName = activeFY === 'ALL' ? 'AllYears' : `FY${activeFY}`;
    exportToCSV(`Nursing_Incidents_Log_${fyName}`, headers, rows);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
      {/* Top Filter & Tab Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Toggle View Mode */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('RECORDS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'RECORDS'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>ประวัติการบันทึก QA ({records.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('INCIDENTS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'INCIDENTS'
                ? 'bg-white text-rose-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>รายงานความเสี่ยง NRLS ({incidents.length})</span>
          </button>
        </div>

        {/* Search, Filter & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ผู้รายงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg w-full sm:w-44 focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>

          {/* Fiscal Year Filter */}
          <select
            value={activeFY}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
              setActiveFY(val as FiscalYearOption);
            }}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-bold focus:ring-2 focus:ring-teal-500 outline-hidden"
          >
            <option value="ALL">ทุกปีงบประมาณ</option>
            {AVAILABLE_FISCAL_YEARS.map((fy) => (
              <option key={fy} value={fy}>
                ปีงบประมาณ {fy}
              </option>
            ))}
          </select>

          {/* Quarter Filter */}
          <select
            value={activeQ}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
              setActiveQ(val as number | 'ALL');
            }}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
          >
            <option value="ALL">ทุกไตรมาส</option>
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>
                {FISCAL_QUARTERS[q].nameTh} ({FISCAL_QUARTERS[q].rangeTh})
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value as any)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
          >
            <option value="ALL">ทุกกลุ่มงาน (11 แผนก)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.shortName}
              </option>
            ))}
          </select>

          {/* Severity filter (for incidents) */}
          {activeTab === 'INCIDENTS' && (
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 outline-hidden"
            >
              <option value="ALL">ทุกระดับความรุนแรง</option>
              <option value="SENTINEL">ระดับ G, H, I (Sentinel Events)</option>
              <option value="MODERATE">ระดับ E, F (Moderate Harm)</option>
              <option value="NEAR_MISS">ระดับ A, B (Near Miss)</option>
            </select>
          )}

          {/* Export & Print */}
          <button
            onClick={activeTab === 'RECORDS' ? handleExportRecords : handleExportIncidents}
            className="p-1.5 text-slate-600 hover:text-teal-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            title="ส่งออกไฟล์ CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="p-1.5 text-slate-600 hover:text-teal-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors hidden sm:block"
            title="พิมพ์รายงาน"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table: Records Tab */}
      {activeTab === 'RECORDS' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">กลุ่มงาน</th>
                <th className="px-4 py-3">วันที่ / เวร</th>
                <th className="px-4 py-3">ตัวหารผู้ป่วย</th>
                <th className="px-4 py-3">ตัวชี้วัดสำคัญ</th>
                <th className="px-4 py-3">ผู้บันทึก</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    ไม่พบข้อมูลการบันทึกตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const dept = departments.find((d) => d.id === r.departmentId);
                  const isVerified = r.status === 'VERIFIED';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[11px]">
                              {dept?.shortName || r.departmentId}
                            </span>
                            <span className="truncate max-w-[120px]">{dept?.nameTh.split('(')[0]}</span>
                          </span>
                          {r.subDepartment && (
                            <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200 self-start mt-0.5">
                              {IPD_SUB_DEPARTMENTS.find((s) => s.id === r.subDepartment)?.shortName ||
                               ICU_SUB_DEPARTMENTS.find((s) => s.id === r.subDepartment)?.shortName ||
                               SPECIAL_TREATMENT_SUB_DEPARTMENTS.find((s) => s.id === r.subDepartment)?.shortName ||
                               r.subDepartment}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{formatThaiDate(r.date)}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 font-bold">
                            ปีงบ {r.fiscalYear || getFiscalYear(r.date)} Q{r.fiscalQuarter || getFiscalQuarter(r.date)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {r.shift === 'MORNING'
                              ? '☀️ เวรเช้า'
                              : r.shift === 'AFTERNOON'
                              ? '⛅ เวรบ่าย'
                              : r.shift === 'NIGHT'
                              ? '🌙 เวรดึก'
                              : 'สรุปประจำเดือน'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {r.patientCount} เคส/วัน
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {dept?.indicators.slice(0, 2).map((ind) => {
                            const val = r.values[ind.id];
                            return (
                              <span
                                key={ind.id}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 truncate"
                              >
                                {ind.name.split('(')[0]}: <strong>{val ?? '-'} {ind.unit}</strong>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <div>{r.recordedBy}</div>
                        <span className="text-[10px] text-slate-400">{r.recordedByRole}</span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            อนุมัติแล้ว
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            รออนุมัติ
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {!isVerified && canApprove ? (
                          <button
                            onClick={() => onApproveRecord(r.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
                          >
                            รับรองข้อมูล
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">ครบถ้วน</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table: Incidents Tab */}
      {activeTab === 'INCIDENTS' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ระดับ NRLS</th>
                <th className="px-4 py-3">กลุ่มงาน</th>
                <th className="px-4 py-3">เหตุการณ์ความเสี่ยง</th>
                <th className="px-4 py-3">วัน-เวลาเกิดเหตุ</th>
                <th className="px-4 py-3">การแก้ไขทันที</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-right">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    ไม่พบรายงานอุบัติการณ์ตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const riskInfo = RISK_LEVELS[inc.riskLevel];
                  const dept = departments.find((d) => d.id === inc.departmentId);

                  return (
                    <tr
                      key={inc.id}
                      onClick={() => onViewIncident(inc)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold border ${riskInfo.badgeBg}`}
                        >
                          {inc.riskLevel}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <span>{dept?.shortName || inc.departmentId}</span>
                          {inc.subDepartment && (
                            <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-200 self-start">
                              {IPD_SUB_DEPARTMENTS.find((s) => s.id === inc.subDepartment)?.shortName ||
                               ICU_SUB_DEPARTMENTS.find((s) => s.id === inc.subDepartment)?.shortName ||
                               SPECIAL_TREATMENT_SUB_DEPARTMENTS.find((s) => s.id === inc.subDepartment)?.shortName ||
                               inc.subDepartment}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{inc.title}</div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {inc.description}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-semibold text-slate-800">{formatThaiDate(inc.date)}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-bold">
                            ปีงบ {inc.fiscalYear || getFiscalYear(inc.date)} Q{inc.fiscalQuarter || getFiscalQuarter(inc.date)}
                          </span>
                          <span className="text-[10px] text-slate-500">{inc.time} น.</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {inc.immediateAction}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            inc.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inc.status === 'INVESTIGATING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inc.status === 'RESOLVED'
                            ? 'ปิดเคสแล้ว'
                            : inc.status === 'INVESTIGATING'
                            ? 'กำลังวิเคราะห์ RCA'
                            : 'เปิดเคสใหม่'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewIncident(inc);
                          }}
                          className="p-1 rounded text-teal-700 hover:bg-teal-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
