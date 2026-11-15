import React from 'react';
import { Clock, CalendarDays, Hourglass, RotateCcw, ListChecks } from 'lucide-react';
import StatBox from '@/components/ui/StatBox';
import { fmtFull } from './fmt';

export default function OverviewKpis({ kpis }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 [&_p.text-xl]:text-lg sm:[&_p.text-xl]:text-xl">
      <StatBox icon={Clock} color="blue" label="Estudado hoje" value={fmtFull(kpis.studyToday)}
        sub={kpis.reviewToday > 0 ? `+ ${fmtFull(kpis.reviewToday)} de revisão` : undefined} />
      <StatBox icon={CalendarDays} color="blue" label="Estudado no mês" value={fmtFull(kpis.studyMonth)}
        sub={kpis.reviewMonth > 0 ? `+ ${fmtFull(kpis.reviewMonth)} de revisão` : undefined} />
      <StatBox icon={Hourglass} color="blue" label="Total desde o início" value={fmtFull(kpis.studyTotal)}
        sub={kpis.reviewTotal > 0 ? `+ ${fmtFull(kpis.reviewTotal)} de revisão` : undefined} />
      <StatBox icon={RotateCcw} color="purple" label="Tempo de revisão" value={fmtFull(kpis.reviewTotal)}
        sub={`${kpis.reviewCount} registro${kpis.reviewCount === 1 ? '' : 's'}`} />
      <div className="col-span-2 lg:col-span-1">
        <StatBox icon={ListChecks} color="green" label="Sessões realizadas" value={kpis.sessionCount}
          sub="estudos registrados" />
      </div>
    </div>
  );
}
