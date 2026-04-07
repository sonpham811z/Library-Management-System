import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login, clearError } from '../../features/auth/authSlice';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
// Import User thay vì Mail, giữ lại Eye, EyeOff, Lock
import { BookOpen, LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const [form, setForm] = useState({ tendangnhap: '', matkhau: '' });
  const [showPassword, setShowPassword] = useState(false); // State quản lý ẩn/hiện pass
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error, isAuthenticated } = useAuth();

  const getHomeRoute = (role) => {
    if (role === 'STAFF') return '/staff/dashboard';
    if (role === 'READER') return '/my-profile';
    return '/dashboard';
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomeRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tendangnhap || !form.matkhau) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      toast.success('Đăng nhập thành công!');
      navigate(getHomeRoute(result.payload?.role), { replace: true });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 font-sans bg-slate-50 overflow-hidden">
      
      {/* Background Orbs (Hiệu ứng ánh sáng mờ phía sau) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 pointer-events-none"></div>

      {/* Main Form Card (Hiệu ứng kính mờ - Glassmorphism) */}
      <div className="relative w-full max-w-[420px] bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden transition-all">
        
        {/* Card Header */}
        <div className="flex flex-col space-y-2 p-8 pb-6 text-center relative">
          <Link to="/" className="inline-flex justify-center mb-3 group">
            <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 group-hover:shadow-indigo-500/30">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </Link>
          <h3 className="font-bold tracking-tight text-3xl text-gray-900">Thư Viện Sách</h3>
        
        </div>

        {/* Card Content */}
        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Username (Đã đổi sang icon User và Placeholder mới) */}
            <div className="space-y-2">
              <label 
                htmlFor="username" 
                className="text-sm font-bold text-gray-700 ml-1"
              >
                Tên đăng nhập
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {/* Đổi Mail thành User ở đây */}
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  id="username"
                  value={form.tendangnhap}
                  onChange={(e) => setForm({ ...form, tendangnhap: e.target.value })}
                  /* Đổi placeholder ở đây */
                  placeholder="Nhập tên đăng nhập của bạn..."
                  autoComplete="username"
                  className="block w-full pl-12 pr-4 py-3 sm:text-sm bg-white/50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:bg-white transition-all duration-300 shadow-sm"
                />
              </div>
            </div>

            {/* Input Password (Giữ nguyên con mắt ẩn/hiện pass xịn) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label 
                  htmlFor="password" 
                  className="text-sm font-bold text-gray-700"
                >
                  Mật khẩu
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.matkhau}
                  onChange={(e) => setForm({ ...form, matkhau: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="block w-full pl-12 pr-12 py-3 sm:text-sm bg-white/50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:bg-white transition-all duration-300 shadow-sm"
                />
                {/* Nút Ẩn/Hiện mật khẩu */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-500 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="group relative flex w-full justify-center items-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] transform hover:-translate-y-0.5 transition-all duration-200 mt-8"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          
        </div>

      </div>
    </div>
  );
};