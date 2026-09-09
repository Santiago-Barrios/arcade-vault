export default function Home() {
  return (
    <>
      <div className="av-bg" />
      <div className="av-noise" />
      <main className="av-main flex flex-1 items-center justify-center">
        <div className="av-hero">
          <h1 className="pixel flicker">Arcade Vault</h1>
          <p className="sub">
            Insert coin to continue
            <span className="blink">_</span>
          </p>
        </div>
      </main>
    </>
  );
}
