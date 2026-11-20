import React, { useState, useEffect } from 'react';
import { CalendarCheck, Clock, Users, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { LabBooking } from '../api/types';
import { StatusBadge } from '../components/common/StatusBadge';

export const LabBookingPage: React.FC = () => {
  const [bookings, setBookings] = useState<LabBooking[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [facultyName, setFacultyName] = useState('Prof. Vikram Sharma');
  const [department, setDepartment] = useState('Computer Science');
  const [purpose, setPurpose] = useState('CS-402 Operating Systems Practicum');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('13:00');
  const [attendees, setAttendees] = useState(25);

  const fetchBookings = async () => {
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch {
      // background
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setSuccessMessage(null);

    try {
      await api.createBooking({
        lab_id: 1,
        faculty_name: facultyName,
        department,
        purpose,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        attendees_count: attendees,
      });

      setSuccessMessage('Laboratory reservation successfully confirmed.');
      setShowModal(false);
      await fetchBookings();
    } catch (err: any) {
      setConflictError(err.message || 'Booking conflict or server error');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.cancelBooking(id);
      await fetchBookings();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Laboratory Reservation & Scheduling
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              {bookings.length} Bookings
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Faculty reservation management with automated time-slot conflict detection and attendee limits.
          </p>
        </div>

        <button
          onClick={() => {
            setConflictError(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Reservation</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Course / Purpose</th>
                <th className="py-3 px-4">Attendees</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-white">{b.booking_date}</td>
                  <td className="py-3 px-4 font-mono text-blue-400">
                    {b.start_time} - {b.end_time}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{b.faculty_name}</td>
                  <td className="py-3 px-4 text-slate-400">{b.department}</td>
                  <td className="py-3 px-4 text-slate-300 font-medium">{b.purpose}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{b.attendees_count} Students</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Booking Modal with Conflict Detection */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Reserve Computer Laboratory</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter schedule details. The system checks in real time for time-slot collisions with other faculty bookings.
            </p>

            {conflictError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Faculty Member</label>
                <input
                  type="text"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Purpose / Course Description</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
