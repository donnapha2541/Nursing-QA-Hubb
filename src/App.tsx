/**
 * Nursing QA Data Collection, Real-time Risk Alerts & RBAC System
 * Developed for Thai Hospital Nursing Service Organization (NSO)
 */

import React, { useState, useEffect } from 'react';
import {
  DepartmentId,
  UserProfile,
  QARecord,
  IncidentReport,
  RealtimeAlert,
  WardResponsible,
} from './types/nursing';
import {
  DEPARTMENTS,
  MOCK_USERS,
  INITIAL_RECORDS,
  INITIAL_INCIDENTS,
  INITIAL_ALERTS,
  INITIAL_WARD_RESPONSIBLES,
} from './data/mockData';
import { Header } from './components/Header';
import { DepartmentTabs } from './components/DepartmentTabs';
import { DashboardView } from './components/DashboardView';
import { DataEntryForm } from './components/DataEntryForm';
import { IncidentModal } from './components/IncidentModal';
import { RiskAlertDrawer } from './components/RiskAlertDrawer';
import { IncidentHistoryTable } from './components/IncidentHistoryTable';
import { RolePermissionModal } from './components/RolePermissionModal';
import { WardDirectoryModal } from './components/WardDirectoryModal';
import { soundAlert } from './utils/audioAlert';
import { evaluateIndicatorSeverity } from './utils/calculations';
import {
  LayoutDashboard,
  FileCheck2,
  ShieldAlert,
  Bell,
  Smartphone,
  Tablet,
  Sparkles,
  Building2,
  Calendar,
  Clock,
  ChevronDown,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import {
  AVAILABLE_FISCAL_YEARS,
  FiscalYearOption,
  formatFiscalYearLabel,
  FISCAL_QUARTERS,
} from './utils/fiscalYear';


export default function App() {
  // Helper functions to clean any legacy fake names from local storage
  const sanitizeRecordAuthor = (name?: string, deptId?: string): string => {
    if (!name) return deptId === 'NSO' ? 'ผู้ตรวจการการพยาบาล (NSO)' : 'พยาบาลวิชาชีพ';
    if (
      name.includes('นันทวัน') ||
      name.includes('จุฑามาศ') ||
      name.includes('ภัทรภรณ์') ||
      name.includes('กัลยา') ||
      name.includes('อรัญญา') ||
      name.includes('นลินี') ||
      name.includes('ธีรเดช') ||
      name.includes('ชนินทร์') ||
      name.includes('กลอยใจ') ||
      name.includes('ศิราณี') ||
      name.includes('พว.')
    ) {
      return deptId === 'NSO' ? 'ผู้ตรวจการการพยาบาล (NSO)' : 'พยาบาลวิชาชีพ';
    }
    return name;
  };

  const sanitizeIncidentAuthor = (name?: string, fallback: string = 'พยาบาลวิชาชีพ'): string => {
    if (!name) return fallback;
    if (
      name.includes('จุฑามาศ') ||
      name.includes('สุภาพร') ||
      name.includes('อรัญญา') ||
      name.includes('ภัทรภรณ์') ||
      name.includes('พิมพา') ||
      name.includes('สุวิมล') ||
      name.includes('นงลักษณ์') ||
      name.includes('นันทวัน') ||
      name.includes('กัลยา') ||
      name.includes('มณีรัตน์') ||
      name.includes('พว.')
    ) {
      return fallback;
    }
    return name;
  };

  // State Initialization with LocalStorage Persistence
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nursing_qa_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          parsed.name?.includes('กลอยใจ') ||
          parsed.name?.includes('ศิราณี') ||
          parsed.name?.includes('พว.')
        ) {
          const defaultUser = parsed.id === 'u-2' ? MOCK_USERS[1] : MOCK_USERS[0];
          localStorage.setItem('nursing_qa_user', JSON.stringify(defaultUser));
          return defaultUser;
        }
        return parsed;
      } catch (e) {
        return MOCK_USERS[0];
      }
    }
    return MOCK_USERS[0];
  });

  const handleUpdateUserName = (newName: string) => {
    const updated = { ...currentUser, name: newName };
    setCurrentUser(updated);
    localStorage.setItem('nursing_qa_user', JSON.stringify(updated));
  };

  const [records, setRecords] = useState<QARecord[]>(() => {
    const saved = localStorage.getItem('nursing_qa_records');
    if (saved) {
      try {
        const parsed: QARecord[] = JSON.parse(saved);
        const ipdRec = parsed.find((r) => r.departmentId === 'IPD');
        const erRec = parsed.find((r) => r.departmentId === 'ER');
        const ancRec = parsed.find((r) => r.departmentId === 'ANC');
        const opdRec = parsed.find((r) => r.departmentId === 'OPD');
        const anesRec = parsed.find((r) => r.departmentId === 'ANESTHESIA');
        const orRec = parsed.find((r) => r.departmentId === 'OR');
        const lrRec = parsed.find((r) => r.departmentId === 'LR');
        const icRec = parsed.find((r) => r.departmentId === 'IC');
        const specRec = parsed.find((r) => r.departmentId === 'SPECIAL_TREATMENT');
        if (
          !ipdRec || !ipdRec.values || ipdRec.values.ipd_dim1_1 === undefined ||
          !erRec || !erRec.values || erRec.values.er_dim1_1 === undefined ||
          !ancRec || !ancRec.values || ancRec.values.anc_dim1_1 === undefined ||
          !opdRec || !opdRec.values || opdRec.values.opd_dim1_1 === undefined ||
          !anesRec || !anesRec.values || anesRec.values.anes_dim1_1 === undefined ||
          !orRec || !orRec.values || orRec.values.or_dim1_1 === undefined ||
          !lrRec || !lrRec.values || lrRec.values.lr_dim1_1 === undefined ||
          !icRec || !icRec.values || icRec.values.ic_dim1_1 === undefined ||
          !specRec || !specRec.values || specRec.values.spec_dim1_1 === undefined
        ) {
          return INITIAL_RECORDS;
        }

        // Clean any old names in saved records
        const sanitized = parsed.map((r) => ({
          ...r,
          recordedBy: sanitizeRecordAuthor(r.recordedBy, r.departmentId),
        }));

        // Merge missing historical fiscal records if not present in saved state
        const existingIds = new Set(sanitized.map((r) => r.id));
        const missing = INITIAL_RECORDS.filter((r) => !existingIds.has(r.id));
        if (missing.length > 0) {
          const merged = [...sanitized, ...missing];
          localStorage.setItem('nursing_qa_records', JSON.stringify(merged));
          return merged;
        }
        return sanitized;
      } catch (e) {
        return INITIAL_RECORDS;
      }
    }
    return INITIAL_RECORDS;
  });

  const [incidents, setIncidents] = useState<IncidentReport[]>(() => {
    const saved = localStorage.getItem('nursing_qa_incidents');
    if (saved) {
      try {
        const parsed: IncidentReport[] = JSON.parse(saved);
        // Clean any old names in saved incidents
        const sanitized = parsed.map((inc) => ({
          ...inc,
          reportedBy: sanitizeIncidentAuthor(inc.reportedBy, 'พยาบาลวิชาชีพ'),
          resolvedBy: inc.resolvedBy ? sanitizeIncidentAuthor(inc.resolvedBy, 'ทีมบริหารความเสี่ยง (RM)') : undefined,
        }));

        const existingIds = new Set(sanitized.map((i) => i.id));
        const missing = INITIAL_INCIDENTS.filter((i) => !existingIds.has(i.id));
        if (missing.length > 0) {
          const merged = [...sanitized, ...missing];
          localStorage.setItem('nursing_qa_incidents', JSON.stringify(merged));
          return merged;
        }
        return sanitized;
      } catch {
        return INITIAL_INCIDENTS;
      }
    }
    return INITIAL_INCIDENTS;
  });


  const [alerts, setAlerts] = useState<RealtimeAlert[]>(() => {
    const saved = localStorage.getItem('nursing_qa_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('nursing_qa_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [customResponsiblePersons, setCustomResponsiblePersons] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('nursing_qa_resp_persons');
    return saved ? JSON.parse(saved) : {};
  });

  const [wardResponsibles, setWardResponsibles] = useState<Record<string, WardResponsible>>(() => {
    const saved = localStorage.getItem('nursing_qa_ward_responsibles');
    if (saved) {
      try {
        const parsed: Record<string, WardResponsible> = JSON.parse(saved);
        // Wipe legacy mock names if present so user never sees fake names
        const sampleWard = parsed['MALE_MED'];
        if (
          sampleWard &&
          (sampleWard.headNurseName === 'พว.สมใจ มั่นคง' ||
            sampleWard.qaLeadName === 'พว.วิชัย สุขใจ')
        ) {
          localStorage.removeItem('nursing_qa_ward_responsibles');
          return INITIAL_WARD_RESPONSIBLES;
        }
        return parsed;
      } catch (e) {
        return INITIAL_WARD_RESPONSIBLES;
      }
    }
    return INITIAL_WARD_RESPONSIBLES;
  });

  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentId | 'ALL'>('ALL');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYearOption>(2569);
  const [selectedQuarter, setSelectedQuarter] = useState<number | 'ALL'>('ALL');
  const [mainView, setMainView] = useState<'DASHBOARD' | 'HISTORY'>('DASHBOARD');
  const [viewportMode, setViewportMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');


  // Modal Controllers
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [dataEntryDept, setDataEntryDept] = useState<DepartmentId>('IPD');

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentModalDept, setIncidentModalDept] = useState<DepartmentId | undefined>();
  const [incidentModalTitle, setIncidentModalTitle] = useState<string>('');
  const [incidentModalDesc, setIncidentModalDesc] = useState<string>('');
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);

  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isWardDirectoryOpen, setIsWardDirectoryOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('nursing_qa_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('nursing_qa_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('nursing_qa_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('nursing_qa_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('nursing_qa_sound', JSON.stringify(soundEnabled));
    soundAlert.soundEnabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('nursing_qa_resp_persons', JSON.stringify(customResponsiblePersons));
  }, [customResponsiblePersons]);

  useEffect(() => {
    localStorage.setItem('nursing_qa_ward_responsibles', JSON.stringify(wardResponsibles));
  }, [wardResponsibles]);

  const handleUpdateResponsiblePerson = (indicatorId: string, name: string) => {
    setCustomResponsiblePersons((prev) => ({
      ...prev,
      [indicatorId]: name,
    }));
  };

  const handleUpdateWardResponsible = (wardId: string, data: WardResponsible) => {
    setWardResponsibles((prev) => ({
      ...prev,
      [wardId]: data,
    }));
  };

  const departmentsWithResponsiblePersons = React.useMemo(() => {
    return DEPARTMENTS.map((dept) => ({
      ...dept,
      indicators: dept.indicators.map((ind) => ({
        ...ind,
        responsiblePerson: customResponsiblePersons[ind.id] !== undefined && customResponsiblePersons[ind.id] !== ''
          ? customResponsiblePersons[ind.id]
          : (ind.responsiblePerson || ''),
      })),
    }));
  }, [customResponsiblePersons]);

  // Handler to toggle sound
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState) {
      soundAlert.playWarningAlert();
    }
  };

  // Open Data Entry for specific department
  const handleOpenNewRecord = (deptId?: DepartmentId) => {
    const target = deptId || (selectedDepartment !== 'ALL' ? selectedDepartment : 'IPD');
    setDataEntryDept(target);
    setIsDataEntryOpen(true);
  };

  // Open Incident Modal
  const handleOpenNewIncident = (deptId?: DepartmentId) => {
    setEditingIncident(null);
    setIncidentModalTitle('');
    setIncidentModalDesc('');
    setIncidentModalDept(deptId || (selectedDepartment !== 'ALL' ? selectedDepartment : 'ICU'));
    setIsIncidentModalOpen(true);
  };

  // Trigger Instant Incident from form
  const handleTriggerInstantIncident = (
    deptId: DepartmentId,
    title: string,
    desc: string
  ) => {
    setEditingIncident(null);
    setIncidentModalDept(deptId);
    setIncidentModalTitle(title);
    setIncidentModalDesc(desc);
    setIsIncidentModalOpen(true);
  };

  // Save QA Record & evaluate real-time alerts
  const handleSaveRecord = (newRecord: QARecord) => {
    setRecords((prev) => [newRecord, ...prev]);

    // Check indicators for new real-time alerts
    const deptConfig = DEPARTMENTS.find((d) => d.id === newRecord.departmentId);
    if (deptConfig) {
      deptConfig.indicators.forEach((ind) => {
        const val = newRecord.values[ind.id];
        if (val !== undefined) {
          const severity = evaluateIndicatorSeverity(ind, val);
          if (severity === 'CRITICAL' || severity === 'WARNING') {
            const newAlert: RealtimeAlert = {
              id: `alt-${Date.now()}-${ind.id}`,
              departmentId: newRecord.departmentId,
              indicatorId: ind.id,
              indicatorName: ind.name,
              currentValue: val,
              benchmarkValue: ind.targetBenchmark,
              unit: ind.unit,
              severity,
              message: `ตรวจพบค่า ${ind.name} อยู่ที่ ${val} ${ind.unit} (เกณฑ์: ${
                ind.benchmarkType === 'MIN' ? '>=' : '<='
              } ${ind.targetBenchmark} ${ind.unit}) ในเวร ${newRecord.shift}`,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              isRead: false,
            };

            setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
          }
        }
      });
    }
  };

  // Save Incident Report
  const handleSaveIncident = (incident: IncidentReport) => {
    setIncidents((prev) => {
      const exists = prev.find((i) => i.id === incident.id);
      if (exists) {
        return prev.map((i) => (i.id === incident.id ? incident : i));
      }
      return [incident, ...prev];
    });

    // If critical, also add real-time alert
    if (['G', 'H', 'I'].includes(incident.riskLevel)) {
      const newAlert: RealtimeAlert = {
        id: `alt-inc-${incident.id}`,
        departmentId: incident.departmentId,
        indicatorName: `Sentinel Event: ${incident.title}`,
        currentValue: 1,
        benchmarkValue: 0,
        unit: 'เคส',
        severity: 'CRITICAL',
        message: `อุบัติการณ์ระดับ ${incident.riskLevel}: ${incident.description.substring(0, 80)}...`,
        timestamp: `${incident.date} ${incident.time}`,
        isRead: false,
        incidentId: incident.id,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  // View Existing Incident
  const handleViewIncidentDetail = (incident: IncidentReport) => {
    setEditingIncident(incident);
    setIsIncidentModalOpen(true);
  };

  // View incident by ID
  const handleViewIncidentById = (incidentId: string) => {
    const target = incidents.find((i) => i.id === incidentId);
    if (target) {
      setEditingIncident(target);
      setIsIncidentModalOpen(true);
    }
  };

  // Open incident modal for alert
  const handleOpenIncidentForAlert = (alert: RealtimeAlert) => {
    setEditingIncident(null);
    setIncidentModalDept(alert.departmentId);
    setIncidentModalTitle(`อุบัติการณ์ผิดปกติ: ${alert.indicatorName}`);
    setIncidentModalDesc(alert.message);
    setIsIncidentModalOpen(true);
  };

  // Dismiss / resolve alert
  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  // Approve QA Record
  const handleApproveRecord = (recordId: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, status: 'VERIFIED' } : r))
    );
    soundAlert.playSuccessTone();
  };

  // Active alerts count
  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div
      className={`min-h-screen bg-slate-100 flex flex-col font-['Sarabun',sans-serif] selection:bg-teal-500 selection:text-white ${
        viewportMode === 'mobile'
          ? 'items-center py-4 sm:py-8'
          : viewportMode === 'tablet'
          ? 'items-center py-4'
          : ''
      }`}
    >
      {/* Device Simulation Wrapper (for iPhone / iPad / Desktop presentation) */}
      <div
        className={`w-full transition-all duration-300 flex flex-col bg-slate-50 min-h-screen ${
          viewportMode === 'mobile'
            ? 'max-w-[420px] rounded-3xl shadow-2xl border-8 border-slate-800 overflow-hidden min-h-[850px] relative'
            : viewportMode === 'tablet'
            ? 'max-w-[860px] rounded-2xl shadow-2xl border-8 border-slate-700 overflow-hidden min-h-[900px] relative'
            : 'max-w-full'
        }`}
      >
        {/* Mobile/iPad Status Bar Simulation */}
        {viewportMode !== 'desktop' && (
          <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1.5 flex items-center justify-between shrink-0 font-medium">
            <span className="font-bold text-white">09:41</span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="px-1.5 py-0.2 rounded bg-teal-800 text-teal-200">
                {viewportMode === 'mobile' ? 'iPhone View (390px)' : 'iPad Tablet View (820px)'}
              </span>
              <span>100% 🔋</span>
            </div>
          </div>
        )}

        {/* Global Application Header */}
        <Header
          currentUser={currentUser}
          onSelectUser={setCurrentUser}
          onUpdateUserName={handleUpdateUserName}
          alerts={alerts}
          onOpenAlerts={() => setIsAlertDrawerOpen(true)}
          onOpenNewRecord={() => handleOpenNewRecord()}
          onOpenNewIncident={() => handleOpenNewIncident()}
          onOpenPermissionGuide={() => setIsPermissionModalOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          viewportMode={viewportMode}
          onChangeViewport={setViewportMode}
        />

        {/* 11 Department Tabs exactly matching user attachment */}
        <DepartmentTabs
          departments={departmentsWithResponsiblePersons}
          selectedDepartment={selectedDepartment}
          onSelectDepartment={setSelectedDepartment}
          alerts={alerts}
        />

        {/* Navigation Mode Subheader */}
        <div className="bg-white/90 border-b border-slate-200 px-3 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setMainView('DASHBOARD')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mainView === 'DASHBOARD'
                  ? 'bg-teal-50 text-teal-900 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>แดชบอร์ดคุณภาพ (QA Dashboard)</span>
            </button>
            <button
              onClick={() => setMainView('HISTORY')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mainView === 'HISTORY'
                  ? 'bg-teal-50 text-teal-900 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>ประวัติข้อมูลและรายงาน (Audit Log)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsWardDirectoryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 cursor-pointer shadow-2xs"
              title="เปิดทำเนียบผู้รับผิดชอบและเบอร์โทรภายใน 21 หอผู้ป่วย/หน่วยงาน"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>ทำเนียบผู้รับผิดชอบตึก (21 ตึก)</span>
            </button>
            <button
              onClick={() => setIsPermissionModalOpen(true)}
              className="hidden sm:flex text-slate-500 hover:text-teal-700 items-center gap-1 font-medium cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>ผังสิทธิ์บทบาท ({currentUser.roleNameTh.split('(')[0]})</span>
            </button>
          </div>
        </div>

        {/* Fiscal Year & Quarter Global Selector Bar */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-600 text-[11px]">แบ่งข้อมูลตามปีงบประมาณ:</span>
              <select
                value={selectedFiscalYear}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setSelectedFiscalYear(val as FiscalYearOption);
                }}
                className="font-bold text-teal-900 bg-teal-50/80 border border-teal-300 rounded px-2 py-0.5 outline-hidden cursor-pointer text-xs"
              >
                <option value={2570}>ปีงบประมาณ 2570 (เริ่ม ต.ค. 69 - ปัจจุบัน)</option>
                <option value={2569}>ปีงบประมาณ 2569 (ต.ค. 68 - ก.ย. 69) [เต็มปี]</option>
                <option value={2568}>ปีงบประมาณ 2568 (ต.ค. 67 - ก.ย. 68)</option>
                <option value={2567}>ปีงบประมาณ 2567 (ต.ค. 66 - ก.ย. 67)</option>
                <option value="ALL">ทุกปีงบประมาณ (All Years)</option>
              </select>
            </div>

            {/* Quarter filter pills */}
            <div className="flex items-center gap-0.5 bg-white border border-slate-300 rounded-lg p-0.5 text-xs shadow-2xs">
              <button
                onClick={() => setSelectedQuarter('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  selectedQuarter === 'ALL'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ทุกไตรมาส
              </button>
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    selectedQuarter === q
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={`${FISCAL_QUARTERS[q].nameTh} (${FISCAL_QUARTERS[q].rangeTh})`}
                >
                  <span>Q{q}</span>
                  <span className="hidden md:inline font-normal text-[10px] ml-1 text-slate-500">
                    {selectedQuarter === q ? '' : `(${FISCAL_QUARTERS[q].rangeTh})`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                รอบประเมิน: {selectedFiscalYear === 'ALL' ? 'ทุกปีงบ' : `ปีงบประมาณ ${selectedFiscalYear}`}{' '}
                {selectedQuarter !== 'ALL' ? FISCAL_QUARTERS[selectedQuarter].nameTh : '(รอบ 12 เดือน)'}
              </span>
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20">
          {mainView === 'DASHBOARD' ? (
            <DashboardView
              departments={departmentsWithResponsiblePersons}
              selectedDepartment={selectedDepartment}
              onSelectDepartment={setSelectedDepartment}
              records={records}
              incidents={incidents}
              alerts={alerts}
              currentUser={currentUser}
              wardResponsibles={wardResponsibles}
              fiscalYear={selectedFiscalYear}
              onSelectFiscalYear={setSelectedFiscalYear}
              fiscalQuarter={selectedQuarter}
              onSelectFiscalQuarter={setSelectedQuarter}
              onOpenNewRecord={handleOpenNewRecord}
              onOpenNewIncident={handleOpenNewIncident}
              onViewIncidentDetail={handleViewIncidentDetail}
              onUpdateResponsiblePerson={handleUpdateResponsiblePerson}
              onUpdateWardResponsible={handleUpdateWardResponsible}
              onOpenWardDirectory={() => setIsWardDirectoryOpen(true)}
            />
          ) : (
            <IncidentHistoryTable
              records={records}
              incidents={incidents}
              departments={departmentsWithResponsiblePersons}
              currentUser={currentUser}
              fiscalYear={selectedFiscalYear}
              onSelectFiscalYear={setSelectedFiscalYear}
              fiscalQuarter={selectedQuarter}
              onSelectFiscalQuarter={setSelectedQuarter}
              onViewIncident={handleViewIncidentDetail}
              onApproveRecord={handleApproveRecord}
              onOpenNewRecord={() => handleOpenNewRecord()}
              onOpenNewIncident={() => handleOpenNewIncident()}
            />
          )}
        </main>

        {/* Touch Bottom Navigation Bar (Mobile / iPad optimized) */}
        <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg">
          <button
            onClick={() => setMainView('DASHBOARD')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              mainView === 'DASHBOARD'
                ? 'text-teal-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>แดชบอร์ด</span>
          </button>

          <button
            onClick={() => handleOpenNewRecord()}
            className="flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold text-teal-700 hover:text-teal-800"
          >
            <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center -mt-2 shadow-md">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span className="mt-0.5">บันทึก QA</span>
          </button>

          <button
            onClick={() => handleOpenNewIncident()}
            className="flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold text-rose-700 hover:text-rose-800"
          >
            <ShieldAlert className="w-4 h-4 mb-0.5 text-rose-600" />
            <span>แจ้งความเสี่ยง</span>
          </button>

          <button
            onClick={() => setIsAlertDrawerOpen(true)}
            className="relative flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold text-slate-600 hover:text-slate-800"
          >
            <Bell className="w-4 h-4 mb-0.5" />
            {alerts.length > 0 && (
              <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                {alerts.length}
              </span>
            )}
            <span>แจ้งเตือน</span>
          </button>

          <button
            onClick={() => setIsPermissionModalOpen(true)}
            className="flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-semibold text-slate-600 hover:text-slate-800"
          >
            <div
              className={`w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-bold mb-0.5 ${currentUser.avatarColor}`}
            >
              {currentUser.name.charAt(4) || 'พ'}
            </div>
            <span>สิทธิ์: {currentUser.role.split('_')[0]}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Data Entry Modal */}
      <DataEntryForm
        departments={departmentsWithResponsiblePersons}
        initialDepartmentId={dataEntryDept}
        currentUser={currentUser}
        isOpen={isDataEntryOpen}
        wardResponsibles={wardResponsibles}
        onClose={() => setIsDataEntryOpen(false)}
        onSaveRecord={handleSaveRecord}
        onTriggerInstantIncident={handleTriggerInstantIncident}
        onUpdateWardResponsible={handleUpdateWardResponsible}
      />

      {/* Incident Report Modal (NRLS Level A-I) */}
      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => {
          setIsIncidentModalOpen(false);
          setEditingIncident(null);
        }}
        departments={departmentsWithResponsiblePersons}
        initialDepartmentId={incidentModalDept}
        initialTitle={incidentModalTitle}
        initialDescription={incidentModalDesc}
        existingIncident={editingIncident}
        currentUser={currentUser}
        wardResponsibles={wardResponsibles}
        onSaveIncident={handleSaveIncident}
      />

      {/* Real-time Risk Alert Drawer */}
      <RiskAlertDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={alerts}
        departments={departmentsWithResponsiblePersons}
        currentUser={currentUser}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onDismissAlert={handleDismissAlert}
        onViewIncident={handleViewIncidentById}
        onOpenNewIncidentForAlert={handleOpenIncidentForAlert}
      />

      {/* Role-Based Access Control Modal */}
      <RolePermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
      />

      {/* 21 Wards Responsible Directory Modal */}
      <WardDirectoryModal
        isOpen={isWardDirectoryOpen}
        onClose={() => setIsWardDirectoryOpen(false)}
        wardResponsibles={wardResponsibles}
        currentUser={currentUser}
        onUpdateWardResponsible={handleUpdateWardResponsible}
      />
    </div>
  );
}
