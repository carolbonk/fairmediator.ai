import { useAuth } from '../../contexts/AuthContext';
import MediatorDashboard from './MediatorDashboard';
import ClientDashboard from './ClientDashboard';

/**
 * DashboardPage - Routes to the appropriate dashboard based on user account type
 * - Mediators: Profile stats, case management, reviews
 * - Attorneys + Parties (demand side): unified ClientDashboard, which selects
 *   the right view internally by accountType
 */
export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-neu-700 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-semibold text-neu-800">Loading...</p>
        </div>
      </div>
    );
  }

  return user.accountType === 'mediator' ? <MediatorDashboard /> : <ClientDashboard />;
}
