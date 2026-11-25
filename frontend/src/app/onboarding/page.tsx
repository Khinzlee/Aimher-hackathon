"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ClipboardList,
  HeartPulse,
  Sparkles,
  User,
} from "lucide-react";
import { CONDITIONS } from "@/lib/symptoms";
import { SymptomIcon } from "@/components/SymptomIcon";

const TOTAL_STEPS = 4;

interface Profile {
  full_name: string;
  date_of_birth: string;
  gender: string;
  focus: string[];
}

const titles = [
  {
    eyebrow: "STEP 01 · ABOUT YOU",
    title: "Let's start with you",
    sub: "A few details help us personalise your health insights.",
  },
  {
    eyebrow: "STEP 02 · YOUR FOCUS",
    title: "What matters to you?",
    sub: "Choose the areas you'd like to keep an eye on.",
  },
  {
    eyebrow: "STEP 03 · HOW IT WORKS",
    title: "Your daily check-in",
    sub: "Simple tools that turn how you feel into useful trends.",
  },
  {
    eyebrow: "STEP 04 · READY",
    title: "You're all set",
    sub: "Your personal health space is ready to go.",
  },
];

const features = [
  {
    icon: ClipboardList,
    title: "Log symptoms daily",
    desc: "Rate intensity from 0–10 for the areas you picked — takes under a minute.",
  },
  {
    icon: HeartPulse,
    title: "Track condition burden",
    desc: "See how your symptoms trend for each condition over time.",
  },
  {
    icon: Camera,
    title: "rPPG passive sensing",
    desc: "Capture heart rate, HRV and SpO₂ using your camera.",
  },
];

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
      focus: p.focus.includes(id)
        ? p.focus.filter((f) => f !== id)
        : [...p.focus, id],
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
    step === 0
      ? profile.full_name.trim().length > 0 &&
        !!profile.date_of_birth &&
        !!profile.gender
      : step === 1
        ? profile.focus.length > 0
        : true;

  const selectedFocus = CONDITIONS.filter((c) => profile.focus.includes(c.id));

  return (
    <main className="ob-page">
      <div className="ob-card">
        <div className="ob-top">
          <button
            type="button"
            className="ob-back"
            onClick={() => (step === 0 ? router.push("/") : go(step - 1))}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="ob-brand">
            <Image src="/logo.png" alt="" width={26} height={26} />
            <span>AIMHER</span>
          </div>
        </div>

        <div className="ob-progress" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={i <= step ? "done" : ""} />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.section
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -22 }}
            transition={{ duration: 0.22 }}
            className="ob-stage"
          >
            <header className="ob-head">
              <span className="ob-eyebrow">{titles[step].eyebrow}</span>
              <h1>{titles[step].title}</h1>
              <p>{titles[step].sub}</p>
            </header>

            <div className="ob-body">
              {step === 0 && (
                <div className="ob-fields">
                  <div className="ob-field">
                    <label htmlFor="ob-name">Full name</label>
                    <input
                      id="ob-name"
                      className="ob-input"
                      placeholder="e.g. Alex Morgan"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="ob-field">
                    <label htmlFor="ob-dob">Date of birth</label>
                    <input
                      id="ob-dob"
                      className="ob-input"
                      type="date"
                      value={profile.date_of_birth}
                      onChange={(e) =>
                        setProfile({ ...profile, date_of_birth: e.target.value })
                      }
                    />
                  </div>

                  <div className="ob-field">
                    <label>Gender</label>
                    <div className="ob-seg">
                      {[
                        { value: "female", label: "Female" },
                        { value: "male", label: "Male" },
                        { value: "other", label: "Prefer not to say" },
                      ].map((g) => {
                        const active = profile.gender === g.value;
                        return (
                          <button
                            key={g.value}
                            type="button"
                            className={`ob-seg-btn${active ? " active" : ""}`}
                            onClick={() =>
                              setProfile({ ...profile, gender: g.value })
                            }
                          >
                            <span className="ob-seg-ico">
                              <User size={18} />
                            </span>
                            <span>{g.label}</span>
                            {active && <Check className="ob-seg-check" size={16} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="ob-focus-grid">
                  {CONDITIONS.map((c) => {
                    const selected = profile.focus.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`ob-focus${selected ? " active" : ""}`}
                        style={
                          {
                            "--focus-color": c.color,
                            "--focus-tint": `${c.color}14`,
                          } as CSSProperties
                        }
                        onClick={() => toggleFocus(c.id)}
                      >
                        <span className={`ob-check${selected ? " on" : ""}`}>
                          {selected && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className="ob-focus-ico">
                          <SymptomIcon name={c.icon} className="ob-icon" />
                        </span>
                        <strong>{c.name}</strong>
                        <small>{c.fullName}</small>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && (
                <div className="ob-features">
                  {features.map((f, i) => (
                    <div className="ob-feature" key={f.title}>
                      <span className="ob-feature-ico">
                        <f.icon size={20} />
                      </span>
                      <div>
                        <b>
                          <span className="ob-num">0{i + 1}</span>
                          {f.title}
                        </b>
                        <p>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="ob-success">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    className="ob-success-badge"
                  >
                    <Sparkles size={38} />
                  </motion.div>
                  <h2>
                    Welcome
                    {profile.full_name
                      ? `, ${profile.full_name.trim().split(" ")[0]}`
                      : ""}
                    !
                  </h2>
                  <p>
                    Your dashboard is ready. Start by logging how you feel today,
                    or jump straight into an rPPG measurement.
                  </p>
                  {selectedFocus.length > 0 && (
                    <div className="ob-summary">
                      {selectedFocus.map((c) => (
                        <span key={c.id}>{c.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>
        </AnimatePresence>

        <div className="ob-actions">
          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              className="ob-next"
              disabled={!stepValid}
              onClick={() => go(step + 1)}
            >
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button type="button" className="ob-next" onClick={finish}>
              Go to dashboard <ArrowRight size={18} />
            </button>
          )}
          <p className="ob-footnote">
            Step {step + 1} of {TOTAL_STEPS} · Your data stays on your device
          </p>
        </div>
      </div>
    </main>
  );
}
