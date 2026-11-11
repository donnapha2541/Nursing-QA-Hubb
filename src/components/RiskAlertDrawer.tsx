import React from 'react';
import {
  RealtimeAlert,
  DepartmentConfig,
  UserProfile,
  IncidentReport,
} from '../types/nursing';
import { soundAlert } from '../utils/audioAlert';
import {
  X,
  ShieldAlert,
  AlertCircle,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { canUserResolveIncidents } from '../utils/calculations';

interface RiskAlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: RealtimeAlert[];
  departments: DepartmentConfig[];
  currentUser: UserProfile;
  onAcknowledgeAlert: (alertId: string) => void;
  onDismissAlert: (alertId: string) => void;
  onViewIncident: (incidentId: string) => void;
  onOpenNewIncidentForAlert: (alert: RealtimeAlert) => void;
}

export const RiskAlertDrawer: React.FC<RiskAlertDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  departments,
  currentUser,
  onAcknowledgeAlert,
  onDismissAlert,
  onViewIncident,
  onOpenNewIncidentForAlert,
}) => {
  if (!isOpen) return null;

  const canResolve = canUserResolveIncidents(currentUser.role);
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const warningAlerts = alerts.filter((a) => a.severity === 'WARNING');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-600/30 text-rose-400">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-['Prompt',sans-serif]">
                ศูนย์แจ้งเตือนความเสี่ยงเรียลไทม์ (Live Risk Alerts)
              </h3>
              <p className="text-[11px] text-slate-400">
                ตรวจพบค่าผิดปกติ {alerts.length} รายการ (วิกฤต {criticalAlerts.length})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => soundAlert.playCriticalAlert()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="ทดสอบเสียงเตือนวิกฤต"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {alerts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">ไม่มีการแจ้งเตือนความเสี่ยง</h4>
              <p className="text-xs text-slate-500 mt-1">
                ตัวชี้วัดทุกกลุ่มงานอยู่ในเกณฑ์มาตรฐานที่ปลอดภัย
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const dept = departments.find((d) => d.id === alert.departmentId);
              const isCritical = alert.severity === 'CRITICAL';

              return (
                <div
                  key={alert.id}
                  className={`pt-3 first:pt-0 p-3 rounded-xl border transition-all ${
                    isCritical
                      ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
                      : 'bg-amber-50/70 border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white font-['Prompt',sans-serif]">
                        {dept?.shortName || alert.departmentId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isCritical
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {isCritical ? 'วิกฤต (Critical)' : 'เฝ้าระวัง (Warning)'}
                      </span>
                    </div>

                    <div className="flex items-center text-[10px] text-slate-500 gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{alert.timestamp.split(' ')[1] || alert.timestamp}</span>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 mt-1.5">
                    {alert.indicatorName}
                  </h5>

                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] bg-white/70 p-1.5 rounded-lg border border-slate-200/60">
                    <span className="text-slate-600">
                      ค่าตรวจวัด: <strong className="text-rose-700 font-bold">{alert.currentValue} {alert.unit}</strong>
                    </span>
                    <span className="text-slate-500">
                      เกณฑ์เป้าหมาย: {alert.benchmarkValue} {alert.unit}
                    </span>
                  </div>

                  {/* Actions on this alert */}
                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                    {alert.incidentId ? (
                      <button
                        onClick={() => onViewIncident(alert.incidentId!)}
                        className="text-xs text-teal-800 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>ดูใบรายงาน RCA (#{alert.incidentId})</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenNewIncidentForAlert(alert)}
                        className="text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>เปิดใบรายงานอุบัติการณ์ (IR)</span>
                      </button>
                    )}

                    {canResolve && (
                      <button
                        onClick={() => onDismissAlert(alert.id)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded border border-slate-300 transition-colors"
                      >
                        รับทราบ/ปิดการเตือน
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500">
            แจ้งเตือนอัตโนมัติแบบเรียลไทม์ตามเกณฑ์ความปลอดภัยผู้ป่วย (Patient Safety Goals)
          </p>
        </div>
      </div>
    </div>
  );
};
