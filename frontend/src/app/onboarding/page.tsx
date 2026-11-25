"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, User, HeartPulse, ClipboardList, Camera } from "lucide-react";
import { CONDITIONS } from "@/lib/symptoms";
import { SymptomIcon } from "@/components/SymptomIcon";

const TEAL = "#00897B";
const TOTAL_STEPS = 4;

interface Profile {
  full_name: string;
  date_of_birth: string;
  gender: string;
  focus: string[];
}

const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    date_of_birth: "",
    gender: "",
    focus: [],
  });

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const toggleFocus = (id: string) => {
    setProfile((p) => ({
      ...p,
      focus: p.focus.includes(id) ? p.focus.filter((f) => f !== id) : [...p.focus, id],
    }));
  };

  const finish = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("aimher-profile", JSON.stringify(profile));
      window.localStorage.setItem("aimher-onboarding-complete", "1");
    }
    router.push("/dashboard");
  };

  const stepValid =
    step === 0 ? profile.full_name.trim().length > 0 && !!profile.date_of_birth && !!profile.gender
    : step === 1 ? profile.focus.length > 0
    : true;

  const titles = [
    { title: "Personal Information", sub: "Tell us a bit about yourself" },
    { title: "What would you like to track?", sub: "Pick the areas that matter to you" },
    { title: "Daily symptom logging", sub: "Rate how you feel in seconds" },
    { title: "You're all set", sub: "Here's what you can do" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50 via-white to-white">
      <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
        <button
          onClick={() => (step === 0 ? router.push("/") : go(step - 1))}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-8 self-start"
        >
          <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Back" : "Back"}
        </button>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span className="text-sm font-semibold" style={{ color: TEAL }}>
            {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: TEAL }}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{titles[step].title}</h1>
              <p className="text-gray-500 mt-1">{titles[step].sub}</p>
            </div>

            {step === 0 && (
              <div className="space-y-5 flex-1">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input
                    className={inputCls}
                    placeholder="Enter your full name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Date of Birth</label>
                  <input
                    className={inputCls}
                    type="date"
                    value={profile.date_of_birth}
                    onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "female", label: "Female" },
                      { value: "male", label: "Male" },
                    ].map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setProfile({ ...profile, gender: g.value })}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                          profile.gender === g.value
                            ? "text-white border-transparent"
                            : "border-gray-300 text-gray-600 bg-white hover:border-teal-300"
                        }`}
                        style={profile.gender === g.value ? { backgroundColor: TEAL } : {}}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3 flex-1">
                {CONDITIONS.map((c) => {
                  const selected = profile.focus.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleFocus(c.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                        selected ? "border-transparent shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      style={selected ? { backgroundColor: `${c.color}14`, borderColor: c.color } : {}}
                    >
                      <span
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${c.color}1A` }}
                      >
                        <SymptomIcon name={c.icon} className="h-5 w-5" style={{ color: c.color }} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-gray-900 text-sm">{c.name}</span>
                        <span className="block text-xs text-gray-500">{c.fullName}</span>
                      </span>
                      <span
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selected ? "border-transparent" : "border-gray-300"
                        }`}
                        style={selected ? { backgroundColor: c.color } : {}}
                      >
                        {selected && <Check className="h-4 w-4 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 flex-1">
                {[
                  { icon: ClipboardList, title: "Log symptoms daily", desc: "Rate intensity 0–10 for the areas you picked — takes under a minute." },
                  { icon: HeartPulse, title: "Track condition burden", desc: "See how your symptoms trend for each condition over time." },
                  { icon: Camera, title: "rPPG passive sensing", desc: "Capture heart rate, HRV, SpO₂ and more using your camera." },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3 bg-white rounded-2xl border border-gray-200 p-4">
                    <span
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${TEAL}1A` }}
                    >
                      <f.icon className="h-5 w-5" style={{ color: TEAL }} />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="h-20 w-20 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${TEAL}1A` }}
                >
                  <User className="h-10 w-10" style={{ color: TEAL }} />
                </motion.div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
                </h2>
                <p className="text-sm text-gray-500 max-w-xs">
                  Your dashboard is ready. Start by logging how you feel today, or jump straight into an rPPG measurement.
                </p>
              </div>
            )}

            <div className="pt-8">
              {step < TOTAL_STEPS - 1 ? (
                <button
                  onClick={() => go(step + 1)}
                  disabled={!stepValid}
                  className="w-full h-12 rounded-xl font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ backgroundColor: TEAL }}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={finish}
                  className="w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: TEAL }}
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
