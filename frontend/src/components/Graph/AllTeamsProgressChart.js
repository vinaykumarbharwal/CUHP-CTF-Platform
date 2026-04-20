import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, isValid } from 'date-fns';
import { Activity } from 'lucide-react';

const TEAM_COLORS = [
  '#e11d48',
  '#db2777',
  '#d946ef',
  '#8b5cf6',
  '#2563eb',
  '#0891b2',
  '#0f766e',
  '#16a34a',
  '#ca8a04',
  '#f97316'
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
    <div className="rounded-md border border-slate-300 bg-white shadow-md p-3 min-w-52">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2 font-mono">{dateLabel}</p>
      <div className="space-y-1.5">
        {sortedPayload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-slate-700 font-bold truncate">{entry.name}</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{numberFormatter.format(entry.value || 0)}</span>
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
        const score = Number(point.score);
        return [isValid(d) ? d.getTime() : null, Number.isFinite(score) ? score : 0];
      })
      .filter(p => p[0] !== null)
      .sort((a, b) => a[0] - b[0]);

    if (!pointsByTimestamp.length) {
      timelineRows.forEach((row) => { row[key] = null; });
      return;
    }

    const firstTimestamp = pointsByTimestamp[0][0];
    let currentScore = 0;
    let pointIndex = 0;

    timelineRows.forEach((row) => {
      if (row.timestamp < firstTimestamp) {
        row[key] = 0;
        return;
      }

      while (pointIndex < pointsByTimestamp.length && pointsByTimestamp[pointIndex][0] <= row.timestamp) {
        currentScore = pointsByTimestamp[pointIndex][1];
        pointIndex += 1;
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

  const topTeams = useMemo(() => (
    [...normalizedSeries]
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 5)
  ), [normalizedSeries]);

  const graphData = useMemo(() => buildTimelineData(topTeams), [topTeams]);

  const formatXAxisTick = (value) => {
    const date = new Date(value);
    if (!isValid(date)) return '';
    if (date.getHours() === 0) {
      return format(date, 'dd');
    }
    return format(date, 'HH:mm');
  };

  if (!graphData.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
         <Activity className="h-12 w-12 mb-3 stroke-1" />
         <p className="text-xs uppercase font-black tracking-[0.2em]">No performance data detected</p>
      </div>
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={390}>
        <LineChart data={graphData} margin={{ top: 8, right: 20, left: 8, bottom: 22 }}>
          <CartesianGrid stroke="#dbe2ea" strokeDasharray="2 2" vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            padding={{ left: 0, right: 0 }}
            allowDataOverflow
            tickFormatter={formatXAxisTick}
            tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#9ca3af' }}
            minTickGap={55}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
            tickFormatter={(value) => numberFormatter.format(value)}
            tickLine={false}
            axisLine={{ stroke: '#9ca3af' }}
            domain={[0, 'auto']}
            width={60}
          />
          <Tooltip content={<ProgressTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="left"
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', color: '#4b5563', paddingTop: '18px', fontWeight: 600 }}
          />
          {topTeams.map((team) => (
            <Line
              key={team.teamId}
              type="stepAfter"
              dataKey={team.key}
              stroke={team.color}
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 4, fill: '#ffffff', stroke: team.color, strokeWidth: 2 }}
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
