import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Calendar, Clock, CheckCircle, MapPin, Video, ArrowLeft, XCircle
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import {
  AppointmentFormat,
  AppointmentServiceType,
  PharmacyAppointment
} from '../types';
import { authFetch } from '../utils/authToken';

const SERVICES: {
  id: AppointmentServiceType;
  label: string;
  duration: number;
  description: string;
  supportsVisio: boolean;
}[] = [
  {
    id: 'vaccination',
    label: 'Vaccination Officinale',
    duration: 15,
    description: 'Grippe saisonnière, COVID-19 ou rappels vaccinaux adultes sur prescription ou éligibilité.',
    supportsVisio: false
  },
  {
    id: 'trod_angine',
    label: 'Test Rapide Angine (TROD) / COVID',
    duration: 15,
    description: 'Dépistage rapide en cabine confidentielle avec délivrance adaptée selon résultat.',
    supportsVisio: false
  },
  {
    id: 'bilan_medication',
    label: 'Bilan Partagé de Médication',
    duration: 30,
    description: 'Point complet sur vos traitements chroniques, tolérance et prévention des interactions.',
    supportsVisio: true
  },
  {
    id: 'conseil_dermo',
    label: 'Consultation Dermo-Cosmétique',
    duration: 20,
    description: 'Analyse de votre routine cutanée et sélection de soins tolérés par un pharmacien conseil.',
    supportsVisio: true
  },
  {
    id: 'suivi_maternite',
    label: 'Accompagnement Maternité & Bébé',
    duration: 20,
    description: 'Conseils grossesse, allaitement et premiers soins pédiatriques en toute sécurité.',
    supportsVisio: true
  }
];

