import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosInstance'; // ✅ updated import
import { toast } from 'react-toastify';
import JobStatusChart from '../components/JobStatusChart';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { generateAISuggestions } from '../utils/aiSuggestions';

// CSV Export Utility
const exportToCSV = (jobs, filename = 'jobs.csv') => {
  const headers = ['Company', 'Position', 'Status', 'Job Type', 'Interview Date'];
  const rows = jobs.map(job => [
    job.company,
    job.position,
    job.status,
    job.jobType,
    job.interviewDate ? new Date(job.interviewDate).toLocaleDateString() : ''
  ]);

  const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToPDF = (jobs) => {
  const doc = new jsPDF();
  doc.text('Job Applications Report', 14, 16);

  const tableColumn = ['Company', 'Position', 'Status', 'Job Type', 'Interview Date'];
  const tableRows = [];

  jobs.forEach((job) => {
    const jobData = [
      job.company,
      job.position,
      job.status,
      job.jobType,
      job.interviewDate ? new Date(job.interviewDate).toLocaleDateString() : '',
    ];
    tableRows.push(jobData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 22,
  });

  doc.save('job_applications.pdf');
};

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editJobId, setEditJobId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  const [formData, setFormData] = useState({
    company: '',
    position: '',
    status: 'pending',
    jobType: 'full-time',
    interviewDate: '',
  });

  const fetchJobs = async () => {
    try {
      const res = await axios.get('/jobs');
      const jobData = res.data;
      setJobs(jobData);

      jobData.forEach(job => {
        if (job.interviewDate) {
          const interviewTime = new Date(job.interviewDate).getTime();
          const now = new Date().getTime();
          const hoursLeft = (interviewTime - now) / (1000 * 60 * 60);

          if (hoursLeft > 0 && hoursLeft <= 24 && Notification.permission === 'granted') {
            new Notification('📅 Interview Reminder', {
              body: `${job.position} at ${job.company} is scheduled within 24 hours.`,
            });
          }
        }
      });
    } catch (err) {
      toast.error('Failed to load jobs');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/jobs/stats');
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load job stats');
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    fetchJobs();
    fetchStats();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`/jobs/${editJobId}`, formData);
        toast.success('Job updated');
        setEditMode(false);
        setEditJobId(null);
      } else {
        await axios.post('/jobs', formData);
        toast.success('Job added');
      }

      setFormData({
        company: '',
        position: '',
        status: 'pending',
        jobType: 'full-time',
        interviewDate: '',
      });

      fetchJobs();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Operation failed');
    }
  };

  const handleEdit = (job) => {
    setEditMode(true);
    setEditJobId(job._id);
    setFormData({
      company: job.company,
      position: job.position,
      status: job.status,
      jobType: job.jobType,
      interviewDate: job.interviewDate ? job.interviewDate.split('T')[0] : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      await axios.delete(`/jobs/${jobId}`);
      toast.success('Job deleted');
      fetchJobs();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete job');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    return (
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (jobTypeFilter ? job.jobType === jobTypeFilter : true) &&
      (statusFilter ? job.status === statusFilter : true)
    );
  });

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const aiSuggestions = generateAISuggestions(filteredJobs);

  const paginate = (direction) => {
    if (direction === 'prev' && currentPage > 1) setCurrentPage(prev => prev - 1);
    if (direction === 'next' && currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>👋 Welcome, {user?.name}</h2>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Add/Edit Job Form */}
      <div className="card p-4 mb-4 shadow-sm">
        <h5 className="mb-3">{editMode ? 'Update Job' : 'Add New Job'}</h5>
        <form onSubmit={handleSubmit}>
          <input className="form-control mb-2" type="text" name="company" placeholder="Company Name" value={formData.company} onChange={handleChange} required />
          <input className="form-control mb-2" type="text" name="position" placeholder="Position" value={formData.position} onChange={handleChange} required />
          <select className="form-control mb-2" name="status" value={formData.status} onChange={handleChange}>
            <option value="pending">Pending</option>
            <option value="interview">Interview</option>
            <option value="declined">Declined</option>
            <option value="accepted">Accepted</option>
          </select>
          <select className="form-control mb-2" name="jobType" value={formData.jobType} onChange={handleChange}>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
          </select>
          <input className="form-control mb-3" type="date" name="interviewDate" value={formData.interviewDate} onChange={handleChange} />
          <button className="btn btn-primary w-100" type="submit">{editMode ? 'Update Job' : 'Add Job'}</button>
        </form>
      </div>

      {/* Search & Filter */}
      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <input type="text" className="form-control" placeholder="Search by company" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="col-md-4 mb-2">
          <select className="form-control" value={jobTypeFilter} onChange={(e) => setJobTypeFilter(e.target.value)}>
            <option value="">All Job Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
          </select>
        </div>
        <div className="col-md-4 mb-2">
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="interview">Interview</option>
            <option value="declined">Declined</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="text-end mb-3">
        <button className="btn btn-outline-success me-2" onClick={() => exportToCSV(filteredJobs)}>
          Export to CSV
        </button>
        <button className="btn btn-outline-danger" onClick={() => exportToPDF(filteredJobs)}>
          Export to PDF
        </button>
      </div>

      {/* Job List */}
      <div>
        <h5 className="mb-3">📋 Your Jobs</h5>
        {currentJobs.length === 0 ? (
          <p>No jobs found</p>
        ) : (
          <>
            <ul className="list-group">
              {currentJobs.map((job) => (
                <li key={job._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{job.position}</strong> at {job.company}
                    <div className="text-muted small">
                      {job.jobType} | Status: {job.status}
                      {job.interviewDate && (
                        <div>
                          <span className="badge bg-info text-dark mt-1">
                            Interview: {new Date(job.interviewDate).toLocaleDateString()}
                          </span>
                          {(() => {
                            const today = new Date();
                            const interviewDay = new Date(job.interviewDate);
                            const diff = (interviewDay - today) / (1000 * 60 * 60 * 24);
                            if (diff < 2 && diff >= 0) {
                              return (
                                <span className="badge bg-warning text-dark ms-2">
                                  Reminder: Upcoming
                                </span>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(job)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(job._id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="mt-3 d-flex justify-content-center">
              <button className="btn btn-outline-primary me-2" onClick={() => paginate('prev')} disabled={currentPage === 1}>
                ⬅️ Prev
              </button>
              <span className="align-self-center">Page {currentPage} of {totalPages}</span>
              <button className="btn btn-outline-primary ms-2" onClick={() => paginate('next')} disabled={currentPage === totalPages}>
                Next ➡️
              </button>
            </div>
          </>
        )}
      </div>

      {/* AI Suggestions */}
      <div className="mt-5">
        <h5 className="mb-3">🤖 Smart Suggestions</h5>
        <ul className="list-group">
          {aiSuggestions.map((tip, idx) => (
            <li key={idx} className="list-group-item">
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Job Stats */}
      {stats && (
        <div className="mt-5">
          <h5 className="mb-3">📈 Application Summary</h5>
          <div className="row mb-4">
            {Object.entries(stats).map(([status, count]) => (
              <div className="col-md-3 mb-3" key={status}>
                <div className="card text-center shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title text-capitalize">{status}</h6>
                    <h4 className="card-text">{count}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row">
            <div className="col-md-6 offset-md-3">
              <JobStatusChart stats={stats} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
