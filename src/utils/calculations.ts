import { IndicatorDefinition, AlertSeverity, RiskLevel, UserRole, DepartmentId } from '../types/nursing';

/**
 * Check if a value breaches warning or critical thresholds
 */
export function evaluateIndicatorSeverity(
  indicator: IndicatorDefinition,
  value: number
): AlertSeverity {
  if (value === undefined || isNaN(value)) return 'NORMAL';

  if (indicator.benchmarkType === 'MAX') {
    // Value should be low (e.g. Fall rate, SSI, VAP)
    if (value >= indicator.criticalThreshold && indicator.criticalThreshold > 0) {
      return 'CRITICAL';
    }
    if (value > indicator.warningThreshold) {
      return 'WARNING';
    }
    return 'NORMAL';
  } else {
    // Value should be high (e.g. Documentation %, Satisfaction %, Hand Hygiene %)
    if (value <= indicator.criticalThreshold) {
      return 'CRITICAL';
    }
    if (value < indicator.warningThreshold) {
      return 'WARNING';
    }
    return 'NORMAL';
  }
}

/**
 * Thai Hospital Accreditation (HA / NRLS) Risk Severity Info
 */
export interface RiskLevelDetail {
  level: RiskLevel;
  category: 'NEAR_MISS' | 'NO_HARM' | 'MODERATE_HARM' | 'SEVERE_SENTINEL';
  titleTh: string;
  descriptionTh: string;
  badgeBg: string;
  textColor: string;
  isSentinel: boolean;
}

export const RISK_LEVELS: Record<RiskLevel, RiskLevelDetail> = {
  A: {
    level: 'A',
    category: 'NEAR_MISS',
    titleTh: 'ระดับ A (มีโอกาสเกิด)',
    descriptionTh: 'มีสภาวะแวดล้อมหรือเหตุการณ์ที่มีโอกาสทำให้เกิดความคลาดเคลื่อน',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    textColor: 'text-emerald-700',
    isSentinel: false,
  },
  B: {
    level: 'B',
    category: 'NEAR_MISS',
    titleTh: 'ระดับ B (เกิดแต่ไม่ถึงตัว)',
    descriptionTh: 'เกิดความคลาดเคลื่อนขึ้นแต่ไม่ถึงตัวผู้ป่วย (ตรวจพบและแก้ไขทัน)',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    textColor: 'text-emerald-700',
    isSentinel: false,
  },
  C: {
    level: 'C',
    category: 'NO_HARM',
    titleTh: 'ระดับ C (ถึงตัวไม่เกิดอันตราย)',
    descriptionTh: 'เกิดความคลาดเคลื่อนถึงตัวผู้ป่วยแล้ว แต่ไม่ทำให้เกิดอันตรายใดๆ',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    textColor: 'text-amber-700',
    isSentinel: false,
  },
  D: {
    level: 'D',
    category: 'NO_HARM',
    titleTh: 'ระดับ D (ต้องเฝ้าระวังติดตาม)',
    descriptionTh: 'เกิดความคลาดเคลื่อนถึงตัวผู้ป่วย ต้องติดตามเฝ้าระวังอาการอย่างใกล้ชิด',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    textColor: 'text-amber-700',
    isSentinel: false,
  },
  E: {
    level: 'E',
    category: 'MODERATE_HARM',
    titleTh: 'ระดับ E (อันตรายชั่วคราว)',
    descriptionTh: 'เกิดอันตรายชั่วคราวและต้องให้การรักษา/หัตถการเพิ่มเติม',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    textColor: 'text-orange-700',
    isSentinel: false,
  },
  F: {
    level: 'F',
    category: 'MODERATE_HARM',
    titleTh: 'ระดับ F (นอน รพ. นานขึ้น)',
    descriptionTh: 'เกิดอันตรายชั่วคราว และทำให้ต้องนอนโรงพยาบาลนานขึ้น หรือส่งต่อ ICU',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    textColor: 'text-orange-700',
    isSentinel: false,
  },
  G: {
    level: 'G',
    category: 'SEVERE_SENTINEL',
    titleTh: 'ระดับ G (อันตรายถาวร/พิการ)',
    descriptionTh: 'เกิดอันตรายถาวร สูญเสียอวัยวะหรือสมรรถภาพการทำงานของร่างกาย',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    textColor: 'text-rose-700',
    isSentinel: true,
  },
  H: {
    level: 'H',
    category: 'SEVERE_SENTINEL',
    titleTh: 'ระดับ H (ต้องกู้ชีพฉุกเฉิน)',
    descriptionTh: 'เกิดภาวะวิกฤตคุกคามชีวิต ต้องให้การช่วยฟื้นคืนชีพ (CPR / Life support)',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    textColor: 'text-rose-700',
    isSentinel: true,
  },
  I: {
    level: 'I',
    category: 'SEVERE_SENTINEL',
    titleTh: 'ระดับ I (เสียชีวิต - Sentinel Event)',
    descriptionTh: 'เหตุการณ์ไม่พึงประสงค์ที่ทำให้ผู้ป่วยเสียชีวิต ต้องรายงานทันทีใน 24 ชม.',
    badgeBg: 'bg-red-200 text-red-900 border-red-400 font-bold',
    textColor: 'text-red-800',
    isSentinel: true,
  },
};

/**
 * Format Thai date
 */
export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const thaiYear = parseInt(year, 10) + 543;
    const monthName = thaiMonths[parseInt(month, 10) - 1];
    return `${parseInt(day, 10)} ${monthName} ${thaiYear}`;
  } catch {
    return dateStr;
  }
}

/**
 * Check Role Permissions
 */
export function canUserEditDepartment(role: UserRole, userDept: DepartmentId | 'ALL', targetDept: DepartmentId): boolean {
  if (role === 'AUDITOR') return false; // Auditors are read-only
  if (role === 'SUPER_ADMIN_NSO' || role === 'QA_MANAGER') return true; // Full access across hospital
  if (role === 'HEAD_NURSE' || role === 'STAFF_NURSE') {
    return userDept === 'ALL' || userDept === targetDept;
  }
  return false;
}

export function canUserApproveRecords(role: UserRole): boolean {
  return role === 'SUPER_ADMIN_NSO' || role === 'QA_MANAGER' || role === 'HEAD_NURSE';
}

export function canUserResolveIncidents(role: UserRole): boolean {
  return role === 'SUPER_ADMIN_NSO' || role === 'QA_MANAGER' || role === 'HEAD_NURSE';
}

export function canUserEditThresholds(role: UserRole): boolean {
  return role === 'SUPER_ADMIN_NSO' || role === 'QA_MANAGER';
}

/**
 * CSV Exporter helper
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row.map(val => {
      const stringified = String(val ?? '');
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    }).join(',');
  };

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(processRow)].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
