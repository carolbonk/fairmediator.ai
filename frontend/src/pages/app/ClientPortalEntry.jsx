import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoadmapPopup from '../../components/RoadmapPopup';

/**
 * ClientPortalEntry — shared placeholder for the demand-side portals
 * (attorneys + parties), replacing the former AttorneyPortalEntry/PartyPortalEntry.
 */
export default function ClientPortalEntry() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200">
      <RoadmapPopup
        feature="client-portal"
        source="client-portal-entry"
        open={open}
        onClose={() => { setOpen(false); navigate('/dashboard'); }}
      />
    </div>
  );
}
