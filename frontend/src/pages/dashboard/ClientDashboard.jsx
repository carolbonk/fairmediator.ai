import { useAuth } from '../../contexts/AuthContext';
import AttorneyDashboard from './AttorneyDashboard';
import PartyDashboard from './PartyDashboard';

/**
 * ClientDashboard — unified entry for the demand side (attorneys + parties).
 * Their day-to-day needs differ (attorneys: search/saved/cases; parties: case
 * journey + recommendations), so each keeps its own view; this component just
 * selects the right one by account type.
 */
export default function ClientDashboard() {
  const { user } = useAuth();
  return user?.accountType === 'attorney' ? <AttorneyDashboard /> : <PartyDashboard />;
}
