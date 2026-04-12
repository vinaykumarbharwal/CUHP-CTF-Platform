import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

function TeamGraph() {
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamInfo, setTeamInfo] = useState(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/graph/my-team`);
      const formattedData = response.data.map((point) => ({
        ...point,
        formattedTime: format(new Date(point.timestamp), 'MMM dd, HH:mm')
      }));
      setGraphData(formattedData);

      const teamResponse = await axios.get(`${process.env.REACT_APP_API_URL}/teams/my/team`);
      setTeamInfo(teamResponse.data);
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

  if (!teamInfo) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Team Found</h2>
            <p className="text-yellow-700">Please create or join a team to view the score graph.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Progress</h1>
          <p className="text-gray-600">
            {teamInfo.name} - Current Score: <span className="font-bold text-blue-600">{teamInfo.totalScore}</span> points
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Challenges Solved: {teamInfo.solvedChallenges?.length || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Score Progression Over Time</h2>
          {graphData.length > 1 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedTime" angle={-45} textAnchor="end" height={80} interval="preserveStartEnd" />
                <YAxis label={{ value: 'Total Score', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} points`, 'Score']} labelFormatter={(label) => `Time: ${label}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 8 }}
                  name="Team Score"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No submissions yet. Solve some challenges to see your progress!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default TeamGraph;
