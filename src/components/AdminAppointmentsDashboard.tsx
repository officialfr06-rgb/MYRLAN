import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Calendar, CheckCircle, Search, XCircle, Clock } from 'lucide-react';
import { AppointmentStatus, PharmacyAppointment } from '../types';
import { authFetch } from '../utils/authToken';

interface AdminAppointmentsDashboardProps {
  showToast: (msg: string) => void;
}

export const AdminAppointmentsDashboard: React.FC<AdminAppointmentsDashboardProps> = ({ showToast }) => {
  const [appointments, setAppointments] = useState<PharmacyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'Tous' | AppointmentStatus>('Tous');
  const [search, setSearch] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<PharmacyAppointment | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/appointments');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) setAppointments(list);
      }
    } catch {
      showToast('Erreur chargement des rendez-vous.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    const socket = io();
    socket.on('appointments-updated', (updated: PharmacyAppointment[]) => {
      if (Array.isArray(updated)) {
        setAppointments(updated);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchStatus = statusFilter === 'Tous' || a.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.patientEmail.toLowerCase().includes(q) ||
        a.serviceLabel.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [appointments, statusFilter, search]);

  const counts = useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter(a => a.status === 'Confirmé').length,
      completed: appointments.filter(a => a.status === 'Terminé').length,
      cancelled: appointments.filter(a => a.status === 'Annulé').length
    };
  }, [appointments]);

  const handleUpdateStatus = async (id: string, status: AppointmentStatus, pharmacistNote?: string) => {
    setUpdating(true);
    try {
      const res = await authFetch(`/api/admin/appointments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, pharmacistNote })
      });
      const data = await res.json();
      if (data.success && data.appointment) {
        setAppointments(prev => prev.map(a => (a.id === id ? data.appointment : a)));
        if (selectedAppt?.id === id) setSelectedAppt(data.appointment);
        showToast(`Rendez-vous ${id} mis à jour (${status}).`);
      } else {
        showToast(data.error || 'Mise à jour impossible.');
      }
    } catch {
      showToast('Erreur réseau.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-500">Total Rendez-vous</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{counts.total}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-blue-700">Confirmés / À venir</div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{counts.confirmed}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-emerald-700">Terminés</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{counts.completed}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-500">Annulés</div>
          <div className="text-2xl font-bold text-slate-600 mt-1">{counts.cancelled}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['Tous', 'Confirmé', 'Terminé', 'Annulé'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher patient, motif, RDV..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Appointments Table */}
        <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900 inline-flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Agenda Officinal ({filteredAppointments.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Chargement de l’agenda...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Réf.</th>
                    <th className="py-3 px-4">Créneau</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Prestation</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map(appt => (
                    <tr
                      key={appt.id}
                      onClick={() => { setSelectedAppt(appt); setNoteInput(appt.pharmacistNote || ''); }}
                      className={`cursor-pointer hover:bg-slate-50 ${selectedAppt?.id === appt.id ? 'bg-blue-50/60' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{appt.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {appt.date} · {appt.timeSlot}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{appt.patientName}</div>
                        <div className="text-[11px] text-slate-500">{appt.patientPhone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{appt.serviceLabel}</div>
                        <div className="text-[11px] text-slate-400">
                          {appt.format === 'visio' ? 'Téléconsultation' : 'À l’officine'} · {appt.durationMinutes} min
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${
                          appt.status === 'Terminé'
                            ? 'text-emerald-700'
                            : appt.status === 'Confirmé'
                              ? 'text-blue-700'
                              : 'text-slate-500'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppt(appt);
                            setNoteInput(appt.pharmacistNote || '');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg"
                        >
                          Gérer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Aucun rendez-vous enregistré pour ces critères.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Detail & Actions Panel */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          {!selectedAppt ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Clock className="w-6 h-6 mx-auto text-slate-300" />
              <p>Sélectionnez un rendez-vous dans la liste pour consulter les notes patient et mettre à jour le statut.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 pb-3">
                <div className="text-[11px] font-mono text-slate-400">{selectedAppt.id}</div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedAppt.patientName}</h3>
                <div className="text-xs text-slate-600">
                  {selectedAppt.patientEmail} · {selectedAppt.patientPhone}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 tabular-nums">
                <div className="font-bold text-slate-900">{selectedAppt.serviceLabel}</div>
                <div className="text-slate-600">{selectedAppt.date} à {selectedAppt.timeSlot} ({selectedAppt.durationMinutes} min)</div>
                <div className="text-slate-500">
                  Mode : {selectedAppt.format === 'visio' ? 'Téléconsultation / Téléphone' : 'À l’officine (Lyon 2e)'}
                </div>
              </div>

              {selectedAppt.notes && (
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-slate-700">Note du patient</div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                    {selectedAppt.notes}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Compte-rendu / Consigne pharmacien
                </label>
                <textarea
                  rows={3}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Ex: Apporter carnet de vaccination ou résultat bilan..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'Terminé', noteInput)}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Marquer terminé &amp; Enregistrer note</span>
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'Confirmé', noteInput)}
                  className="w-full py-2 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg"
                >
                  Confirmer / Enregistrer la note
                </button>
                {selectedAppt.status !== 'Annulé' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'Annulé', noteInput)}
                    className="w-full py-2 px-3 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Annuler ce créneau</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
