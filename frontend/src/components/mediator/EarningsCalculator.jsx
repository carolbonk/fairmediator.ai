import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Target, Activity,
  BarChart3, PieChart, Calendar, AlertCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

/**
 * Mediator Earnings Calculator Component
 * Interactive profitability calculator with 1-3 year projections
 */
const EarningsCalculator = ({ mediatorId }) => {
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState(null);
  const [activeScenario, setActiveScenario] = useState('base');
  const [projectionYears, setProjectionYears] = useState(3);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form inputs for calculator
  const [inputs, setInputs] = useState({
    hourlyRate: 350,
    averageSessionHours: 4,
    sessionsPerMonth: 8,
    overhead: {
      office: 2000,
      admin: 1500,
      marketing: 500,
      insurance: 800,
      other: 200
    },
    enableODR: false,
    enableCollaboration: false,
    taxRate: 30,
    inflationRate: 3,
    growthRate: 5
  });

  // Monochrome gray ramp for charts
  const COLORS = {
    primary: '#1F2937',    // neu-800
    secondary: '#6B7280',  // neu-500
    danger: '#9CA3AF',     // neu-400
    warning: '#4B5563',    // neu-600
    purple: '#374151',     // neu-700
    indigo: '#D1D5DB'      // neu-300
  };

  const scenarioColors = {
    base: COLORS.primary,
    odr: COLORS.secondary,
    collaboration: COLORS.warning
  };

  useEffect(() => {
    fetchEarningsData();
  }, [mediatorId]);

  const fetchEarningsData = async () => {
    try {
      const response = await axios.get(`/api/mediators/${mediatorId}/earnings`);
      setEarningsData(response.data);
      // Populate inputs with existing data
      if (response.data.currentMetrics) {
        setInputs(prev => ({
          ...prev,
          hourlyRate: response.data.currentMetrics.hourlyRate,
          averageSessionHours: response.data.currentMetrics.averageSessionHours,
          sessionsPerMonth: response.data.currentMetrics.sessionsPerMonth,
          overhead: response.data.currentMetrics.overhead || prev.overhead
        }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      setLoading(false);
    }
  };

  const calculateCurrentMetrics = () => {
    const monthlyRevenue = inputs.hourlyRate * inputs.averageSessionHours * inputs.sessionsPerMonth;
    const monthlyExpenses = Object.values(inputs.overhead).reduce((sum, val) => sum + Number(val), 0);
    const monthlyProfit = monthlyRevenue - monthlyExpenses;
    const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

    return {
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit,
      profitMargin,
      annualRevenue: monthlyRevenue * 12,
      annualExpenses: monthlyExpenses * 12,
      annualProfit: monthlyProfit * 12
    };
  };

  const generateProjections = () => {
    const current = calculateCurrentMetrics();
    const projections = [];

    for (let year = 1; year <= projectionYears; year++) {
      const baseGrowth = 1 + (inputs.growthRate / 100);
      const inflation = 1 + (inputs.inflationRate / 100);

      // Base scenario
      const baseRevenue = current.annualRevenue * Math.pow(baseGrowth, year);
      const baseExpenses = current.annualExpenses * Math.pow(inflation, year);
      const baseProfit = baseRevenue - baseExpenses;

      let projection = {
        year: `Year ${year}`,
        base: baseProfit,
        baseRevenue,
        baseExpenses
      };

      // ODR scenario
      if (inputs.enableODR) {
        const odrSessions = inputs.sessionsPerMonth * 12 * Math.pow(baseGrowth, year) * 1.2; // 20% more sessions
        const odrRate = inputs.hourlyRate * 0.85; // 15% lower rate
        const odrRevenue = odrSessions * odrRate * inputs.averageSessionHours;
        const platformFee = odrRevenue * 0.15; // 15% platform fee
        const odrProfit = odrRevenue - baseExpenses - platformFee;
        projection.odr = odrProfit;
        projection.odrRevenue = odrRevenue;
      }

      // Collaboration scenario
      if (inputs.enableCollaboration) {
        const collabSessions = inputs.sessionsPerMonth * 12 * Math.pow(baseGrowth, year) * 1.35; // 35% more sessions
        const collabRevenue = collabSessions * inputs.hourlyRate * inputs.averageSessionHours;
        const referralBonus = collabSessions * 0.2 * 500; // $500 bonus for 20% of sessions
        const totalRevenue = collabRevenue + referralBonus;
        const referralFees = totalRevenue * 0.1; // 10% referral fees
        const collabProfit = totalRevenue - baseExpenses - referralFees;
        projection.collaboration = collabProfit;
        projection.collaborationRevenue = totalRevenue;
      }

      projections.push(projection);
    }

    return projections;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const currentMetrics = calculateCurrentMetrics();
  const projections = generateProjections();

  // Prepare data for pie chart (expense breakdown)
  const expenseData = Object.entries(inputs.overhead).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: Number(value),
    percentage: (Number(value) / currentMetrics.monthlyExpenses * 100).toFixed(1)
  }));

  // Calculate ROI for different scenarios
  const calculateROI = (scenario) => {
    if (!projections.length) return 0;
    const lastYear = projections[projections.length - 1];
    const profit = lastYear[scenario] || 0;
    const investment = currentMetrics.annualExpenses;
    return investment > 0 ? ((profit / investment) * 100).toFixed(1) : 0;
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setInputs(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setInputs(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveCalculation = async () => {
    try {
      await axios.post(`/api/mediators/${mediatorId}/earnings/calculate`, {
        ...inputs,
        projections: generateProjections()
      });
      alert('Calculations saved successfully!');
    } catch (error) {
      console.error('Error saving calculations:', error);
      alert('Failed to save calculations');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-neu-700 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Current Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-neu-100 rounded-neu-lg shadow-neu p-7">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-neu-sm flex items-center justify-center shadow-neu-inset-sm bg-neu-100">
              <DollarSign className="h-5 w-5 text-neu-600" />
            </span>
            <span className="text-xs text-neu-500 font-semibold uppercase tracking-wide">Monthly</span>
          </div>
          <div className="text-2xl font-extrabold text-neu-800">
            {formatCurrency(currentMetrics.monthlyRevenue)}
          </div>
          <p className="text-sm text-neu-600 mt-1">Revenue</p>
        </div>

        <div className="bg-neu-100 rounded-neu-lg shadow-neu p-7">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-neu-sm flex items-center justify-center shadow-neu-inset-sm bg-neu-100">
              <TrendingUp className="h-5 w-5 text-neu-700" />
            </span>
            <span className="text-xs text-neu-500 font-semibold uppercase tracking-wide">Monthly</span>
          </div>
          <div className="text-2xl font-extrabold text-neu-800">
            {formatCurrency(currentMetrics.monthlyProfit)}
          </div>
          <p className="text-sm text-neu-600 mt-1">Net Profit</p>
        </div>

        <div className="bg-neu-100 rounded-neu-lg shadow-neu p-7">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-neu-sm flex items-center justify-center shadow-neu-inset-sm bg-neu-100">
              <Activity className="h-5 w-5 text-dark-neu-300" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-neu-800">
            {formatPercent(currentMetrics.profitMargin)}
          </div>
          <p className="text-sm text-neu-600 mt-1">Profit Margin</p>
        </div>

        <div className="bg-neu-100 rounded-neu-lg shadow-neu p-7">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-neu-sm flex items-center justify-center shadow-neu-inset-sm bg-neu-100">
              <Target className="h-5 w-5 text-neu-500" />
            </span>
            <span className="text-xs text-neu-500 font-semibold uppercase tracking-wide">Annual</span>
          </div>
          <div className="text-2xl font-extrabold text-neu-800">
            {formatCurrency(currentMetrics.annualRevenue)}
          </div>
          <p className="text-sm text-neu-600 mt-1">Projected Revenue</p>
        </div>
      </div>

      {/* Calculator Inputs */}
      <div className="bg-neu-100 rounded-neu-lg shadow-neu p-8 mb-12">
        <h2 className="text-xl font-bold text-neu-800 mb-4">Practice Metrics</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-neu-700 mb-2">
              Hourly Rate ($)
            </label>
            <input
              type="number"
              value={inputs.hourlyRate}
              onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
              className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm text-neu-800 shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neu-700 mb-2">
              Average Session Hours
            </label>
            <input
              type="number"
              value={inputs.averageSessionHours}
              onChange={(e) => handleInputChange('averageSessionHours', e.target.value)}
              className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm text-neu-800 shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neu-700 mb-2">
              Sessions Per Month
            </label>
            <input
              type="number"
              value={inputs.sessionsPerMonth}
              onChange={(e) => handleInputChange('sessionsPerMonth', e.target.value)}
              className="w-full bg-neu-200 rounded-neu-sm px-4 py-2.5 text-sm text-neu-800 shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400"
            />
          </div>
        </div>

        {/* Overhead Expenses */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-neu-800">Monthly Overhead</h3>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-1.5 rounded-neu-sm bg-neu-100 text-neu-700 text-sm font-semibold shadow-neu-sm hover:shadow-neu transition-all"
            >
              {showAdvanced ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(inputs.overhead).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm text-neu-600 mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleInputChange(`overhead.${key}`, e.target.value)}
                    className="w-full bg-neu-200 rounded-neu-sm px-3 py-2 text-sm text-neu-800 shadow-neu-inset-sm outline-none focus:ring-2 focus:ring-neu-400"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Growth Scenarios */}
        <div className="mt-8 p-6 bg-neu-100 rounded-neu-lg shadow-neu-inset">
          <h3 className="text-lg font-bold text-neu-800 mb-3">Growth Scenarios</h3>

          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inputs.enableODR}
                onChange={(e) => handleInputChange('enableODR', e.target.checked)}
                className="mr-3 h-4 w-4 accent-neu-700"
              />
              <span className="text-neu-700 text-sm">
                Enable Online Dispute Resolution (ODR) — 20% more cases, 15% lower rate
              </span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inputs.enableCollaboration}
                onChange={(e) => handleInputChange('enableCollaboration', e.target.checked)}
                className="mr-3 h-4 w-4 accent-neu-700"
              />
              <span className="text-neu-700 text-sm">
                Enable Lawyer Collaboration — 35% more cases, referral bonuses
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Projections Chart */}
      <div className="bg-neu-100 rounded-neu-lg shadow-neu p-8 mb-12">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-neu-800">Profit Projections</h2>
          <div className="flex gap-2 flex-wrap">
            {['base', 'odr', 'collaboration'].map(scenario => (
              (scenario === 'base' ||
               (scenario === 'odr' && inputs.enableODR) ||
               (scenario === 'collaboration' && inputs.enableCollaboration)) && (
                <button
                  key={scenario}
                  onClick={() => setActiveScenario(scenario)}
                  className={`px-4 py-1.5 rounded-neu-sm text-sm font-semibold transition-all ${
                    activeScenario === scenario
                      ? 'bg-gradient-to-r from-neu-600 to-neu-800 text-white shadow-neu'
                      : 'bg-neu-100 text-neu-700 shadow-neu-sm hover:shadow-neu'
                  }`}
                >
                  {scenario === 'base' ? 'Base' :
                   scenario === 'odr' ? 'With ODR' : 'With Collaboration'}
                </button>
              )
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={projections}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar
              dataKey="base"
              fill={COLORS.primary}
              name="Base Scenario"
              opacity={activeScenario === 'base' ? 1 : 0.3}
            />
            {inputs.enableODR && (
              <Bar
                dataKey="odr"
                fill={COLORS.secondary}
                name="ODR Scenario"
                opacity={activeScenario === 'odr' ? 1 : 0.3}
              />
            )}
            {inputs.enableCollaboration && (
              <Bar
                dataKey="collaboration"
                fill={COLORS.purple}
                name="Collaboration"
                opacity={activeScenario === 'collaboration' ? 1 : 0.3}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-neu-100 rounded-neu-lg shadow-neu p-8">
          <h2 className="text-xl font-bold text-neu-800 mb-4">Expense Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* ROI Comparison */}
        <div className="bg-neu-100 rounded-neu-lg shadow-neu p-8">
          <h2 className="text-xl font-bold text-neu-800 mb-4">Return on Investment</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neu-100 rounded-neu-sm shadow-neu-inset-sm border-l-4 border-neu-700">
              <div>
                <p className="font-bold text-neu-800">Base Scenario</p>
                <p className="text-sm text-neu-600">Traditional practice growth</p>
              </div>
              <div className="text-2xl font-extrabold text-neu-800">
                {calculateROI('base')}%
              </div>
            </div>

            {inputs.enableODR && (
              <div className="flex items-center justify-between p-4 bg-neu-100 rounded-neu-sm shadow-neu-inset-sm border-l-4 border-neu-500">
                <div>
                  <p className="font-bold text-neu-800">With ODR</p>
                  <p className="text-sm text-neu-600">Online dispute resolution</p>
                </div>
                <div className="text-2xl font-extrabold text-neu-600">
                  {calculateROI('odr')}%
                </div>
              </div>
            )}

            {inputs.enableCollaboration && (
              <div className="flex items-center justify-between p-4 bg-neu-100 rounded-neu-sm shadow-neu-inset-sm border-l-4 border-neu-400">
                <div>
                  <p className="font-bold text-neu-800">With Collaboration</p>
                  <p className="text-sm text-neu-600">Lawyer partnership program</p>
                </div>
                <div className="text-2xl font-extrabold text-dark-neu-300">
                  {calculateROI('collaboration')}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-neu-100 rounded-neu-lg shadow-neu border-l-4 border-neu-400 p-8 mb-12">
        <div className="flex items-start">
          <span className="w-10 h-10 rounded-neu-sm flex items-center justify-center flex-shrink-0 shadow-neu-inset-sm bg-neu-100 mr-3">
            <AlertCircle className="h-5 w-5 text-neu-700" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-neu-800 mb-2">
              Key Insights
            </h3>
            <ul className="space-y-2 text-neu-700 text-sm">
              <li>• Your current profit margin of {formatPercent(currentMetrics.profitMargin)} is
                  {currentMetrics.profitMargin > 50 ? ' above' : ' below'} the industry average of 50%</li>
              {inputs.enableODR && (
                <li>• Adding ODR could increase your annual case volume by 20% despite lower rates</li>
              )}
              {inputs.enableCollaboration && (
                <li>• Lawyer collaboration could boost revenue by 35% through increased referrals</li>
              )}
              <li>• Year 3 projected profit: {formatCurrency(projections[2]?.[activeScenario] || 0)}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => window.print()}
          className="px-6 py-2.5 rounded-neu-sm font-semibold text-sm bg-neu-100 text-neu-700 shadow-neu hover:shadow-neu-lg transition-all"
        >
          Export Report
        </button>
        <button
          onClick={handleSaveCalculation}
          className="px-6 py-2.5 rounded-neu-sm font-bold text-sm bg-gradient-to-r from-neu-600 to-neu-800 text-white shadow-neu hover:shadow-neu-lg transition-all"
        >
          Save Calculations
        </button>
      </div>
    </div>
  );
};

export default EarningsCalculator;