"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

function storeSession(accessToken: string) {
  window.localStorage.setItem("aimher-token", accessToken);
  window.localStorage.setItem("accessToken", accessToken);
}

/** True when the API itself rejected the request (vs. being unreachable). */
function isApiRejection(err: unknown): boolean {
  return typeof err === "object" && err !== null && "status" in err;
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {off ? (
        <>
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

function PasswordInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  withToggle?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input
        className="input"
        type={show ? "text" : "password"}
        value={props.value}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        onChange={(e) => props.onChange(e.target.value)}
        required
      />
      {props.withToggle && (
        <button type="button" className="eye" onClick={() => setShow(!show)} aria-label="Toggle password visibility">
          <EyeIcon off={show} />
        </button>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="back" onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}

/* ---------------- Sign In ---------------- */
export function SignIn({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: id, password }),
      });
      storeSession(res.accessToken);
      router.push("/dashboard");
    } catch (err) {
      if (isApiRejection(err)) {
        setError(err instanceof Error ? err.message : "Invalid credentials");
      } else {
        // Backend unreachable — demo fallback
        await new Promise((r) => setTimeout(r, 1200));
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <BackButton onClick={() => history.back()} />
      <Image className="auth-logo" src="/logo.png" alt="AIMHER Health" width={282} height={181} />
      <h2>Welcome back</h2>
      <p className="lead">Sign in to continue monitoring your health</p>

      <form onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}

        <div className="field">
          <label htmlFor="id">Email or Patient ID</label>
          <input
            id="id"
            className="input"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="pw">
            Password
            <a href="#">Forgot password?</a>
          </label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder=""
            autoComplete="current-password"
            withToggle
          />
        </div>

        <button className="btn" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <p className="switch">
        Don&apos;t have an account?{" "}
        <button className="link" onClick={onSwitch}>Create one</button>
      </p>
    </main>
  );
}

/* ---------------- Sign Up ---------------- */
export function SignUp({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!agree) return setError("Please accept the Terms of Service and Privacy Policy.");

    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (res?.accessToken) storeSession(res.accessToken);
      router.push("/onboarding");
    } catch (err) {
      if (isApiRejection(err)) {
        setError(err instanceof Error ? err.message : "Registration failed");
      } else {
        // Backend unreachable — demo fallback
        await new Promise((r) => setTimeout(r, 1200));
        onSwitch();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <BackButton onClick={onSwitch} />
      <Image className="auth-logo" src="/logo.png" alt="AIMHER Health" width={282} height={181} />
      <h2>Create your account</h2>
      <p className="lead">Start your personalized health journey</p>

      <form onSubmit={handleSubmit}>
        {error && <div className="error">{error}</div>}

        <div className="field">
          <label>Full Name</label>
          <input className="input" placeholder="Your full name" value={name}
            onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>

        <div className="field">
          <label>Email</label>
          <input className="input" type="email" placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>

        <div className="field">
          <label>Password</label>
          <PasswordInput value={password} onChange={setPassword}
            placeholder="Min 8 characters" autoComplete="new-password" withToggle />
        </div>

        <div className="field">
          <label>Confirm Password</label>
          <PasswordInput value={confirm} onChange={setConfirm}
            placeholder="Re-enter password" autoComplete="new-password" />
        </div>

        <label className="terms">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I agree to the Terms of Service and Privacy Policy
        </label>

        <button className="btn" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      <p className="switch">
        Already have an account?{" "}
        <button className="link" onClick={onSwitch}>Sign in</button>
      </p>
    </main>
  );
}
