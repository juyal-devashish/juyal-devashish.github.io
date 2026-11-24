'use client';
// Prints the résumé PDF itself, not the web page: the PDF loads in a hidden frame and
// that frame's print dialog opens. Where a browser can't print a framed PDF (the frame
// throws, or never loads), the PDF opens in a new tab instead, to print from there.
// Hidden without JS.
import { useRef } from 'react';

export default function PrintButton({ pdf, className = 'hbtn' }: { pdf: string; className?: string }) {
  const frame = useRef<HTMLIFrameElement | null>(null);

  function openTab() {
    window.open(pdf, '_blank', 'noopener');
  }

  function print() {
    frame.current?.remove();
    const f = document.createElement('iframe');
    f.title = 'Résumé PDF for printing';
    f.setAttribute('aria-hidden', 'true');
    f.tabIndex = -1;
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    const fallback = window.setTimeout(() => { f.remove(); openTab(); }, 8000);
    f.onload = () => {
      window.clearTimeout(fallback);
      try {
        f.contentWindow?.focus();
        f.contentWindow?.print();
      } catch {
        f.remove();
        openTab();
      }
    };
    f.src = pdf;
    document.body.appendChild(f);
    frame.current = f;
  }

  return (
    <button type="button" className={`js-only ${className}`} onClick={print}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" /></svg>
      Print
    </button>
  );
}
