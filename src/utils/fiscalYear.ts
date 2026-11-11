/**
 * Utility functions for Thai Fiscal Year (ปีงบประมาณ พ.ศ.)
 * In Thai Public Health / Hospital Administration:
 * - Fiscal Year starts on October 1st and ends on September 30th of the following year.
 *   - October, November, December of Year Y belong to Fiscal Year (Y + 1) in CE, or (Y + 1 + 543) in BE.
 *   - January through September of Year Y belong to Fiscal Year Y in CE, or (Y + 543) in BE.
 * - Quarters (ไตรมาส):
 *   - ไตรมาส 1 (Q1): ตุลาคม - ธันวาคม (ต.ค. - ธ.ค.)
 *   - ไตรมาส 2 (Q2): มกราคม - มีนาคม (ม.ค. - มี.ค.)
 *   - ไตรมาส 3 (Q3): เมษายน - มิถุนายน (เม.ย. - มิ.ย.)
 *   - ไตรมาส 4 (Q4): กรกฎาคม - กันยายน (ก.ค. - ก.ย.)
 */

export interface FiscalQuarterInfo {
  quarter: number; // 1, 2, 3, 4
  nameTh: string; // 'ไตรมาส 1'
  rangeTh: string; // 'ต.ค. - ธ.ค.'
  months: number[]; // [10, 11, 12]
}

export const FISCAL_QUARTERS: Record<number, FiscalQuarterInfo> = {
  1: { quarter: 1, nameTh: 'ไตรมาส 1', rangeTh: 'ต.ค. - ธ.ค.', months: [10, 11, 12] },
  2: { quarter: 2, nameTh: 'ไตรมาส 2', rangeTh: 'ม.ค. - มี.ค.', months: [1, 2, 3] },
  3: { quarter: 3, nameTh: 'ไตรมาส 3', rangeTh: 'เม.ย. - มิ.ย.', months: [4, 5, 6] },
  4: { quarter: 4, nameTh: 'ไตรมาส 4', rangeTh: 'ก.ค. - ก.ย.', months: [7, 8, 9] },
};

export const AVAILABLE_FISCAL_YEARS = [2570, 2569, 2568, 2567] as const;
export type FiscalYearOption = (typeof AVAILABLE_FISCAL_YEARS)[number] | 'ALL';

export const THAI_MONTH_NAMES_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_MONTH_NAMES_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Calculates Thai Fiscal Year (พ.ศ.) from a date or YYYY-MM string
 */
export function getFiscalYear(dateOrMonthStr: string): number {
  if (!dateOrMonthStr) return 2569;
  try {
    const parts = dateOrMonthStr.split('-');
    const yearCE = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (isNaN(yearCE) || isNaN(month)) return 2569;

    // If month is Oct (10), Nov (11), Dec (12), it advances to next fiscal year
    const fyCE = month >= 10 ? yearCE + 1 : yearCE;
    return fyCE + 543;
  } catch {
    return 2569;
  }
}

/**
 * Calculates Fiscal Quarter (1, 2, 3, or 4) from a date or YYYY-MM string
 */
export function getFiscalQuarter(dateOrMonthStr: string): number {
  if (!dateOrMonthStr) return 1;
  try {
    const parts = dateOrMonthStr.split('-');
    const month = parseInt(parts[1], 10);
    if (isNaN(month)) return 1;

    if (month >= 10 && month <= 12) return 1; // Oct, Nov, Dec
    if (month >= 1 && month <= 3) return 2;   // Jan, Feb, Mar
    if (month >= 4 && month <= 6) return 3;   // Apr, May, Jun
    if (month >= 7 && month <= 9) return 4;   // Jul, Aug, Sep
    return 1;
  } catch {
    return 1;
  }
}

/**
 * Generates the list of 12 chronological months belonging to a given Fiscal Year (Oct of Year-1 to Sep of Year)
 */
