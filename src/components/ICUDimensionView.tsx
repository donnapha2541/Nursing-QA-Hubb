import React, { useState } from 'react';
import { IndicatorDefinition, QARecord, UserProfile, ICU_SUB_DEPARTMENTS, WardResponsible } from '../types/nursing';
import { ICU_DIMENSIONS } from '../data/icuIndicators';
import { getWardResponsible } from '../data/mockData';
import { evaluateIndicatorSeverity, exportToCSV } from '../utils/calculations';
import { EditWardResponsibleModal } from './EditWardResponsibleModal';
import {
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Download,
  Search,
  Layers,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Pencil,
  Building2,
  Phone,
  UserCheck,
  PlusCircle,
} from 'lucide-react';

interface ICUDimensionViewProps {
  indicators: IndicatorDefinition[];
  latestRecord?: QARecord;
  icuRecords?: QARecord[];
  currentUser: UserProfile;
  wardResponsibles?: Record<string, WardResponsible>;
  onOpenNewRecord: () => void;
  onOpenNewIncident: () => void;
  onUpdateResponsiblePerson?: (indicatorId: string, name: string) => void;
  onUpdateWardResponsible?: (wardId: string, data: WardResponsible) => void;
  initialSubDepartment?: string;
}

export const ICUDimensionView: React.FC<ICUDimensionViewProps> = ({
  indicators,
  latestRecord,
  icuRecords = [],
  currentUser,
  wardResponsibles = {},
  onOpenNewRecord,
  onOpenNewIncident,
  onUpdateResponsiblePerson,
  onUpdateWardResponsible,
  initialSubDepartment,
}) => {
  const [selectedDimId, setSelectedDimId] = useState<string>('ALL');
  const [selectedSubDept, setSelectedSubDept] = useState<string>(initialSubDepartment || 'ALL');

  React.useEffect(() => {
    if (initialSubDepartment) {
      setSelectedSubDept(initialSubDepartment);
    }
  }, [initialSubDepartment]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndId, setEditingIndId] = useState<string | null>(null);
  const [editingWardModal, setEditingWardModal] = useState<{ isOpen: boolean; wardId: string; wardName: string }>({
    isOpen: false,
    wardId: 'MICU',
    wardName: 'MICU (ไอซียูอายุรกรรม)',
  });
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

  // Determine active record based on selected ICU sub-unit
  const activeRecord = React.useMemo(() => {
    if (selectedSubDept === 'ALL' || icuRecords.length === 0) {
      return latestRecord;
    }
    const matching = icuRecords.filter((r) => r.subDepartment === selectedSubDept);
    if (matching.length > 0) {
      return matching.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    }
    return latestRecord;
  }, [selectedSubDept, icuRecords, latestRecord]);

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

  // Calculate statistics for each dimension using activeRecord
  const dimensionStats = ICU_DIMENSIONS.map((dim) => {
    const dimInds = indicators.filter((i) => i.dimensionId === dim.id);
    let passed = 0;
    let critical = 0;
    let warning = 0;

    dimInds.forEach((ind) => {
      const val = activeRecord?.values[ind.id];
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

  const handleExportICUCSV = () => {
    const headers = [
      'มิติการประเมิน',
      'ลำดับและตัวชี้วัด',
      'ค่าเป้าหมาย',
      'ผลการประเมินจริง',
      'สถานะ',
      'ผู้รับผิดชอบ',
    ];

    const rows = filteredIndicators.map((ind) => {
      const dim = ICU_DIMENSIONS.find((d) => d.id === ind.dimensionId);
      const val = activeRecord?.values[ind.id] ?? '-';
      const severity = typeof val === 'number' ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';

      let targetStr = '';
      if (ind.id === 'icu_dim2_1') {
        targetStr = 'ร้อยละ 90-110';
      } else if (ind.id === 'icu_dim2_2') {
        targetStr = 'ตามบริบทของหน่วยงาน';
      } else if (ind.id === 'icu_dim6_11') {
        targetStr = '0(หรือตามบริบท)';
      } else if (ind.targetBenchmark === 0) {
        targetStr = '0';
      } else if (ind.benchmarkType === 'MIN') {
        targetStr = ind.targetBenchmark === 100 ? 'ร้อยละ100' : `≥ร้อยละ ${ind.targetBenchmark}`;
      } else {
        targetStr = `≤ร้อยละ${ind.targetBenchmark}`;
      }

      return [
        `${dim?.code}: ${dim?.nameTh}`,
        ind.name,
        targetStr,
        val !== '-' ? `${val} ${ind.unit}` : 'ยังไม่บันทึก',
        severity === 'NORMAL' ? 'ผ่านเกณฑ์' : severity === 'WARNING' ? 'เฝ้าระวัง' : 'ผิดปกติ/วิกฤต',
        ind.responsiblePerson || '-',
      ];
    });

    exportToCSV(`ICU_${selectedSubDept}_Quality_Indicators`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: ICU Official Quality Standard */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-rose-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs font-semibold mb-2">
              <HeartPulse className="w-3.5 h-3.5 text-rose-300" />
              <span>เกณฑ์ชี้วัดคุณภาพการพยาบาลผู้ป่วยหนัก 6 มิติ (ICU)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-['Prompt',sans-serif] tracking-tight">
              แบบประเมินและติดตามตัวชี้วัดคุณภาพหอผู้ป่วยหนัก (43 ตัวชี้วัด)
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/80 mt-1 max-w-2xl">
              มาตรฐานคุณภาพและความปลอดภัยผู้ป่วยวิกฤต (Critical Care Safety) สภาการพยาบาล และ HA
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportICUCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก ICU ({selectedSubDept}) CSV</span>
            </button>
            <button
              onClick={onOpenNewIncident}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/60 hover:bg-rose-600 text-white text-xs font-bold border border-rose-400/40 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>แจ้งความเสี่ยง ICU</span>
            </button>
            <button
              onClick={onOpenNewRecord}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-400 hover:bg-rose-300 text-slate-950 text-xs font-bold transition-all shadow-md"
            >
              <span>+ บันทึกเกณฑ์ ICU</span>
            </button>
          </div>
        </div>

        {/* ICU Sub-Unit Filter Bar (MICU, SICU, ICUชั้น5, NICU) */}
        <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-rose-200">
            <Building2 className="w-4 h-4 text-rose-300" />
            <span className="font-bold">จำแนกตามหอผู้ป่วย ICU (Sub-Units):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedSubDept('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedSubDept === 'ALL'
                  ? 'bg-white text-rose-950 border-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              ภาพรวมทุกหอ ICU รวม
            </button>
            {ICU_SUB_DEPARTMENTS.map((sub) => {
              const isSelected = selectedSubDept === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubDept(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-300 shadow-md ring-2 ring-rose-300/50'
                      : 'bg-white/10 hover:bg-white/20 text-rose-100 border-white/20'
                  }`}
                >
                  {sub.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected ICU Ward Responsible Person Active Banner */}
        {selectedSubDept !== 'ALL' && (() => {
          const subInfo = ICU_SUB_DEPARTMENTS.find((s) => s.id === selectedSubDept);
          const resp = getWardResponsible(wardResponsibles, selectedSubDept);
          const isAssigned = Boolean(resp.headNurseName && resp.headNurseName.trim().length > 0);

          return (
            <div className={`mt-4 p-3.5 rounded-xl border text-xs text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isAssigned
                ? 'bg-white/10 backdrop-blur-md border-white/20'
                : 'bg-amber-500/15 backdrop-blur-md border-amber-300/40 text-amber-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg shrink-0 border ${
                  isAssigned ? 'bg-rose-500/20 border-rose-300/30 text-rose-200' : 'bg-amber-500/20 border-amber-300/40 text-amber-200'
                }`}>
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{subInfo?.nameTh || selectedSubDept}</span>
                    {isAssigned ? (
                      resp.phoneInternal && (
                        <span className="text-[10px] bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded-full border border-rose-400/30 font-medium flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          เบอร์ภายใน: {resp.phoneInternal}
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/30 font-medium">
                        ยังไม่ได้ระบุผู้รับผิดชอบหอผู้ป่วยวิกฤตนี้
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-rose-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                    {isAssigned ? (
                      <>
                        <span><strong>หัวหน้า ICU:</strong> {resp.headNurseName}</span>
                        {resp.qaLeadName && <span><strong>ผู้รับผิดชอบ QA:</strong> {resp.qaLeadName}</span>}
                        {resp.note && <span className="text-rose-200">({resp.note})</span>}
                      </>
                    ) : (
                      <span className="text-amber-200/90">
                        ยังไม่มีการลงชื่อผู้รับผิดชอบ — แต่ละหอ ICU สามารถกดปุ่มด้านขวาเพื่อลงชื่อหัวหน้าหอและเบอร์ติดต่อของตนเองได้
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingWardModal({
                  isOpen: true,
                  wardId: selectedSubDept,
                  wardName: subInfo?.nameTh || selectedSubDept,
                })}
                className={`shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm ${
                  isAssigned
                    ? 'bg-rose-400 text-slate-950 hover:bg-rose-300'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isAssigned ? 'แก้ไขผู้รับผิดชอบหอผู้ป่วยวิกฤตนี้' : '+ ลงชื่อผู้รับผิดชอบหอผู้ป่วยวิกฤตนี้'}</span>
              </button>
            </div>
          );
        })()}

        {/* Dimension Summary Cards (6 Dimensions) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
          {dimensionStats.map((stat) => {
            const isSelected = selectedDimId === stat.dim.id;
            return (
              <button
                key={stat.dim.id}
                onClick={() => setSelectedDimId(selectedDimId === stat.dim.id ? 'ALL' : stat.dim.id)}
                className={`p-2.5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-white text-slate-900 border-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-slate-900 text-white' : 'bg-white/20 text-rose-200'
                  }`}>
                    {stat.dim.code}
                  </span>
                  <span className="text-xs font-extrabold">{stat.passRate}%</span>
                </div>
                <h5 className="text-[11px] font-bold truncate mt-1">
                  {stat.dim.nameTh}
                </h5>
                <div className="flex items-center justify-between text-[10px] opacity-80 mt-1">
                  <span>{stat.total} ตัวชี้วัด</span>
                  {stat.critical > 0 ? (
                    <span className="text-rose-400 font-bold">{stat.critical} วิกฤต</span>
                  ) : stat.warning > 0 ? (
                    <span className="text-amber-300 font-bold">{stat.warning} เฝ้าระวัง</span>
                  ) : (
                    <span className="text-emerald-300 font-bold">ผ่านเกณฑ์</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Dimension Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setSelectedDimId('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
              selectedDimId === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด (6 มิติ 43 ข้อ)
          </button>
          {ICU_DIMENSIONS.map((dim) => (
            <button
              key={dim.id}
              onClick={() => setSelectedDimId(dim.id)}
              className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                selectedDimId === dim.id
                  ? 'bg-rose-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dim.code}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตัวชี้วัด, ผู้รับผิดชอบ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
          />
        </div>
      </div>

      {/* Dimension Groups & Indicators Table matching User's Image */}
      <div className="space-y-4">
        {ICU_DIMENSIONS.map((dimension) => {
          if (selectedDimId !== 'ALL' && selectedDimId !== dimension.id) return null;

          const dimIndicators = filteredIndicators.filter((i) => i.dimensionId === dimension.id);
          if (dimIndicators.length === 0) return null;

          const isExpanded = expandedDims[dimension.id] ?? true;

          return (
            <div
              key={dimension.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Dimension Group Header */}
              <div
                onClick={() => toggleDimension(dimension.id)}
                className="bg-slate-100/90 hover:bg-slate-200/80 px-4 py-3 flex items-center justify-between cursor-pointer border-b border-slate-200 transition-colors select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${dimension.badgeBg}`}>
                    {dimension.code}
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-['Prompt',sans-serif]">
                      {dimension.nameTh}
                    </h3>
                    <p className="text-[11px] text-slate-500 hidden sm:block">
                      {dimension.descriptionTh}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {dimIndicators.length} ตัวชี้วัด
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Table of Indicators in this Dimension */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="px-3 py-2.5 w-12 text-center">ลำดับ</th>
                        <th className="px-4 py-2.5">ตัวชี้วัด</th>
                        <th className="px-3 py-2.5 text-center w-40">ค่าเป้าหมาย</th>
                        <th className="px-3 py-2.5 text-center w-32">ผลงานจริง</th>
                        <th className="px-3 py-2.5 text-center w-28">สถานะ</th>
                        <th className="px-4 py-2.5 w-48">ผู้รับผิดชอบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dimIndicators.map((ind, index) => {
                        const val = activeRecord?.values[ind.id];
                        const hasVal = val !== undefined;
                        const severity = hasVal ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';

                        // Format target text matching the user's ICU attachment
                        let targetText = '';
                        if (ind.id === 'icu_dim2_1') {
                          targetText = 'ร้อยละ 90-110';
                        } else if (ind.id === 'icu_dim2_2') {
                          targetText = 'ตามบริบทของหน่วยงาน';
                        } else if (ind.id === 'icu_dim6_11') {
                          targetText = '0(หรือตามบริบท)';
                        } else if (ind.id === 'icu_dim6_12') {
                          targetText = '0 (หรือตามบริบท)';
                        } else if (ind.targetBenchmark === 0) {
                          targetText = '0';
                        } else if (ind.benchmarkType === 'MIN') {
                          targetText =
                            ind.targetBenchmark === 100
                              ? 'ร้อยละ100'
                              : `≥ร้อยละ 80`;
                        } else {
                          targetText = ind.id === 'icu_dim3_3' ? '≤ร้อยละ5' : `≤ร้อยละ${ind.targetBenchmark}`;
                        }

                        return (
                          <tr
                            key={ind.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              severity === 'CRITICAL'
                                ? 'bg-rose-50/60'
                                : severity === 'WARNING'
                                ? 'bg-amber-50/40'
                                : ''
                            }`}
                          >
                            {/* Number */}
                            <td className="px-3 py-2.5 text-center font-bold text-slate-500">
                              {index + 1}
                            </td>

                            {/* Indicator Title & description */}
                            <td className="px-4 py-2.5">
                              <div className="font-semibold text-slate-900 leading-snug">
                                {ind.name.replace(/^[0-9]+\.\s*/, '')}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {ind.description}
                              </p>
                            </td>

                            {/* Target Benchmark */}
                            <td className="px-3 py-2.5 text-center font-bold text-slate-700 bg-slate-50/50">
                              {targetText}
                            </td>

                            {/* Actual result */}
                            <td className="px-3 py-2.5 text-center">
                              {hasVal ? (
                                <span
                                  className={`text-xs sm:text-sm font-extrabold font-['Prompt',sans-serif] ${
                                    severity === 'CRITICAL'
                                      ? 'text-rose-600 font-black animate-pulse'
                                      : severity === 'WARNING'
                                      ? 'text-amber-600 font-bold'
                                      : 'text-emerald-700'
                                  }`}
                                >
                                  {val} {ind.unit}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">-</span>
                              )}
                            </td>

                            {/* Status badge */}
                            <td className="px-3 py-2.5 text-center">
                              {severity === 'CRITICAL' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                                  ไม่ผ่านเกณฑ์
                                </span>
                              ) : severity === 'WARNING' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  เฝ้าระวัง
                                </span>
                              ) : hasVal ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ผ่านเกณฑ์
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">รอประเมิน</span>
                              )}
                            </td>

                            {/* Responsible Person */}
                            <td className="px-4 py-2.5 text-slate-600 text-[11px]">
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
                                  className="w-full px-2 py-1 text-xs border border-sky-400 rounded-md bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 shadow-2xs"
                                  placeholder="พิมพ์ชื่อ/ตำแหน่งผู้รับผิดชอบ..."
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingIndId(ind.id)}
                                  className="group/resp inline-flex items-center gap-1.5 text-left hover:text-sky-700 transition-colors py-1 px-1.5 rounded-md hover:bg-sky-50/80 cursor-pointer"
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

      {/* Edit ICU Ward Responsible Modal */}
      <EditWardResponsibleModal
        isOpen={editingWardModal.isOpen}
        wardId={editingWardModal.wardId}
        wardNameTh={editingWardModal.wardName}
        currentData={getWardResponsible(wardResponsibles, editingWardModal.wardId)}
        currentUser={currentUser}
        onClose={() => setEditingWardModal((prev) => ({ ...prev, isOpen: false }))}
        onSave={(wardId, data) => {
          onUpdateWardResponsible?.(wardId, data);
        }}
      />
    </div>
  );
};
