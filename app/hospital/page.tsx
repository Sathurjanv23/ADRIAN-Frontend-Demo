'use client';

import { useState, useEffect } from 'react';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useNovaStore } from '@/lib/store/nova-store';
import { StatCard } from '@/components/emergency/StatCard';
import { SeverityBadge } from '@/components/emergency/SeverityBadge';
import { motion } from 'framer-motion';
import { Bed, Users, Activity, Truck, Clock, AlertTriangle, HeartPulse, Phone, UserPlus, PlusCircle, CheckCircle2 } from 'lucide-react';
import { cn, formatTimeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { hospitalsApi } from '@/lib/api/client';

import { useTranslation } from '@/lib/i18n';

export default function HospitalDashboardPage() {
  const { hospitals, updateHospital, currentUser, fetchHospitals } = useNovaStore();
  const { t, localize, statusLabel } = useTranslation();

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // Selected hospital state (defaults to user's assigned hospitalId or matched district hospital or h001)
  const userHospital = hospitals.find((h) => h.id === (currentUser as any)?.hospitalId) ||
    hospitals.find((h) => currentUser?.district && h.district?.toLowerCase() === currentUser.district.toLowerCase()) ||
    hospitals[0];

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [admittingId, setAdmittingId] = useState<string | null>(null);

  const activeHospitalId = selectedHospitalId || userHospital?.id || 'h001';
  const myHospital = hospitals.find((h) => h.id === activeHospitalId) || userHospital || hospitals[0];

  if (!myHospital) {
    return (
      <AuthGuard allowedRoles={['hospital']}>
        <div className="min-h-screen bg-em-bg">
          <TopNav role="hospital" />
          <DashboardShell role="hospital">
            <div className="p-12 text-center space-y-3">
              <HeartPulse className="w-12 h-12 text-em-text-muted mx-auto opacity-40" />
              <h2 className="text-lg font-bold text-nova-text">No hospital capacity data available</h2>
              <p className="text-xs text-em-text-dim max-w-md mx-auto">
                No active hospital facility profile is assigned or registered in the database. Real-time telemetry will appear when hospital records are connected.
              </p>
            </div>
          </DashboardShell>
        </div>
      </AuthGuard>
    );
  }

  const bedUsagePercent = Math.round(((myHospital.totalBeds - myHospital.availableBeds) / myHospital.totalBeds) * 100);
  const icuUsagePercent = Math.round(((myHospital.icuTotal - myHospital.icuAvailable) / myHospital.icuTotal) * 100);

  const updateBeds = async (delta: number) => {
    const newAvailable = Math.max(0, Math.min(myHospital.totalBeds, myHospital.availableBeds + delta));
    try {
      await hospitalsApi.updateCapacity(myHospital.id, { availableBeds: newAvailable });
      updateHospital(myHospital.id, { availableBeds: newAvailable });
      toast.success(`Bed count updated for ${myHospital.name}: ${newAvailable} ${t('status.available')}`);
    } catch (err: any) {
      toast.error('Failed to update capacity', { description: err.message });
    }
  };

  const updateIcuBeds = async (delta: number) => {
    const newAvailable = Math.max(0, Math.min(myHospital.icuTotal, myHospital.icuAvailable + delta));
    try {
      await hospitalsApi.updateCapacity(myHospital.id, { icuAvailable: newAvailable });
      updateHospital(myHospital.id, { icuAvailable: newAvailable });
      toast.success(`ICU count updated for ${myHospital.name}: ${newAvailable} ${t('status.available')}`);
    } catch (err: any) {
      toast.error('Failed to update capacity', { description: err.message });
    }
  };

  const handleAdmitCase = async (ic: any, requiresIcu: boolean = false) => {
    if (!myHospital) return;
    setAdmittingId(ic.id);
    try {
      await hospitalsApi.admitPatient(myHospital.id, {
        patientCount: ic.patientCount || 1,
        requiresIcu,
        incomingCaseId: ic.id,
      });

      const count = ic.patientCount || 1;
      const updatedIncoming = myHospital.incomingCases.filter((c) => c.id !== ic.id);
      if (requiresIcu) {
        const remaining = Math.max(0, myHospital.icuAvailable - count);
        updateHospital(myHospital.id, {
          icuAvailable: remaining,
          incomingCases: updatedIncoming,
        });
        toast.success(`Patient admitted to ICU: ${count} ICU Bed occupied. (${remaining} remaining)`);
      } else {
        const remaining = Math.max(0, myHospital.availableBeds - count);
        updateHospital(myHospital.id, {
          availableBeds: remaining,
          incomingCases: updatedIncoming,
        });
        toast.success(`Patient admitted: ${count} Ward Bed occupied. (${remaining} remaining)`);
      }
    } catch (err: any) {
      toast.error('Failed to admit patient', { description: err.message });
    } finally {
      setAdmittingId(null);
    }
  };

  const handleQuickAdmit = async (requiresIcu: boolean = false) => {
    if (!myHospital) return;
    try {
      await hospitalsApi.admitPatient(myHospital.id, {
        patientCount: 1,
        requiresIcu,
      });
      if (requiresIcu) {
        const next = Math.max(0, myHospital.icuAvailable - 1);
        updateHospital(myHospital.id, { icuAvailable: next });
        toast.success(`Walk-in admitted to ICU (${next} remaining)`);
      } else {
        const next = Math.max(0, myHospital.availableBeds - 1);
        updateHospital(myHospital.id, { availableBeds: next });
        toast.success(`Walk-in admitted to Ward Bed (${next} remaining)`);
      }
    } catch (err: any) {
      toast.error('Admission failed', { description: err.message });
    }
  };

  return (
    <AuthGuard allowedRoles={['hospital']}>
      <div className="min-h-screen bg-em-bg">
        <TopNav role="hospital" />
        <DashboardShell role="hospital">
          <div className="p-5 space-y-5">
            {/* Header with Hospital Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 p-4 rounded-2xl border border-em-border">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold font-display text-nova-text">{t('heading.hospital_dashboard')}</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-er-blue-light border border-er-blue/30 text-er-blue uppercase">
                    {myHospital.type} Facility
                  </span>
                </div>
                <p className="text-sm text-em-text-dim mt-0.5">{localize(myHospital.name)} — {myHospital.district} District</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Hospital Switcher Dropdown */}
                <div className="flex items-center gap-2 bg-white border border-em-border rounded-xl px-3 py-1.5 text-xs text-nova-text">
                  <HeartPulse className="w-4 h-4 text-er-blue flex-shrink-0" />
                  <select
                    value={myHospital.id}
                    onChange={(e) => setSelectedHospitalId(e.target.value)}
                    className="bg-transparent text-nova-text font-bold focus:outline-none cursor-pointer pr-2"
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id} className="bg-white text-nova-text">
                        🏥 {h.name} ({h.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAdmit(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs hover:bg-emerald-500/25 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + Admit Walk-in
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdmit(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs hover:bg-cyan-500/25 transition-all"
                  >
                    <HeartPulse className="w-3.5 h-3.5" />
                    + ICU Admit
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-er-green px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-nova-low animate-pulse" />
                  {t('common.ready')}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label={t('stats.available_beds')} value={myHospital.availableBeds} icon={<Bed className="w-4 h-4" />} variant={myHospital.availableBeds < 50 ? 'critical' : 'default'} />
              <StatCard label={t('stats.icu_available')} value={myHospital.icuAvailable} icon={<HeartPulse className="w-4 h-4" />} variant={myHospital.icuAvailable < 5 ? 'critical' : 'warning'} />
              <StatCard label={t('stats.medical_teams')} value={myHospital.emergencyTeams} icon={<Users className="w-4 h-4" />} variant="cyan" />
              <StatCard label={t('stats.incoming_cases')} value={myHospital.incomingCases.length} icon={<AlertTriangle className="w-4 h-4" />} variant={myHospital.incomingCases.length > 0 ? 'critical' : 'default'} />
            </div>

            {/* Capacity Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emergency Beds */}
              <div className="em-card border border-em-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-nova-text">{t('heading.ward_capacity')}</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateBeds(-1)} className="w-6 h-6 rounded bg-white border border-em-border text-em-text-dim hover:text-nova-text flex items-center justify-center text-sm">-</button>
                    <button onClick={() => updateBeds(1)} className="w-6 h-6 rounded bg-white border border-em-border text-em-text-dim hover:text-nova-text flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold font-mono text-nova-text">{myHospital.availableBeds}</span>
                  <span className="text-xs text-em-text-muted">of {myHospital.totalBeds} total</span>
                </div>
                <div className="h-3 bg-nova-border rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', bedUsagePercent > 90 ? 'bg-red-500' : bedUsagePercent > 70 ? 'bg-orange-500' : 'bg-green-500')}
                    style={{ width: `${bedUsagePercent}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${bedUsagePercent}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <p className="text-xs text-em-text-muted mt-1">{bedUsagePercent}% occupied</p>
              </div>

              {/* ICU */}
              <div className="em-card border border-em-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-nova-text">{t('stats.icu_available')}</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateIcuBeds(-1)} className="w-6 h-6 rounded bg-white border border-em-border text-em-text-dim hover:text-nova-text flex items-center justify-center text-sm">-</button>
                    <button onClick={() => updateIcuBeds(1)} className="w-6 h-6 rounded bg-white border border-em-border text-em-text-dim hover:text-nova-text flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={cn('text-2xl font-bold font-mono', myHospital.icuAvailable <= 3 ? 'text-red-400' : 'text-nova-text')}>
                    {myHospital.icuAvailable}
                  </span>
                  <span className="text-xs text-em-text-muted">of {myHospital.icuTotal} total</span>
                </div>
                <div className="h-3 bg-nova-border rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', icuUsagePercent > 90 ? 'bg-red-500' : icuUsagePercent > 70 ? 'bg-orange-500' : 'bg-nova-cyan')}
                    style={{ width: `${icuUsagePercent}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${icuUsagePercent}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <p className="text-xs text-em-text-muted mt-1">{icuUsagePercent}% occupied</p>
                {myHospital.icuAvailable <= 3 && (
                  <p className="text-xs text-red-400 mt-2 font-semibold">⚠️ {t('stats.icu_available')} {t('severity.critical')}!</p>
                )}
              </div>
            </div>

            {/* Incoming Emergency Cases */}
            {myHospital.incomingCases.length > 0 && (
              <div className="em-card border border-red-500/25 rounded-xl p-5">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4">🚨 {t('heading.incoming_emergencies')}</p>
                <div className="space-y-3">
                  {myHospital.incomingCases.map((ic) => (
                    <div key={ic.id} className="p-4 rounded-xl bg-white/70 border border-em-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-mono text-em-text-muted">{ic.incidentId}</p>
                          <p className="text-sm font-bold text-nova-text mt-0.5">{localize(ic.condition)}</p>
                        </div>
                        <div className="text-right">
                          <SeverityBadge severity={ic.severity} size="sm" />
                          <p className="text-sm font-bold text-er-orange mt-1">{ic.eta} {t('common.min')}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ic.requiredCare.map((care) => (
                          <span key={care} className="text-[10px] bg-er-blue-light text-er-blue border border-er-blue/20 px-2 py-0.5 rounded-full">
                            {care}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-em-border/70 flex-wrap">
                        <p className="text-xs text-em-text-muted">Patients: <strong className="text-nova-text">{ic.patientCount}</strong></p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={admittingId === ic.id || myHospital.availableBeds < (ic.patientCount || 1)}
                            onClick={() => handleAdmitCase(ic, false)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            Admit to Bed
                          </button>
                          <button
                            type="button"
                            disabled={admittingId === ic.id || myHospital.icuAvailable < (ic.patientCount || 1)}
                            onClick={() => handleAdmitCase(ic, true)}
                            className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            <HeartPulse className="w-3 h-3" />
                            Admit to ICU
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ambulances */}
            {(() => {
              const defaultPrefix = (myHospital?.district ? myHospital.district.substring(0, 3) : 'SL').toUpperCase();
              const ambulances = (myHospital?.ambulances && myHospital.ambulances.length > 0)
                ? myHospital.ambulances
                : [
                  { id: `amb-${myHospital.id}-1`, code: `${defaultPrefix}-AMB-01`, status: 'available', eta: null, assignedCase: null },
                  { id: `amb-${myHospital.id}-2`, code: `${defaultPrefix}-AMB-02`, status: 'dispatched', eta: 8, assignedCase: 'NOV-1041' },
                  { id: `amb-${myHospital.id}-3`, code: `${defaultPrefix}-AMB-03`, status: 'available', eta: null, assignedCase: null },
                  { id: `amb-${myHospital.id}-4`, code: `${defaultPrefix}-AMB-04`, status: 'dispatched', eta: 12, assignedCase: 'NOV-1039' },
                  { id: `amb-${myHospital.id}-5`, code: `${defaultPrefix}-AMB-05`, status: 'available', eta: null, assignedCase: null },
                  { id: `amb-${myHospital.id}-6`, code: `${defaultPrefix}-AMB-06`, status: 'maintenance', eta: null, assignedCase: null },
                ];

              return (
                <div className="em-card border border-em-border rounded-xl p-4">
                  <p className="text-xs font-bold text-em-text-muted uppercase tracking-wider mb-3">{t('heading.ambulance_fleet')} ({ambulances.length} Units)</p>
                  <div className="space-y-2">
                    {ambulances.map((amb) => (
                      <div key={amb.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/50 border border-em-border">
                        <div className="flex items-center gap-3">
                          <Truck className={cn('w-4 h-4', {
                            'text-green-400': amb.status === 'available',
                            'text-orange-400': amb.status === 'dispatched',
                            'text-em-text-muted': amb.status === 'maintenance',
                          })} />
                          <div>
                            <p className="text-xs font-bold text-nova-text font-mono">{amb.code}</p>
                            {amb.assignedCase && <p className="text-[10px] text-er-blue font-mono">→ {amb.assignedCase}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {amb.eta && <span className="text-xs text-er-orange font-semibold">{amb.eta} {t('common.min')}</span>}
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', {
                            'bg-green-500/10 text-green-400 border border-green-500/20': amb.status === 'available',
                            'bg-orange-500/10 text-orange-400 border border-orange-500/20': amb.status === 'dispatched',
                            'bg-nova-border text-em-text-muted border border-em-border': amb.status === 'maintenance',
                          })}>
                            {statusLabel(amb.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </DashboardShell>
      </div>
    </AuthGuard>
  );
}
