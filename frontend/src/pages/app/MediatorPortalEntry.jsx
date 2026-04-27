import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MediatorLoginPopup from '../../components/MediatorLoginPopup';

export default function MediatorPortalEntry() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neu-100 via-neu-150 to-neu-200">
      <MediatorLoginPopup open={open} onClose={() => { setOpen(false); navigate('/dashboard'); }} />
    </div>
  );
}
