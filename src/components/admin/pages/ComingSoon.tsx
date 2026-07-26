import { Card } from '../ui';

export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <Card>
        <p className="text-sm text-slate-500">{note}</p>
      </Card>
    </div>
  );
}
