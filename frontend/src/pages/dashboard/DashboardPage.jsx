import { useAuth } from '../../contexts/AuthContext';
import MediatorDashboard from './MediatorDashboard';
import AttorneyDashboard from './AttorneyDashboard';
import PartyDashboard from './PartyDashboard';

/**
 * DashboardPage - Routes to the appropriate dashboard based on user account type
 * - Mediators: Profile stats, case management, reviews
 * - Attorneys: Search activity, saved mediators, conflict checker
 * - Parties: Case guidance, mediator recommendations, education
 */
export default function DashboardPage() {
  const { user } = useAuth();

  // Route to appropriate dashboard based on account type
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  // Route based on accountType
  switch (user.accountType) {
    case 'mediator':
      return <MediatorDashboard />;
    case 'attorney':
      return <AttorneyDashboard />;
    case 'party':
      return <PartyDashboard />;
    default:
      // Fallback for users without accountType (legacy data)
      return <PartyDashboard />;
  }
}
