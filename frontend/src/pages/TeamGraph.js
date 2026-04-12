import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

const toSeriesKey = (teamId) => `team_${teamId}`;

const buildTimelineData = (seriesList) => {
  const timestampSet = new Set();

  seriesList.forEach((series) => {
    series.points.forEach((point) => {
      timestampSet.add(new Date(point.timestamp).getTime());
    });
  });

  const sortedTimestamps = Array.from(timestampSet).sort((a, b) => a - b);
  const timelineRows = sortedTimestamps.map((ts) => ({
    timestamp: ts,
    formattedTime: format(new Date(ts), 'MMM dd, HH:mm')
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Teams Progress</h1>
          <p className="text-gray-600">Real-time cumulative score progression across all teams.</p>
          <p className="text-sm text-gray-500 mt-1">
            Teams tracked: {seriesMeta.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Score Progression Over Time</h2>
          {graphData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedTime" angle={-45} textAnchor="end" height={80} interval="preserveStartEnd" />
                <YAxis label={{ value: 'Total Score', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} points`, 'Score']} labelFormatter={(label) => `Time: ${label}`} />
                <Legend />
                {seriesMeta.map((series) => (
                  <Line
                    key={series.teamId}
                    type="stepAfter"
                    dataKey={series.key}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    name={series.teamName}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
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
