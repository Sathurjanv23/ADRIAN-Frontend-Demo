'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Cpu,
  Radio,
  MapPin,
  Activity,
  HeartPulse,
  Users,
  Building2,
  Database,
  Lock,
  ArrowRight,
  ChevronRight,
  Globe2,
  CheckCircle2
} from 'lucide-react';

export default function AboutPage() {
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
              <span className="text-[10px] block text-er-blue font-mono leading-none">EMERGENCY NETWORK</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-em-text-dim">
            <Link href="/" className="hover:text-nova-text transition-colors">Home</Link>
            <Link href="/about" className="text-er-blue font-medium">About</Link>
            <Link href="/preparedness" className="hover:text-nova-text transition-colors">Preparedness</Link>
            <Link href="/command" className="hover:text-nova-text transition-colors">Command Center</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-em-text-dim hover:text-nova-text border border-em-border px-3 py-1.5 rounded-lg hover:border-em-border-strong transition-all">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-nova-cyan text-nova-bg px-4 py-1.5 rounded-lg hover:bg-nova-cyan-dim transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─ Hero Section ─ */}
      <section className="relative py-20 px-6 overflow-hidden border-b border-em-border/40">
        <div className="absolute inset-0 opacity-10 opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-er-blue-light border border-er-blue/30 text-er-blue text-xs font-mono"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            AI-POWERED MULTI-AGENCY EMERGENCY ORCHESTRATION
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight"
          >
            Next-Generation National <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nova-cyan via-teal-300 to-emerald-400">
              Disaster Response Platform
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-em-text-dim max-w-3xl mx-auto leading-relaxed"
          >
            ADRIAN unites citizens, first responders, hospitals, and command operations
            through predictive geospatial AI, automated triage, and live digital-twin simulations to save lives during critical disasters in Sri Lanka.
          </motion.p>
        </div>
      </section>

      {/* ─ Key Architecture & Modules ─ */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">Integrated Core Ecosystem</h2>
          <p className="text-sm text-em-text-dim">Five dedicated roles operating on a unified real-time infrastructure</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="em-card border border-em-border rounded-2xl p-6 space-y-4 hover:border-er-blue/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Command Center & AI Copilot</h3>
            <p className="text-xs text-em-text-dim leading-relaxed">
              Real-time situational dashboard with predictive flood & landslide risk heatmaps, automated resource dispatch, and AI copilot intelligence.
            </p>
            <Link href="/command" className="inline-flex items-center gap-1.5 text-xs text-er-blue font-bold hover:underline pt-2">
              Launch Command Center <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="em-card border border-em-border rounded-2xl p-6 space-y-4 hover:border-er-blue/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Citizen SOS & Emergency Reporting</h3>
            <p className="text-xs text-em-text-dim leading-relaxed">
              Instant multimodal distress filing in Sinhala, Tamil, and English with auto-GPS beaconing, live rescue tracking, and safety shelter maps.
            </p>
            <Link href="/citizen/sos" className="inline-flex items-center gap-1.5 text-xs text-red-400 font-bold hover:underline pt-2">
              Citizen Emergency Portal <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="em-card border border-em-border rounded-2xl p-6 space-y-4 hover:border-er-blue/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Hospital Network & Triage</h3>
            <p className="text-xs text-em-text-dim leading-relaxed">
              Live ICU and bed occupancy tracking across Sri Lankan teaching hospitals, instant ALS/BLS ambulance telemetry, and pre-arrival triage alerts.
            </p>
            <Link href="/hospital" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:underline pt-2">
              Hospital Console <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="em-card border border-em-border rounded-2xl p-6 space-y-4 hover:border-er-blue/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Rescue Field Team Ops</h3>
            <p className="text-xs text-em-text-dim leading-relaxed">
              Real-time route optimization, tactical mission coordinates, victim telemetry, and team status synchronization with DMC command base.
            </p>
            <Link href="/rescue" className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold hover:underline pt-2">
              Rescue Unit Terminal <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="em-card border border-em-border rounded-2xl p-6 space-y-4 hover:border-er-blue/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Predictive Risk & Digital Twin</h3>
            <p className="text-xs text-em-text-dim leading-relaxed">
              Kelani River hydro-telemetry, monsoon rainfall forecasting, and 1hr/3hr/6hr predictive zone impact modeling for preemptive evacuations.
            </p>
            <Link href="/command/prediction" className="inline-flex items-center gap-1.5 text-xs text-purple-400 font-bold hover:underline pt-2">
              View Digital Twin <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="em-card border border-em-border rounded-2xl p-6 space-y-4 hover:border-er-blue/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Frontend Demo Data Layer</h3>
            <p className="text-xs text-em-text-dim leading-relaxed">
              This build runs entirely in the browser — mock operational data stands in for the Spring Boot + MongoDB Atlas backend so the full experience can be demoed without any server.
            </p>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold hover:underline pt-2">
              System Admin <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─ Quick CTA Footer ─ */}
      <footer className="mt-auto border-t border-em-border py-10 px-6 bg-white/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-er-blue" />
            <span className="font-mono text-xs text-em-text-muted">ADRIAN — Autonomous Emergency Response Network</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-em-text-dim">
            <Link href="/" className="hover:text-nova-text">Home</Link>
            <Link href="/preparedness" className="hover:text-nova-text">Preparedness</Link>
            <Link href="/citizen/sos" className="hover:text-red-400 font-bold">SOS Portal</Link>
            <Link href="/command" className="hover:text-er-blue">Command Center</Link>
            <Link href="/login" className="hover:text-nova-text">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
