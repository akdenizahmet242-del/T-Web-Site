"use client";

/** Root layout'un kendisi çökerse (çok nadir) — kendi <html>/<body>'sini çizer. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{ background: "#0e0c0a", color: "#f4f0e7", fontFamily: "system-ui, sans-serif" }}
      >
        <main
          style={{
            minHeight: "100svh",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: 32 }}>Site şu an yanıt vermiyor.</h1>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 24, padding: "10px 20px", borderRadius: 8 }}
            >
              Tekrar dene
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
