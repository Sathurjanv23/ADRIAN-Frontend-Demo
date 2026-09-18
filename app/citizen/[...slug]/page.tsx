'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/shared/TopNav';
import { DashboardShell } from '@/components/shared/Sidebar';
import { useNovaStore } from '@/lib/store/nova-store';
import { CitizenSignInPrompt } from '@/components/citizen/CitizenSignInPrompt';
import { motion } from 'framer-motion';
import { AlertTriangle, ClipboardList, ShieldAlert, Send, Clock, CheckCircle2, ChevronRight, Phone, ShieldCheck } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { validatePhone, isSriLankanPhone } from '@/lib/auth';

export default function CitizenOperationsCatchAll() {
  const params = useParams<{ slug: string[] }>();
  const router = useRouter();
  const slug = params?.slug?.[0] || '';
  const { t } = useTranslation();

  const { incidents, addIncident, currentUser } = useNovaStore();
  const citizenReports = incidents.filter(i => i.reporterName === 'Amal Perera');

  // ⚠️ ALL hooks must be declared before any conditional returns (React Rules of Hooks)
  // Form State for Report Emergency
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('flood');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If attempting to access My Reports without citizen login, require sign-in
  // (this must come AFTER all useState hooks)
  if (slug === 'reports' && (!currentUser || currentUser.role !== 'citizen')) {
    return <CitizenSignInPrompt feature="reports" />;
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !address) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const phoneErr = validatePhone(phone);
    if (phone.trim() && phoneErr) {
      toast.error('Invalid Contact Phone', { description: phoneErr });
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));

    const newId = `NOV-${1000 + incidents.length + 1}`;
    const newInc = {
      id: newId,
      trackingCode: newId,
      title,
      description,
      type: type as any,
      severity: 'high' as const,
      status: 'reported' as const,
      location: { lat: 6.9271, lng: 79.8612, address, district: 'Colombo' },
      reportedAt: new Date().toISOString(),
      reporterName: currentUser?.name || 'Amal Perera',
      reporterPhone: phone.trim() || '+94771234567',
      peopleAffected: 1,
      updates: [{ id: `upd-${Date.now()}`, status: 'reported' as const, message: 'Citizen report filed via portal.', updatedBy: currentUser?.name || 'Citizen', updatedAt: new Date().toISOString() }],
    };

    addIncident(newInc as any);
    useNovaStore.getState().addNotification({
      id: `notif-${Date.now()}`,
      type: 'critical_incident',
      title: `🚨 ${title}`,
      message: `${description.slice(0, 70)} — Contact: ${phone.trim() || 'Logged'}`,
      severity: 'high',
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: newId,
      relatedType: 'incident',
    });

    setSubmitting(false);
    toast.success('distress report submitted successfully. AI is triaging...');
    router.push('/citizen/reports');
  };

  // 1. REPORT EMERGENCY DISTRESS FORM
  const renderReportForm = () => {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        {(!currentUser || currentUser.role !== 'citizen') && (
          <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-orange-300 block">Direct Emergency Filing Mode</span>
              <p className="text-em-text-dim text-[11px] mt-0.5 leading-relaxed">
                Emergency reporting is open to all citizens without signing in. To access the full Citizen Portal (view dashboard, track report progress, and receive live updates), please{' '}
                <Link href="/login?portal=citizen" className="text-er-blue underline font-semibold">
                  sign in to Citizen Portal
                </Link>.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h2 className="text-lg font-bold text-nova-text">{t('heading.distress_form')}</h2>
        </div>
        <form onSubmit={handleReportSubmit} className="em-card border border-em-border rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-em-text-muted uppercase tracking-wider mb-1.5">Emergency Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-white border border-em-border rounded-xl px-3 py-2.5 text-sm text-nova-text focus:outline-none focus:border-er-blue/40"
            >
              <option value="flood">Flood / Rising Water</option>
              <option value="landslide">Landslide / Mudflow</option>
              <option value="fire">Fire Incident</option>
              <option value="road_accident">Road Accident</option>
              <option value="medical">Medical Emergency</option>
              <option value="missing_person">Missing Person</option>
              <option value="building_collapse">Building Collapse</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-em-text-muted uppercase tracking-wider mb-1.5">Short Title</label>
            <input
              type="text"
              placeholder="e.g. Water flooded into first floor of residence"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-em-border rounded-xl px-3 py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-em-text-muted uppercase tracking-wider mb-1.5">Full Details</label>
            <textarea
              rows={4}
              placeholder="Provide details about trapped people, medical needs, or direct hazards..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-em-border rounded-xl px-3 py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-em-text-muted uppercase tracking-wider mb-1.5">Location Address</label>
            <input
              type="text"
              placeholder="Provide exact street address, house number or landmark..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white border border-em-border rounded-xl px-3 py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none focus:border-er-blue/40"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-em-text-muted uppercase tracking-wider">Contact Phone</label>
              {phone.trim() && (
                <span className={cn(
                  'text-[10px] font-medium font-mono px-1.5 py-0.2 rounded',
                  validatePhone(phone) ? 'text-red-400 bg-red-500/10' : 'text-green-400 bg-green-500/10'
                )}>
                  {validatePhone(phone) ? 'Invalid' : isSriLankanPhone(phone) ? '✓ Sri Lanka (+94)' : '✓ Valid'}
                </span>
              )}
            </div>
            <input
              type="tel"
              placeholder="+94 77 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={cn(
                "w-full bg-white border rounded-xl px-3 py-2.5 text-sm text-nova-text placeholder:text-em-text-muted focus:outline-none transition-colors",
                phone.trim() && validatePhone(phone) ? "border-red-500/60 focus:border-red-500" : "border-em-border focus:border-er-blue/40"
              )}
            />
            {phone.trim() && validatePhone(phone) && (
              <p className="text-[11px] text-red-400 mt-1">
                {validatePhone(phone)}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-1.5 bg-red-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Submitting Report...' : 'File Emergency Report'}
          </button>
        </form>
      </div>
    );
  };

  // 2. MY SUBMITTED REPORTS
  const renderMyReports = () => {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-er-blue" /> {t('heading.my_reports')}
        </h2>
        {citizenReports.length > 0 ? (
          <div className="space-y-3">
            {citizenReports.map((rep) => (
              <div key={rep.id} className="em-card border border-em-border rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-em-text-muted">{rep.id}</span>
                    <p className="text-sm font-bold text-nova-text mt-0.5">{rep.title}</p>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase', {
                    'bg-green-500/10 border-green-500/30 text-green-400': rep.status === 'resolved',
                    'bg-yellow-500/10 border-yellow-500/30 text-yellow-400': rep.status === 'assigned' || rep.status === 'en_route',
                    'bg-white border-em-border text-em-text-muted': rep.status === 'reported',
                  })}>
                    {rep.status}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-em-border text-[10px] text-em-text-muted">
                  <span>Filed: {formatDateTime(rep.reportedAt).split(',')[1]}</span>
                  {rep.status !== 'reported' && (
                    <button onClick={() => router.push(`/citizen/tracking/${rep.id}`)} className="text-er-blue hover:underline flex items-center gap-0.5">
                      Track Dispatch <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="em-card border border-em-border rounded-xl p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-em-text-muted mx-auto mb-3" />
            <p className="text-base font-bold text-nova-text">No active reports</p>
            <p className="text-xs text-em-text-muted mt-1">You haven't submitted any emergency reports.</p>
          </div>
        )}
      </div>
    );
  };

  // 3. SAFETY GUIDE
  const renderSafetyGuide = () => {
    const tips = [
      { category: '🌧️ Storms & Monsoon', text: 'Stay indoors, disconnect all electric systems, do not walk or drive through flooded areas, and stay clear of downed power cables.' },
      { category: '🌋 Landslides risk', text: 'If located in steep hillside districts, look out for ground crackings, tilting tree lines, or sudden trickling of soil. Evacuate pre-emptively.' },
      { category: '🏥 Medical Care', text: 'Keep emergency supplies ready, store clean drinking water, prepare a first-aid kit, and locate your closest local shelter zone.' },
    ];
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-nova-text flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-er-blue" /> {t('heading.safety_guidelines')}
        </h2>
        <div className="space-y-3">
          {tips.map((tip, idx) => (
            <div key={idx} className="em-card border border-em-border rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-er-blue">{tip.category}</p>
              <p className="text-xs text-em-text-dim leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-em-bg">
      <TopNav role="citizen" />
      <DashboardShell role="citizen">
        <div className="p-6 space-y-6">
          {slug === 'report' && renderReportForm()}
          {slug === 'reports' && renderMyReports()}
          {slug === 'safety' && renderSafetyGuide()}
        </div>
      </DashboardShell>
    </div>
  );
}
