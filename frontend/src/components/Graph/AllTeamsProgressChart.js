import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
    const pointsByTimestamp = series.points
      .map((point) => [new Date(point.timestamp).getTime(), point.score])
      .sort((a, b) => a[0] - b[0]);

    if (!pointsByTimestamp.length) {
      timelineRows.forEach((row) => {
        row[key] = null;
      });
      return;
    }

    const firstTimestamp = pointsByTimestamp[0][0];
    const lastTimestamp = pointsByTimestamp[pointsByTimestamp.length - 1][0];
    let currentScore = null;
    const scoreByTimestamp = new Map(pointsByTimestamp);

    timelineRows.forEach((row) => {
      if (row.timestamp < firstTimestamp || row.timestamp > lastTimestamp) {
        row[key] = null;
        return;
      }

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
        <LineChart data={graphData} margin={{ top: 16, right: 10, left: 0, bottom: 22 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            padding={{ left: 0, right: 0 }}
            allowDataOverflow
            tickFormatter={(value) => format(new Date(value), 'HH:mm')}
            tick={{ fontSize: 11, fill: '#475569' }}
            tickLine={false}
            axisLine={{ stroke: '#CBD5E1' }}
            minTickGap={32}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#475569' }}
            tickFormatter={(value) => numberFormatter.format(value)}
            tickLine={false}
            axisLine={{ stroke: '#CBD5E1' }}
            width={70}
          />
          <Tooltip content={<ProgressTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="left"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', color: '#475569', paddingTop: '10px' }}
          />
          {normalizedSeries.map((team) => (
            <Line
              key={team.teamId}
              type="linear"
              dataKey={team.key}
              stroke={team.color}
              strokeWidth={highlightedTeamIds.has(team.teamId) ? 3 : 2}
              strokeOpacity={highlightedTeamIds.has(team.teamId) ? 1 : 0.45}
              dot={{ r: 2, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              name={team.teamName}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

export default AllTeamsProgressChart;
