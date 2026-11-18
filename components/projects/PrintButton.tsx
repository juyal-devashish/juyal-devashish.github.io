'use client';
// Prints the page (the résumé has its own print stylesheet). Hidden without JS.
export default function PrintButton({ className = 'hbtn' }: { className?: string }) {
  return (
    <button type="button" className={`js-only ${className}`} onClick={() => window.print()}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" /></svg>
      Print
    </button>
  );
}
