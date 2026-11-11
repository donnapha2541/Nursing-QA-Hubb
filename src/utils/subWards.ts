import {
  DepartmentConfig,
  DepartmentId,
  IPD_SUB_DEPARTMENTS,
  ICU_SUB_DEPARTMENTS,
  SPECIAL_TREATMENT_SUB_DEPARTMENTS,
  QARecord,
  IncidentReport,
  WardResponsible,
} from '../types/nursing';
import { evaluateIndicatorSeverity } from './calculations';
import { getWardResponsible } from '../data/mockData';

export interface SubWardDef {
  id: string;
  nameTh: string;
  shortName: string;
  parentDeptId: DepartmentId;
  parentDeptNameTh: string;
  category: 'IPD' | 'ICU' | 'SPECIAL';
  categoryLabelTh: string;
  colorHex: string;
  bgLightClass: string;
  borderClass: string;
  textClass: string;
  location: string;
}

export const ALL_SUB_WARDS: SubWardDef[] = [
  // --- 15 IPD Wards (หอผู้ป่วยใน) ---
  {
    id: 'MALE_MED',
    nameTh: 'หอผู้ป่วยอายุรกรรมชาย',
    shortName: 'อายุรกรรมชาย',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#0284c7',
    bgLightClass: 'bg-sky-50 text-sky-800 border-sky-300',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-700',
    location: 'ตึกอายุรกรรม ชั้น 2',
  },
  {
    id: 'FEMALE_MED',
    nameTh: 'หอผู้ป่วยอายุรกรรมหญิง',
    shortName: 'อายุรกรรมหญิง',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#0ea5e9',
    bgLightClass: 'bg-sky-50 text-sky-800 border-sky-300',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-700',
    location: 'ตึกอายุรกรรม ชั้น 3',
  },
  {
    id: 'ENT',
    nameTh: 'หอผู้ป่วยตา หู คอ จมูก',
    shortName: 'ตาหูคอจมูก',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#06b6d4',
    bgLightClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    borderClass: 'border-cyan-300',
    textClass: 'text-cyan-700',
    location: 'ตึกผู้ป่วยใน ชั้น 4',
  },
  {
    id: 'OBGYN',
    nameTh: 'หอผู้ป่วยสูตินรีเวช',
    shortName: 'สูตินรีเวช',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#ec4899',
    bgLightClass: 'bg-pink-50 text-pink-800 border-pink-300',
    borderClass: 'border-pink-300',
    textClass: 'text-pink-700',
    location: 'ตึกสูติการ ชั้น 2',
  },
  {
    id: 'MED2',
    nameTh: 'หอผู้ป่วยอายุรกรรม 2',
    shortName: 'อายุรกรรม 2',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#38bdf8',
    bgLightClass: 'bg-sky-50 text-sky-800 border-sky-300',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-700',
    location: 'ตึกเฉลิมพระเกียรติ ชั้น 3',
  },
  {
    id: 'PEDIATRICS',
    nameTh: 'หอผู้ป่วยกุมารเวชกรรม',
    shortName: 'กุมารเวชกรรม',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#f472b6',
    bgLightClass: 'bg-pink-50 text-pink-800 border-pink-300',
    borderClass: 'border-pink-300',
    textClass: 'text-pink-700',
    location: 'ตึกกุมารเวชกรรม ชั้น 1',
  },
  {
    id: 'VIP75_FL2',
    nameTh: 'หอผู้ป่วยพิเศษ 75 ปี ชั้น 2',
    shortName: 'พิเศษ 75 ปี ชั้น 2',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#8b5cf6',
    bgLightClass: 'bg-purple-50 text-purple-800 border-purple-300',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-700',
    location: 'อาคาร 75 ปี ชั้น 2',
  },
  {
    id: 'SUKJAI',
    nameTh: 'หอผู้ป่วยสุขใจ',
    shortName: 'สุขใจ',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#10b981',
    bgLightClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-700',
    location: 'อาคารส่งเสริมสุขภาพ ชั้น 1',
  },
  {
    id: 'MONK_BUILDING',
    nameTh: 'หอผู้ป่วยตึกพระสงฆ์',
    shortName: 'ตึกพระสงฆ์',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#f59e0b',
    bgLightClass: 'bg-amber-50 text-amber-800 border-amber-300',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-700',
    location: 'อาคารตึกสงฆ์อาพาธ',
  },
  {
    id: 'MALE_SURG',
    nameTh: 'หอผู้ป่วยศัลยกรรมชาย',
    shortName: 'ศัลยกรรมชาย',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#2563eb',
    bgLightClass: 'bg-blue-50 text-blue-800 border-blue-300',
    borderClass: 'border-blue-300',
    textClass: 'text-blue-700',
    location: 'ตึกศัลยกรรม ชั้น 2',
  },
  {
    id: 'FEMALE_SURG',
    nameTh: 'หอผู้ป่วยศัลยกรรมหญิง',
    shortName: 'ศัลยกรรมหญิง',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#6366f1',
    bgLightClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    borderClass: 'border-indigo-300',
    textClass: 'text-indigo-700',
    location: 'ตึกศัลยกรรม ชั้น 3',
  },
  {
    id: 'ORTHO',
    nameTh: 'หอผู้ป่วยศัลยกรรมกระดูก',
    shortName: 'ศัลยกรรมกระดูก',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#d97706',
    bgLightClass: 'bg-amber-50 text-amber-800 border-amber-300',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-700',
    location: 'ตึกศัลยกรรม ชั้น 4',
  },
  {
    id: 'VIP_FL6',
    nameTh: 'หอผู้ป่วยพิเศษชั้น 6',
    shortName: 'พิเศษชั้น 6',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#a855f7',
    bgLightClass: 'bg-purple-50 text-purple-800 border-purple-300',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-700',
    location: 'อาคารศูนย์การแพทย์ ชั้น 6',
  },
  {
    id: 'VIP_FL7',
    nameTh: 'หอผู้ป่วยพิเศษชั้น 7',
    shortName: 'พิเศษชั้น 7',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#7e22ce',
    bgLightClass: 'bg-purple-50 text-purple-800 border-purple-300',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-700',
    location: 'อาคารศูนย์การแพทย์ ชั้น 7',
  },
  {
    id: 'PSYCHIATRY',
    nameTh: 'หอผู้ป่วยจิตเวช',
    shortName: 'จิตเวช',
    parentDeptId: 'IPD',
    parentDeptNameTh: 'หอผู้ป่วยใน (IPD)',
    category: 'IPD',
    categoryLabelTh: 'ผู้ป่วยใน (IPD)',
    colorHex: '#14b8a6',
    bgLightClass: 'bg-teal-50 text-teal-800 border-teal-300',
    borderClass: 'border-teal-300',
    textClass: 'text-teal-700',
    location: 'อาคารจิตเวชและบำบัดรักษา',
  },

  // --- 4 ICU Sub-units (หอผู้ป่วยหนัก) ---
  {
    id: 'MICU',
    nameTh: 'MICU (ไอซียูอายุรกรรม)',
    shortName: 'MICU',
    parentDeptId: 'ICU',
    parentDeptNameTh: 'ผู้ป่วยหนัก (ICU)',
    category: 'ICU',
    categoryLabelTh: 'ผู้ป่วยหนัก (ICU)',
    colorHex: '#ef4444',
    bgLightClass: 'bg-red-50 text-red-800 border-red-300',
    borderClass: 'border-red-300',
    textClass: 'text-red-700',
    location: 'ตึกอายุรกรรม ชั้น 4',
  },
  {
    id: 'SICU',
    nameTh: 'SICU (ไอซียูศัลยกรรม)',
    shortName: 'SICU',
    parentDeptId: 'ICU',
    parentDeptNameTh: 'ผู้ป่วยหนัก (ICU)',
    category: 'ICU',
    categoryLabelTh: 'ผู้ป่วยหนัก (ICU)',
    colorHex: '#f43f5e',
    bgLightClass: 'bg-rose-50 text-rose-800 border-rose-300',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-700',
    location: 'ตึกศัลยกรรม ชั้น 3',
  },
  {
    id: 'ICU5',
    nameTh: 'ICUชั้น5 (ไอซียู ชั้น 5)',
    shortName: 'ICU ชั้น 5',
    parentDeptId: 'ICU',
    parentDeptNameTh: 'ผู้ป่วยหนัก (ICU)',
    category: 'ICU',
    categoryLabelTh: 'ผู้ป่วยหนัก (ICU)',
    colorHex: '#e11d48',
    bgLightClass: 'bg-rose-50 text-rose-800 border-rose-300',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-700',
    location: 'อาคารศูนย์การแพทย์ ชั้น 5',
  },
  {
    id: 'NICU',
    nameTh: 'NICU (ไอซียูทารกแรกเกิด)',
    shortName: 'NICU',
    parentDeptId: 'ICU',
    parentDeptNameTh: 'ผู้ป่วยหนัก (ICU)',
    category: 'ICU',
    categoryLabelTh: 'ผู้ป่วยหนัก (ICU)',
    colorHex: '#fb7185',
    bgLightClass: 'bg-pink-50 text-pink-800 border-pink-300',
    borderClass: 'border-pink-300',
    textClass: 'text-pink-700',
    location: 'ตึกสูติการ ชั้น 3',
  },

  // --- 2 Special Treatment Units (การตรวจรักษาพิเศษ) ---
  {
    id: 'OPD_EYE',
    nameTh: 'OPD จักษุ (Eye Clinic)',
    shortName: 'OPD จักษุ',
    parentDeptId: 'SPECIAL_TREATMENT',
    parentDeptNameTh: 'ตรวจรักษาพิเศษ (SPECIAL)',
    category: 'SPECIAL',
    categoryLabelTh: 'บริการพิเศษ (Special)',
    colorHex: '#4f46e5',
    bgLightClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    borderClass: 'border-indigo-300',
    textClass: 'text-indigo-700',
    location: 'อาคารผู้ป่วยนอก ชั้น 2',
  },
  {
    id: 'HEMODIALYSIS',
    nameTh: 'หน่วยไตเทียม (Hemodialysis)',
    shortName: 'ไตเทียม',
    parentDeptId: 'SPECIAL_TREATMENT',
    parentDeptNameTh: 'ตรวจรักษาพิเศษ (SPECIAL)',
    category: 'SPECIAL',
    categoryLabelTh: 'บริการพิเศษ (Special)',
    colorHex: '#0d9488',
    bgLightClass: 'bg-teal-50 text-teal-800 border-teal-300',
    borderClass: 'border-teal-300',
    textClass: 'text-teal-700',
    location: 'อาคารเฉลิมพระเกียรติ ชั้น 1',
  },
];

