"use client";

import { useEffect, useState } from "react";
import Splash from "@/components/Splash";
import { SignIn, SignUp } from "@/components/AuthForms";

type View = "splash" | "signin" | "signup";

export default function Home() {
  const [view, setView] = useState<View>("splash");

  useEffect(() => {
    const t = setTimeout(() => setView("signin"), 2600);
    return () => clearTimeout(t);
  }, []);

  if (view === "splash") return <Splash />;
  if (view === "signup") return <SignUp onSwitch={() => setView("signin")} />;
  return <SignIn onSwitch={() => setView("signup")} />;
}
