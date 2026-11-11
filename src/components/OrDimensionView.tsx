import React, { useState } from 'react';
import { IndicatorDefinition, QARecord, UserProfile } from '../types/nursing';
import { OR_DIMENSIONS } from '../data/orIndicators';
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
  Scissors,
  PlusCircle,
  Clock,
  Pencil,
} from 'lucide-react';

interface OrDimensionViewProps {
  indicators: IndicatorDefinition[];
  latestRecord?: QARecord;
  currentUser: UserProfile;
  onOpenNewRecord: () => void;
  onOpenNewIncident: () => void;
  onUpdateResponsiblePerson?: (indicatorId: string, name: string) => void;
}

export const OrDimensionView: React.FC<OrDimensionViewProps> = ({
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
  const dimensionStats = OR_DIMENSIONS.map((dim) => {
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

  const handleExportOrCSV = () => {
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
      if (ind.id === 'or_dim2_1') {
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

    exportToCSV(`OR_Surgical_Nursing_QA_6Dimensions_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const totalPassed = dimensionStats.reduce((acc, curr) => acc + curr.passed, 0);
  const overallRate =
    indicators.length > 0 ? Math.round((totalPassed / indicators.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* OR Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 text-cyan-200">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Prompt',sans-serif] tracking-tight">
                  เกณฑ์ชี้วัดคุณภาพการพยาบาลผู้ป่วยผ่าตัด 6 มิติ (OR QA Hub)
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-400/20 text-cyan-200 border border-blue-300/30 font-medium">
                  กลุ่มงานการพยาบาลผู้ป่วยผ่าตัด • 35 ตัวชี้วัด
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-1">
                การประเมินคุณภาพความปลอดภัยในการผ่าตัด (Surgical Safety Checklist) ปลอดสิ่งแปลกปลอมตกค้าง ป้องกันการติดเชื้อแผลสะอาด และบริหารความเสี่ยงห้องผ่าตัด
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenNewRecord}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-blue-950 font-semibold text-xs shadow-sm hover:bg-blue-50 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>บันทึก QA ผ่าตัดเวรนี้</span>
            </button>
            <button
              onClick={onOpenNewIncident}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-white font-semibold text-xs border border-rose-400/30 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-rose-300" />
              <span>รายงานความเสี่ยงผ่าตัด</span>
            </button>
            <button
              onClick={handleExportOrCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white font-medium text-xs border border-white/10 transition-all cursor-pointer"
              title="ส่งออกรายงานตัวชี้วัดผ่าตัดทั้ง 6 มิติเป็นไฟล์ CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>

        {/* OR Overall KPI Strip */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-lg p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-blue-200">ตัวชี้วัดทั้งหมด</span>
            <p className="text-lg font-bold font-['Prompt',sans-serif] mt-0.5">{indicators.length} ตัวชี้วัด</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-blue-200">มิติการประเมิน</span>
            <p className="text-lg font-bold font-['Prompt',sans-serif] mt-0.5">6 มิติหลัก</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-emerald-300">ผ่านเกณฑ์แล้ว</span>
            <p className="text-lg font-bold font-['Prompt',sans-serif] text-emerald-300 mt-0.5">
              {totalPassed} / {indicators.length}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 backdrop-blur-xs border border-white/10">
            <span className="text-[11px] text-cyan-200">อัตราผ่านเกณฑ์เฉลี่ย</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-lg font-bold font-['Prompt',sans-serif] text-cyan-200">{overallRate}%</p>
              <span className="text-[10px] text-blue-200">ภาพรวม OR</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Dimension KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {dimensionStats.map(({ dim, total, passed, passRate }) => {
          const isSelected = selectedDimId === dim.id;
          return (
            <button
              key={dim.id}
              onClick={() => setSelectedDimId(isSelected ? 'ALL' : dim.id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-500 shadow-sm ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 text-[11px]">{dim.code}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${dim.badgeBg}`}>
                  {passed}/{total}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">{dim.nameTh}</p>
              <div className="mt-2 flex items-center justify-between">
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mr-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      passRate >= 80 ? 'bg-emerald-500' : passRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${passRate}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700">{passRate}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedDimId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedDimId === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({indicators.length} ข้อ)
          </button>
          {OR_DIMENSIONS.map((dim) => {
            const count = indicators.filter((i) => i.dimensionId === dim.id).length;
            const isSel = selectedDimId === dim.id;
            return (
              <button
                key={dim.id}
                onClick={() => setSelectedDimId(dim.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSel
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dim.code} {dim.nameTh.replace('ผลลัพธ์', '')} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตัวชี้วัด หรือชื่อผู้รับผิดชอบ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Dimensions Accordion List */}
      <div className="space-y-4">
        {OR_DIMENSIONS.filter(
          (dim) => selectedDimId === 'ALL' || selectedDimId === dim.id
        ).map((dim) => {
          const dimInds = filteredIndicators.filter((i) => i.dimensionId === dim.id);
          if (dimInds.length === 0) return null;
          const isExpanded = expandedDims[dim.id] ?? true;
          const stat = dimensionStats.find((s) => s.dim.id === dim.id);

          return (
            <div
              key={dim.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-all"
            >
              {/* Dimension Accordion Header */}
              <div
                onClick={() => toggleDimension(dim.id)}
                className="p-4 bg-gradient-to-r from-slate-50 to-white hover:bg-slate-50/80 cursor-pointer flex items-center justify-between border-b border-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {dim.code.replace('มิติที่ ', 'M')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 font-['Prompt',sans-serif]">
                        {dim.code}: {dim.nameTh}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-500">
                        ({dimInds.length} ตัวชี้วัด)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {dim.descriptionTh}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {stat && (
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                      <span className="text-slate-500">ผ่านเกณฑ์</span>
                      <span className="font-bold text-emerald-600">
                        {stat.passed}/{stat.total}
                      </span>
                      <span className="text-slate-400">({stat.passRate}%)</span>
                    </div>
                  )}
                  <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Indicators Table for this Dimension */}
              {isExpanded && (
                <div className="divide-y divide-slate-100">
                  <div className="bg-slate-50/70 px-4 py-2 text-[11px] font-bold text-slate-500 grid grid-cols-12 gap-2">
                    <span className="col-span-12 sm:col-span-5">ตัวชี้วัดคุณภาพ</span>
                    <span className="col-span-4 sm:col-span-2 text-center">ค่าเป้าหมาย</span>
                    <span className="col-span-4 sm:col-span-2 text-center">ผลการประเมิน</span>
                    <span className="col-span-4 sm:col-span-3 text-right">ผู้รับผิดชอบ</span>
                  </div>

                  {dimInds.map((ind) => {
                    const val = latestRecord?.values[ind.id];
                    const severity =
                      val !== undefined ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';

                    // Display benchmark text
                    let targetText = '';
                    if (ind.id === 'or_dim2_1') {
                      targetText = 'ร้อยละ 90-110';
                    } else if (ind.targetBenchmark === 0) {
                      targetText = '0';
                    } else if (ind.benchmarkType === 'MIN') {
                      targetText =
                        ind.targetBenchmark === 100
                          ? 'ร้อยละ 100'
                          : `≥ ร้อยละ ${ind.targetBenchmark}`;
                    } else {
                      targetText = `≤ ร้อยละ ${ind.targetBenchmark}`;
                    }

                    const isNeverEvent =
                      ind.id === 'or_dim6_3' ||
                      ind.id === 'or_dim6_7' ||
                      ind.id === 'or_dim6_8';

                    return (
                      <div
                        key={ind.id}
                        className={`p-3.5 sm:px-4 sm:py-3 transition-colors grid grid-cols-12 gap-2 items-center ${
                          isNeverEvent
                            ? 'bg-rose-50/30 hover:bg-rose-50/50'
                            : severity === 'CRITICAL'
                            ? 'bg-rose-50/40 hover:bg-rose-50/60'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Name and Description */}
                        <div className="col-span-12 sm:col-span-5">
                          <div className="flex items-start gap-1.5">
                            {isNeverEvent && (
                              <span className="mt-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-600 text-white shrink-0">
                                NEVER EVENT
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-800 leading-snug">
                              {ind.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-2">
                            {ind.description}
                          </p>
                        </div>

                        {/* Target Benchmark */}
                        <div className="col-span-4 sm:col-span-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              ind.targetBenchmark === 0
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {targetText}
                          </span>
                        </div>

                        {/* Live Value & Status Badge */}
                        <div className="col-span-4 sm:col-span-2 text-center">
                          {val !== undefined ? (
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                  severity === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : severity === 'WARNING'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {val} {ind.unit}
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                {severity === 'NORMAL'
                                  ? 'ผ่านเกณฑ์'
                                  : severity === 'WARNING'
                                  ? 'เฝ้าระวัง'
                                  : 'หลุดเกณฑ์'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              รอประเมิน
                            </span>
                          )}
                        </div>

                        {/* Responsible Person (Editable inline) */}
                        <div className="col-span-4 sm:col-span-3 text-right">
                          {editingIndId === ind.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="text"
                                defaultValue={ind.responsiblePerson || ''}
                                placeholder="พิมพ์ชื่อผู้รับผิดชอบ..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newName = (e.target as HTMLInputElement).value.trim();
                                    ind.responsiblePerson = newName;
                                    localStorage.setItem(`qa_or_resp_${ind.id}`, newName);
                                    if (onUpdateResponsiblePerson) {
                                      onUpdateResponsiblePerson(ind.id, newName);
                                    }
                                    setEditingIndId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingIndId(null);
                                  }
                                }}
                                onBlur={(e) => {
                                  const newName = e.target.value.trim();
                                  ind.responsiblePerson = newName;
                                  localStorage.setItem(`qa_or_resp_${ind.id}`, newName);
                                  if (onUpdateResponsiblePerson) {
                                    onUpdateResponsiblePerson(ind.id, newName);
                                  }
                                  setEditingIndId(null);
                                }}
                                className="text-xs px-2 py-1 border border-blue-400 rounded-md bg-white text-slate-900 w-36 outline-hidden focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingIndId(ind.id)}
                              className="group inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                              title="คลิกเพื่อแก้ไขหรือระบุผู้รับผิดชอบ"
                            >
                              {ind.responsiblePerson ? (
                                <span className="font-medium text-slate-700 group-hover:text-blue-700">
                                  {ind.responsiblePerson}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[10px] group-hover:text-blue-600">
                                  + ระบุผู้รับผิดชอบ
                                </span>
                              )}
                              <Pencil className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
