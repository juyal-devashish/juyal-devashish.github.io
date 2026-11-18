import { searchIndex } from '@/lib/text';
export const dynamic = 'force-static';
export function GET() {
  return Response.json(searchIndex());
}
