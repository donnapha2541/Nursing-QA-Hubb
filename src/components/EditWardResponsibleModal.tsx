import React, { useState } from 'react';
import { WardResponsible, UserProfile } from '../types/nursing';
import { UserCheck, Phone, Building, CheckCircle2, X, RotateCcw, Sparkles } from 'lucide-react';

interface EditWardResponsibleModalProps {
  isOpen: boolean;
  wardId: string;
  wardNameTh: string;
  currentData?: WardResponsible;
  currentUser?: UserProfile;
  onClose: () => void;
  onSave: (wardId: string, data: WardResponsible) => void;
}

export const EditWardResponsibleModal: React.FC<EditWardResponsibleModalProps> = ({
  isOpen,
  wardId,
  wardNameTh,
  currentData,
  currentUser,
  onClose,
  onSave,
}) => {
  const [headNurseName, setHeadNurseName] = useState(currentData?.headNurseName || '');
  const [headNursePosition, setHeadNursePosition] = useState(currentData?.headNursePosition || 'หัวหน้าหอผู้ป่วย');
  const [qaLeadName, setQaLeadName] = useState(currentData?.qaLeadName || '');
  const [phoneInternal, setPhoneInternal] = useState(currentData?.phoneInternal || '');
  const [note, setNote] = useState(currentData?.note || '');

  React.useEffect(() => {
    if (currentData) {
      setHeadNurseName(currentData.headNurseName || '');
      setHeadNursePosition(currentData.headNursePosition || 'หัวหน้าหอผู้ป่วย');
      setQaLeadName(currentData.qaLeadName || '');
      setPhoneInternal(currentData.phoneInternal || '');
      setNote(currentData.note || '');
    } else {
      setHeadNurseName('');
      setHeadNursePosition('หัวหน้าหอผู้ป่วย');
      setQaLeadName('');
      setPhoneInternal('');
      setNote('');
    }
  }, [currentData, wardId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(wardId, {
      headNurseName: headNurseName.trim(),
      headNursePosition: headNursePosition.trim(),
      qaLeadName: qaLeadName.trim(),
      phoneInternal: phoneInternal.trim(),
      note: note.trim(),
      lastUpdated: new Date().toLocaleDateString('th-TH'),
      updatedBy: currentUser?.name || 'พยาบาลผู้รับผิดชอบ',
    });
    onClose();
  };

  const handleUseCurrentUser = () => {
    if (currentUser) {
      setHeadNurseName(currentUser.name);
      setHeadNursePosition(currentUser.roleNameTh.split('(')[0].trim() || 'หัวหน้าหอผู้ป่วย');
    }
  };

  const handleClearAll = () => {
    setHeadNurseName('');
    setHeadNursePosition('หัวหน้าหอผู้ป่วย');
    setQaLeadName('');
    setPhoneInternal('');
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight font-['Prompt',sans-serif]">
                กำหนดผู้รับผิดชอบประจำตึก/หอผู้ป่วย
              </h3>
              <p className="text-xs text-teal-100 font-medium">{wardNameTh}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[11px] text-slate-500 font-medium">ทางลัดการกรอกข้อมูล:</span>
            <div className="flex items-center gap-1.5">
              {currentUser && (
                <button
                  type="button"
                  onClick={handleUseCurrentUser}
                  className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-100/80 hover:bg-teal-200 rounded-lg transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-teal-700" />
                  <span>ใส่ชื่อฉัน ({currentUser.name})</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2 py-1 text-xs text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition flex items-center gap-1"
                title="ล้างข้อมูลทั้งหมดให้ว่าง"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ล้างค่า</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              ชื่อ-นามสกุล หัวหน้าหอผู้ป่วย / ผู้รับผิดชอบหลัก
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="ระบุชื่อ-นามสกุล หรือเว้นว่างหากยังไม่ระบุ"
                value={headNurseName}
                onChange={(e) => setHeadNurseName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ตำแหน่ง
              </label>
              <input
                type="text"
                placeholder="หัวหน้าหอผู้ป่วย / พยาบาลวิชาชีพ"
                value={headNursePosition}
                onChange={(e) => setHeadNursePosition(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                เบอร์โทรศัพท์ภายใน / มือถือ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="เช่น 1201 หรือ 08x-xxx-xxxx"
                  value={phoneInternal}
                  onChange={(e) => setPhoneInternal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              ผู้รับผิดชอบงาน QA ประจำตึก (QA Lead)
            </label>
            <input
              type="text"
              placeholder="ระบุชื่อผู้รับผิดชอบตัวชี้วัดหรือกรรมการ QA ประจำตึก..."
              value={qaLeadName}
              onChange={(e) => setQaLeadName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              ที่ตั้ง / อาคาร / ชั้น
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="เช่น อาคารเฉลิมพระเกียรติ ชั้น 3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium transition"
            >
              รีเซ็ตเป็นค่าว่าง
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl shadow-md transition flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกข้อมูลตึกนี้</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
