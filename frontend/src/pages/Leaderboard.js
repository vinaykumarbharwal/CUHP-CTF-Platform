import React from 'react';
import Layout from '../components/Layout';

function Leaderboard() {
  return (
    <Layout>
      <div className="min-h-[60vh] py-8 flex items-center justify-center text-center">
        <div>
          <div className="h-1 bg-cyber-green w-16 rounded-full shadow-[0_0_10px_rgba(0,255,65,0.5)] mx-auto mb-6"></div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase italic">
            Results will be updated soon..!
          </h1>
        </div>
      </div>
    </Layout>
  );
}

export default Leaderboard;
