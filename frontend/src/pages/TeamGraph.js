import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

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
    <div className="rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm p-3 min-w-52">
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
  const timelineRows = sortedTimestamps.map((ts) => ({
    timestamp: ts
  }));

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

function TeamGraph() {
  const [graphData, setGraphData] = useState([]);
  const [seriesMeta, setSeriesMeta] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const maxScore = useMemo(() => {
    if (!seriesMeta.length) return 0;
    return Math.max(...seriesMeta.map((team) => team.totalScore || 0));
  }, [seriesMeta]);

  const latestTimestamp = useMemo(() => {
    if (!graphData.length) return null;
    return graphData[graphData.length - 1].timestamp;
  }, [graphData]);

  const topTeams = useMemo(() => (
    [...seriesMeta]
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 5)
  ), [seriesMeta]);

  const highlightedTeamIds = useMemo(() => new Set(topTeams.map((team) => team.teamId)), [topTeams]);

  const fetchGraphData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/graph/all-teams`);
      const rawSeries = Array.isArray(response.data) ? response.data : [];

      const normalizedSeries = rawSeries.map((series, index) => ({
        ...series,
        color: TEAM_COLORS[index % TEAM_COLORS.length],
        key: toSeriesKey(series.teamId)
      }));

      setSeriesMeta(normalizedSeries);
      setGraphData(buildTimelineData(normalizedSeries));
    } catch (error) {
      toast.error('Failed to load graph data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!seriesMeta.length) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Teams Found</h2>
            <p className="text-yellow-700">Create a team and submit flags to generate progress data.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Competition Progress</h1>
          <p className="text-slate-600">Cumulative score movement of every team over time.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Teams Tracked</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{numberFormatter.format(seriesMeta.length)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Highest Score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{numberFormatter.format(maxScore)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Last Activity</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {latestTimestamp ? format(new Date(latestTimestamp), 'MMM dd, yyyy HH:mm') : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Score Progression Timeline</h2>
          {graphData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={430}>
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
                {seriesMeta.map((series) => (
                  <Line
                    key={series.teamId}
                    type="stepAfter"
                    dataKey={series.key}
                    stroke={series.color}
                    strokeWidth={highlightedTeamIds.has(series.teamId) ? 3 : 2}
                    strokeOpacity={highlightedTeamIds.has(series.teamId) ? 1 : 0.38}
                    dot={false}
                    activeDot={{ r: 6 }}
                    name={series.teamName}
                    connectNulls
                  />
                ))}
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-5 flex flex-wrap gap-2">
                {topTeams.map((team) => (
                  <div
                    key={team.teamId}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="text-xs font-medium text-slate-700">{team.teamName}</span>
                    <span className="text-xs text-slate-500">{numberFormatter.format(team.totalScore || 0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No submissions yet. Solve some challenges to see team progress!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default TeamGraph;
