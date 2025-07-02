// components/JobStatusBarChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const JobStatusBarChart = ({ stats }) => {
  const data = Object.entries(stats).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="status" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#007bff" barSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default JobStatusBarChart;
