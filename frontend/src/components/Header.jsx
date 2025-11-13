import React from 'react';
import { FaBalanceScale, FaRobot } from 'react-icons/fa';

const Header = () => {
  return (
    <header className="bg-dark-neu-300 shadow-dark-neu-lg sticky top-0 z-50 border-b border-dark-neu-500">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-5 lg:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-5">
            {/* Icon with graffiti-style glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 p-3.5 rounded-xl shadow-dark-neu-lg">
                <FaBalanceScale className="text-2xl text-white drop-shadow-lg" />
              </div>
            </div>
            
            {/* Text with graffiti styling */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-blue-900 tracking-tight drop-shadow-md">
                FairMediator
              </h1>
              <p className="text-sm text-dark-neu-50 font-semibold mt-1 tracking-wide opacity-80">
                Intelligent Mediator Matching & Screening Platform
              </p>
            </div>
          </div>
          
          {/* Badge with convex neumorphism */}
          <div className="flex items-center space-x-3 px-5 py-3 bg-dark-neu-400 rounded-xl shadow-dark-neu border border-dark-neu-200">
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
        </div>
      </div>
      
      {/* Graffiti-style bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
    </header>
  );
};

export default Header;
