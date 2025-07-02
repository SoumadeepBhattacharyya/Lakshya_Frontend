import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const JobStatusChart = ({ stats }) => {
  const data = {
    labels: ['Pending', 'Interview', 'Declined', 'Accepted'],
    datasets: [
      {
        label: 'Job Status',
        data: [
          stats?.pending || 0,
          stats?.interview || 0,
          stats?.declined || 0,
          stats?.accepted || 0,
        ],
        backgroundColor: ['#ffc107', '#0d6efd', '#dc3545', '#28a745'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="card p-3 shadow-sm">
      <h6 className="mb-3">📊 Job Status Overview</h6>
      <Doughnut data={data} />
    </div>
  );
};

export default JobStatusChart;
