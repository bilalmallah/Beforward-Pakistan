import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { TeamRecord } from './teamsApi';
import { listTeams } from './teamsApi';

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listTeams()
      .then(setTeams)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">Teams</h1>

      {isLoading && <p className="text-sm text-ink-500">Loading…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="p-5">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-brand-600" />
              <h2 className="font-medium text-ink-900">{team.name}</h2>
            </div>
            {team.region && <p className="mt-1 text-xs text-ink-500">{team.region}</p>}

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-ink-500">Manager</span>
              <span className="font-medium text-ink-900">{team.manager?.fullName ?? '—'}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-ink-500">Members</span>
              <Badge tone="brand">{team.members.length}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