export function getMonthsOfFiscalYear(fiscalYear: number): {
  value: string; // '2025-10'
  labelTh: string; // 'ตุลาคม 2568'
  shortLabelTh: string; // 'ต.ค. 68'
  quarter: number; // 1..4
  quarterNameTh: string; // 'ไตรมาส 1'
}[] {
  const fyCE = fiscalYear - 543;
  const prevCE = fyCE - 1;
  const prevBE = fiscalYear - 1;

  return [
    // Q1
    { value: `${prevCE}-10`, labelTh: `ตุลาคม ${prevBE}`, shortLabelTh: `ต.ค. ${String(prevBE).slice(-2)}`, quarter: 1, quarterNameTh: 'ไตรมาส 1' },
    { value: `${prevCE}-11`, labelTh: `พฤศจิกายน ${prevBE}`, shortLabelTh: `พ.ย. ${String(prevBE).slice(-2)}`, quarter: 1, quarterNameTh: 'ไตรมาส 1' },
    { value: `${prevCE}-12`, labelTh: `ธันวาคม ${prevBE}`, shortLabelTh: `ธ.ค. ${String(prevBE).slice(-2)}`, quarter: 1, quarterNameTh: 'ไตรมาส 1' },
    // Q2
    { value: `${fyCE}-01`, labelTh: `มกราคม ${fiscalYear}`, shortLabelTh: `ม.ค. ${String(fiscalYear).slice(-2)}`, quarter: 2, quarterNameTh: 'ไตรมาส 2' },
    { value: `${fyCE}-02`, labelTh: `กุมภาพันธ์ ${fiscalYear}`, shortLabelTh: `ก.พ. ${String(fiscalYear).slice(-2)}`, quarter: 2, quarterNameTh: 'ไตรมาส 2' },
    { value: `${fyCE}-03`, labelTh: `มีนาคม ${fiscalYear}`, shortLabelTh: `มี.ค. ${String(fiscalYear).slice(-2)}`, quarter: 2, quarterNameTh: 'ไตรมาส 2' },
    // Q3
    { value: `${fyCE}-04`, labelTh: `เมษายน ${fiscalYear}`, shortLabelTh: `เม.ย. ${String(fiscalYear).slice(-2)}`, quarter: 3, quarterNameTh: 'ไตรมาส 3' },
    { value: `${fyCE}-05`, labelTh: `พฤษภาคม ${fiscalYear}`, shortLabelTh: `พ.ค. ${String(fiscalYear).slice(-2)}`, quarter: 3, quarterNameTh: 'ไตรมาส 3' },
    { value: `${fyCE}-06`, labelTh: `มิถุนายน ${fiscalYear}`, shortLabelTh: `มิ.ย. ${String(fiscalYear).slice(-2)}`, quarter: 3, quarterNameTh: 'ไตรมาส 3' },
    // Q4
    { value: `${fyCE}-07`, labelTh: `กรกฎาคม ${fiscalYear}`, shortLabelTh: `ก.ค. ${String(fiscalYear).slice(-2)}`, quarter: 4, quarterNameTh: 'ไตรมาส 4' },
    { value: `${fyCE}-08`, labelTh: `สิงหาคม ${fiscalYear}`, shortLabelTh: `ส.ค. ${String(fiscalYear).slice(-2)}`, quarter: 4, quarterNameTh: 'ไตรมาส 4' },
    { value: `${fyCE}-09`, labelTh: `กันยายน ${fiscalYear}`, shortLabelTh: `ก.ย. ${String(fiscalYear).slice(-2)}`, quarter: 4, quarterNameTh: 'ไตรมาส 4' },
  ];
}

/**
 * Filter an array of items with .date or .month by Fiscal Year, Quarter, or Month
 */
export function filterByFiscalPeriod<T extends { date?: string; month?: string }>(
  items: T[],
  filter: {
    fiscalYear: FiscalYearOption;
    quarter?: number | 'ALL';
    month?: string | 'ALL';
  }
): T[] {
  return items.filter((item) => {
    const dateStr = item.date || item.month || '';
    if (!dateStr) return true;

    const itemFY = getFiscalYear(dateStr);
    if (filter.fiscalYear !== 'ALL' && itemFY !== filter.fiscalYear) {
      return false;
    }

    if (filter.quarter && filter.quarter !== 'ALL') {
      const itemQ = getFiscalQuarter(dateStr);
      if (itemQ !== filter.quarter) {
        return false;
      }
    }

    if (filter.month && filter.month !== 'ALL') {
      const itemMonth = (item.month || dateStr.slice(0, 7));
      if (itemMonth !== filter.month) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Format Fiscal Year Display Text
 */
export function formatFiscalYearLabel(fy: FiscalYearOption): string {
  if (fy === 'ALL') return 'ทุกปีงบประมาณ';
  return `ปีงบประมาณ ${fy}`;
}

/**
 * Format Quarter Display Text
 */
export function formatQuarterLabel(q: number | 'ALL'): string {
  if (q === 'ALL') return 'ทุกไตรมาส (ทั้งปี)';
  const info = FISCAL_QUARTERS[q];
  return info ? `${info.nameTh} (${info.rangeTh})` : `ไตรมาส ${q}`;
}

