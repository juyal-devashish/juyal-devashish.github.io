// Project status as a ring badge: <StatusBadge status="Live" />. Notes: <span className="badge note">Synthetic data</span>
import type { Status } from '@/lib/site';

const CLS: Record<Status, string> = { Live: 'live', 'Live · beta': 'live', Demo: 'demo', Prototype: 'proto', Research: 'research', Archived: 'archived' };

export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge ${CLS[status]}`}><i aria-hidden="true" />{status}</span>;
}
