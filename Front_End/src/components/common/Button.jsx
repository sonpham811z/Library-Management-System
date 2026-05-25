export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon, // Thêm prop icon
  className = '',
  ...props
}) => {
  // Thêm shadow, transform hover cho button có cảm giác bấm (tactile feel)
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:-translate-y-0.5';

  const variants = {
    // Giữ nguyên màu xanh lá đậm brand của bro
    primary: 'bg-[#354336] text-white hover:bg-[#263227] focus:ring-[#354336] border border-transparent',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-[#354336]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500 shadow-none hover:shadow-none hover:translate-y-0',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="h-5 w-5" />
      ) : null}
      {children}
    </button>
  );
};