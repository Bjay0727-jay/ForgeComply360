import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExperience } from '../hooks/useExperience';
import { api } from '../utils/api';

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
  color: string;
  dotColor: string;
  textColor: string;
  bgLight: string;
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
    color: 'bg-orange-500',
    dotColor: 'bg-orange-400',
    textColor: 'text-orange-700',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-400',
    href: '/poams',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  evidence_schedule: {
    label: 'Evidence Due',
    color: 'bg-purple-500',
    dotColor: 'bg-purple-400',
    textColor: 'text-purple-700',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-400',
    href: '/evidence/schedules',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  audit_task: {
    label: 'Audit Task',
    color: 'bg-blue-500',
    dotColor: 'bg-blue-400',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-400',
    href: '/audit-prep',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  ato_expiry: {
    label: 'ATO Expiry',
    color: 'bg-amber-500',
    dotColor: 'bg-amber-400',
    textColor: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-400',
    href: '/systems',
    icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2',
  },
  vendor_assessment: {
    label: 'Vendor Review',
    color: 'bg-teal-500',
    dotColor: 'bg-teal-400',
    textColor: 'text-teal-700',
    bgLight: 'bg-teal-50',
    borderColor: 'border-teal-400',
    href: '/vendors',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  vendor_contract: {
    label: 'Contract End',
    color: 'bg-teal-500',
    dotColor: 'bg-teal-300',
    textColor: 'text-teal-700',
    bgLight: 'bg-teal-50',
    borderColor: 'border-teal-300',
    href: '/vendors',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  risk_treatment: {
    label: 'Risk Due',
    color: 'bg-rose-500',
    dotColor: 'bg-rose-400',
    textColor: 'text-rose-700',
    bgLight: 'bg-rose-50',
    borderColor: 'border-rose-400',
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('compliance')} Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">All deadlines and milestones in one view</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 w-48 text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={goToToday} className="ml-2 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Today
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.entries(EVENT_TYPES) as [EventType, EventTypeConfig][]).map(([type, cfg]) => {
          const count = typeCounts[type] || 0;
          const active = filters[type];
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                active
                  ? `${cfg.bgLight} ${cfg.textColor} border-current`
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${active ? cfg.dotColor : 'bg-gray-300'}`} />
              {cfg.label}
              {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Main Content: Calendar Grid + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {calendarDays.map((day) => {
              const dayEvents = eventsByDate[day.key] || [];
              const isToday = day.key === todayKey;
              const isSelected = day.key === selectedDate;
              const isOverdue = day.key < todayKey && dayEvents.length > 0;

              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDate(day.key)}
                  className={`relative p-1.5 min-h-[72px] text-left rounded-lg transition-all
                    ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50'}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                    ${isToday ? 'bg-blue-50' : ''}
                  `}
                >
                  <span className={`text-xs font-medium ${
                    !day.isCurrentMonth ? 'text-gray-300' :
                    isToday ? 'text-blue-700 font-bold' :
                    'text-gray-700'
                  }`}>
                    {day.date}
                  </span>

                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPES[ev.type]?.dotColor || 'bg-gray-300'}`}
                          title={ev.name}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-gray-400 leading-none ml-0.5">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Overdue indicator */}
                  {isOverdue && day.isCurrentMonth && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-1">{formatSelectedDate(selectedDate)}</h3>
          {selectedDate < todayKey && selectedEvents.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium mb-3">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
              </svg>
              Overdue
            </span>
          )}
          <p className="text-xs text-gray-400 mb-4">
            {selectedEvents.length === 0 ? 'No events on this day' : `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''}`}
          </p>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {selectedEvents.map((ev) => {
              const cfg = EVENT_TYPES[ev.type];
              if (!cfg) return null;
              return (
                <a
                  key={ev.id}
                  href={cfg.href}
                  className={`block rounded-lg border-l-4 ${cfg.borderColor} p-3 hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-start gap-2">
                    <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.name}</p>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cfg.bgLight} ${cfg.textColor}`}>
                        {cfg.label}
                      </span>
                      {/* Meta pills */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {ev.meta.status && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">
                            {String(ev.meta.status).replace('_', ' ')}
                          </span>
                        )}
                        {ev.meta.risk_level && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            ev.meta.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                            ev.meta.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                            ev.meta.risk_level === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {String(ev.meta.risk_level)}
                          </span>
                        )}
                        {ev.meta.cadence && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 text-[10px]">
                            {String(ev.meta.cadence)}
                          </span>
                        )}
                        {ev.meta.criticality && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            ev.meta.criticality === 'critical' ? 'bg-red-100 text-red-700' :
                            ev.meta.criticality === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {String(ev.meta.criticality)}
                          </span>
                        )}
                        {ev.meta.category && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[10px]">
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

          {/* Legend */}
          {selectedEvents.length === 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Event Types</p>
              <div className="space-y-1.5">
                {(Object.entries(EVENT_TYPES) as [EventType, EventTypeConfig][]).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                    <span className="text-xs text-gray-500">{cfg.label}</span>
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
