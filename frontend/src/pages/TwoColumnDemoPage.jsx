import { useState } from 'react';
import TwoColumnLayout from '../components/layouts/TwoColumnLayout';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaInfoCircle, FaList, FaChartBar, FaUsers } from 'react-icons/fa';

/**
 * TwoColumnDemoPage - Demonstrates the independent scrolling two-column layout
 *
 * This page shows how to implement the TwoColumnLayout component
 * with independent scrolling for desktop screens.
 */
const TwoColumnDemoPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Left column content (navigation/sidebar)
  const leftContent = (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Navigation</h2>

      {/* Navigation Menu */}
      <nav className="space-y-2">
        {[
          { id: 'overview', label: 'Overview', icon: FaInfoCircle },
          { id: 'mediators', label: 'Mediators', icon: FaUsers },
          { id: 'analytics', label: 'Analytics', icon: FaChartBar },
          { id: 'tasks', label: 'Tasks', icon: FaList }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <item.icon className="text-lg" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Additional sidebar content to demonstrate scrolling */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-800">Activity Item {i + 1}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(Date.now() - i * 3600000).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics section */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Users', value: '1,234' },
            { label: 'Active Cases', value: '89' },
            { label: 'Mediators', value: '456' },
            { label: 'Success Rate', value: '94%' }
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Right column content (main content area)
  const rightContent = (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {activeTab === 'overview' && 'Dashboard Overview'}
        {activeTab === 'mediators' && 'Mediator Management'}
        {activeTab === 'analytics' && 'Analytics & Reports'}
        {activeTab === 'tasks' && 'Task Management'}
      </h1>

      <p className="text-gray-600 mb-8">
        Scroll this column independently from the left sidebar.
        Notice how each column scrolls separately based on cursor position.
      </p>

      {/* Dynamic content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome to Your Dashboard</h2>
            <p className="text-gray-600">
              This demonstrates independent column scrolling. Try hovering over each column
              and scrolling - only the column under your cursor will scroll.
            </p>
          </div>

          {/* Generate multiple cards to enable scrolling */}
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Overview Section {i + 1}
              </h3>
              <p className="text-gray-600 mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                quis nostrud exercitation ullamco laboris.
              </p>
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Action {i + 1}
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'mediators' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800">
              Mediator list would appear here. Each column maintains its scroll position
              independently when switching tabs.
            </p>
          </div>

          {/* Mediator cards */}
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Mediator {String.fromCharCode(65 + i)}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Specialization: Family Law, Business Disputes
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Experience: {10 + i} years
                  </p>
                </div>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Chart {i + 1}
                </h3>
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Chart Placeholder</span>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-gray-600">Total: {(i + 1) * 100}</span>
                  <span className="text-green-600">+{(i + 1) * 5}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800">
              Task management interface. Notice how smooth the scrolling is in each column.
            </p>
          </div>

          {/* Task list */}
          {Array.from({ length: 15 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 rounded border-gray-300"
                    defaultChecked={i % 3 === 0}
                  />
                  <div>
                    <h4 className="font-medium text-gray-800">Task {i + 1}</h4>
                    <p className="text-sm text-gray-500">Due in {i + 1} days</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  i % 3 === 0 ? 'bg-green-100 text-green-700' :
                  i % 3 === 1 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {i % 3 === 0 ? 'Completed' : i % 3 === 1 ? 'In Progress' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="px-4 py-4">
        <TwoColumnLayout
          leftContent={leftContent}
          rightContent={rightContent}
          leftWidth="320px"
          rightWidth="1fr"
          gap="2rem"
          className="max-w-7xl mx-auto"
          leftClassName="bg-white rounded-xl shadow-sm"
          rightClassName="bg-gray-50"
        />
      </div>

      {/* Note: Footer is outside the two-column layout */}
      <Footer />
    </div>
  );
};

export default TwoColumnDemoPage;