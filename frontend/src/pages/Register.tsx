import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Register route now redirects to the unified auth page at /login */
export function Register() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);
  return null;
}
