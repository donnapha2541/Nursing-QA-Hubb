import React, { useRef } from 'react';
import { DepartmentId, DepartmentConfig, RealtimeAlert } from '../types/nursing';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

interface DepartmentTabsProps {
  departments: DepartmentConfig[];
  selectedDepartment: DepartmentId | 'ALL';
  onSelectDepartment: (deptId: DepartmentId | 'ALL') => void;
  alerts: RealtimeAlert[];
}

export const DepartmentTabs: React.FC<DepartmentTabsProps> = ({
  departments,
  selectedDepartment,
  onSelectDepartment,
  alerts,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Helper to determine alert status of each department
  const getDeptAlertStatus = (deptId: DepartmentId) => {
    const deptAlerts = alerts.filter((a) => a.departmentId === deptId);
    const hasCritical = deptAlerts.some((a) => a.severity === 'CRITICAL');
    const hasWarning = deptAlerts.some((a) => a.severity === 'WARNING');
    return { count: deptAlerts.length, hasCritical, hasWarning };
  };

  return (
    <div className="bg-[#e9eff2] border-b border-slate-300 relative shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 relative">
        {/* Left Scroll Button (visible on mobile / tablet) */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/90 rounded-full shadow border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 lg:hidden"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Tabs Bar matching the user's attachment style */}
        <div
          ref={scrollContainerRef}
          className="flex items-center overflow-x-auto no-scrollbar scroll-smooth py-1 sm:py-1.5 text-sm font-['Prompt',sans-serif] select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Overview Tab */}
          <button
            onClick={() => onSelectDepartment('ALL')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 transition-all text-xs sm:text-sm font-medium rounded-t-sm relative ${
              selectedDepartment === 'ALL'
                ? 'text-teal-900 font-bold bg-white/70 after:absolute after:bottom-0 after:left-1 after:right-1 after:h-0.5 after:bg-teal-700'
                : 'text-slate-700 hover:text-teal-800 hover:bg-slate-200/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>ภาพรวมทุกกลุ่มงาน</span>
          </button>

          <span className="text-slate-300 px-1 text-xs">|</span>

          {/* Department Tabs matching screenshot */}
          {departments.map((dept, index) => {
            const isSelected = selectedDepartment === dept.id;
            const { count, hasCritical, hasWarning } = getDeptAlertStatus(dept.id);

            return (
              <React.Fragment key={dept.id}>
                <button
                  onClick={() => onSelectDepartment(dept.id)}
                  title={dept.nameTh}
                  className={`shrink-0 flex items-center gap-1 px-3 sm:px-3.5 py-1.5 transition-all text-xs sm:text-sm rounded-t-sm relative group ${
                    isSelected
                      ? 'text-emerald-950 font-bold bg-white/80 shadow-xs after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[3px] after:bg-emerald-700 after:rounded-t'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/40'
                  }`}
                >
                  {/* Status Indicator Dot */}
                  {hasCritical ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  ) : hasWarning ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  ) : null}

                  <span className="tracking-wide">{dept.shortName}</span>

                  {/* Alert Count Badge if any */}
                  {count > 0 && (
                    <span
                      className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white ${
                        hasCritical ? 'bg-rose-600' : 'bg-amber-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>

                {index < departments.length - 1 && (
                  <span className="text-slate-300 font-light px-0.5 text-xs">|</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Scroll Button (visible on mobile / tablet) */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/90 rounded-full shadow border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 lg:hidden"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
