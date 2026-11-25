import Image from "next/image";

export default function Splash() {
  return (
    <main className="splash">
      <div className="splash-card">
        <div className="splash-icon">
          <Image src="/logo.png" alt="AIMHER logo" width={282} height={181} />
        </div>
        <h1>AIMHER Health</h1>
        <p className="sub">Metabolic &amp; Syndromic Health Monitor</p>
        <p className="desc">
          Clinical-grade PMOS &amp; MAMH detection with explainable AI
        </p>
        <p className="preparing">PREPARING YOUR EXPERIENCE</p>
        <div className="progress"><span /></div>
      </div>
    </main>
  );
}
