import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../Footer';
import logo from '../../images/Fair_Mediator_logoBlue.svg';

const ROLES = [
  { value: 'mediator',  label: 'Mediator' },
  { value: 'attorney',  label: 'Attorney' },
  { value: 'party',     label: 'Party' },
];

const LoginForm = () => {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please complete all required fields.');
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password, formData.role);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || authError || 'Authentication failed. Please try again.');
    }

    setLoading(false);
  };

  const handleBackdropClick = () => navigate('/');

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={handleBackdropClick}
      />

      <div
        className="flex-grow flex items-center justify-center px-4 py-8 relative z-50"
        onClick={handleBackdropClick}
      >
        <div
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 sm:p-10">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src={logo} alt="FairMediator Logo" className="h-12 w-auto" />
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                Sign in to FairMediator
              </h1>
              <p className="text-sm text-gray-500">
                Access your account to continue.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Account role */}
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-3">
                  Signing in as
                </legend>
                <div className="flex gap-3">
                  {ROLES.map(({ value, label }) => {
                    const checked = formData.role === value;
                    return (
                      <label
                        key={value}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all duration-150 select-none ${
                          checked
                            ? 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-400 text-slate-800 shadow-neumorphic-inset'
                            : 'bg-gray-50 border-gray-200 text-gray-600 shadow-neumorphic hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={value}
                          checked={checked}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl shadow-neumorphic-inset border-none focus:outline-none focus:ring-2 focus:ring-slate-400 text-gray-800 placeholder-gray-400 transition-all text-sm"
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl shadow-neumorphic-inset border-none focus:outline-none focus:ring-2 focus:ring-slate-400 text-gray-800 placeholder-gray-400 transition-all text-sm"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              {/* Forgot password */}
              <div className="text-right -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-dark-neu-400 text-white font-semibold rounded-2xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-7 space-y-2.5 border-t border-gray-200 pt-6 text-sm text-gray-600">
              <p>
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-slate-800 hover:text-slate-600 transition-colors">
                  Create an account
                </Link>
              </p>
              <p>
                Are you a mediator?{' '}
                <Link to="/mediators/apply" className="font-semibold text-slate-800 hover:text-slate-600 transition-colors">
                  Apply to join the FairMediator Marketplace
                </Link>
              </p>
            </div>

          </div>

          {/* Legal note */}
          <div className="mt-5 text-center">
            <p className="text-xs text-gray-400">
              By signing in, you agree to our{' '}
              <a href="/terms" className="underline hover:text-gray-600 transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="underline hover:text-gray-600 transition-colors">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default LoginForm;
