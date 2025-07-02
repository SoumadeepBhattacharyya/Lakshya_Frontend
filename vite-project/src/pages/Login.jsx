import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('/api/auth/login', formData);
      login(res.data.user, res.data.token);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: '100%', maxWidth: '400px' }}>
        <h4 className="text-center mb-4">Login</h4>
        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-3"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            className="form-control mb-4"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button className="btn btn-success w-100 mb-3" type="submit">
            Login
          </button>
          <div className="text-center">
            <small>
              Don't have an account? <Link to="/register">Register</Link>
            </small>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
