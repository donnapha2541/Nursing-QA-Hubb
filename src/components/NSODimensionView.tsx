import React, { useState } from 'react';
import { IndicatorDefinition, QARecord, UserProfile } from '../types/nursing';
import { NSO_DIMENSIONS, NSODimension } from '../data/nsoIndicators';
import { evaluateIndicatorSeverity, exportToCSV } from '../utils/calculations';
import {
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Download,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  UserCheck,
  TrendingUp,
  Pencil,
} from 'lucide-react';

interface NSODimensionViewProps {
  indicators: IndicatorDefinition[];
  latestRecord?: QARecord;
  currentUser: UserProfile;
  onOpenNewRecord: () => void;
  onOpenNewIncident: () => void;
  onUpdateResponsiblePerson?: (indicatorId: string, name: string) => void;
}

export const NSODimensionView: React.FC<NSODimensionViewProps> = ({
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
  const dimensionStats = NSO_DIMENSIONS.map((dim) => {
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

  const handleExportNSOCSV = () => {
    const headers = [
      'มิติการประเมิน',
      'ลำดับและตัวชี้วัด',
      'ค่าเป้าหมาย',
      'ผลการประเมินจริง',
      'สถานะ',
      'ผู้รับผิดชอบ',
    ];

    const rows = filteredIndicators.map((ind) => {
      const dim = NSO_DIMENSIONS.find((d) => d.id === ind.dimensionId);
      const val = latestRecord?.values[ind.id] ?? '-';
      const severity = typeof val === 'number' ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';

      let targetStr = '';
      if (ind.targetBenchmark === 0) {
        targetStr = ind.id === 'nso_dim6_9' ? '0 (หรือตามบริบท)' : '0';
      } else if (ind.benchmarkType === 'MIN') {
        targetStr = ind.targetBenchmark === 100 ? 'ร้อยละ 100' : `≥ ร้อยละ ${ind.targetBenchmark}`;
      } else {
        targetStr = `≤ ร้อยละ ${ind.targetBenchmark}`;
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

    exportToCSV('NSO_Nursing_Quality_Indicators_6_Dimensions', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: NSO Official Quality Standard */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>เกณฑ์ชี้วัดคุณภาพการพยาบาลในภาพรวมขององค์กรพยาบาล (NSO)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-['Prompt',sans-serif] tracking-tight">
              แบบประเมินและติดตามตัวชี้วัดคุณภาพ 6 มิติ (40 ตัวชี้วัด)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
              มาตรฐานการบริหารการพยาบาล กรมการแพทย์ / สภาการพยาบาล และสถาบันรับรองคุณภาพสถานพยาบาล (HA)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportNSOCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก NSO (CSV)</span>
            </button>
            <button
              onClick={onOpenNewRecord}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all shadow-md"
            >
              <span>+ บันทึกเกณฑ์ NSO</span>
            </button>
          </div>
        </div>

        {/* Dimension Summary Cards (6 Dimensions) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-white/10">
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
                    isSelected ? 'bg-slate-900 text-white' : 'bg-white/20 text-emerald-200'
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
            ทั้งหมด (6 มิติ)
          </button>
          {NSO_DIMENSIONS.map((dim) => (
            <button
              key={dim.id}
              onClick={() => setSelectedDimId(dim.id)}
              className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                selectedDimId === dim.id
                  ? 'bg-emerald-700 text-white'
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
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
          />
        </div>
      </div>

      {/* Dimension Groups & Indicators Table matching User's Image */}
      <div className="space-y-4">
        {NSO_DIMENSIONS.map((dimension) => {
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
                        <th className="px-3 py-2.5 text-center w-36">ค่าเป้าหมาย</th>
                        <th className="px-3 py-2.5 text-center w-32">ผลงานจริง</th>
                        <th className="px-3 py-2.5 text-center w-28">สถานะ</th>
                        <th className="px-4 py-2.5 w-48">ผู้รับผิดชอบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dimIndicators.map((ind, index) => {
                        const val = latestRecord?.values[ind.id];
                        const hasVal = val !== undefined;
                        const severity = hasVal ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';

                        // Format target text matching the user's attachment
                        let targetText = '';
                        if (ind.targetBenchmark === 0) {
                          targetText = ind.id === 'nso_dim6_9' ? '0 (หรือตามบริบท)' : '0';
                        } else if (ind.benchmarkType === 'MIN') {
                          targetText =
                            ind.targetBenchmark === 100
                              ? 'ร้อยละ 100'
                              : `≥ ร้อยละ ${ind.targetBenchmark}`;
                        } else {
                          targetText = `≤ ร้อยละ ${ind.targetBenchmark}`;
                        }

                        return (
                          <tr
                            key={ind.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              severity === 'CRITICAL'
                                ? 'bg-rose-50/50'
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
    </div>
  );
};
