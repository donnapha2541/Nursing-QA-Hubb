import React, { useState } from 'react';
import { IndicatorDefinition, QARecord, UserProfile, IPD_SUB_DEPARTMENTS, WardResponsible } from '../types/nursing';
import { IPD_DIMENSIONS } from '../data/ipdIndicators';
import { getWardResponsible } from '../data/mockData';
import { evaluateIndicatorSeverity, exportToCSV } from '../utils/calculations';
import { getFiscalYear } from '../utils/fiscalYear';
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
  Bed,
  PlusCircle,
  Clock,
  Sparkles,
  Target,
  UserCheck,
  Pencil,
  Building2,
  Phone,
  User,
  Building,
} from 'lucide-react';

interface IPDDimensionViewProps {
  indicators: IndicatorDefinition[];
  latestRecord?: QARecord;
  ipdRecords?: QARecord[];
  currentUser: UserProfile;
  wardResponsibles?: Record<string, WardResponsible>;
  onOpenNewRecord: () => void;
  onOpenNewIncident: () => void;
  onUpdateResponsiblePerson?: (indicatorId: string, name: string) => void;
  onUpdateWardResponsible?: (wardId: string, data: WardResponsible) => void;
  onOpenWardDirectory?: () => void;
  initialSubDepartment?: string;
}

