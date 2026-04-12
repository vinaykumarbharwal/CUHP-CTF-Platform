import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const TEAM_COLORS = [
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#0F766E',
  '#9333EA',
  '#65A30D'
];

const numberFormatter = new Intl.NumberFormat('en-US');

const toSeriesKey = (teamId) => `team_${teamId}`;

function ProgressTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const sortedPayload = [...payload]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 8);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 shadow-xl p-3 min-w-52">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">{format(new Date(label), 'MMM dd, yyyy HH:mm')}</p>
      <div className="space-y-1.5">
        {sortedPayload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-slate-700 truncate">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">{numberFormatter.format(entry.value || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const buildTimelineData = (seriesList) => {
  const timestampSet = new Set();

  seriesList.forEach((series) => {
    series.points.forEach((point) => {
      timestampSet.add(new Date(point.timestamp).getTime());
    });
  });

  const sortedTimestamps = Array.from(timestampSet).sort((a, b) => a - b);
  const timelineRows = sortedTimestamps.map((ts) => ({ timestamp: ts }));

  seriesList.forEach((series) => {
    const key = toSeriesKey(series.teamId);
    let currentScore = 0;
    const scoreByTimestamp = new Map(
      series.points.map((point) => [new Date(point.timestamp).getTime(), point.score])
    );

    timelineRows.forEach((row) => {
      if (scoreByTimestamp.has(row.timestamp)) {
        currentScore = scoreByTimestamp.get(row.timestamp);
      }
      row[key] = currentScore;
    });
  });

  return timelineRows;
};

function AllTeamsProgressChart({ series = [] }) {
  const normalizedSeries = useMemo(() => (
    series.map((item, index) => ({
      ...item,
      color: TEAM_COLORS[index % TEAM_COLORS.length],
      key: toSeriesKey(item.teamId)
    }))
  ), [series]);

  const graphData = useMemo(() => buildTimelineData(normalizedSeries), [normalizedSeries]);

  const topTeams = useMemo(() => (
    [...normalizedSeries]
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 5)
  ), [normalizedSeries]);

  const highlightedTeamIds = useMemo(
    () => new Set(topTeams.map((team) => team.teamId)),
    [topTeams]
  );

  if (!graphData.length) {
    return <p className="text-gray-500">No submissions yet.</p>;
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={graphData} margin={{ top: 16, right: 24, left: 8, bottom: 18 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => format(new Date(value), 'MMM dd HH:mm')}
            tick={{ fontSize: 12, fill: '#475569' }}
            minTickGap={32}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#475569' }}
            tickFormatter={(value) => numberFormatter.format(value)}
            width={70}
          />
          <Tooltip content={<ProgressTooltip />} />
          {normalizedSeries.map((team) => (
            <Line
              key={team.teamId}
              type="stepAfter"
              dataKey={team.key}
              stroke={team.color}
              strokeWidth={highlightedTeamIds.has(team.teamId) ? 3 : 2}
              strokeOpacity={highlightedTeamIds.has(team.teamId) ? 1 : 0.38}
              dot={false}
              activeDot={{ r: 6 }}
              name={team.teamName}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-2">
        {topTeams.map((team) => (
          <div key={team.teamId} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
            <span className="text-xs font-medium text-slate-700">{team.teamName}</span>
            <span className="text-xs text-slate-500">{numberFormatter.format(team.totalScore || 0)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default AllTeamsProgressChart;
