import { Link, useNavigate } from 'react-router-dom';
import { FaRobot, FaUser, FaSignOutAlt, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import logoBlue from '../images/Fair_Mediator_logoBlue.svg';


const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-dark-neu-300 shadow-dark-neu-lg sticky top-0 z-50 border-b border-dark-neu-500">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-2.5 lg:py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-end space-x-4 hover:opacity-80 transition-opacity">
            {/* Logo */}
            <img
              src={logoBlue}
              alt="Fair Mediator"
              className="h-22 w-auto drop-shadow-lg"
              
            />

            {/* Tagline - Hidden on mobile, smaller on tablet */}
            <div className="hidden sm:block">
              <p className="text-[10px] md:text-xs lg:text-sm text-white font-semibold tracking-wide opacity-80 mb-[3px]">
                Intelligent Mediator Matching & Screening Platform
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Badge with convex neumorphism - Hidden on mobile */}
            <div className="hidden sm:flex items-center space-x-3 px-5 py-3 bg-dark-neu-400 rounded-xl shadow-dark-neu border border-dark-neu-200">
              <div className="relative">
                <FaRobot className="text-xl text-blue-400 drop-shadow-lg animate-pulse" />
                <div className="absolute inset-0 bg-blue-400 blur-md opacity-30"></div>
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                  100% FREE
                </span>
                <span className="text-xs text-dark-neu-50 font-medium opacity-70">
                  Hugging Face AI
                </span>
              </div>
              <span className="md:hidden text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                FREE
              </span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200"
                  >
                    <FaChartLine className="text-blue-400" />
                    <span className="hidden sm:inline font-medium">Dashboard</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200"
                  >
                    <FaSignOutAlt />
                    <span className="hidden sm:inline font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200"
                >
                  <FaUser className="text-blue-400" />
                  <span className="font-medium">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Graffiti-style bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
    </header>
  );
};

export default Header;
