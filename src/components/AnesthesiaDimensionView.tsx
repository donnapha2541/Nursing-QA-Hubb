import React, { useState } from 'react';
import { IndicatorDefinition, QARecord, UserProfile } from '../types/nursing';
import { ANESTHESIA_DIMENSIONS } from '../data/anesthesiaIndicators';
import { evaluateIndicatorSeverity, exportToCSV } from '../utils/calculations';
import {
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Download,
  Search,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  PlusCircle,
  Clock,
  Pencil,
} from 'lucide-react';

interface AnesthesiaDimensionViewProps {
  indicators: IndicatorDefinition[];
  latestRecord?: QARecord;
  currentUser: UserProfile;
  onOpenNewRecord: () => void;
  onOpenNewIncident: () => void;
  onUpdateResponsiblePerson?: (indicatorId: string, name: string) => void;
}

export const AnesthesiaDimensionView: React.FC<AnesthesiaDimensionViewProps> = ({
  indicators,
  latestRecord,
  currentUser,
  onOpenNewRecord,
  onOpenNewIncident,
  onUpdateResponsiblePerson,
}) => {
  const [selectedDimId, setSelectedDimId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndId, setEditingIndId] = useState<string | null>(null);
  const [expandedDims, setExpandedDims] = useState<Record<string, boolean>>({
    DIM_1: true,
    DIM_2: true,
    DIM_3: true,
    DIM_4: true,
    DIM_5: true,
    DIM_6: true,
  });

  const toggleDimension = (dimId: string) => {
    setExpandedDims((prev) => ({ ...prev, [dimId]: !prev[dimId] }));
  };

  // Filter indicators
  const filteredIndicators = indicators.filter((ind) => {
    if (selectedDimId !== 'ALL' && ind.dimensionId !== selectedDimId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = ind.name.toLowerCase().includes(q);
      const matchDesc = ind.description.toLowerCase().includes(q);
      const matchResp = (ind.responsiblePerson || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchResp) return false;
    }
    return true;
  });

  // Calculate statistics for each dimension
  const dimensionStats = ANESTHESIA_DIMENSIONS.map((dim) => {
    const dimInds = indicators.filter((i) => i.dimensionId === dim.id);
    let passed = 0;
    let critical = 0;
    let warning = 0;

    dimInds.forEach((ind) => {
      const val = latestRecord?.values[ind.id];
      if (val !== undefined) {
        const severity = evaluateIndicatorSeverity(ind, val);
        if (severity === 'NORMAL') passed++;
        else if (severity === 'CRITICAL') critical++;
        else if (severity === 'WARNING') warning++;
      } else {
        passed++;
      }
    });

    const passRate = dimInds.length > 0 ? Math.round((passed / dimInds.length) * 100) : 100;
    return {
      dim,
      total: dimInds.length,
      passed,
      critical,
      warning,
      passRate,
    };
  });

  const handleExportAnesCSV = () => {
    const headers = [
      'มิติการประเมิน',
      'ลำดับและตัวชี้วัด',
      'ค่าเป้าหมาย',
      'ผลการประเมินจริง',
      'สถานะ',
      'ผู้รับผิดชอบ',
    ];

    const rows = filteredIndicators.map((ind) => {
      const val = latestRecord?.values[ind.id];
      const severity = val !== undefined ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';
      const statusText =
        severity === 'NORMAL' ? 'ผ่านเกณฑ์' : severity === 'WARNING' ? 'เฝ้าระวัง' : 'วิกฤต';

      let targetText = '';
      if (ind.id === 'anes_dim2_1') {
        targetText = 'ร้อยละ 90-110';
      } else if (ind.targetBenchmark === 0) {
        targetText = '0';
      } else if (ind.benchmarkType === 'MIN') {
        targetText = ind.targetBenchmark === 100 ? 'ร้อยละ 100' : `≥ ร้อยละ ${ind.targetBenchmark}`;
      } else {
        targetText = `≤ ร้อยละ ${ind.targetBenchmark}`;
      }

      return [
        ind.dimensionName || '-',
        ind.name,
        targetText,
        val !== undefined ? `${val} ${ind.unit}` : 'ยังไม่บันทึก',
        statusText,
        ind.responsiblePerson || '-',
      ];
    });

    exportToCSV(`Anesthesia_Nursing_QA_6Dimensions_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const totalPassed = dimensionStats.reduce((acc, curr) => acc + curr.passed, 0);
  const overallRate =
    indicators.length > 0 ? Math.round((totalPassed / indicators.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Anesthesia Header Card */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 text-purple-200">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Prompt',sans-serif] tracking-tight">
                  เกณฑ์ชี้วัดคุณภาพการพยาบาลวิสัญญี 6 มิติ (Anesthesia QA Hub)
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-400/20 text-purple-200 border border-purple-300/30 font-medium">
                  งานการพยาบาลวิสัญญี • 42 ตัวชี้วัด
                </span>
              </div>
              <p className="text-xs text-purple-100/90 mt-1">
                การประเมินคุณภาพการระงับความรู้สึก การฟื้นตัวหลังผ่าตัดใน PACU และบริหารความเสี่ยงวิสัญญีตามเกณฑ์มาตรฐาน HA & ราชวิทยาลัยฯ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenNewRecord}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-purple-900 font-semibold text-xs shadow-sm hover:bg-purple-50 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-purple-600" />
              <span>บันทึก QA เวรนี้</span>
            </button>
            <button
              onClick={onOpenNewIncident}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-white font-semibold text-xs border border-purple-400/30 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-purple-300" />
              <span>รายงานความเสี่ยงวิสัญญี</span>
            </button>
            <button
              onClick={handleExportAnesCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white font-medium text-xs border border-white/10 transition-all cursor-pointer"
              title="ส่งออกรายงานตัวชี้วัดวิสัญญีทั้ง 6 มิติเป็นไฟล์ CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>

        {/* Anesthesia Overall KPI Strip */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-lg p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-purple-200">ตัวชี้วัดทั้งหมด</span>
            <p className="text-lg font-bold font-['Prompt',sans-serif] mt-0.5">{indicators.length} ตัวชี้วัด</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-purple-200">มิติการประเมิน</span>
            <p className="text-lg font-bold font-['Prompt',sans-serif] mt-0.5">6 มิติคุณภาพ</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-purple-200">ความสอดคล้องรวม</span>
            <p className="text-lg font-bold text-emerald-300 font-['Prompt',sans-serif] mt-0.5">{overallRate}%</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-purple-200">ข้อมูลเวรล่าสุด</span>
            <p className="text-xs font-semibold text-purple-100 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-300" />
              {latestRecord ? `${latestRecord.date} (เวร ${latestRecord.shift})` : 'ยังไม่มีการบันทึก'}
            </p>
          </div>
        </div>
      </div>

      {/* 6 Dimensions Quick Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={() => setSelectedDimId('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            selectedDimId === 'ALL'
              ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold">ทุกมิติ</span>
            <Layers className="w-3.5 h-3.5 opacity-70" />
          </div>
          <p className="text-base font-extrabold font-['Prompt',sans-serif]">{indicators.length}</p>
          <span className="text-[10px] opacity-80 block truncate">ครบ 42 ตัวชี้วัด</span>
        </button>

        {dimensionStats.map(({ dim, total, passRate }) => {
          const isSelected = selectedDimId === dim.id;
          return (
            <button
              key={dim.id}
              onClick={() => setSelectedDimId(dim.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-purple-800 text-white border-purple-800 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {dim.code}
                </span>
                <span className={`text-[10px] font-bold ${
                  isSelected ? 'text-emerald-300' : 'text-emerald-600'
                }`}>
                  {passRate}%
                </span>
              </div>
              <p className="text-xs font-bold truncate mt-0.5">{dim.nameTh}</p>
              <span className="text-[10px] opacity-75 block mt-0.5">{total} ตัวชี้วัด</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตัวชี้วัดวิสัญญี, เป้าหมาย, ผู้รับผิดชอบ..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 font-medium">
          <span>แสดง {filteredIndicators.length} จาก {indicators.length} ตัวชี้วัด</span>
          {selectedDimId !== 'ALL' && (
            <button
              onClick={() => setSelectedDimId('ALL')}
              className="text-purple-700 hover:underline text-xs ml-1"
            >
              (ล้างตัวกรอง)
            </button>
          )}
        </div>
      </div>

      {/* Detailed Dimensions Accordion & Indicators Table */}
      <div className="space-y-4">
        {ANESTHESIA_DIMENSIONS.filter(
          (dim) => selectedDimId === 'ALL' || selectedDimId === dim.id
        ).map((dim) => {
          const dimInds = filteredIndicators.filter((i) => i.dimensionId === dim.id);
          if (dimInds.length === 0) return null;
          const isExpanded = expandedDims[dim.id] ?? true;

          return (
            <div
              key={dim.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
            >
              {/* Dimension Accordion Header */}
              <div
                onClick={() => toggleDimension(dim.id)}
                className="px-4 py-3 bg-slate-50/90 hover:bg-slate-100/90 border-b border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${dim.badgeBg}`}>
                    {dim.code}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{dim.nameTh}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{dim.descriptionTh}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                    {dimInds.length} ตัวชี้วัด
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Dimension Indicators Table */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-200/80 font-medium">
                        <th className="py-2.5 px-4 w-12 text-center">ลำดับ</th>
                        <th className="py-2.5 px-4 min-w-[300px]">ชื่อตัวชี้วัด (Indicator Name)</th>
                        <th className="py-2.5 px-4 text-center w-28">ค่าเป้าหมาย</th>
                        <th className="py-2.5 px-4 text-center w-28">ผลการประเมิน</th>
                        <th className="py-2.5 px-4 text-center w-24">สถานะ</th>
                        <th className="py-2.5 px-4 hidden md:table-cell w-56">ผู้รับผิดชอบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dimInds.map((ind, idx) => {
                        const val = latestRecord?.values[ind.id];
                        const severity = val !== undefined ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';

                        let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                        let badgeIcon = <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />;
                        let statusText = 'ผ่านเกณฑ์';

                        if (val === undefined) {
                          badgeColor = 'bg-slate-50 text-slate-500 border-slate-200';
                          badgeIcon = <Clock className="w-3 h-3 text-slate-400 shrink-0" />;
                          statusText = 'รอประเมิน';
                        } else if (severity === 'CRITICAL') {
                          badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                          badgeIcon = <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />;
                          statusText = 'วิกฤต';
                        } else if (severity === 'WARNING') {
                          badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                          badgeIcon = <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />;
                          statusText = 'เฝ้าระวัง';
                        }

                        let targetText = '';
                        if (ind.id === 'anes_dim2_1') {
                          targetText = 'ร้อยละ 90-110';
                        } else if (ind.targetBenchmark === 0) {
                          targetText = '0';
                        } else if (ind.benchmarkType === 'MIN') {
                          targetText = ind.targetBenchmark === 100 ? 'ร้อยละ 100' : `≥ ร้อยละ ${ind.targetBenchmark}`;
                        } else {
                          targetText = `≤ ร้อยละ ${ind.targetBenchmark}`;
                        }

                        // Special color row highlight for items highlighted in original sheet
                        // Item 6 in Dimension 5 (highlighted yellow in spreadsheet)
                        // Item 7 in Dimension 5 (highlighted green in spreadsheet)
                        const isYellowHighlight = ind.id === 'anes_dim5_6';
                        const isGreenHighlight = ind.id === 'anes_dim5_7';

                        return (
                          <tr
                            key={ind.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isYellowHighlight
                                ? 'bg-amber-50/50'
                                : isGreenHighlight
                                ? 'bg-emerald-50/40'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-bold text-slate-500 font-['Prompt',sans-serif]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 leading-snug">{ind.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                {ind.description}
                              </p>
                              {ind.responsiblePerson && (
                                <p className="text-[10px] text-purple-700 mt-1 md:hidden">
                                  👤 ผู้รับผิดชอบ: {ind.responsiblePerson}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {targetText}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-extrabold font-['Prompt',sans-serif] text-slate-900">
                              {val !== undefined ? (
                                <span
                                  className={
                                    severity === 'CRITICAL'
                                      ? 'text-rose-700 text-sm'
                                      : severity === 'WARNING'
                                      ? 'text-amber-700 text-sm'
                                      : 'text-emerald-700 text-sm'
                                  }
                                >
                                  {val} <span className="text-[11px] font-normal">{ind.unit}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeColor}`}
                              >
                                {badgeIcon}
                                <span>{statusText}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 hidden md:table-cell text-[11px]">
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
                                  className="w-full px-2 py-1 text-xs border border-purple-400 rounded-md bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500 shadow-2xs"
                                  placeholder="พิมพ์ชื่อ/ตำแหน่งผู้รับผิดชอบ..."
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingIndId(ind.id)}
                                  className="group/resp inline-flex items-center gap-1.5 text-left hover:text-purple-700 transition-colors py-1 px-1.5 rounded-md hover:bg-purple-50/80 cursor-pointer"
                                  title="คลิกเพื่อระบุหรือแก้ไขผู้รับผิดชอบ"
                                >
                                  <span className={ind.responsiblePerson ? 'font-medium text-slate-700' : 'text-slate-400 italic text-[11px]'}>
                                    {ind.responsiblePerson || '+ ระบุผู้รับผิดชอบ'}
                                  </span>
                                  <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover/resp:opacity-100 transition-opacity shrink-0" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
