'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Radio,
  PhoneCall,
  AlertTriangle,
  Flame,
  Waves,
  Mountain,
  Compass,
  MapPin,
  CheckSquare,
  ArrowRight,
  Shield,
  LifeBuoy,
  FileText
} from 'lucide-react';

export default function PreparednessPage() {
  const hotlines = [
    { name: 'Disaster Management Centre (DMC)', number: '117', desc: 'National 24/7 disaster coordination & flood alerts' },
    { name: '1990 Suwa Seriya Emergency Medical', number: '1990', desc: 'Free national ambulance service & paramedics' },
    { name: 'Fire & Rescue Brigade', number: '110', desc: 'Urban fire emergencies & structural collapses' },
    { name: 'Police Emergency Hotline', number: '119', desc: 'Law enforcement & search-and-rescue assistance' },
  ];

  const guides = [
    {
      icon: <Waves className="w-6 h-6 text-blue-400" />,
      title: 'Flood Safety & Evacuation',
      badge: 'Monsoon Hazard',
      color: 'border-blue-500/30',
      tips: [
        'Move immediately to designated elevated community shelters (e.g. Shelter A, Shelter C).',
        'Turn off main electricity switches and gas valves before floodwaters enter premises.',
        'Never walk, swim, or drive through moving water. Just 15cm of flowing water can knock you down.',
        'Store drinking water in sealed containers and prepare a portable first-aid emergency bag.'
      ]
    },
    {
      icon: <Mountain className="w-6 h-6 text-amber-400" />,
      title: 'Landslide Warning Signs',
      badge: 'Hill Country Alert',
      color: 'border-amber-500/30',
      tips: [
        'Watch for sudden cracks on ground, tilting telephone posts, trees, or retaining walls.',
        'Sudden changes in water flow from clear to muddy stream water indicates upstream ground shifts.',
        'Evacuate immediately upon receiving NBRO red-level landslide alerts on NOVA network.',
        'Avoid river valleys and low-lying drainage paths during and right after intense rainfall.'
      ]
    },
    {
      icon: <Flame className="w-6 h-6 text-red-400" />,
      title: 'Fire & Chemical Hazmat',
      badge: 'Immediate Action',
      color: 'border-red-500/30',
      tips: [
        'Crawl low under smoke towards the nearest emergency exit — breathe through a damp cloth.',
        'Check door handles with the back of your hand before opening to detect heat.',
        'If clothes catch fire: Stop, Drop, and Roll immediately until flames are extinguished.',
        'Never use elevators during a structural or building fire emergency.'
      ]
    }
  ];

  const kitItems = [
    '3-Day drinking water supply (3 liters per person per day)',
    'Non-perishable canned food & manual can opener',
    'Battery-powered or hand-crank emergency radio',
    'High-lumen LED flashlight & extra rechargeable batteries',
    'First aid kit, antiseptic wipes, sterile bandages, and prescribed medications',
    'Whistle to signal emergency rescue teams',
    'Waterproof pouch with national ID, deeds, insurance, and medical documents',
    'Fully charged power bank and USB charging cables'
  ];

  return (
    <div className="min-h-screen bg-em-bg text-nova-text flex flex-col">
      {/* ─ Top Nav ─ */}
      <nav className="sticky top-0 z-50 bg-em-bg/90 backdrop-blur-xl border-b border-em-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-er-blue-light border border-er-blue/30 flex items-center justify-center group-hover:border-nova-cyan transition-colors">
              <ShieldAlert className="w-5 h-5 text-er-blue" />
            </div>
            <div>
              <span className="font-mono font-black tracking-widest text-nova-text">ADRIAN</span>
              <span className="text-[10px] block text-er-blue font-mono leading-none">PREPAREDNESS HUB</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-em-text-dim">
            <Link href="/" className="hover:text-nova-text transition-colors">Home</Link>
            <Link href="/about" className="hover:text-nova-text transition-colors">About</Link>
            <Link href="/preparedness" className="text-er-blue font-medium">Preparedness</Link>
            <Link href="/command" className="hover:text-nova-text transition-colors">Command Center</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/citizen/sos" className="text-sm font-bold bg-red-600/90 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 transition-all flex items-center gap-1.5">
              <Radio className="w-4 h-4" /> SOS Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* ─ Hero Section ─ */}
      <section className="relative py-16 px-6 overflow-hidden border-b border-em-border/40">
        <div className="absolute inset-0 opacity-10 opacity-25 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            PUBLIC SAFETY & DISASTER RESILIENCE
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Emergency Preparedness Guide
          </h1>
          <p className="text-sm md:text-base text-em-text-dim max-w-2xl mx-auto">
            Essential protocols, evacuation instructions, Sri Lanka emergency hotlines, and checklists to safeguard your family before, during, and after disasters.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/citizen/sos"
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Radio className="w-4 h-4 animate-pulse" /> Launch Citizen SOS Beacon
            </Link>
            <Link
              href="/citizen/report"
              className="bg-white hover:bg-white/80 border border-em-border text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> File Emergency Report
            </Link>
          </div>
        </div>
      </section>

      {/* ─ Emergency Hotlines ─ */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-er-blue" /> 24/7 National Emergency Hotlines
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hotlines.map((h, i) => (
            <div key={i} className="em-card border border-em-border rounded-2xl p-5 space-y-2 hover:border-er-blue/40 transition-all">
              <span className="text-2xl font-mono font-black text-er-blue block">{h.number}</span>
              <h3 className="text-sm font-bold text-nova-text">{h.name}</h3>
              <p className="text-xs text-em-text-dim leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─ Action Guides ─ */}
      <section className="py-8 px-6 max-w-7xl mx-auto w-full">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" /> Disaster Protocols
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((g, i) => (
            <div key={i} className={`em-card border ${g.color} rounded-2xl p-6 space-y-4`}>
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-white border border-em-border">
                  {g.icon}
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-em-border text-em-text-muted">
                  {g.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-nova-text">{g.title}</h3>

              <ul className="space-y-2.5">
                {g.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-em-text-dim flex items-start gap-2 leading-relaxed">
                    <span className="text-er-blue font-bold mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─ Go-Bag Checklist ─ */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full mb-12">
        <div className="em-card border border-em-border rounded-2xl p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-em-border pb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" /> 72-Hour Survival Go-Bag Checklist
              </h2>
              <p className="text-xs text-em-text-dim mt-1">Pack these essential items in an easy-to-carry waterproof backpack.</p>
            </div>
            <Link
              href="/citizen/safety"
              className="text-xs text-er-blue font-bold hover:underline inline-flex items-center gap-1 shrink-0"
            >
              View Interactive Safety Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kitItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-em-border/40 text-xs text-nova-text">
                <div className="w-4 h-4 rounded border border-emerald-400/50 bg-emerald-400/10 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                  ✓
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─ Footer ─ */}
      <footer className="mt-auto border-t border-em-border py-8 px-6 bg-white/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-em-text-dim">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-er-blue" />
            <span>Sri Lanka Disaster Management Network — Public Safety Service</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-nova-text">Home</Link>
            <Link href="/about" className="hover:text-nova-text">About</Link>
            <Link href="/command" className="hover:text-nova-text">Command Center</Link>
            <Link href="/citizen/sos" className="hover:text-red-400 font-bold">SOS</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
