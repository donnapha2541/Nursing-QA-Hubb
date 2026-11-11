import React from 'react';
import { X, ShieldCheck, Check, Minus, UserCheck } from 'lucide-react';
import { MOCK_USERS } from '../data/mockData';
import { UserProfile } from '../types/nursing';

interface RolePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
}

export const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  if (!isOpen) return null;

  const permissions = [
    {
      feature: 'ดูแดชบอร์ดภาพรวม 11 กลุ่มงาน',
      nso: true,
      qa: true,
      head: 'เฉพาะแผนก/ภาพรวมย่อ',
      staff: 'เฉพาะแผนกที่สังกัด',
      auditor: true,
    },
    {
      feature: 'กรอกข้อมูล QA ประจำเวร',
      nso: true,
      qa: true,
      head: 'เฉพาะแผนกตนเอง',
      staff: 'เฉพาะแผนกตนเอง',
      auditor: false,
    },
    {
      feature: 'รายงานอุบัติการณ์ความเสี่ยง (IR Level A-I)',
      nso: true,
      qa: true,
      head: true,
      staff: true,
      auditor: false,
    },
    {
      feature: 'สืบสวนสาเหตุเชิงลึก (RCA) & ปิดเคสความเสี่ยง',
      nso: true,
      qa: true,
      head: true,
      staff: false,
      auditor: false,
    },
    {
      feature: 'รับรองและอนุมัติข้อมูลคุณภาพประจำเดือน',
      nso: true,
      qa: true,
      head: 'เฉพาะแผนกตนเอง',
      staff: false,
      auditor: false,
    },
    {
      feature: 'ปรับแต่งค่าเกณฑ์มาตรฐาน (Threshold Config)',
      nso: true,
      qa: true,
      head: false,
      staff: false,
      auditor: false,
    },
    {
      feature: 'ส่งออกรายงานสรุป Audit (CSV & Print)',
      nso: true,
      qa: true,
      head: true,
      staff: false,
      auditor: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-950 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-600/30 text-teal-400">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Prompt',sans-serif]">
                โครงสร้างสิทธิ์การเข้าถึงข้อมูลตามบทบาท (Role-Based Access Control)
              </h3>
              <p className="text-xs text-slate-300">
                การแบ่งสิทธิ์ตามมาตรฐานการบริหารการพยาบาลและความปลอดภัยสารสนเทศโรงพยาบาล
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick User Switcher Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-2 font-['Prompt',sans-serif]">
              คลิกเพื่อสลับผู้ใช้งานทดสอบ (Active Profile Simulator):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MOCK_USERS.map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className={`p-2 rounded-lg text-left border transition-all text-xs ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-slate-900 font-bold">{user.name}</span>
                      {isSelected && <UserCheck className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <span className="text-[10px] text-teal-700 block truncate mt-0.5">
                      {user.roleNameTh.split('(')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permission Matrix Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ฟังก์ชันการทำงาน</th>
                    <th className="px-3 py-3 text-center">ผู้อำนวยการ NSO</th>
                    <th className="px-3 py-3 text-center">ผู้จัดการ QA/RM</th>
                    <th className="px-3 py-3 text-center">หัวหน้าแผนก (Head Nurse)</th>
                    <th className="px-3 py-3 text-center">พยาบาลประจำเวร (Staff)</th>
                    <th className="px-3 py-3 text-center">ผู้ตรวจประเมิน (Auditor)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissions.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">{p.feature}</td>

                      <td className="px-3 py-3 text-center">
                        {p.nso === true ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">{p.nso}</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {p.qa === true ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">{p.qa}</span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {typeof p.head === 'string' ? (
                          <span className="text-[10px] font-semibold text-amber-700 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                            {p.head}
                          </span>
                        ) : p.head === true ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {typeof p.staff === 'string' ? (
                          <span className="text-[10px] font-semibold text-sky-700 px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200">
                            {p.staff}
                          </span>
                        ) : p.staff === true ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {p.auditor === true ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
