import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BusFront, Mail, Lock, Loader2, User } from 'lucide-react';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Get loading state and signup function from context
  const { signup, loading, error: authError } = useAuth();
  // Use a local error state for form-specific validation
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      // Use the signup function from context with proper shape
      const result = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        // Navigate to the main tracker page on success
        navigate('/');
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    // Replaced .auth-container
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-5">
      {/* Replaced .auth-card */}
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 max-w-md w-full animate-slideUp">
        {/* Replaced .auth-header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-3xl font-bold text-indigo-600 mb-2.5 flex items-center justify-center gap-2">
            <BusFront className="w-8 h-8" />
            Bus Tracking System
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Create Account</h2>
          <p className="text-sm text-gray-500">Join us to start tracking buses</p>
        </div>

        {error && (
          // Replaced .alert .alert-error
          <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg mb-5 text-sm animate-slideDown">
            {error}
          </div>
        )}

        {/* Replaced .auth-form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Replaced .form-group */}
          <div className="relative">
            <label htmlFor="name" className="absolute -top-2.5 left-3.5 bg-white px-1 text-xs font-semibold text-gray-600">Full Name</label>
            <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={loading}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="relative">
            <label htmlFor="email" className="absolute -top-2.5 left-3.5 bg-white px-1 text-xs font-semibold text-gray-600">Email Address</label>
            <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@college.edu"
              required
              disabled={loading}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="absolute -top-2.5 left-3.5 bg-white px-1 text-xs font-semibold text-gray-600">Password</label>
            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
              disabled={loading}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="relative">
            <label htmlFor="confirmPassword" className="absolute -top-2.5 left-3.5 bg-white px-1 text-xs font-semibold text-gray-600">Confirm Password</label>
            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              minLength={6}
              required
              disabled={loading}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            // Replaced .btn .btn-primary .btn-full
            className="w-full mt-2 px-6 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:bg-gray-400 disabled:shadow-none disabled:transform-none"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Replaced .auth-footer */}
        <div className="mt-6 pt-5 text-center border-t border-gray-200">
          {/* Replaced .auth-footer p and .auth-link */}
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition duration-300">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;