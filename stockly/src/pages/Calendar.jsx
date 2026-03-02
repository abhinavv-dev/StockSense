import React, { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";

const STORAGE_KEY = "stocksense_calendar_events_v1";
const API_EVENTS_URL = "/api/calendar/events";

function ymd(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function clampToDate(val) {
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEvents(eventsByDate) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsByDate));
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [cursorMonth, setCursorMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => ymd(new Date()));
  const [eventsByDate, setEventsByDate] = useState(() => (typeof window !== "undefined" ? loadEvents() : {}));
  const [newTitle, setNewTitle] = useState("");
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") saveEvents(eventsByDate);
  }, [eventsByDate]);

  useEffect(() => {
    let cancelled = false;
    async function fetchEvents() {
      try {
        setSyncError(null);
        const res = await fetch(API_EVENTS_URL);
        if (!res.ok) throw new Error("Failed to load calendar events");
        const data = await res.json();
        if (cancelled) return;
        const fromApi = data?.eventsByDate || {};
        // Use backend as source-of-truth; keep any local-only entries if API is empty/unavailable.
        setEventsByDate((prev) => (Object.keys(fromApi).length ? fromApi : prev));
      } catch (e) {
        if (!cancelled) setSyncError("Backend not reachable. Events are saved locally only.");
      }
    }
    fetchEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const monthLabel = useMemo(() => {
    const d = clampToDate(cursorMonth);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [cursorMonth]);

  const gridDays = useMemo(() => {
    const start = startOfMonth(cursorMonth);
    const end = endOfMonth(cursorMonth);
    const startDow = start.getDay(); // 0=Sun

    const days = [];
    // Leading days
    for (let i = 0; i < startDow; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (startDow - i));
      days.push({ date: d, inMonth: false });
    }
    // Month days
    for (let day = 1; day <= end.getDate(); day++) {
      days.push({ date: new Date(start.getFullYear(), start.getMonth(), day), inMonth: true });
    }
    // Trailing days to fill 6 weeks
    while (days.length < 42) {
      const last = days[days.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      days.push({ date: d, inMonth: false });
    }
    return days;
  }, [cursorMonth]);

  const selectedEvents = eventsByDate[selectedDate] || [];

  const upcomingAndPast = useMemo(() => {
    const now = new Date();
    const keys = Object.keys(eventsByDate);
    const items = keys
      .flatMap((k) => (eventsByDate[k] || []).map((e) => ({ date: k, ...e })))
      .sort((a, b) => a.date.localeCompare(b.date));

    const past = [];
    const upcoming = [];
    for (const it of items) {
      const d = new Date(`${it.date}T00:00:00`);
      if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) past.push(it);
      else upcoming.push(it);
    }
    return {
      past: past.slice(-8).reverse(),
      upcoming: upcoming.slice(0, 8),
    };
  }, [eventsByDate]);

  const addEvent = () => {
    const title = newTitle.trim();
    if (!title) return;
    const eventId = `${Date.now()}`;
    setEventsByDate((prev) => {
      const list = prev[selectedDate] ? [...prev[selectedDate]] : [];
      list.push({ id: eventId, title });
      return { ...prev, [selectedDate]: list };
    });
    setNewTitle("");

    // Best-effort backend log
    fetch(API_EVENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, title, action: "add", event_id: eventId }),
    }).catch(() => setSyncError("Backend not reachable. Events are saved locally only."));
  };

  const removeEvent = (id) => {
    setEventsByDate((prev) => {
      const list = (prev[selectedDate] || []).filter((e) => e.id !== id);
      const next = { ...prev, [selectedDate]: list };
      if (list.length === 0) delete next[selectedDate];
      return next;
    });

    // Best-effort backend log
    fetch(API_EVENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, action: "remove", event_id: id }),
    }).catch(() => setSyncError("Backend not reachable. Events are saved locally only."));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-lime-100 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-lime-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500 mt-1">Add events to specific dates</p>
          </div>
        </div>
        {syncError && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            {syncError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setCursorMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-lg font-semibold text-gray-900">{monthLabel}</div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setCursorMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              className="px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50"
              onClick={() => {
                setCursorMonth(startOfMonth(new Date()));
                setSelectedDate(ymd(new Date()));
              }}
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-2 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {gridDays.map(({ date, inMonth }) => {
              const key = ymd(date);
              const isToday = key === ymd(today);
              const isSelected = key === selectedDate;
              const hasEvents = (eventsByDate[key] || []).length > 0;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className={[
                    "h-20 rounded-xl border text-left p-2 transition-colors",
                    inMonth ? "bg-white" : "bg-gray-50",
                    isSelected ? "border-lime-400 ring-2 ring-lime-400/30" : "border-gray-100 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className={["text-sm font-semibold", inMonth ? "text-gray-900" : "text-gray-400"].join(" ")}>
                      {date.getDate()}
                    </div>
                    {isToday && <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-100 text-lime-700">Today</span>}
                  </div>
                  {hasEvents && <div className="mt-2 w-2 h-2 rounded-full bg-lime-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Selected date</div>
              <div className="text-xs text-gray-500">{selectedDate}</div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add event..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400"
            />
            <button
              onClick={addEvent}
              className="px-3 py-2 bg-lime-400 text-black rounded-xl text-sm font-medium hover:bg-lime-500 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="space-y-2">
            {selectedEvents.length === 0 ? (
              <div className="text-sm text-gray-500">No events for this date.</div>
            ) : (
              selectedEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-sm text-gray-900">{e.title}</div>
                  <button
                    onClick={() => removeEvent(e.id)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-900"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Upcoming</div>
              {upcomingAndPast.upcoming.length === 0 ? (
                <div className="text-sm text-gray-500">No upcoming events.</div>
              ) : (
                <div className="space-y-2">
                  {upcomingAndPast.upcoming.map((it) => (
                    <button
                      key={`${it.date}-${it.id}`}
                      onClick={() => setSelectedDate(it.date)}
                      className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                    >
                      <div className="text-xs text-gray-500">{it.date}</div>
                      <div className="text-sm text-gray-900">{it.title}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Past</div>
              {upcomingAndPast.past.length === 0 ? (
                <div className="text-sm text-gray-500">No past events.</div>
              ) : (
                <div className="space-y-2">
                  {upcomingAndPast.past.map((it) => (
                    <button
                      key={`${it.date}-${it.id}`}
                      onClick={() => setSelectedDate(it.date)}
                      className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                    >
                      <div className="text-xs text-gray-500">{it.date}</div>
                      <div className="text-sm text-gray-900">{it.title}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

