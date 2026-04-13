import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, isValid } from 'date-fns';
import { Activity } from 'lucide-react';

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

  const dateLabel = isValid(new Date(label)) ? format(new Date(label), 'MMM dd, HH:mm') : 'Unknown Time';

  return (
    <div className="rounded-xl border border-white/10 bg-black/90 backdrop-blur-md shadow-2xl p-3 min-w-52">
      <p className="text-xs uppercase tracking-wide text-white/40 mb-2 font-mono">{dateLabel}</p>
      <div className="space-y-1.5">
        {sortedPayload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-white/80 font-black uppercase tracking-tight truncate">{entry.name}</span>
            </div>
            <span className="text-sm font-black text-cyber-green">{numberFormatter.format(entry.value || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const buildTimelineData = (seriesList) => {
  if (!seriesList || seriesList.length === 0) return [];
  
  const timestampSet = new Set();

  seriesList.forEach((series) => {
    if (series.points && Array.isArray(series.points)) {
      series.points.forEach((point) => {
        const d = new Date(point.timestamp);
        if (isValid(d)) {
          timestampSet.add(d.getTime());
        }
      });
    }
  });

  if (timestampSet.size === 0) return [];

  const sortedTimestamps = Array.from(timestampSet).sort((a, b) => a - b);
  const timelineRows = sortedTimestamps.map((ts) => ({ timestamp: ts }));

  seriesList.forEach((series) => {
    const key = toSeriesKey(series.teamId);
    if (!series.points || !Array.isArray(series.points) || series.points.length === 0) {
      timelineRows.forEach((row) => { row[key] = null; });
      return;
    }

    const pointsByTimestamp = series.points
      .map((point) => {
        const d = new Date(point.timestamp);
        return [isValid(d) ? d.getTime() : null, point.score];
      })
      .filter(p => p[0] !== null)
      .sort((a, b) => a[0] - b[0]);

    if (!pointsByTimestamp.length) {
      timelineRows.forEach((row) => { row[key] = null; });
      return;
    }

    const firstTimestamp = pointsByTimestamp[0][0];
    const lastTimestamp = pointsByTimestamp[pointsByTimestamp.length - 1][0];
    let currentScore = 0; // Initialize with 0
    const scoreByTimestamp = new Map(pointsByTimestamp);

    timelineRows.forEach((row) => {
      if (row.timestamp < firstTimestamp) {
        row[key] = 0; // Show 0 before first score
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
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/20">
         <Activity className="h-12 w-12 mb-3 stroke-1" />
         <p className="text-xs uppercase font-black tracking-[0.2em]">No performance data detected</p>
      </div>
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={graphData} margin={{ top: 16, right: 10, left: 0, bottom: 22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            padding={{ left: 0, right: 0 }}
            allowDataOverflow
            tickFormatter={(value) => isValid(new Date(value)) ? format(new Date(value), 'HH:mm') : ''}
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}
            tickFormatter={(value) => numberFormatter.format(value)}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            width={60}
          />
          <Tooltip content={<ProgressTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="left"
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', paddingTop: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}
          />
          {normalizedSeries.map((team) => (
            <Line
              key={team.teamId}
              type="monotone"
              dataKey={team.key}
              stroke={team.color}
              strokeWidth={highlightedTeamIds.has(team.teamId) ? 3 : 1.5}
              strokeOpacity={highlightedTeamIds.has(team.teamId) ? 1 : 0.3}
              dot={false}
              activeDot={{ r: 4, fill: team.color, stroke: '#fff', strokeWidth: 2 }}
              name={team.teamName || team.name}
              connectNulls={true}
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

export default AllTeamsProgressChart;
