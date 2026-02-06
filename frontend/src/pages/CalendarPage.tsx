import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';
import { PageHeader } from '../components/PageHeader';
import { SkeletonCard } from '../components/Skeleton';
import { BUTTONS, CARDS, BADGES } from '../utils/typography';
import { CALENDAR_EVENT_COLORS, RISK_LEVEL_COLORS, getRiskLevelColor } from '../utils/colorSystem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventType = 'poam' | 'evidence_schedule' | 'audit_task' | 'ato_expiry' | 'vendor_assessment' | 'vendor_contract' | 'risk_treatment';

interface CalendarEvent {
  id: string;
  type: EventType;
  name: string;
  date: string;
  meta: Record<string, string | number | null>;
}

interface EventTypeConfig {
  label: string;
  bg: string;
  bgLight: string;
  dotColor: string;
  textColor: string;
  borderColor: string;
  href: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Event Type Configuration
// ---------------------------------------------------------------------------

const EVENT_TYPES: Record<EventType, EventTypeConfig> = {
  poam: {
    label: 'POA&M Due',
    ...CALENDAR_EVENT_COLORS.poam,
    href: '/poams',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  evidence_schedule: {
    label: 'Evidence Due',
    ...CALENDAR_EVENT_COLORS.evidence_schedule,
    href: '/evidence/schedules',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  audit_task: {
    label: 'Audit Task',
    ...CALENDAR_EVENT_COLORS.audit_task,
    href: '/audit-prep',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  ato_expiry: {
    label: 'ATO Expiry',
    ...CALENDAR_EVENT_COLORS.ato_expiry,
    href: '/systems',
    icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2',
  },
  vendor_assessment: {
    label: 'Vendor Review',
    ...CALENDAR_EVENT_COLORS.vendor_assessment,
    href: '/vendors',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  vendor_contract: {
    label: 'Contract End',
    ...CALENDAR_EVENT_COLORS.vendor_contract,
    href: '/vendors',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  risk_treatment: {
    label: 'Risk Due',
    ...CALENDAR_EVENT_COLORS.risk_treatment,
    href: '/risks',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const days: { date: number; month: number; year: number; key: string; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ date: d, month: m, year: y, key: dateKey(y, m, d), isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, month, year, key: dateKey(year, month, d), isCurrentMonth: true });
  }

  // Next month leading days (fill to 42 cells = 6 rows)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({ date: d, month: m, year: y, key: dateKey(y, m, d), isCurrentMonth: false });
  }

  return days;
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function CalendarPage() {
  const { canEdit } = useAuth();
  const { t, isFederal } = useExperience();

  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<EventType, boolean>>(() => {
    const f: Record<string, boolean> = {};
    for (const k of Object.keys(EVENT_TYPES)) f[k] = true;
    return f as Record<EventType, boolean>;
  });

  // Compute date range for the grid
  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);
  const startDate = calendarDays[0].key;
  const endDate = calendarDays[calendarDays.length - 1].key;

  // Fetch events when month changes
  useEffect(() => {
    setLoading(true);
    api<{ events: CalendarEvent[] }>(`/api/v1/calendar/events?start=${startDate}&end=${endDate}`)
      .then((d) => setEvents(d.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!filters[ev.type]) continue;
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events, filters]);

  // Count events per type for filter bar
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of events) {
      counts[ev.type] = (counts[ev.type] || 0) + 1;
    }
    return counts;
  }, [events]);

  // Events for selected day
  const selectedEvents = useMemo(() => {
    return (eventsByDate[selectedDate] || []).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  }, [eventsByDate, selectedDate]);

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(todayKey);
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const toggleFilter = (type: EventType) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const formatSelectedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader title={`${t('compliance')} Calendar`} subtitle="All deadlines and milestones in one view">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white w-48 text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={goToToday} className={`ml-2 ${BUTTONS.secondary} ${BUTTONS.sm}`}>
            Today
          </button>
        </div>
      </PageHeader>

      {/* Filter Bar */}
      <div className={`${CARDS.base} p-4 mb-6`}>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(EVENT_TYPES) as [EventType, EventTypeConfig][]).map(([type, cfg]) => {
            const count = typeCounts[type] || 0;
            const active = filters[type];
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-forge-navy-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${active ? cfg.dotColor : 'bg-gray-300'}`} />
                {cfg.label}
                {count > 0 && <span className={`ml-1 ${active ? 'text-white/70' : 'text-gray-400'}`}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Calendar Grid + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className={`lg:col-span-2 ${CARDS.base} overflow-hidden`}>
          {loading && (
            <div className="p-4">
              <SkeletonCard />
            </div>
          )}

          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-sm font-semibold text-gray-600 py-3">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 p-px">
            {calendarDays.map((day) => {
              const dayEvents = eventsByDate[day.key] || [];
              const isToday = day.key === todayKey;
              const isSelected = day.key === selectedDate;
              const isOverdue = day.key < todayKey && dayEvents.length > 0;

              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDate(day.key)}
                  className={`relative p-2 min-h-[80px] text-left transition-all
                    ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}
                    ${isSelected ? 'ring-2 ring-forge-green-500 ring-inset z-10' : ''}
                    ${isToday && !isSelected ? 'bg-forge-green-50' : ''}
                  `}
                >
                  <span className={`text-sm font-medium ${
                    !day.isCurrentMonth ? 'text-gray-400' :
                    isToday ? 'text-forge-green-700 font-bold' :
                    'text-gray-700'
                  }`}>
                    {day.date}
                  </span>

                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-full ${EVENT_TYPES[ev.type]?.dotColor || 'bg-gray-300'}`}
                          title={ev.name}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-gray-500 font-medium leading-none ml-0.5">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Overdue indicator */}
                  {isOverdue && day.isCurrentMonth && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Sidebar */}
        <div className={`${CARDS.base} overflow-hidden h-fit`}>
          {/* Header with green accent */}
          <div className="p-5 border-l-4 border-l-forge-green-500 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{formatSelectedDate(selectedDate)}</h3>
            <div className="flex items-center gap-2 mt-2">
              {selectedDate < todayKey && selectedEvents.length > 0 && (
                <span className={`inline-flex items-center gap-1 ${BADGES.pill} ${BADGES.error}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                  </svg>
                  Overdue
                </span>
              )}
              <p className="text-sm font-medium text-gray-500">
                {selectedEvents.length === 0 ? 'No events on this day' : `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Event list or Legend */}
          {selectedEvents.length > 0 ? (
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {selectedEvents.map((ev) => {
                const cfg = EVENT_TYPES[ev.type];
                if (!cfg) return null;
                return (
                  <a
                    key={ev.id}
                    href={cfg.href}
                    className={`block rounded-lg border border-gray-100 border-l-4 ${cfg.borderColor} p-3 hover:shadow-md hover:border-gray-200 transition-all`}
                  >
                    <div className="flex items-start gap-2">
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{ev.name}</p>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-bold ${cfg.bgLight} ${cfg.textColor}`}>
                          {cfg.label}
                        </span>
                        {/* Meta pills */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ev.meta.status && (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                              {String(ev.meta.status).replace('_', ' ')}
                            </span>
                          )}
                          {ev.meta.risk_level && (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRiskLevelColor(String(ev.meta.risk_level))}`}>
                              {String(ev.meta.risk_level)}
                            </span>
                          )}
                          {ev.meta.cadence && (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                              {String(ev.meta.cadence)}
                            </span>
                          )}
                          {ev.meta.criticality && (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRiskLevelColor(String(ev.meta.criticality))}`}>
                              {String(ev.meta.criticality)}
                            </span>
                          )}
                          {ev.meta.category && (
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                              {String(ev.meta.category)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Event Types</p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(EVENT_TYPES) as [EventType, EventTypeConfig][]).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${cfg.dotColor}`} />
                    <span className="text-sm font-medium text-gray-700">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
