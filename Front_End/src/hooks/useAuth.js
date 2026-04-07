import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectAuthLoading, selectAuthError, logout, clearError } from '../features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF',
    isReader: user?.role === 'READER',
    isAdminOrStaff: user?.role === 'ADMIN' || user?.role === 'STAFF',
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
  };
};