export const IPDDimensionView: React.FC<IPDDimensionViewProps> = ({
  indicators,
  latestRecord,
  ipdRecords = [],
  currentUser,
  wardResponsibles = {},
  onOpenNewRecord,
  onOpenNewIncident,
  onUpdateResponsiblePerson,
  onUpdateWardResponsible,
  onOpenWardDirectory,
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
    wardId: 'MALE_MED',
    wardName: 'หอผู้ป่วยอายุรกรรมชาย',
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

  // Determine active record based on selected IPD ward
  const activeRecord = React.useMemo(() => {
    if (selectedSubDept === 'ALL' || ipdRecords.length === 0) {
      return latestRecord;
    }
    const matching = ipdRecords.filter((r) => r.subDepartment === selectedSubDept);
    if (matching.length > 0) {
      return matching.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    }
    return latestRecord;
  }, [selectedSubDept, ipdRecords, latestRecord]);

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
  const dimensionStats = IPD_DIMENSIONS.map((dim) => {
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

  const handleExportIPDCSV = () => {
    const headers = [
      'มิติการประเมิน',
      'ลำดับและตัวชี้วัด',
      'ค่าเป้าหมาย',
      'ผลการประเมินจริง',
      'สถานะ',
      'ผู้รับผิดชอบ',
    ];

    const rows = filteredIndicators.map((ind) => {
      const val = activeRecord?.values[ind.id];
      const severity = val !== undefined ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';
      const statusText =
        severity === 'NORMAL' ? 'ผ่านเกณฑ์' : severity === 'WARNING' ? 'เฝ้าระวัง' : 'วิกฤต';

      return [
        ind.dimensionName || '-',
        ind.name,
        `${ind.targetBenchmark} ${ind.unit}`,
        val !== undefined ? `${val} ${ind.unit}` : 'ยังไม่บันทึก',
        statusText,
        ind.responsiblePerson || '-',
      ];
    });

    exportToCSV(`IPD_${selectedSubDept}_Nursing_QA_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const totalPassed = dimensionStats.reduce((acc, curr) => acc + curr.passed, 0);
  const overallRate =
    indicators.length > 0 ? Math.round((totalPassed / indicators.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* IPD Header Card */}
      <div className="bg-gradient-to-r from-sky-800 via-teal-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 text-sky-200">
              <Bed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Prompt',sans-serif] tracking-tight">
                  เกณฑ์ชี้วัดคุณภาพการพยาบาลผู้ป่วยใน 6 มิติ (IPD QA Hub)
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-300/30 font-medium">
                  หอผู้ป่วยใน • 43 ตัวชี้วัด (15 หอผู้ป่วย)
                </span>
              </div>
              <p className="text-xs text-sky-100/90 mt-1">
                การประเมินคุณภาพและบริหารความเสี่ยงผู้ป่วยในตามเกณฑ์มาตรฐาน HA (Hospital Accreditation)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportIPDCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-colors shadow-xs"
              title="ดาวน์โหลดข้อมูล 6 มิติ IPD เป็นไฟล์ Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก ({selectedSubDept}) CSV</span>
            </button>
            <button
              onClick={onOpenNewIncident}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs border border-rose-400/30 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>แจ้งเหตุความเสี่ยง IPD</span>
            </button>
            <button
              onClick={onOpenNewRecord}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
              <span>บันทึกตัวชี้วัด IPD</span>
            </button>
          </div>
        </div>

        {/* IPD Ward Sub-Unit Selector Bar (15 Wards) */}
        <div className="mt-5 pt-3.5 border-t border-white/15 space-y-2">
          <div className="flex items-center justify-between text-xs text-sky-200">
            <span className="font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-300" />
              <span>เลือกกรองตามหอผู้ป่วยใน (15 Wards):</span>
            </span>
            <span className="text-[11px] text-sky-300 font-semibold">
              {selectedSubDept === 'ALL'
                ? 'ภาพรวมทุกหอผู้ป่วยในรวม'
                : IPD_SUB_DEPARTMENTS.find((s) => s.id === selectedSubDept)?.nameTh}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedSubDept('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                selectedSubDept === 'ALL'
                  ? 'bg-white text-sky-950 border-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              ภาพรวม IPD รวม
            </button>
            {IPD_SUB_DEPARTMENTS.map((sub) => {
              const isSelected = selectedSubDept === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubDept(sub.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-300 shadow-md ring-2 ring-sky-300/50'
                      : 'bg-white/10 hover:bg-white/20 text-sky-100 border-white/20'
                  }`}
                >
                  {sub.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Ward Responsible Person Active Banner */}
        {selectedSubDept !== 'ALL' && (() => {
          const subInfo = IPD_SUB_DEPARTMENTS.find((s) => s.id === selectedSubDept);
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
                  isAssigned ? 'bg-sky-500/20 border-sky-300/30 text-sky-200' : 'bg-amber-500/20 border-amber-300/40 text-amber-200'
                }`}>
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{subInfo?.nameTh || selectedSubDept}</span>
                    {isAssigned ? (
                      resp.phoneInternal && (
                        <span className="text-[10px] bg-sky-900/60 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/30 font-medium flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          เบอร์ภายใน: {resp.phoneInternal}
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/30 font-medium">
                        ยังไม่ได้ระบุผู้รับผิดชอบตึกนี้
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sky-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                    {isAssigned ? (
                      <>
                        <span><strong>หัวหน้าหอผู้ป่วย:</strong> {resp.headNurseName}</span>
                        {resp.qaLeadName && <span><strong>ผู้รับผิดชอบ QA:</strong> {resp.qaLeadName}</span>}
                        {resp.note && <span className="text-sky-200">({resp.note})</span>}
                      </>
                    ) : (
                      <span className="text-amber-200/90">
                        ยังไม่มีการลงชื่อผู้รับผิดชอบ — แต่ละตึกสามารถคลิกปุ่มด้านขวาเพื่อลงชื่อหัวหน้าหอและเบอร์ติดต่อของตึกตนเองได้
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
                    ? 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isAssigned ? 'แก้ไขผู้รับผิดชอบตึกนี้' : '+ ลงชื่อผู้รับผิดชอบตึกนี้'}</span>
              </button>
            </div>
          );
        })()}

        {/* Latest Record Summary Ribbon */}
        {activeRecord && (
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-sky-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sky-200">
                <Clock className="w-3.5 h-3.5 text-sky-300" />
                <span>บันทึกล่าสุด: {activeRecord.timestamp}</span>
              </span>
              <span>•</span>
              <span>ผู้บันทึก: {activeRecord.recordedBy}</span>
              <span>•</span>
              <span>ครองเตียง: {activeRecord.patientCount} Bed-Days</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sky-200">คะแนนความสอดคล้องรวม:</span>
              <span className="font-extrabold text-sm text-emerald-300 font-['Prompt',sans-serif]">
                {overallRate}%
              </span>
              <span className="text-[10px] text-sky-300">
                ({totalPassed}/{indicators.length} ผ่านเกณฑ์)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ward Submission Matrix Table for 15 IPD Wards */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-['Prompt',sans-serif] flex items-center gap-2 flex-wrap">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>สถานะการลงข้อมูลและผู้รับผิดชอบแยกรายตึก (15 หอผู้ป่วย)</span>
              {activeRecord && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                  รอบปีงบประมาณ พ.ศ. {activeRecord.fiscalYear || getFiscalYear(activeRecord.date)} (พบ {ipdRecords.length} บันทึก)
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              แต่ละตึกลงข้อมูลและแต่งตั้งผู้รับผิดชอบประจำตึกได้แยกกันโดยอิสระ
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenWardDirectory && (
              <button
                type="button"
                onClick={onOpenWardDirectory}
                className="text-xs bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="เปิดทำเนียบผู้รับผิดชอบทุกหอผู้ป่วย"
              >
                <Building className="w-3.5 h-3.5 text-teal-600" />
                <span>ทำเนียบผู้รับผิดชอบ (Directory)</span>
              </button>
            )}
            <button
              onClick={onOpenNewRecord}
              className="text-xs bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>+ บันทึกข้อมูลตึกของฉัน</span>
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-3 py-2">ชื่อตึก / หอผู้ป่วย</th>
                <th className="px-3 py-2">หัวหน้าหอผู้ป่วย / ผู้รับผิดชอบ</th>
                <th className="px-3 py-2 text-center">สถานะลงข้อมูล</th>
                <th className="px-3 py-2 text-center">บันทึกล่าสุด</th>
                <th className="px-3 py-2">ผู้บันทึก</th>
                <th className="px-3 py-2 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {IPD_SUB_DEPARTMENTS.map((ward) => {
                const wardRecords = ipdRecords.filter((r) => r.subDepartment === ward.id);
                const latestWardRec = wardRecords.sort(
                  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )[0];
                const isSelected = selectedSubDept === ward.id;
                const resp = getWardResponsible(wardResponsibles, ward.id);
                const isAssigned = Boolean(resp.headNurseName && resp.headNurseName.trim().length > 0);

                return (
                  <tr
                    key={ward.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-sky-50/80 font-bold' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        <span className="font-bold text-slate-900">{ward.shortName}</span>
                        <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                          ({ward.nameTh})
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {isAssigned ? (
                        <div className="flex items-center justify-between gap-2 group/ward">
                          <div>
                            <p className="font-semibold text-slate-900">{resp.headNurseName}</p>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                              {resp.phoneInternal && <span>📞 {resp.phoneInternal}</span>}
                              {resp.qaLeadName && <span>| QA: {resp.qaLeadName}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingWardModal({
                              isOpen: true,
                              wardId: ward.id,
                              wardName: ward.nameTh,
                            })}
                            className="p-1 hover:bg-sky-100 text-slate-400 hover:text-sky-700 rounded transition opacity-60 hover:opacity-100"
                            title="แก้ไขผู้รับผิดชอบตึกนี้"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingWardModal({
                            isOpen: true,
                            wardId: ward.id,
                            wardName: ward.nameTh,
                          })}
                          className="text-left text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md border border-dashed border-amber-300 text-[11px] font-semibold transition flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3 text-amber-600" />
                          <span>+ ระบุผู้รับผิดชอบ</span>
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {latestWardRec ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          บันทึกแล้ว
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          รอลงข้อมูล
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600 text-[11px]">
                      {latestWardRec ? latestWardRec.timestamp : '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700 text-[11px]">
                      {latestWardRec ? latestWardRec.recordedBy : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => setSelectedSubDept(ward.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition-all ${
                          isSelected
                            ? 'bg-sky-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-sky-100 hover:text-sky-900'
                        }`}
                      >
                        {isSelected ? 'กำลังดูตึกนี้' : 'ดูข้อมูลตึกนี้'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6 Dimension Snapshot Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {dimensionStats.map((item) => {
          const isSelected = selectedDimId === item.dim.id;
          return (
            <button
              key={item.dim.id}
              onClick={() => setSelectedDimId(isSelected ? 'ALL' : item.dim.id)}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group shadow-2xs ${
                isSelected
                  ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">{item.dim.code}</span>
                <span
                  className={`text-[11px] font-extrabold font-['Prompt',sans-serif] ${
                    item.passRate >= 85 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {item.passRate}%
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 truncate leading-snug">
                {item.dim.nameTh}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>{item.total} ตัวชี้วัด</span>
                <div className="flex items-center gap-1">
                  {item.critical > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                  {item.warning > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                  {item.critical === 0 && item.warning === 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.passRate >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${item.passRate}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium no-scrollbar">
          <button
            onClick={() => setSelectedDimId('ALL')}
            className={`px-3 py-1.5 rounded-lg shrink-0 font-bold transition-all ${
              selectedDimId === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด (43 ตัวชี้วัด)
          </button>
          {IPD_DIMENSIONS.map((dim) => (
            <button
              key={dim.id}
              onClick={() => setSelectedDimId(dim.id)}
              className={`px-3 py-1.5 rounded-lg shrink-0 font-bold transition-all ${
                selectedDimId === dim.id
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dim.code}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตัวชี้วัด, ผู้รับผิดชอบ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
          />
        </div>
      </div>

      {/* 6 Dimensions Accordion List */}
      <div className="space-y-4">
        {IPD_DIMENSIONS.map((dim) => {
          if (selectedDimId !== 'ALL' && selectedDimId !== dim.id) return null;

          const dimIndicators = filteredIndicators.filter((i) => i.dimensionId === dim.id);
          if (dimIndicators.length === 0) return null;

          const isExpanded = expandedDims[dim.id] ?? true;

          return (
            <div
              key={dim.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleDimension(dim.id)}
                className="w-full px-4 sm:px-6 py-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between border-b border-slate-200 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-900 font-bold text-xs flex items-center justify-center font-['Prompt',sans-serif] shrink-0">
                    {dim.code.replace('มิติที่ ', 'M')}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Prompt',sans-serif]">
                        {dim.code} : {dim.nameTh}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-500">
                        ({dimIndicators.length} ตัวชี้วัด)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 hidden sm:block mt-0.5 line-clamp-1">
                      {dim.descriptionTh}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Table / Content */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 w-12 text-center">ข้อ</th>
                        <th className="py-2.5 px-4">ชื่อตัวชี้วัดและคำอธิบาย</th>
                        <th className="py-2.5 px-4 w-32 text-center">เกณฑ์เป้าหมาย</th>
                        <th className="py-2.5 px-4 w-28 text-center">ผลการประเมิน</th>
                        <th className="py-2.5 px-4 w-28 text-center">สถานะ</th>
                        <th className="py-2.5 px-4 w-44 hidden md:table-cell">ผู้รับผิดชอบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dimIndicators.map((ind, idx) => {
                        const val = activeRecord?.values[ind.id];
                        const severity =
                          val !== undefined ? evaluateIndicatorSeverity(ind, val) : 'NORMAL';

                        let badgeColor =
                          'bg-emerald-50 text-emerald-800 border-emerald-200';
                        let badgeIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
                        let statusText = 'ผ่านเกณฑ์';

                        if (severity === 'WARNING') {
                          badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                          badgeIcon = <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
                          statusText = 'เฝ้าระวัง';
                        } else if (severity === 'CRITICAL') {
                          badgeColor =
                            'bg-rose-50 text-rose-800 border-rose-300 animate-pulse';
                          badgeIcon = <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
                          statusText = 'เกินเกณฑ์วิกฤต';
                        }

                        // Target label formatting
                        let targetText = `${ind.targetBenchmark} ${ind.unit}`;
                        if (ind.id === 'ipd_dim2_1') {
                          targetText = 'ร้อยละ 90-110';
                        } else if (ind.id === 'ipd_dim2_2') {
                          targetText = 'ตามบริบทของหน่วยงาน';
                        } else if (ind.id === 'ipd_dim6_11') {
                          targetText = '0 (หรือตามบริบท)';
                        } else if (ind.id === 'ipd_dim6_12') {
                          targetText = '0 ต่อ 1000 วันนอน (หรือตามบริบท)';
                        } else if (ind.targetBenchmark === 0) {
                          targetText = '0';
                        } else if (ind.benchmarkType === 'MIN') {
                          targetText = ind.targetBenchmark === 100 ? 'ร้อยละ 100' : `≥ ร้อยละ ${ind.targetBenchmark}`;
                        } else {
                          targetText = `≤ ร้อยละ ${ind.targetBenchmark}`;
                        }

                        return (
                          <tr key={ind.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 text-center font-bold text-slate-500 font-['Prompt',sans-serif]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 leading-snug">{ind.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                {ind.description}
                              </p>
                              {ind.responsiblePerson && (
                                <p className="text-[10px] text-sky-700 mt-1 md:hidden">
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

      {/* Edit Ward Responsible Modal */}
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
