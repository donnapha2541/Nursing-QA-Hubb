import React, { useState, useEffect } from 'react';
import {
  DepartmentConfig,
  DepartmentId,
  QARecord,
  UserProfile,
  IncidentReport,
  ICU_SUB_DEPARTMENTS,
  SPECIAL_TREATMENT_SUB_DEPARTMENTS,
  IPD_SUB_DEPARTMENTS,
  WardResponsible,
} from '../types/nursing';
import { getWardResponsible } from '../data/mockData';
import {
  evaluateIndicatorSeverity,
  canUserEditDepartment,
} from '../utils/calculations';
import {
  getFiscalYear,
  getFiscalQuarter,
  FISCAL_QUARTERS,
} from '../utils/fiscalYear';
import { soundAlert } from '../utils/audioAlert';
import { EditWardResponsibleModal } from './EditWardResponsibleModal';
import {
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Plus,
  Minus,
  Sparkles,
  Lock,
  Mic,
  MicOff,
  Clock,
  Calendar,
  Layers,
  Info,
  UserCheck,
  Phone,
  Pencil,
} from 'lucide-react';

interface DataEntryFormProps {
  departments: DepartmentConfig[];
  initialDepartmentId: DepartmentId;
  currentUser: UserProfile;
  isOpen: boolean;
  wardResponsibles?: Record<string, WardResponsible>;
  onClose: () => void;
  onSaveRecord: (record: QARecord) => void;
  onTriggerInstantIncident: (deptId: DepartmentId, title: string, desc: string) => void;
  onUpdateWardResponsible?: (wardId: string, data: WardResponsible) => void;
}

