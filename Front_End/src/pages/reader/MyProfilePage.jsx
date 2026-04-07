import { useEffect, useState, useRef } from 'react';
import { User, CreditCard, KeyRound, Camera } from 'lucide-react';
import { docgiaApi } from '../../api/docgia.api';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const MyProfilePage = () => {
  const { user } = useAuth();
  const [card, setCard]           = useState(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [pwdModal, setPwdModal]   = useState(false);
  const [pwdForm, setPwdForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving]       = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const fetchCard = () => {
    setCardLoading(true);
    docgiaApi.getMe()
      .then(({ data }) => setCard(data.data))
      .catch(() => setCard(null))
      .finally(() => setCardLoading(false));
  };

  useEffect(() => {
    fetchCard();
  }, []);

  const handleChangePassword = async () => {
    if (pwdForm.newPassword !== pwdForm.confirm) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('Mật khẩu mới phải ít nhất 6 ký tự'); return; }
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Đổi mật khẩu thành công');
      setPwdModal(false);
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 3;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Ảnh không được vượt quá ${MAX_MB} MB`);
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data } = await docgiaApi.updateAvatar(file);
      setCard((prev) => prev ? { ...prev, anhdaidien: data.data.anhdaidien } : prev);
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải ảnh lên');
    } finally {
      setUploadingAvatar(false);
      // Reset so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isExpired = card && new Date(card.ngayhethan) < new Date();

  return (
    <div className="w-full space-y-5">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 rounded-2xl text-white p-6 shadow-lg border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border border-white/15 backdrop-blur-sm">
                {card?.anhdaidien ? (
                  <img
                    src={card.anhdaidien}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={30} className="text-white/80" />
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white hover:bg-indigo-400 transition-colors shadow-lg"
                title="Đổi ảnh đại diện"
              >
                {uploadingAvatar ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={12} />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <p className="text-indigo-200 text-sm uppercase tracking-wide">Trang cá nhân</p>
              <h2 className="text-2xl font-bold">{card?.hoten || user?.tenDangNhap}</h2>
              <p className="text-sm text-white/70">{user?.tenDangNhap}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white border border-white/10">
              READER
            </span>
            <Button variant="secondary" size="sm" onClick={() => setPwdModal(true)}>
              <KeyRound size={14} /> Đổi mật khẩu
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Thông tin cá nhân</h3>
          </div>

          {card ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Họ tên</p>
                <p className="font-medium text-gray-800 mt-1">{card.hoten}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Email</p>
                <p className="font-medium text-gray-800 mt-1">{card.email || '—'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Ngày sinh</p>
                <p className="font-medium text-gray-800 mt-1">{formatDate(card.ngaysinh)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Địa chỉ</p>
                <p className="font-medium text-gray-800 mt-1">{card.diachi || '—'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Loại độc giả</p>
                <p className="font-medium text-gray-800 mt-1">{card.loaidocgia?.tenloaidocgia || '—'}</p>
              </div>
            </div>
          ) : cardLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Không tìm thấy thông tin độc giả.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-800">Thẻ độc giả</h3>
          </div>
          {cardLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          ) : card ? (
            <div className={`rounded-2xl p-5 text-white shadow-md ${isExpired ? 'bg-gradient-to-br from-gray-500 to-gray-700' : 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-700'}`}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="text-white/70 text-sm">Độc giả</p>
                  <p className="font-bold text-xl leading-tight">{card.hoten}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${isExpired ? 'bg-red-200 text-red-900' : 'bg-green-200 text-green-900'}`}>
                  {isExpired ? 'Hết hạn' : 'Còn hiệu lực'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-white/70 text-xs uppercase tracking-wide">Ngày lập thẻ</p>
                  <p className="font-medium mt-1">{formatDate(card.ngaylapthe)}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-white/70 text-xs uppercase tracking-wide">Ngày hết hạn</p>
                  <p className="font-medium mt-1">{formatDate(card.ngayhethan)}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm col-span-2">
                  <p className="text-white/70 text-xs uppercase tracking-wide">Mã độc giả</p>
                  <p className="font-mono font-medium mt-1">#{card.madocgia}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm col-span-2">
                  <p className="text-white/70 text-xs uppercase tracking-wide">Tiền nợ</p>
                  <p className={`font-semibold mt-1 ${card.tienno > 0 ? 'text-red-100' : 'text-green-100'}`}>
                    {Number(card.tienno).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Không tìm thấy thẻ độc giả. Đảm bảo tài khoản đã được liên kết với hồ sơ độc giả.</p>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={pwdModal} onClose={() => setPwdModal(false)} title="Đổi mật khẩu">
        <div className="space-y-4">
          <Input label="Mật khẩu hiện tại" type="password" value={pwdForm.currentPassword}
            onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} />
          <Input label="Mật khẩu mới" type="password" value={pwdForm.newPassword}
            onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
          <Input label="Xác nhận mật khẩu mới" type="password" value={pwdForm.confirm}
            onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setPwdModal(false)}>Hủy</Button>
          <Button onClick={handleChangePassword} loading={saving}>Đổi mật khẩu</Button>
        </div>
      </Modal>
    </div>
  );
};
