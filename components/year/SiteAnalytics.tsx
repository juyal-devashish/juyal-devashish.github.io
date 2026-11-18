// Vercel Web Analytics + Speed Insights (cookieless), and the fallback post-view beacon.
// Rendered once from app/layout.tsx. Off Vercel (local dev, CI) nothing is loaded, so
// there are no 404s for /_vercel/* scripts and no debug logging.
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { viewsBeaconOn } from '@/lib/views';
import ViewBeacon from './ViewBeacon';

export default function SiteAnalytics() {
  const onVercel = process.env.VERCEL === '1';
  return (
    <>
      {onVercel ? <><Analytics /><SpeedInsights /></> : null}
      {viewsBeaconOn ? <ViewBeacon /> : null}
    </>
  );
}