function getTomorrowIso(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export const AppointmentsPage: React.FC = () => {
  const { currentUser, userProfile, navigate, showToast } = useShop();

  const [serviceType, setServiceType] = useState<AppointmentServiceType>('conseil_dermo');
  const [format, setFormat] = useState<AppointmentFormat>('officine');
  const [date, setDate] = useState<string>(getTomorrowIso);
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const [patientName, setPatientName] = useState(currentUser?.name || userProfile.name || '');
  const [patientEmail, setPatientEmail] = useState(currentUser?.email || userProfile.email || '');
  const [patientPhone, setPatientPhone] = useState(userProfile.phone || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<PharmacyAppointment | null>(null);
  const [honeypotWebsite, setHoneypotWebsite] = useState('');

  const [myAppointments, setMyAppointments] = useState<PharmacyAppointment[]>([]);

  const selectedService = SERVICES.find(s => s.id === serviceType) || SERVICES[0];

  useEffect(() => {
    if (!selectedService.supportsVisio && format === 'visio') {
      setFormat('officine');
    }
  }, [selectedService, format]);

  useEffect(() => {
    if (currentUser) {
      if (!patientName) setPatientName(currentUser.name);
      if (!patientEmail) setPatientEmail(currentUser.email);
    }
  }, [currentUser]);

  const loadSlots = async (targetDate: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/appointments/slots?date=${encodeURIComponent(targetDate)}`);
      const data = await res.json();
      if (Array.isArray(data.allSlots)) {
        setAllSlots(data.allSlots);
        setBookedSlots(Array.isArray(data.bookedSlots) ? data.bookedSlots : []);
        if (selectedSlot && (data.bookedSlots || []).includes(selectedSlot)) {
          setSelectedSlot('');
        }
      }
    } catch {
      // keep existing
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadMyAppointments = async () => {
    if (!currentUser) {
      setMyAppointments([]);
      return;
    }
    try {
      const res = await authFetch('/api/appointments/mine');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) setMyAppointments(list);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSlots(date);
  }, [date]);

  useEffect(() => {
    loadMyAppointments();
  }, [currentUser]);

  useEffect(() => {
    const socket = io();
    socket.on('appointments-updated', () => {
      loadSlots(date);
      if (currentUser) loadMyAppointments();
    });
    return () => {
      socket.disconnect();
    };
  }, [date, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      showToast('Veuillez sélectionner un créneau horaire disponible.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          format,
          date,
          timeSlot: selectedSlot,
          patientName: patientName.trim(),
          patientEmail: patientEmail.trim(),
          patientPhone: patientPhone.trim(),
          notes: notes.trim(),
          website: honeypotWebsite
        })
      });
      const data = await res.json();
      if (data.success && data.appointment) {
        setConfirmedAppt(data.appointment);
        setSelectedSlot('');
        setNotes('');
        loadSlots(date);
        loadMyAppointments();
        showToast(`Rendez-vous ${data.appointment.id} confirmé.`);
      } else {
        showToast(data.error || 'Impossible de réserver ce créneau.');
        loadSlots(date);
      }
    } catch {
      showToast('Erreur réseau lors de la réservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelMyAppt = async (id: string) => {
    try {
      const res = await authFetch(`/api/appointments/${encodeURIComponent(id)}/cancel`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Rendez-vous ${id} annulé.`);
        loadMyAppointments();
        loadSlots(date);
      }
    } catch {
      showToast('Erreur réseau.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Officine Myrlan · 15 rue de la République, Lyon</span>
            <span aria-hidden="true">·</span>
            <span>Agenda synchronisé en direct</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
            Prendre Rendez-vous avec votre Pharmacien
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Réservez un entretien pharmaceutique confidentiel en officine (vaccination, test angine, bilan de médication) ou en téléconsultation conseil.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 self-start lg:self-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour boutique</span>
        </button>
      </div>

      {confirmedAppt ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle className="w-7 h-7 shrink-0" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">Réservation enregistrée</div>
              <h2 className="text-xl font-bold text-slate-900 tabular-nums">Rendez-vous {confirmedAppt.id} confirmé</h2>
            </div>
          </div>

          <div className="border-t border-b border-slate-200 py-4 space-y-2 text-xs text-slate-700 tabular-nums">
            <div><strong>Prestation :</strong> {confirmedAppt.serviceLabel} ({confirmedAppt.durationMinutes} min)</div>
            <div><strong>Date &amp; Heure :</strong> {confirmedAppt.date} à {confirmedAppt.timeSlot}</div>
            <div>
              <strong>Lieu :</strong>{' '}
              {confirmedAppt.format === 'visio'
                ? 'Téléconsultation / Appel pharmacien'
                : 'Espace Confidentialité · Pharmacie Myrlan, 15 rue de la République, 69002 Lyon'}
            </div>
            <div><strong>Patient :</strong> {confirmedAppt.patientName} · {confirmedAppt.patientPhone}</div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setConfirmedAppt(null)}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl"
            >
              Prendre un autre rendez-vous
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Retourner à la boutique
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Service + Date + Slots */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Service */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">01. Choisir le motif de consultation</h2>
              <div className="space-y-2.5">
                {SERVICES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceType(s.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${
                      serviceType === s.id
                        ? 'border-blue-700 bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">{s.label}</span>
                      <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0">{s.duration} min</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.description}</p>
                    <div className="text-[11px] text-slate-500 mt-2">
                      {s.supportsVisio ? 'À l’officine ou en téléconsultation' : 'Uniquement en personne à l’officine'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Format & Date & Slots */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-bold text-slate-900">02. Format, date et créneau horaire</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat('officine')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 ${
                    format === 'officine' ? 'border-blue-700 bg-blue-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">À l’officine (Lyon 2e)</div>
                    <div className="text-[11px] text-slate-500">Cabine confidentielle dédiée</div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!selectedService.supportsVisio}
                  onClick={() => setFormat('visio')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                    format === 'visio' ? 'border-blue-700 bg-blue-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Video className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Téléconsultation / Tél.</div>
                    <div className="text-[11px] text-slate-500">
                      {selectedService.supportsVisio ? 'Conseil à distance avec un pharmacien' : 'Indisponible pour cet acte'}
                    </div>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date souhaitée</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={getTodayIso()}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono tabular-nums"
                  />
                </div>
                <div className="text-xs text-slate-500 tabular-nums">
                  {loadingSlots
                    ? 'Vérification des disponibilités...'
                    : `${Math.max(0, allSlots.length - bookedSlots.length)} créneau(x) disponible(s) ce jour`}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Sélectionner une heure
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 tabular-nums">
                  {allSlots.map(slot => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-xl border text-xs font-mono font-semibold transition-colors ${
                          isBooked
                            ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Patient Form & Summary */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">03. Coordonnées du patient</h2>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 tabular-nums">
              <div className="font-bold text-slate-900">{selectedService.label}</div>
              <div>
                {date} {selectedSlot ? `à ${selectedSlot}` : '· Heure à sélectionner'} ({selectedService.duration} min)
              </div>
              <div className="text-slate-500">
                {format === 'visio' ? 'Téléconsultation / Téléphone' : 'En cabine à l’officine (Lyon 2e)'}
              </div>
            </div>

            <div className="sr-only" aria-hidden="true">
              <label htmlFor="appt-website">Site web</label>
              <input
                id="appt-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypotWebsite}
                onChange={(e) => setHoneypotWebsite(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom &amp; Prénom</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="ex: Camille Laurent"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="camille@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Précisions pour le pharmacien (facultatif)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Symptômes, allergies, vaccin souhaité ou ordonnance à préparer..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              {submitting ? 'Confirmation en cours...' : 'Confirmer mon rendez-vous'}
            </button>
          </div>
        </form>
      )}

      {/* Authenticated Patient Appointments List */}
      {currentUser && myAppointments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-bold text-sm text-slate-900">Mes rendez-vous officinaux ({myAppointments.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Réf.</th>
                  <th className="py-3 px-4">Prestation</th>
                  <th className="py-3 px-4">Date &amp; Heure</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myAppointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{appt.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{appt.serviceLabel}</div>
                      {appt.pharmacistNote && (
                        <div className="text-[11px] text-blue-700 font-normal mt-0.5">Note officine : {appt.pharmacistNote}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{appt.date} · {appt.timeSlot}</td>
                    <td className="py-3 px-4 text-slate-600">{appt.format === 'visio' ? 'Téléconsultation' : 'À l’officine'}</td>
                    <td className="py-3 px-4 font-semibold">
                      <span className={
                        appt.status === 'Confirmé'
                          ? 'text-blue-700'
                          : appt.status === 'Terminé'
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                      }>
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {appt.status === 'Confirmé' && (
                        <button
                          type="button"
                          onClick={() => handleCancelMyAppt(appt.id)}
                          className="px-2.5 py-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Annuler</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
