/* eslint-disable @typescript-eslint/no-explicit-any -- profile hook returns a loose object */
'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Bell, ChevronRight, Lock, LogOut, Mail, Pencil, Shield, Smartphone,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

function bmiLabel(b: number) {
  if (b < 18.5) return { t: 'Underweight', fg: '#b86e12', bg: '#fdf0dc' };
  if (b < 25) return { t: 'Normal', fg: '#1f7a45', bg: '#e3f4ea' };
  if (b < 30) return { t: 'Overweight', fg: '#c2570c', bg: '#fde8d6' };
  return { t: 'Obese', fg: '#b3263a', bg: '#fdecee' };
}

export default function ProfilePage() {
  const router = useRouter();
  const data: any = useProfile();
  const p = data?.profile ?? data ?? {};

  const get = (...keys: string[]) => {
    const v = keys.map((k) => p?.[k]).find((x) => x !== undefined && x !== null && x !== '');
    return v as any;
  };

  const name: string = get('fullName', 'name', 'full_name') ?? 'Your name';
  const email: string = get('email') ?? '';
  const patientId: string = get('patientId', 'patient_id') ?? '';
  const age = get('age');
  const gender = get('gender', 'sex');
  const nationality = get('nationality');
  const ethnicity = get('ethnicity');
  const height = Number(get('height', 'heightCm') ?? 0);
  const weight = Number(get('weight', 'weightKg') ?? 0);
  const bloodGroup = get('bloodGroup', 'blood_group');
  const genotype = get('genotype');
  const bmi = height && weight ? weight / Math.pow(height / 100, 2) : 0;
  const bmiInfo = bmi ? bmiLabel(bmi) : null;

  const fields = [age, gender, nationality, ethnicity, height, weight, bloodGroup, genotype];
  const filled = fields.filter((f) => f !== undefined && f !== null && f !== '' && f !== 0).length;
  const pct = Math.round((filled / fields.length) * 100);

  const show = (v: any, suffix = '') => (v ? `${v}${suffix}` : 'Not set');

  function signOut() {
    // TODO: clear your auth token/session here
    try { localStorage.clear(); } catch {}
    router.push('/');
  }

  return (
    <>
      <header className="p-head">
        <div className="inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => router.push('/dashboard')}><ArrowLeft size={20} /> Back</button>
            <h1>My Profile</h1>
          </div>
        </div>
      </header>

      <div className="app-wrap">
        <div className="d-card p-id">
          <div className="big">{name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{name}</div>
            {patientId && <div style={{ color: 'var(--teal)', fontWeight: 500 }}>{patientId}</div>}
            {email && (
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                <Mail size={14} /> {email}
              </div>
            )}
          </div>
        </div>

        <div className="d-label">
          Demographics
          <a href="/onboarding"><Pencil size={14} /> Edit</a>
        </div>
        <div className="d-card">
          <div className="p-grid">
            <div className="p-item"><small>Age</small><b>{show(age, ' years')}</b></div>
            <div className="p-item"><small>Gender</small><b>{show(gender)}</b></div>
            <div className="p-item"><small>Nationality</small><b>{show(nationality)}</b></div>
            <div className="p-item"><small>Ethnicity</small><b>{show(ethnicity)}</b></div>
            <div className="p-item"><small>Height</small><b>{show(height, ' cm')}</b></div>
            <div className="p-item"><small>Weight</small><b>{show(weight, ' kg')}</b></div>
          </div>
          <div className="p-bmi">
            <span style={{ color: 'var(--muted)' }}>BMI</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <b style={{ fontSize: '1.2rem' }}>{bmi ? bmi.toFixed(1) : '—'}</b>
              {bmiInfo && <span className="d-chip" style={{ background: bmiInfo.bg, color: bmiInfo.fg }}>{bmiInfo.t}</span>}
            </span>
          </div>
          <div className="p-grid" style={{ borderTop: '1px solid var(--line)' }}>
            <div className="p-item"><small>Blood Group</small><b>{show(bloodGroup)}</b></div>
            <div className="p-item"><small>Genotype</small><b>{show(genotype)}</b></div>
          </div>
        </div>

        <div className="d-label">Wearable connections</div>
        <div className="d-card" style={{ padding: 18, textAlign: 'center' }}>
          <div style={{ color: 'var(--muted)' }}>No devices connected</div>
          <button className="p-connect">Connect a Device</button>
        </div>

        <div className="d-label">Profile completeness</div>
        <div className="d-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Profile info</span>
            <b>{pct}%</b>
          </div>
          <div className="p-bar"><span style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="d-label">Settings</div>
        <div className="d-card p-list">
          <button><span className="left"><Bell size={20} color="#6b7686" /> Notification Settings</span><ChevronRight size={18} color="#9aa5b1" /></button>
          <button><span className="left"><Shield size={20} color="#6b7686" /> Data &amp; Privacy</span><ChevronRight size={18} color="#9aa5b1" /></button>
          <button><span className="left"><Smartphone size={20} color="#6b7686" /> Connected Devices</span><ChevronRight size={18} color="#9aa5b1" /></button>
          <button><span className="left"><Lock size={20} color="#6b7686" /> Change Password</span><ChevronRight size={18} color="#9aa5b1" /></button>
        </div>

        <button className="p-signout" onClick={signOut}>
          <LogOut size={17} strokeWidth={2} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );
}
