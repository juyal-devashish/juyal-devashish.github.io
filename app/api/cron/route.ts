// Daily job (vercel.json). Saves coding snapshots for the year page when the store is configured.
// Pages read coding time live, so nothing breaks when this does not run.
// Vercel sends Authorization: Bearer <CRON_SECRET>. Safe to run twice.
import { saveCodingDay, codingConfigured } from '@/lib/coding';
import { dayKey, storeConfigured } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const done: Record<string, unknown> = {};
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  const today = dayKey();
  if (codingConfigured && storeConfigured) {
    try {
      done.coding = await Promise.all([saveCodingDay(yesterday), saveCodingDay(today)]);
    } catch (e) { done.codingError = String(e); }
  }
  return Response.json({ ok: true, done });
}
