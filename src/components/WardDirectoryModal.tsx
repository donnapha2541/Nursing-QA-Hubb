import React, { useState, useMemo } from 'react';
import {
  WardResponsible,
  UserProfile,
  IPD_SUB_DEPARTMENTS,
  ICU_SUB_DEPARTMENTS,
  SPECIAL_TREATMENT_SUB_DEPARTMENTS,
} from '../types/nursing';
import { getWardResponsible } from '../data/mockData';
import { exportToCSV } from '../utils/calculations';
import {
  Users,
  Search,
  Building2,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
  Download,
  RotateCcw,
  Sparkles,
  Bed,
  HeartPulse,
  Activity,
  Filter,
} from 'lucide-react';
import { EditWardResponsibleModal } from './EditWardResponsibleModal';

interface WardDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardResponsibles: Record<string, WardResponsible>;
  currentUser: UserProfile;
  onUpdateWardResponsible: (wardId: string, data: WardResponsible) => void;
}

export const WardDirectoryModal: React.FC<WardDirectoryModalProps> = ({
  isOpen,
  onClose,
  wardResponsibles,
  currentUser,
  onUpdateWardResponsible,
}) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'IPD' | 'ICU' | 'SPEC'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWard, setEditingWard] = useState<{
    isOpen: boolean;
    wardId: string;
    wardName: string;
  }>({
    isOpen: false,
    wardId: '',
    wardName: '',
  });

  // Consolidated list of all wards and sub-departments
  const allWards = useMemo(() => {
    const list: Array<{
      id: string;
      nameTh: string;
      shortName: string;
      category: 'IPD' | 'ICU' | 'SPEC';
      categoryLabel: string;
      defaultNote?: string;
    }> = [];

    IPD_SUB_DEPARTMENTS.forEach((w) => {
      list.push({
        id: w.id,
        nameTh: w.nameTh,
        shortName: w.shortName,
        category: 'IPD',
        categoryLabel: 'หอผู้ป่วยใน (IPD)',
      });
    });

    ICU_SUB_DEPARTMENTS.forEach((w) => {
      list.push({
        id: w.id,
        nameTh: w.nameTh,
        shortName: w.shortName,
        category: 'ICU',
        categoryLabel: 'ผู้ป่วยหนัก (ICU)',
      });
    });

    SPECIAL_TREATMENT_SUB_DEPARTMENTS.forEach((w) => {
      list.push({
        id: w.id,
        nameTh: w.nameTh,
        shortName: w.shortName,
        category: 'SPEC',
        categoryLabel: 'ตรวจรักษาพิเศษ',
      });
    });

    return list;
  }, []);

  // Filtered wards
  const filteredWards = useMemo(() => {
    return allWards.filter((ward) => {
      if (activeCategory !== 'ALL' && ward.category !== activeCategory) {
        return false;
      }

      const resp = getWardResponsible(wardResponsibles, ward.id);
      const isAssigned = Boolean(resp.headNurseName && resp.headNurseName.trim().length > 0);

      if (statusFilter === 'ASSIGNED' && !isAssigned) return false;
      if (statusFilter === 'UNASSIGNED' && isAssigned) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ward.nameTh.toLowerCase().includes(q) || ward.shortName.toLowerCase().includes(q);
        const matchHead = (resp.headNurseName || '').toLowerCase().includes(q);
        const matchQA = (resp.qaLeadName || '').toLowerCase().includes(q);
        const matchPhone = (resp.phoneInternal || '').toLowerCase().includes(q);
        if (!matchName && !matchHead && !matchQA && !matchPhone) return false;
      }

      return true;
    });
  }, [allWards, activeCategory, statusFilter, searchQuery, wardResponsibles]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = allWards.length;
    let assigned = 0;
    allWards.forEach((w) => {
      const resp = getWardResponsible(wardResponsibles, w.id);
      if (resp.headNurseName && resp.headNurseName.trim().length > 0) {
        assigned++;
      }
    });
    return {
      total,
      assigned,
      unassigned: total - assigned,
      percent: Math.round((assigned / total) * 100),
    };
  }, [allWards, wardResponsibles]);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    const headers = [
      'กลุ่มงาน',
      'รหัสตึก',
      'ชื่อตึก/หอผู้ป่วย',
      'หัวหน้าหอผู้ป่วย / ผู้รับผิดชอบ',
      'ตำแหน่ง',
      'เบอร์โทรศัพท์ภายใน',
      'ผู้รับผิดชอบงาน QA',
      'ที่ตั้ง/อาคาร',
      'สถานะการระบุชื่อ',
    ];

    const rows = allWards.map((w) => {
      const resp = getWardResponsible(wardResponsibles, w.id);
      const isAssigned = Boolean(resp.headNurseName && resp.headNurseName.trim().length > 0);
      return [
        w.categoryLabel,
        w.id,
        w.nameTh,
        resp.headNurseName || 'ยังไม่ระบุ',
        resp.headNursePosition || '-',
        resp.phoneInternal || '-',
        resp.qaLeadName || '-',
        resp.note || '-',
        isAssigned ? 'ระบุแล้ว' : 'ยังไม่ระบุ',
      ];
    });

    exportToCSV(`Nursing_Ward_Directory_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleQuickAssignSelf = (wardId: string) => {
    const current = getWardResponsible(wardResponsibles, wardId);
    onUpdateWardResponsible(wardId, {
      ...current,
      headNurseName: currentUser.name,
      headNursePosition: currentUser.roleNameTh.split('(')[0].trim() || 'หัวหน้าหอผู้ป่วย',
      lastUpdated: new Date().toLocaleDateString('th-TH'),
      updatedBy: currentUser.name,
    });
  };

  const handleQuickClear = (wardId: string) => {
    onUpdateWardResponsible(wardId, {
      headNurseName: '',
      headNursePosition: 'หัวหน้าหอผู้ป่วย',
      qaLeadName: '',
      phoneInternal: '',
      note: '',
      lastUpdated: new Date().toLocaleDateString('th-TH'),
      updatedBy: currentUser.name,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/15 rounded-xl border border-white/20">
              <Users className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg leading-tight font-['Prompt',sans-serif]">
                  ทำเนียบและระบบลงชื่อผู้รับผิดชอบประจำตึก (Ward Responsible Directory)
                </h3>
                <span className="text-[11px] bg-teal-500/30 text-teal-200 px-2.5 py-0.5 rounded-full border border-teal-300/30 font-medium hidden sm:inline">
                  ครอบคลุม 21 ตึก/หน่วยงาน
                </span>
              </div>
              <p className="text-xs text-teal-100/90 mt-0.5">
                แต่ละตึก/หอผู้ป่วยสามารถกำหนดหัวหน้าหอผู้ป่วย เบอร์ติดต่อ และผู้รับผิดชอบ QA ประจำตึกได้แยกกันอย่างอิสระ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
              title="ส่งออกทำเนียบผู้รับผิดชอบเป็น Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ส่งออก CSV</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium">ตึก/หน่วยงานทั้งหมด</span>
            <div className="text-lg font-bold text-slate-900 font-['Prompt',sans-serif] mt-0.5">
              {stats.total} <span className="text-xs text-slate-500 font-normal">หน่วยงาน</span>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[11px] text-emerald-800 font-medium">ระบุผู้รับผิดชอบแล้ว</span>
            <div className="text-lg font-bold text-emerald-700 font-['Prompt',sans-serif] mt-0.5">
              {stats.assigned} <span className="text-xs text-emerald-600 font-normal">แห่ง ({stats.percent}%)</span>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
            <span className="text-[11px] text-amber-800 font-medium">ยังไม่ได้ระบุผู้รับผิดชอบ</span>
            <div className="text-lg font-bold text-amber-700 font-['Prompt',sans-serif] mt-0.5">
              {stats.unassigned} <span className="text-xs text-amber-600 font-normal">แห่ง</span>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-teal-200 bg-teal-50/20 shadow-2xs flex flex-col justify-center">
            <span className="text-[11px] text-teal-800 font-medium">ความครอบคลุมข้อมูล</span>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:px-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                activeCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด (21)
            </button>
            <button
              onClick={() => setActiveCategory('IPD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                activeCategory === 'IPD'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Bed className="w-3.5 h-3.5" />
              <span>หอผู้ป่วยใน IPD (15)</span>
            </button>
            <button
              onClick={() => setActiveCategory('ICU')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                activeCategory === 'ICU'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>ผู้ป่วยหนัก ICU (4)</span>
            </button>
            <button
              onClick={() => setActiveCategory('SPEC')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                activeCategory === 'SPEC'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>ตรวจรักษาพิเศษ (2)</span>
            </button>
          </div>

          {/* Status Filter & Search */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="ASSIGNED">เฉพาะที่ลงชื่อแล้ว</option>
              <option value="UNASSIGNED">เฉพาะที่ยังไม่ลงชื่อ</option>
            </select>

            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อตึก, พยาบาล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Directory Table Body */}
        <div className="flex-1 overflow-y-auto">
          {filteredWards.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              ไม่พบข้อมูลตึก/หอผู้ป่วยตามเงื่อนไขที่ค้นหา
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5">ชื่อตึก / หอผู้ป่วย</th>
                  <th className="px-3 py-2.5">กลุ่มงาน</th>
                  <th className="px-4 py-2.5">หัวหน้าหอผู้ป่วย / ผู้รับผิดชอบหลัก</th>
                  <th className="px-3 py-2.5">เบอร์ภายใน</th>
                  <th className="px-3 py-2.5">ผู้รับผิดชอบ QA ประจำตึก</th>
                  <th className="px-3 py-2.5 text-center">สถานะ</th>
                  <th className="px-4 py-2.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWards.map((ward) => {
                  const resp = getWardResponsible(wardResponsibles, ward.id);
                  const isAssigned = Boolean(resp.headNurseName && resp.headNurseName.trim().length > 0);

                  return (
                    <tr key={ward.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              ward.category === 'IPD'
                                ? 'bg-sky-500'
                                : ward.category === 'ICU'
                                ? 'bg-rose-500'
                                : 'bg-indigo-500'
                            }`}
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{ward.shortName}</span>
                            <span className="text-[10px] text-slate-400">{ward.nameTh}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            ward.category === 'IPD'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : ward.category === 'ICU'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {ward.category === 'IPD' ? 'IPD' : ward.category === 'ICU' ? 'ICU' : 'พิเศษ'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {isAssigned ? (
                          <div>
                            <span className="font-semibold text-slate-900 block">{resp.headNurseName}</span>
                            <span className="text-[10px] text-slate-500">{resp.headNursePosition || 'หัวหน้าหอผู้ป่วย'}</span>
                          </div>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200/60 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            ยังไม่ได้ระบุ
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-slate-700">
                        {resp.phoneInternal ? (
                          <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-800">
                            <Phone className="w-3 h-3 text-teal-600" />
                            {resp.phoneInternal}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-slate-700">
                        {resp.qaLeadName ? (
                          <span className="font-medium text-slate-800">{resp.qaLeadName}</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ระบุแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            รอลงชื่อ
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isAssigned && (
                            <button
                              type="button"
                              onClick={() => handleQuickAssignSelf(ward.id)}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition flex items-center gap-1"
                              title={`ใส่ชื่อฉัน (${currentUser.name}) เป็นผู้รับผิดชอบตึกนี้`}
                            >
                              <Sparkles className="w-3 h-3 text-teal-600" />
                              <span className="hidden sm:inline">ใส่ชื่อฉัน</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setEditingWard({
                                isOpen: true,
                                wardId: ward.id,
                                wardName: ward.nameTh,
                              })
                            }
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition flex items-center gap-1 shadow-2xs"
                          >
                            <Pencil className="w-3 h-3 text-slate-500" />
                            <span>{isAssigned ? 'แก้ไข' : 'ระบุชื่อ'}</span>
                          </button>

                          {isAssigned && (
                            <button
                              type="button"
                              onClick={() => handleQuickClear(ward.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="ล้างข้อมูลผู้รับผิดชอบตึกนี้"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-500">
            💡 ข้อมูลผู้รับผิดชอบจะถูกนำไปแสดงในฟอร์มบันทึกตัวชี้วัด (QA Entry) และระบบแจ้งเหตุความเสี่ยงโดยอัตโนมัติ
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Child Edit Modal */}
      <EditWardResponsibleModal
        isOpen={editingWard.isOpen}
        wardId={editingWard.wardId}
        wardNameTh={editingWard.wardName}
        currentData={getWardResponsible(wardResponsibles, editingWard.wardId)}
        currentUser={currentUser}
        onClose={() => setEditingWard((prev) => ({ ...prev, isOpen: false }))}
        onSave={(wardId, data) => {
          onUpdateWardResponsible(wardId, data);
        }}
      />
    </div>
  );
};
