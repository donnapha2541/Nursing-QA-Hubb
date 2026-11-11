import React, { useState } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  ShieldCheck,
  Smartphone,
  Tablet,
  Monitor,
  UserCheck,
  AlertTriangle,
  PlusCircle,
  HelpCircle,
  Building,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { UserProfile, RealtimeAlert } from '../types/nursing';
import { MOCK_USERS } from '../data/mockData';

interface HeaderProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onUpdateUserName?: (name: string) => void;
  alerts: RealtimeAlert[];
  onOpenAlerts: () => void;
  onOpenNewRecord: () => void;
  onOpenNewIncident: () => void;
  onOpenPermissionGuide: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  viewportMode: 'mobile' | 'tablet' | 'desktop';
  onChangeViewport: (mode: 'mobile' | 'tablet' | 'desktop') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  onUpdateUserName,
  alerts,
  onOpenAlerts,
  onOpenNewRecord,
  onOpenNewIncident,
  onOpenPermissionGuide,
  soundEnabled,
  onToggleSound,
  viewportMode,
  onChangeViewport,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState(currentUser.name);

  const unreadAlerts = alerts.filter((a) => !a.isRead);
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;

  const handleSaveName = () => {
    const trimmed = customNameInput.trim();
    if (trimmed && onUpdateUserName) {
      onUpdateUserName(trimmed);
    }
    setIsEditingName(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner: Hospital info & Quick Utilities */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Hospital & System Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 ring-2 ring-teal-100">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5 font-['Prompt',sans-serif]">
                <span>ระบบบริหารคุณภาพพยาบาล (Nursing QA Hub)</span>
                <span className="hidden md:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  HA Standard & NRLS
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {currentUser.hospitalName} • ติดตามตัวชี้วัดและแจ้งเตือนความเสี่ยงเรียลไทม์
            </p>
          </div>
        </div>

        {/* Right: Actions, Viewport Preview, Sound & User Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Device Preview Mode Switcher (Great for demonstrating phone/tablet view) */}
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs text-slate-600">
            <button
              onClick={() => onChangeViewport('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                viewportMode === 'mobile'
                  ? 'bg-white text-teal-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
              title="จำลองหน้าจอมือถือ (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>มือถือ</span>
            </button>
            <button
              onClick={() => onChangeViewport('tablet')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                viewportMode === 'tablet'
                  ? 'bg-white text-teal-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
              title="จำลองหน้าจอไอแพด (820px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>ไอแพด</span>
            </button>
            <button
              onClick={() => onChangeViewport('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                viewportMode === 'desktop'
                  ? 'bg-white text-teal-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
              title="หน้าจอปกติ (Responsive)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>เต็มจอ</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
            }`}
            title={soundEnabled ? 'เปิดเสียงแจ้งเตือนความเสี่ยง' : 'ปิดเสียงแจ้งเตือน'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Alert Notification Bell with Real-time Pulse */}
          <button
            onClick={onOpenAlerts}
            className={`relative p-2 rounded-lg border transition-all ${
              criticalCount > 0
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse hover:bg-rose-100'
                : unreadAlerts.length > 0
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="แจ้งเตือนความเสี่ยงเรียลไทม์"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center text-white ${
                  criticalCount > 0 ? 'bg-rose-600' : 'bg-amber-500'
                }`}
              >
                {alerts.length}
              </span>
            )}
          </button>

          {/* Quick Action: Log Incident */}
          <button
            onClick={onOpenNewIncident}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>แจ้งความเสี่ยง</span>
          </button>

          {/* Quick Action: Log QA Record */}
          <button
            onClick={onOpenNewRecord}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">บันทึก QA</span>
            <span className="sm:hidden">+ QA</span>
          </button>

          {/* Role & User Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setIsEditingName(false);
                setCustomNameInput(currentUser.name);
              }}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div
                className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ${currentUser.avatarColor}`}
              >
                {currentUser.name.charAt(0) || 'ห'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-teal-600 font-medium">
                  {currentUser.roleNameTh.split('(')[0]}
                </div>
              </div>
            </button>

            {/* Dropdown Menu for RBAC Switching & Custom Name */}
            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      สลับบทบาทผู้ใช้งาน (RBAC)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      เข้าถึงข้อมูลตามสิทธิ์ของตำแหน่ง
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenPermissionGuide();
                    }}
                    className="p-1 text-slate-400 hover:text-teal-600"
                    title="ดูตารางสิทธิ์การใช้งาน"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Custom Name Editor Section */}
                <div className="p-3 bg-teal-50/50 border-b border-teal-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-teal-900">
                      ชื่อผู้ใช้งานของคุณ:
                    </span>
                    {!isEditingName && (
                      <button
                        onClick={() => {
                          setCustomNameInput(currentUser.name);
                          setIsEditingName(true);
                        }}
                        className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>แก้ไขชื่อคุณ</span>
                      </button>
                    )}
                  </div>

                  {isEditingName ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        value={customNameInput}
                        onChange={(e) => setCustomNameInput(e.target.value)}
                        placeholder="ระบุชื่อของคุณ หรือชื่อ-นามสกุล..."
                        className="flex-1 px-2.5 py-1 text-xs border border-teal-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium text-slate-900"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          if (e.key === 'Escape') setIsEditingName(false);
                        }}
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shrink-0"
                        title="บันทึกชื่อ"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors shrink-0"
                        title="ยกเลิก"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-teal-200 truncate flex items-center justify-between">
                      <span className="truncate">{currentUser.name}</span>
                      <span className="text-[10px] text-teal-700 font-semibold ml-1">
                        ({currentUser.roleNameTh.split('(')[0]})
                      </span>
                    </div>
                  )}
                </div>

                {/* Role Switcher List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {MOCK_USERS.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSelectUser(user);
                          setShowUserDropdown(false);
                          setIsEditingName(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-teal-50/60' : ''
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${user.avatarColor}`}
                        >
                          {user.name.charAt(0) || 'ห'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {user.name}
                            </span>
                            {isSelected && (
                              <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-teal-700 font-medium truncate">
                            {user.roleNameTh}
                          </p>
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {user.departmentId === 'ALL'
                              ? 'เข้าถึงได้ทุกกลุ่มงาน'
                              : `เฉพาะกลุ่มงาน ${user.departmentId}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenPermissionGuide();
                    }}
                    className="text-[11px] text-teal-700 hover:underline font-semibold flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ดูโครงสร้างสิทธิ์ตามบทบาท (Permission Matrix)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
