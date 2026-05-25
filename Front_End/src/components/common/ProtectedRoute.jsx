import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

 if (roles && !roles.includes(user?.role)) {
    console.log("Sai quyền rồi bro! Đang có:", user?.role, "| Cần:", roles);
    
    // Tạm thời trả về cục div này để tránh vòng lặp vô tận
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h1 className="text-3xl font-bold text-red-600 mb-2">403 - Access Denied</h1>
        <p className="text-gray-600">Bạn không có quyền vào trang này đâu!</p>
      </div>
    );
  }

  return children;
};
