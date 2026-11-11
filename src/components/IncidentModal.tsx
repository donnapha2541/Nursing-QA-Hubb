import React, { useState, useEffect } from 'react';
import {
  IncidentReport,
  DepartmentConfig,
  DepartmentId,
  RiskLevel,
  UserProfile,
  ICU_SUB_DEPARTMENTS,
  SPECIAL_TREATMENT_SUB_DEPARTMENTS,
  IPD_SUB_DEPARTMENTS,
  WardResponsible,
} from '../types/nursing';
import { getWardResponsible } from '../data/mockData';
import { RISK_LEVELS, canUserResolveIncidents } from '../utils/calculations';
import { getFiscalYear, getFiscalQuarter, FISCAL_QUARTERS } from '../utils/fiscalYear';
import { soundAlert } from '../utils/audioAlert';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Save,
  HelpCircle,
  Clock,
  User,
  UserCheck,
  Calendar,
} from 'lucide-react';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentConfig[];
  initialDepartmentId?: DepartmentId;
  initialTitle?: string;
  initialDescription?: string;
  existingIncident?: IncidentReport | null;
  currentUser: UserProfile;
  wardResponsibles?: Record<string, WardResponsible>;
  onSaveIncident: (incident: IncidentReport) => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  onClose,
  departments,
  initialDepartmentId,
  initialTitle = '',
  initialDescription = '',
  existingIncident = null,
  currentUser,
  wardResponsibles = {},
  onSaveIncident,
}) => {
  const [departmentId, setDepartmentId] = useState<DepartmentId>(
    initialDepartmentId || 'ICU'
  );
  const [subDepartment, setSubDepartment] = useState<string>('MICU');
  const [title, setTitle] = useState(initialTitle);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:00');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('D');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientGender, setPatientGender] = useState<'ชาย' | 'หญิง'>('ชาย');
  const [description, setDescription] = useState(initialDescription);
  const [immediateAction, setImmediateAction] = useState('');
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'INVESTIGATING' | 'RESOLVED'>('OPEN');
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (existingIncident) {
      setDepartmentId(existingIncident.departmentId);
      if (existingIncident.subDepartment) setSubDepartment(existingIncident.subDepartment);
      setTitle(existingIncident.title);
      setDate(existingIncident.date);
      setTime(existingIncident.time);
      setRiskLevel(existingIncident.riskLevel);
      setPatientAge(existingIncident.patientAge ?? '');
      setPatientGender(existingIncident.patientGender ?? 'ชาย');
      setDescription(existingIncident.description);
      setImmediateAction(existingIncident.immediateAction);
      setRootCauseAnalysis(existingIncident.rootCauseAnalysis ?? '');
      setPreventiveAction(existingIncident.preventiveAction ?? '');
      setStatus(existingIncident.status);
      setResolutionNote(existingIncident.resolutionNote ?? '');
    } else {
      if (initialDepartmentId) setDepartmentId(initialDepartmentId);
      if (initialTitle) setTitle(initialTitle);
      if (initialDescription) setDescription(initialDescription);
    }
  }, [existingIncident, initialDepartmentId, initialTitle, initialDescription, isOpen]);

  if (!isOpen) return null;

  const canResolve = canUserResolveIncidents(currentUser.role);
  const currentRisk = RISK_LEVELS[riskLevel];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isCritical = ['G', 'H', 'I'].includes(riskLevel);
    const isWarning = ['C', 'D', 'E', 'F'].includes(riskLevel);

    const savedIncident: IncidentReport = {
      id: existingIncident?.id || `inc-${Date.now()}`,
      departmentId,
      subDepartment: (departmentId === 'ICU' || departmentId === 'SPECIAL_TREATMENT' || departmentId === 'IPD') ? subDepartment : undefined,
      title,
      date,
      time,
      fiscalYear: getFiscalYear(date),
      fiscalQuarter: getFiscalQuarter(date),
      riskLevel,
      severity: isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NORMAL',
      description,
      patientAge: typeof patientAge === 'number' ? patientAge : undefined,
      patientGender,
      immediateAction,
      rootCauseAnalysis,
      preventiveAction,
      reportedBy: existingIncident?.reportedBy || currentUser.name,
      status,
      resolvedAt:
        status === 'RESOLVED'
          ? existingIncident?.resolvedAt || new Date().toISOString()
          : undefined,
      resolvedBy: status === 'RESOLVED' ? currentUser.name : undefined,
      resolutionNote: status === 'RESOLVED' ? resolutionNote : undefined,
    };

    if (isCritical) {
      soundAlert.playCriticalAlert();
    } else {
      soundAlert.playSuccessTone();
    }

    onSaveIncident(savedIncident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-600 text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-['Prompt',sans-serif]">
                {existingIncident
                  ? `รายงานอุบัติการณ์ความเสี่ยง (${existingIncident.id})`
                  : 'แบบรายงานอุบัติการณ์และความเสี่ยงทางการพยาบาล (Incident Report - IR)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                มาตรฐาน National Incident Reporting System (NRLS) ระดับ A - I
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* NRLS Level Selector Matrix (A to I) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1 font-['Prompt',sans-serif]">
                <span>ระดับความรุนแรงตามเกณฑ์ NRLS (Risk Severity Level)</span>
                <span className="text-rose-600">*</span>
              </label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${currentRisk.badgeBg}`}>
                {currentRisk.titleTh}
              </span>
            </div>

            {/* Level Buttons Grid A-I */}
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
              {(Object.keys(RISK_LEVELS) as RiskLevel[]).map((lvl) => {
                const info = RISK_LEVELS[lvl];
                const isSelected = riskLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setRiskLevel(lvl)}
                    className={`py-2 px-1 text-center rounded-lg border font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-teal-500 shadow-sm'
                        : `${info.badgeBg} hover:opacity-80`
                    }`}
                  >
                    <div className="font-extrabold text-sm">{lvl}</div>
                    <div className="text-[9px] truncate font-medium">
                      {info.category === 'NEAR_MISS'
                        ? 'Near Miss'
                        : info.category === 'NO_HARM'
                        ? 'No Harm'
                        : info.category === 'MODERATE_HARM'
                        ? 'Moderate'
                        : 'Sentinel'}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-600 mt-2 bg-white p-2 rounded-lg border border-slate-200/80">
              {currentRisk.descriptionTh}
            </p>
          </div>

          {/* Department, Date, Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                กลุ่มงานที่เกิดเหตุ
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

              {departmentId === 'ICU' && (
                <div className="mt-1.5">
                  <label className="block text-[10px] font-bold text-rose-800 mb-0.5">
                    หน่วยงานย่อย ICU
                  </label>
                  <select
                    value={subDepartment}
                    onChange={(e) => setSubDepartment(e.target.value)}
                    className="w-full text-xs font-bold bg-rose-50 border border-rose-300 rounded-lg p-1.5 text-rose-900 outline-hidden"
                  >
                    {ICU_SUB_DEPARTMENTS.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.shortName} ({sub.nameTh.split('(')[1]?.replace(')', '') || sub.nameTh})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {departmentId === 'SPECIAL_TREATMENT' && (
                <div className="mt-1.5">
                  <label className="block text-[10px] font-bold text-indigo-800 mb-0.5">
                    หน่วยงานย่อย ตรวจรักษาพิเศษ
                  </label>
                  <select
                    value={subDepartment}
                    onChange={(e) => setSubDepartment(e.target.value)}
                    className="w-full text-xs font-bold bg-indigo-50 border border-indigo-300 rounded-lg p-1.5 text-indigo-900 outline-hidden"
                  >
                    {SPECIAL_TREATMENT_SUB_DEPARTMENTS.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.shortName} ({sub.nameTh})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {departmentId === 'IPD' && (
                <div className="mt-1.5">
                  <label className="block text-[10px] font-bold text-sky-800 mb-0.5">
                    หอผู้ป่วยใน (IPD Ward)
                  </label>
                  <select
                    value={subDepartment}
                    onChange={(e) => setSubDepartment(e.target.value)}
                    className="w-full text-xs font-bold bg-sky-50 border border-sky-300 rounded-lg p-1.5 text-sky-900 outline-hidden"
                  >
                    {IPD_SUB_DEPARTMENTS.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.shortName} - {sub.nameTh}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(departmentId === 'IPD' || departmentId === 'ICU' || departmentId === 'SPECIAL_TREATMENT') && (() => {
                const resp = getWardResponsible(wardResponsibles, subDepartment);
                const isAssigned = Boolean(resp.headNurseName && resp.headNurseName.trim().length > 0);
                return (
                  <div className="mt-2 text-[10px] bg-slate-100 p-2 rounded-lg border border-slate-200 text-slate-700">
                    <span className="font-bold text-slate-900 block">👤 ผู้รับผิดชอบตึก ({subDepartment}):</span>
                    <span>
                      {isAssigned ? (
                        <>
                          <strong className="text-teal-800">{resp.headNurseName}</strong>
                          {resp.phoneInternal && ` (โทร ${resp.phoneInternal})`}
                        </>
                      ) : (
                        <span className="text-amber-700 italic">ยังไม่ได้ระบุผู้รับผิดชอบ</span>
                      )}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                วันที่เกิดเหตุ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden"
                required
              />
              <p className="mt-1 text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-rose-600 shrink-0" />
                <span>ปีงบประมาณ {getFiscalYear(date)} • ไตรมาส {getFiscalQuarter(date)} ({FISCAL_QUARTERS[getFiscalQuarter(date)].rangeTh})</span>
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                เวลาที่เกิดเหตุ
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden"
                required
              />
            </div>
          </div>

          {/* Incident Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ชื่อเหตุการณ์ / สรุปประเด็นความเสี่ยง
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ท่อช่วยหายใจเลื่อนหลุด, ข้อผิดพลาดในการบริหารยา, หกล้มข้างเตียง"
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden"
              required
            />
          </div>

          {/* Patient Demographics */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                อายุผู้ป่วย (ปี)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={patientAge}
                onChange={(e) =>
                  setPatientAge(e.target.value === '' ? '' : parseInt(e.target.value))
                }
                placeholder="ระบุอายุ"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                เพศผู้ป่วย
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-1.5"
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>
          </div>

          {/* Description of Incident */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              พฤติการณ์ / รายละเอียดเหตุการณ์ที่เกิดขึ้น
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุลำดับเหตุการณ์ สภาพแวดล้อม และอาการของผู้ป่วย..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-hidden"
              required
            />
          </div>

          {/* Immediate Action Taken */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              การแก้ไขปัญหาเฉพาะหน้าทันที (Immediate Action)
            </label>
            <textarea
              rows={2}
              value={immediateAction}
              onChange={(e) => setImmediateAction(e.target.value)}
              placeholder="การปฐมพยาบาล แจ้งแพทย์ หรือระงับเหตุการณ์ทันที..."
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-hidden"
              required
            />
          </div>

          {/* Root Cause Analysis (RCA) & Prevention */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                การวิเคราะห์สาเหตุเชิงลึก (Root Cause Analysis - RCA)
              </label>
              <textarea
                rows={2}
                value={rootCauseAnalysis}
                onChange={(e) => setRootCauseAnalysis(e.target.value)}
                placeholder="สาเหตุจากบุคคล ระบบ สิ่งแวดล้อม หรืออุปกรณ์..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                แนวทางแก้ไขเชิงระบบและป้องกันเกิดซ้ำ (Preventive Action)
              </label>
              <textarea
                rows={2}
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                placeholder="การปรับ CPG ซ้อมแผน หรือกำหนดมาตรการรัดกุม..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>

          {/* Incident Status & Resolution (for Head Nurse & QA Manager) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800">
                  สถานะการจัดการความเสี่ยง (Incident Status)
                </span>
                <p className="text-[10px] text-slate-500">
                  สำหรับหัวหน้าแผนกและกรรมการบริหารความเสี่ยง (QA/RM)
                </p>
              </div>

              <select
                disabled={!canResolve}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="text-xs font-bold bg-white border border-slate-300 rounded-lg p-1.5 focus:ring-2 focus:ring-teal-500"
              >
                <option value="OPEN">🔴 รอการตรวจสอบ (Open)</option>
                <option value="INVESTIGATING">🟡 กำลังสืบสวนสาเหตุ (Investigating)</option>
                <option value="RESOLVED">🟢 แก้ไขและปิดเคสแล้ว (Resolved)</option>
              </select>
            </div>

            {status === 'RESOLVED' && (
              <div className="mt-2.5">
                <label className="block text-[10px] font-medium text-slate-700 mb-1">
                  บันทึกการปิดเคส / ผลการติดตามอาการ
                </label>
                <input
                  type="text"
                  value={resolutionNote}
                  disabled={!canResolve}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="ระบุผลการติดตามผู้ป่วยและการปรับปรุงกระบวนการ..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-1.5"
                />
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              ผู้รายงาน: <strong>{currentUser.name}</strong> ({currentUser.roleNameTh.split('(')[0]})
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
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกรายงานความเสี่ยง (IR)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
