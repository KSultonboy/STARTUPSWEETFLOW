import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Yuklanmoqda...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default PrivateRoute;
