import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import About from '../pages/About';

export const LandingRoute: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C7FB]"></div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/home" replace />;
  }

  return <About />;
};

export default LandingRoute;
