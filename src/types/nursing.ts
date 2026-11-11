export type DepartmentId =
  | 'NSO'
  | 'ICU'
  | 'IPD'
  | 'ER'
  | 'ANC'
  | 'OPD'
  | 'ANESTHESIA' // วิสัญญี
  | 'OR'
  | 'LR'
  | 'IC'
  | 'SPECIAL_TREATMENT'; // ตรวจรักษาพิเศษ

export type UserRole =
  | 'SUPER_ADMIN_NSO' // หัวหน้าพยาบาล / ผู้ตรวจการบริหาร
  | 'QA_MANAGER'      // หัวหน้างาน QA / กรรมการคุณภาพ
  | 'HEAD_NURSE'      // หัวหน้าหอผู้ป่วย / หัวหน้าแผนก
  | 'STAFF_NURSE'     // พยาบาลประจำเวร
  | 'AUDITOR';        // ผู้ตรวจประเมินคุณภาพ HA

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleNameTh: string;
  departmentId: DepartmentId | 'ALL';
  hospitalName: string;
  avatarColor: string;
}

export interface WardResponsible {
  headNurseName: string;
  headNursePosition?: string;
  qaLeadName?: string;
  phoneInternal?: string;
  note?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

export type RiskLevel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export type AlertSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface IndicatorDefinition {
  id: string;
  name: string;
  description: string;
  unit: string; // '%', 'ต่อ 1,000 วันนอน', 'ต่อ 1,000 ครั้ง', 'คน', 'ครั้ง', 'คะแนน'
  targetBenchmark: number; // e.g. 0 or 1.5 or 85
  benchmarkType: 'MAX' | 'MIN'; // MAX = value must be <= benchmark (e.g. Fall rate); MIN = value must be >= benchmark (e.g. Hand hygiene)
  criticalThreshold: number; // threshold where a CRITICAL alert triggers
  warningThreshold: number;  // threshold where a WARNING alert triggers
  category: 'SAFETY' | 'CLINICAL' | 'INFECTION' | 'SATISFACTION' | 'DOCUMENTATION';
  dimensionId?: string;
  dimensionName?: string;
  responsiblePerson?: string;
}

export interface DepartmentConfig {
  id: DepartmentId;
  nameEn: string;
  nameTh: string;
  shortName: string;
  iconName: string;
  description: string;
  indicators: IndicatorDefinition[];
}

export const ICU_SUB_DEPARTMENTS = [
  { id: 'MICU', nameTh: 'MICU (ไอซียูอายุรกรรม)', shortName: 'MICU', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'SICU', nameTh: 'SICU (ไอซียูศัลยกรรม)', shortName: 'SICU', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'ICU5', nameTh: 'ICUชั้น5 (ไอซียู ชั้น 5)', shortName: 'ICUชั้น5', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'NICU', nameTh: 'NICU (ไอซียูทารกแรกเกิด)', shortName: 'NICU', color: 'bg-pink-100 text-pink-800 border-pink-300' },
] as const;

export const SPECIAL_TREATMENT_SUB_DEPARTMENTS = [
  { id: 'OPD_EYE', nameTh: 'OPD จักษุ (Eye Clinic)', shortName: 'OPDจักษุ', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'HEMODIALYSIS', nameTh: 'หน่วยไตเทียม (Hemodialysis)', shortName: 'ไตเทียม', color: 'bg-teal-100 text-teal-800 border-teal-300' },
] as const;

export const IPD_SUB_DEPARTMENTS = [
  { id: 'MALE_MED', nameTh: 'หอผู้ป่วยอายุรกรรมชาย', shortName: 'อายุรกรรมชาย' },
  { id: 'FEMALE_MED', nameTh: 'หอผู้ป่วยอายุรกรรมหญิง', shortName: 'อายุรกรรมหญิง' },
  { id: 'ENT', nameTh: 'หอผู้ป่วยตา หู คอ จมูก', shortName: 'ตาหูคอจมูก' },
  { id: 'OBGYN', nameTh: 'หอผู้ป่วยสูตินรีเวช', shortName: 'สูตินรีเวช' },
  { id: 'MED2', nameTh: 'หอผู้ป่วยอายุรกรรม 2', shortName: 'อายุรกรรม2' },
  { id: 'PEDIATRICS', nameTh: 'หอผู้ป่วยกุมารเวชกรรม', shortName: 'กุมารเวชกรรม' },
  { id: 'VIP75_FL2', nameTh: 'หอผู้ป่วยพิเศษ 75 ปี ชั้น 2', shortName: 'พิเศษ75ปีชั้น2' },
  { id: 'SUKJAI', nameTh: 'หอผู้ป่วยสุขใจ', shortName: 'สุขใจ' },
  { id: 'MONK_BUILDING', nameTh: 'หอผู้ป่วยตึกพระสงฆ์', shortName: 'ตึกพระสงฆ์' },
  { id: 'MALE_SURG', nameTh: 'หอผู้ป่วยศัลยกรรมชาย', shortName: 'ศัลยกรรมชาย' },
  { id: 'FEMALE_SURG', nameTh: 'หอผู้ป่วยศัลยกรรมหญิง', shortName: 'ศัลยกรรมหญิง' },
  { id: 'ORTHO', nameTh: 'หอผู้ป่วยศัลยกรรมกระดูก', shortName: 'ศัลยกรรมกระดูก' },
  { id: 'VIP_FL6', nameTh: 'หอผู้ป่วยพิเศษชั้น 6', shortName: 'พิเศษชั้น 6' },
  { id: 'VIP_FL7', nameTh: 'หอผู้ป่วยพิเศษชั้น 7', shortName: 'พิเศษชั้น 7' },
  { id: 'PSYCHIATRY', nameTh: 'หอผู้ป่วยจิตเวช', shortName: 'จิตเวช' },
] as const;

export interface QARecord {
  id: string;
  departmentId: DepartmentId;
  subDepartment?: string; // For sub-units e.g. MICU, SICU, ICUชั้น5, NICU
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  fiscalYear?: number; // e.g. 2569, 2570
  fiscalQuarter?: number; // 1, 2, 3, 4
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'MONTHLY_SUMMARY';
  recordedBy: string;
  recordedByRole: UserRole;
  timestamp: string;
  patientCount: number; // Denominator (e.g. total patients, total bed-days, total procedures)
  denominatorLabel: string;
  values: Record<string, number>; // indicatorId -> calculated value
  rawCounts: Record<string, number>; // indicatorId -> raw count
  incidents: IncidentReport[];
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'FLAGGED';
  notes?: string;
}

export interface IncidentReport {
  id: string;
  departmentId: DepartmentId;
  subDepartment?: string;
  title: string;
  date: string;
  time: string;
  fiscalYear?: number;
  fiscalQuarter?: number;
  riskLevel: RiskLevel; // A to I
  severity: AlertSeverity;
  description: string;
  patientAge?: number;
  patientGender?: 'ชาย' | 'หญิง';
  immediateAction: string;
  rootCauseAnalysis?: string;
  preventiveAction?: string;
  reportedBy: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface RealtimeAlert {
  id: string;
  departmentId: DepartmentId;
  indicatorId?: string;
  indicatorName: string;
  currentValue: number;
  benchmarkValue: number;
  unit: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  isRead: boolean;
  incidentId?: string;
  acknowledgedBy?: string;
}
