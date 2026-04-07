export const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN');
};

export const getRoleBadgeColor = (role) => {
  const colors = {
    ADMIN: 'bg-red-100 text-red-700',
    STAFF: 'bg-blue-100 text-blue-700',
    READER: 'bg-green-100 text-green-700',
  };
  return colors[role] || 'bg-gray-100 text-gray-700';
};

export const getStatusColor = (status) => {
  const colors = {
    BORROWING: 'bg-yellow-100 text-yellow-700',
    RETURNED: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    AVAILABLE: 'bg-green-100 text-green-700',
    BORROWED: 'bg-red-100 text-red-700',
    ACTIVE: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    HOLDING: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    COMPLETED: 'bg-green-100 text-green-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export const getStatusLabel = (status) => {
  const labels = {
    BORROWING: 'Đang mượn',
    RETURNED: 'Đã trả',
    OVERDUE: 'Quá hạn',
    AVAILABLE: 'Còn sách',
    BORROWED: 'Hết sách',
    ACTIVE: 'Hoạt động',
    EXPIRED: 'Hết hạn',
    SUSPENDED: 'Tạm khóa',
    PENDING: 'Chờ',
    HOLDING: 'Đang giữ',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Hoàn thành',
  };
  return labels[status] || status;
};
