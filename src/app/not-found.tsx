import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-5 text-center">
      <div>
        <p className="font-mono text-xs tracking-[0.3em] text-brass">404</p>
        <h1 className="mt-4 font-display text-6xl">Bu sayfa zamanda kayboldu.</h1>
        <Link href="/" className="mt-8 inline-block text-sm underline underline-offset-4">
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