const DIMENSION_CONFIGS: Record<string, { code: string; shortTitle: string; badgeStyle: string }> = {
  DIM_1: {
    code: 'มิติที่ 1',
    shortTitle: 'นำองค์กร',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  DIM_2: {
    code: 'มิติที่ 2',
    shortTitle: 'ประสิทธิภาพ',
    badgeStyle: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  DIM_3: {
    code: 'มิติที่ 3',
    shortTitle: 'ผู้ใช้บริการ',
    badgeStyle: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  DIM_4: {
    code: 'มิติที่ 4',
    shortTitle: 'บุคลากร',
    badgeStyle: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  DIM_5: {
    code: 'มิติที่ 5',
    shortTitle: 'ระบบงาน',
    badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  DIM_6: {
    code: 'มิติที่ 6',
    shortTitle: 'บริการพยาบาล',
    badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
  },
};

export const DataEntryForm: React.FC<DataEntryFormProps> = ({
  departments,
  initialDepartmentId,
  currentUser,
  isOpen,
  wardResponsibles = {},
  onClose,
  onSaveRecord,
  onTriggerInstantIncident,
  onUpdateWardResponsible,
}) => {
  const [isEditWardOpen, setIsEditWardOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState<DepartmentId>(initialDepartmentId);
  const [subDepartment, setSubDepartment] = useState<string>('MICU');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<'MORNING' | 'AFTERNOON' | 'NIGHT' | 'MONTHLY_SUMMARY'>('MORNING');
  const [patientCount, setPatientCount] = useState<number>(30); // Denominator
  const [rawCounts, setRawCounts] = useState<Record<string, number>>({});
  const [calculatedValues, setCalculatedValues] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [formDimensionFilter, setFormDimensionFilter] = useState<string>('ALL');

  const handleFillCompliantDefaults = () => {
    const compliantCounts: Record<string, number> = {};
    const compliantVals: Record<string, number> = {};

    activeDepartment.indicators.forEach((ind) => {
      compliantVals[ind.id] = ind.targetBenchmark;
      if (ind.unit === '%') {
        compliantCounts[ind.id] = Math.round((ind.targetBenchmark / 100) * patientCount);
      } else {
        compliantCounts[ind.id] = ind.targetBenchmark;
      }
    });

    setRawCounts(compliantCounts);
    setCalculatedValues(compliantVals);
    soundAlert.playSuccessTone();
  };

  // Sync initial department
  useEffect(() => {
    if (initialDepartmentId) {
      setDepartmentId(initialDepartmentId);
    }
  }, [initialDepartmentId, isOpen]);

  const activeDepartment =
    departments.find((d) => d.id === departmentId) || departments[0];

  // Check RBAC permission for this department
  const canEdit = canUserEditDepartment(currentUser.role, currentUser.departmentId, departmentId);

  // Initialize or reset counts when department changes
  useEffect(() => {
    if (departmentId === 'SPECIAL_TREATMENT' && subDepartment !== 'OPD_EYE' && subDepartment !== 'HEMODIALYSIS') {
      setSubDepartment('OPD_EYE');
    } else if (departmentId === 'ICU' && !['MICU', 'SICU', 'ICU5', 'NICU'].includes(subDepartment)) {
      setSubDepartment('MICU');
    } else if (departmentId === 'IPD' && !IPD_SUB_DEPARTMENTS.some((s) => s.id === subDepartment)) {
      setSubDepartment('MALE_MED');
    }

    const defaultCounts: Record<string, number> = {};
    const defaultVals: Record<string, number> = {};

    activeDepartment.indicators.forEach((ind) => {
      // Sensible defaults based on indicator type
      if (ind.unit === '%') {
        defaultVals[ind.id] = ind.targetBenchmark;
        defaultCounts[ind.id] = Math.round((ind.targetBenchmark / 100) * patientCount);
      } else {
        defaultCounts[ind.id] = 0;
        defaultVals[ind.id] = 0;
      }
    });

    setRawCounts(defaultCounts);
    setCalculatedValues(defaultVals);
  }, [departmentId, patientCount]);

  if (!isOpen) return null;

  // Handle count change & calculate rate
  const handleCountChange = (indId: string, newCount: number) => {
    const validCount = Math.max(0, newCount);
    const updatedRaw = { ...rawCounts, [indId]: validCount };
    setRawCounts(updatedRaw);

    const ind = activeDepartment.indicators.find((i) => i.id === indId);
    if (!ind) return;

    let computedValue = validCount;
    if (ind.unit === '%') {
      computedValue = patientCount > 0 ? Math.round((validCount / patientCount) * 1000) / 10 : 0;
    } else if (ind.unit.includes('1,000')) {
      computedValue = patientCount > 0 ? Math.round((validCount / patientCount) * 10000) / 10 : 0;
    }

    const updatedVals = { ...calculatedValues, [indId]: computedValue };
    setCalculatedValues(updatedVals);

    // Real-time Audio & Severity check
    const severity = evaluateIndicatorSeverity(ind, computedValue);
    if (severity === 'CRITICAL') {
      soundAlert.playCriticalAlert();
    } else if (severity === 'WARNING') {
      soundAlert.playWarningAlert();
    }
  };

  const handleDirectValueChange = (indId: string, val: number) => {
    const updatedVals = { ...calculatedValues, [indId]: val };
    setCalculatedValues(updatedVals);

    const ind = activeDepartment.indicators.find((i) => i.id === indId);
    if (ind) {
      const severity = evaluateIndicatorSeverity(ind, val);
      if (severity === 'CRITICAL') {
        soundAlert.playCriticalAlert();
      } else if (severity === 'WARNING') {
        soundAlert.playWarningAlert();
      }
    }
  };

  // Simulate Voice Dictation for ward mobile convenience
  const handleToggleVoiceNote = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setNotes((prev) =>
          prev ? `${prev} ผู้ป่วยอาการคงที่ ส่งเวรเรียบร้อยไม่มีอุบัติการณ์เพิ่ม` : 'ผู้ป่วยอาการคงที่ ส่งเวรเรียบร้อยไม่มีอุบัติการณ์เพิ่ม'
        );
        setIsListening(false);
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const newRecord: QARecord = {
      id: `rec-${departmentId.toLowerCase()}-${Date.now()}`,
      departmentId,
      subDepartment: (departmentId === 'ICU' || departmentId === 'SPECIAL_TREATMENT' || departmentId === 'IPD') ? subDepartment : undefined,
      date,
      month: date.substring(0, 7),
      fiscalYear: getFiscalYear(date),
      fiscalQuarter: getFiscalQuarter(date),
      shift,
      recordedBy: currentUser.name,
      recordedByRole: currentUser.role,
      timestamp: new Date().toISOString(),
      patientCount,
      denominatorLabel: `จำนวนผู้รับบริการ / วันนอน (${patientCount})`,
      values: calculatedValues,
      rawCounts,
      incidents: [],
      status: 'SUBMITTED',
      notes,
    };

    soundAlert.playSuccessTone();
    onSaveRecord(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-900 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs font-['Prompt',sans-serif]">
              {activeDepartment.shortName}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-['Prompt',sans-serif] leading-tight">
                บันทึกตัวชี้วัดคุณภาพ (QA Data Entry)
              </h3>
              <p className="text-[11px] text-teal-100 font-medium">
                {activeDepartment.nameTh}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Notice Banner */}
        {!canEdit && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-800">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>โหมดอ่านอย่างเดียว (Read-Only):</strong> บัญชีปัจจุบัน ({currentUser.name}) ไม่มีสิทธิ์บันทึกข้อมูลของกลุ่มงานนี้ (อนุญาตเฉพาะกลุ่มงาน {currentUser.departmentId} หรือ NSO/QA Manager)
            </span>
          </div>
        )}

        {/* Form Body - Touch & Tablet Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Section 1: Department & Shift Context */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Department Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  กลุ่มงานการพยาบาล
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value as DepartmentId)}
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.shortName} - {d.nameTh.split('(')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  วันที่บันทึกข้อมูล
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden"
                  required
                />
                <p className="mt-1 text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-teal-600 shrink-0" />
                  <span>ปีงบประมาณ {getFiscalYear(date)} • ไตรมาส {getFiscalQuarter(date)} ({FISCAL_QUARTERS[getFiscalQuarter(date)].rangeTh})</span>
                </p>
              </div>

              {/* Shift */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  เวรปฏิบัติการ / รอบประเมิน
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden"
                >
                  <option value="MORNING">☀️ เวรเช้า (08:00 - 16:00)</option>
                  <option value="AFTERNOON">⛅ เวรบ่าย (16:00 - 24:00)</option>
                  <option value="NIGHT">🌙 เวรดึก (24:00 - 08:00)</option>
                  <option value="MONTHLY_SUMMARY">📊 สรุปรวมประจำเดือน</option>
                </select>
              </div>
            </div>

            {/* Sub-Unit Selector for ICU */}
            {departmentId === 'ICU' && (
              <div className="pt-2 border-t border-slate-200/80 bg-rose-50/60 -mx-3.5 -mb-3.5 p-3 rounded-b-xl border-rose-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 font-['Prompt',sans-serif]">
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px]">ICU Sub-Unit</span>
                    <span>เลือกหน่วยงานย่อย ICU (ลงข้อมูลรวมในหมวด ICU):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ICU_SUB_DEPARTMENTS.map((sub) => {
                      const isSelected = subDepartment === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSubDepartment(sub.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                              : 'bg-white text-rose-900 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {sub.shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Unit Selector for Special Treatment */}
            {departmentId === 'SPECIAL_TREATMENT' && (
              <div className="pt-2 border-t border-slate-200/80 bg-indigo-50/60 -mx-3.5 -mb-3.5 p-3 rounded-b-xl border-indigo-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 font-['Prompt',sans-serif]">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px]">ตรวจรักษาพิเศษ</span>
                    <span>เลือกหน่วยงานย่อย (ลงข้อมูลรวมในหมวด ตรวจรักษาพิเศษ):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {SPECIAL_TREATMENT_SUB_DEPARTMENTS.map((sub) => {
                      const isSelected = subDepartment === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSubDepartment(sub.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                              : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {sub.shortName} ({sub.nameTh.split('(')[0].trim()})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Unit Selector for IPD Wards (15 Wards) */}
            {departmentId === 'IPD' && (
              <div className="pt-2 border-t border-slate-200/80 bg-sky-50/70 -mx-3.5 -mb-3.5 p-3 rounded-b-xl border-sky-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-950 font-['Prompt',sans-serif] flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-sky-600 text-white rounded text-[10px]">IPD Ward</span>
                      <span>เลือกหอผู้ป่วยใน (15 หอผู้ป่วย - ลงข้อมูลรวมในหมวด IPD):</span>
                    </span>
                    <span className="text-[11px] text-sky-700 font-semibold">
                      {IPD_SUB_DEPARTMENTS.find((s) => s.id === subDepartment)?.nameTh || ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {IPD_SUB_DEPARTMENTS.map((sub) => {
                      const isSelected = subDepartment === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSubDepartment(sub.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                            isSelected
                              ? 'bg-sky-700 text-white border-sky-800 shadow-xs ring-1 ring-sky-300'
                              : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-100'
                          }`}
                        >
                          {sub.shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Ward Responsible Person Info Ribbon */}
            {(departmentId === 'IPD' || departmentId === 'ICU' || departmentId === 'SPECIAL_TREATMENT') && (() => {
              const resp = getWardResponsible(wardResponsibles, subDepartment);
              const isAssigned = Boolean(resp.headNurseName && resp.headNurseName.trim().length > 0);

              return (
                <div className={`mt-2 text-xs p-2.5 rounded-lg border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-colors ${
                  isAssigned
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <UserCheck className={`w-4 h-4 shrink-0 ${isAssigned ? 'text-teal-600' : 'text-amber-600'}`} />
                    <div>
                      <span>
                        <strong className="text-slate-900">ผู้รับผิดชอบตึก ({subDepartment}):</strong>{' '}
                        {isAssigned ? (
                          <>
                            <span className="font-bold text-teal-800">{resp.headNurseName}</span>
                            {resp.phoneInternal && <span className="text-teal-700 font-semibold ml-1">(📞 {resp.phoneInternal})</span>}
                            {resp.qaLeadName && <span className="text-slate-500 font-normal hidden sm:inline"> • QA: {resp.qaLeadName}</span>}
                          </>
                        ) : (
                          <span className="text-amber-700 italic">ยังไม่ได้ระบุผู้รับผิดชอบ</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    {!isAssigned && onUpdateWardResponsible && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateWardResponsible(subDepartment, {
                            headNurseName: currentUser.name,
                            headNursePosition: currentUser.roleNameTh.split('(')[0].trim() || 'หัวหน้าหอผู้ป่วย',
                            qaLeadName: '',
                            phoneInternal: '',
                            note: '',
                            lastUpdated: new Date().toLocaleDateString('th-TH'),
                            updatedBy: currentUser.name,
                          });
                        }}
                        className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 hover:bg-teal-200 text-teal-800 transition flex items-center gap-1"
                        title={`ตั้งฉัน (${currentUser.name}) เป็นผู้รับผิดชอบตึกนี้`}
                      >
                        <Sparkles className="w-3 h-3 text-teal-600" />
                        <span>ใส่ชื่อฉัน</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditWardOpen(true)}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3 text-slate-500" />
                      <span>{isAssigned ? 'แก้ไข' : '+ ระบุชื่อ'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section 2: Denominator (ตัวตั้ง/ตัวหาร ผู้ป่วยครองเตียงหรือหัตถการ) */}
          <div className="bg-teal-50/50 border border-teal-200/80 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5 font-['Prompt',sans-serif]">
                <Info className="w-3.5 h-3.5 text-teal-700" />
                <span>จำนวนตัวหารประชากร (Denominator)</span>
              </span>
              <p className="text-[11px] text-teal-800 mt-0.5">
                {departmentId === 'ICU' || departmentId === 'IPD'
                  ? 'จำนวนวันนอนผู้ป่วยรวม (Patient Bed-Days)'
                  : departmentId === 'ER' || departmentId === 'OPD'
                  ? 'จำนวนผู้ป่วยรับบริการทั้งหมด'
                  : departmentId === 'OR' || departmentId === 'ANESTHESIA'
                  ? 'จำนวนเคสผ่าตัด/ระงับความรู้สึก'
                  : departmentId === 'LR'
                  ? 'จำนวนหญิงคลอดทั้งหมด'
                  : 'จำนวนเคสที่ให้บริการ'}
              </p>
            </div>

            {/* Touch Counter for Denominator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPatientCount(Math.max(1, patientCount - 5))}
                className="w-8 h-8 rounded-lg bg-white border border-teal-300 text-teal-800 font-bold flex items-center justify-center hover:bg-teal-100 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="1"
                value={patientCount}
                onChange={(e) => setPatientCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center font-bold text-base bg-white border border-teal-300 rounded-lg py-1 text-teal-950 outline-hidden"
              />

              <button
                type="button"
                onClick={() => setPatientCount(patientCount + 5)}
                className="w-8 h-8 rounded-lg bg-white border border-teal-300 text-teal-800 font-bold flex items-center justify-center hover:bg-teal-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section 3: Dynamic Department Indicators (Touch-friendly for Phone & iPad) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['Prompt',sans-serif] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  รายการตัวชี้วัด {activeDepartment.shortName} ({activeDepartment.indicators.length} รายการ)
                </span>
              </h4>

              {/* Quick Preset Action for NSO / Large indicator sets */}
              <button
                type="button"
                onClick={handleFillCompliantDefaults}
                className="text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-md transition-colors self-start sm:self-auto flex items-center gap-1"
                title="กำหนดค่าตัวชี้วัดทั้งหมดให้อยู่ในเกณฑ์เป้าหมาย"
              >
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>ใส่ค่าผ่านเกณฑ์เริ่มต้นอัตโนมัติ</span>
              </button>
            </div>

            {/* If NSO, ICU, IPD, ER, ANC, OPD, ANESTHESIA, OR, LR, IC, or SPECIAL_TREATMENT, show 6-Dimension quick filter tabs */}
            {(departmentId === 'NSO' || departmentId === 'ICU' || departmentId === 'IPD' || departmentId === 'ER' || departmentId === 'ANC' || departmentId === 'OPD' || departmentId === 'ANESTHESIA' || departmentId === 'OR' || departmentId === 'LR' || departmentId === 'IC' || departmentId === 'SPECIAL_TREATMENT') && (
              <div className="flex items-center gap-1 overflow-x-auto py-1 text-[11px] font-medium no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFormDimensionFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md shrink-0 font-bold transition-colors ${
                    formDimensionFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด ({activeDepartment.indicators.length} ข้อ)
                </button>
                {['DIM_1', 'DIM_2', 'DIM_3', 'DIM_4', 'DIM_5', 'DIM_6'].map((dimId, idx) => {
                  const dimNames = ['มิติ 1 นำองค์กร', 'มิติ 2 ประสิทธิภาพ', 'มิติ 3 ผู้ใช้บริการ', 'มิติ 4 บุคลากร', 'มิติ 5 ระบบงาน', 'มิติ 6 บริการพยาบาล'];
                  const dimCount = activeDepartment.indicators.filter((i) => i.dimensionId === dimId).length;
                  return (
                    <button
                      key={dimId}
                      type="button"
                      onClick={() => setFormDimensionFilter(dimId)}
                      className={`px-2.5 py-1 rounded-md shrink-0 font-bold transition-colors ${
                        formDimensionFilter === dimId
                          ? departmentId === 'SPECIAL_TREATMENT'
                            ? 'bg-indigo-700 text-white'
                            : departmentId === 'IC'
                            ? 'bg-emerald-700 text-white'
                            : departmentId === 'LR'
                            ? 'bg-rose-700 text-white'
                            : departmentId === 'OR'
                            ? 'bg-blue-700 text-white'
                            : departmentId === 'ANESTHESIA'
                            ? 'bg-purple-700 text-white'
                            : departmentId === 'OPD'
                            ? 'bg-cyan-700 text-white'
                            : departmentId === 'ANC'
                            ? 'bg-pink-700 text-white'
                            : departmentId === 'ER'
                            ? 'bg-red-700 text-white'
                            : departmentId === 'ICU'
                            ? 'bg-rose-700 text-white'
                            : departmentId === 'IPD'
                            ? 'bg-sky-700 text-white'
                            : 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {dimNames[idx]} ({dimCount})
                    </button>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              {activeDepartment.indicators
                .filter((ind) => formDimensionFilter === 'ALL' || ind.dimensionId === formDimensionFilter)
                .map((ind) => {
                  const currentVal = calculatedValues[ind.id] ?? 0;
                  const rawCount = rawCounts[ind.id] ?? 0;
                  const severity = evaluateIndicatorSeverity(ind, currentVal);

                  return (
                    <div
                      key={ind.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        severity === 'CRITICAL'
                          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300'
                          : severity === 'WARNING'
                          ? 'bg-amber-50/60 border-amber-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const dimKey =
                                ind.dimensionId ||
                                (ind.dimensionName?.match(/มิติที่\s*(\d+)/)
                                  ? `DIM_${ind.dimensionName.match(/มิติที่\s*(\d+)/)![1]}`
                                  : undefined);
                              const dimCfg = dimKey ? DIMENSION_CONFIGS[dimKey] : null;

                              if (dimCfg) {
                                return (
                                  <span
                                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 shrink-0 ${dimCfg.badgeStyle}`}
                                    title={ind.dimensionName || `${dimCfg.code} - ${dimCfg.shortTitle}`}
                                  >
                                    <span className="font-extrabold">{dimCfg.code}</span>
                                    <span className="hidden sm:inline font-medium opacity-85">
                                      • {dimCfg.shortTitle}
                                    </span>
                                  </span>
                                );
                              }

                              if (ind.dimensionName) {
                                return (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {ind.dimensionName}
                                  </span>
                                );
                              }

                              return null;
                            })()}
                            <span className="text-xs font-bold text-slate-900">{ind.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              (เป้าหมาย: {ind.benchmarkType === 'MIN' ? '≥' : '≤'} {ind.targetBenchmark} {ind.unit})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{ind.description}</p>
                          {ind.responsiblePerson && (
                            <span className="text-[10px] text-teal-700 block mt-0.5">
                              ผู้รับผิดชอบ: {ind.responsiblePerson}
                            </span>
                          )}
                        </div>

                      {/* Live Calculated Metric Badge */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-xs text-slate-500 font-medium">ผลคำนวณ:</span>
                        <span
                          className={`text-sm sm:text-base font-extrabold px-2.5 py-0.5 rounded-lg border font-['Prompt',sans-serif] ${
                            severity === 'CRITICAL'
                              ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                              : severity === 'WARNING'
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {currentVal} {ind.unit}
                        </span>
                      </div>
                    </div>

                    {/* Numeric Input & Steppers (Optimized for Mobile/iPad fingers) */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {ind.unit === '%' ? (
                          // Percentage direct slider or input
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              disabled={!canEdit}
                              value={currentVal}
                              onChange={(e) =>
                                handleDirectValueChange(ind.id, parseFloat(e.target.value))
                              }
                              className="w-32 sm:w-44 accent-teal-600 cursor-pointer"
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              disabled={!canEdit}
                              value={currentVal}
                              onChange={(e) =>
                                handleDirectValueChange(ind.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 p-1 text-xs text-center font-bold border border-slate-300 rounded-md"
                            />
                            <span className="text-xs text-slate-600">%</span>
                          </div>
                        ) : (
                          // Case count steppers (+ / -)
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-600 font-medium mr-1">จำนวนเคส:</span>
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => handleCountChange(ind.id, rawCount - 1)}
                              className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center disabled:opacity-50"
                            >
                              -1
                            </button>
                            <input
                              type="number"
                              min="0"
                              disabled={!canEdit}
                              value={rawCount}
                              onChange={(e) =>
                                handleCountChange(ind.id, parseInt(e.target.value) || 0)
                              }
                              className="w-14 p-1 text-center font-bold text-xs border border-slate-300 rounded-md"
                            />
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => handleCountChange(ind.id, rawCount + 1)}
                              className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center disabled:opacity-50"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => handleCountChange(ind.id, rawCount + 5)}
                              className="px-2 h-8 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold disabled:opacity-50"
                            >
                              +5
                            </button>
                          </div>
                        )}
                      </div>

                      {/* If Critical, Show Instant Incident Action Prompt */}
                      {severity === 'CRITICAL' && (
                        <button
                          type="button"
                          onClick={() =>
                            onTriggerInstantIncident(
                              activeDepartment.id,
                              `ตรวจพบค่าวิกฤต: ${ind.name} (${currentVal} ${ind.unit})`,
                              `บันทึกพบค่าตัวชี้วัดผิดปกติเกินเกณฑ์วิกฤตในเวร ${shift} วันที่ ${date}`
                            )
                          }
                          className="text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>เปิดใบรายงานอุบัติการณ์ด่วน (IR)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Clinical Notes & Ward Handoff with Speech helper */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                หมายเหตุเพิ่มเติม / ข้อสังเกตประจำเวร
              </label>
              <button
                type="button"
                onClick={handleToggleVoiceNote}
                className={`text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                  isListening
                    ? 'bg-rose-100 text-rose-700 font-bold animate-pulse'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-3 h-3 text-rose-600" />
                    <span>กำลังฟังเสียงพิมพ์บันทึก...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-slate-500" />
                    <span>พิมพ์ด้วยเสียง (จำลอง)</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={2}
              value={notes}
              disabled={!canEdit}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="บันทึกข้อสังเกต ปัญหา อุปสรรค หรือมาตรการควบคุมความเสี่ยงเพิ่มเติมในเวร..."
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>

          {/* Submit Action Bar */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              ผู้บันทึก: <strong>{currentUser.name}</strong> ({currentUser.roleNameTh.split('(')[0]})
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!canEdit}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกข้อมูล QA</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Edit Ward Modal triggered from Data Entry */}
      <EditWardResponsibleModal
        isOpen={isEditWardOpen}
        wardId={subDepartment}
        wardNameTh={`หอผู้ป่วย / หน่วยงาน: ${subDepartment}`}
        currentData={getWardResponsible(wardResponsibles, subDepartment)}
        currentUser={currentUser}
        onClose={() => setIsEditWardOpen(false)}
        onSave={(wardId, data) => {
          onUpdateWardResponsible?.(wardId, data);
        }}
      />
    </div>
  );
};