export interface SubWardStat {
  def: SubWardDef;
  latestRecord?: QARecord;
  compliancePercent: number;
  totalIndicators: number;
  passedIndicators: number;
  criticalCount: number;
  warningCount: number;
  incidentCount: number;
  hasRecord: boolean;
  responsible: WardResponsible;
}

export function computeSubWardStats(
  records: QARecord[],
  incidents: IncidentReport[],
  departments: DepartmentConfig[],
  wardResponsibles: Record<string, WardResponsible> = {}
): SubWardStat[] {
  return ALL_SUB_WARDS.map((def) => {
    const parentDept = departments.find((d) => d.id === def.parentDeptId);
    const indicators = parentDept?.indicators || [];

    // Filter records for this specific sub-ward
    const matchingRecords = records.filter(
      (r) => r.departmentId === def.parentDeptId && r.subDepartment === def.id
    );

    const latestRecord = matchingRecords.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    // Filter incidents for this sub-ward
    const wardIncidents = incidents.filter(
      (i) => i.departmentId === def.parentDeptId && i.subDepartment === def.id
    );

    let passed = 0;
    let critical = 0;
    let warning = 0;
    const total = indicators.length;

    indicators.forEach((ind) => {
      const val = latestRecord?.values?.[ind.id];
      if (val !== undefined) {
        const sev = evaluateIndicatorSeverity(ind, val);
        if (sev === 'NORMAL') passed++;
        else if (sev === 'CRITICAL') critical++;
        else if (sev === 'WARNING') warning++;
      } else {
        passed++; // default baseline
      }
    });

    const compliancePercent = total > 0 ? Math.round((passed / total) * 100) : 90;
    const responsible = getWardResponsible(wardResponsibles, def.id);

    return {
      def,
      latestRecord,
      compliancePercent,
      totalIndicators: total,
      passedIndicators: passed,
      criticalCount: critical,
      warningCount: warning,
      incidentCount: wardIncidents.length,
      hasRecord: !!latestRecord,
      responsible,
    };
  });
}
