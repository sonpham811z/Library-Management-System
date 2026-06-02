import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, RefreshCw, Trash2 } from 'lucide-react';
import { docgiaApi } from '../../api/docgia.api';
import { loaidocgiaApi } from '../../api/loaidocgia.api';
import { nguoidungApi } from '../../api/nguoidung.api';
import { Table, Pagination } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Input, Select } from '../../components/common/Input';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  hoten: '',
  ngaysinh: '',
  diachi: '',
  email: '',
  maloaidocgia: '',
  manguoidung: '',
};

export const ReaderCardsPage = () => {
  const [readers, setReaders] = useState([]);
  const [loaiList, setLoaiList] = useState([]);
  const [userList, setUserList] = useState([]); // NGUOIDUNG list for FK linking
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, target: null });

  // Load reader types and user list once
  useEffect(() => {
    Promise.all([
      loaidocgiaApi.getAll(),
      nguoidungApi.getAll({ limit: 200 }),
    ])
      .then(([loai, users]) => {
        setLoaiList(loai.data.data || []);
        setUserList(users.data.data || []);
      })
      .catch(() => toast.error('Không thể tải dữ liệu danh mục'));
  }, []);

  const fetchReaders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await docgiaApi.getAll({ page, limit: 15, search });
      setReaders(data.data || []);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch {
      toast.error('Không thể tải danh sách độc giả');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchReaders(); }, [fetchReaders]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, maloaidocgia: loaiList[0]?.maloaidocgia ?? '' });
    setModal({ open: true, mode: 'create' });
  };

  const openEdit = (r) => {
    setForm({
      hoten: r.hoten,
      ngaysinh: r.ngaysinh,
      diachi: r.diachi || '',
      email: r.email || '',
      maloaidocgia: r.maloaidocgia,
      manguoidung: r.manguoidung || '',
    });
    setModal({ open: true, mode: 'edit', data: r });
  };

  const handleSave = async () => {
    if (!form.hoten || !form.ngaysinh || !form.maloaidocgia) {
      toast.error('Họ tên, ngày sinh và loại độc giả là bắt buộc');
      return;
    }

    setSaving(true);
    try {
      if (modal.mode === 'create') {
        const res = await docgiaApi.create({
          ...form,
          maloaidocgia: +form.maloaidocgia,
          manguoidung: form.manguoidung ? +form.manguoidung : undefined,
        });
        toast.success(res.data.message || 'Lập thẻ thành công');
      } else {
        await docgiaApi.update(modal.data.madocgia, {
          ...form,
          maloaidocgia: +form.maloaidocgia,
          manguoidung: form.manguoidung ? +form.manguoidung : undefined,
        });
        toast.success('Cập nhật độc giả thành công');
      }
      setModal({ open: false });
      fetchReaders(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleGiaHan = async (r) => {
    try {
      const res = await docgiaApi.giaHan(r.madocgia);
      toast.success(res.data.message || 'Gia hạn thành công');
      fetchReaders(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = (r) => {
    setConfirmModal({ open: true, target: r });
  };

  const confirmDelete = async () => {
    try {
      await docgiaApi.remove(confirmModal.target.madocgia);
      toast.success('Đã xóa độc giả');
      setConfirmModal({ open: false, target: null });
      fetchReaders(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const isExpired = (ngayHetHan) => new Date(ngayHetHan) < new Date();

  const columns = [
    {
      key: 'madocgia',
      title: 'Mã ĐG',
      render: (v) => <span className="text-xs font-mono text-gray-400">#{v}</span>,
    },
    {
      key: 'hoten',
      title: 'Họ tên',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-800">{v}</p>
          <p className="text-xs text-gray-400">{row.email || '—'}</p>
          {row.manguoidung && (
            <p className="text-xs text-indigo-500">TK #{row.manguoidung}</p>
          )}
        </div>
      ),
    },
    {
      key: 'ngaysinh',
      title: 'Ngày sinh',
      render: (v) => formatDate(v),
    },
    {
      key: 'loaidocgia',
      title: 'Loại',
      render: (v) => (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          {v?.tenloaidocgia || '—'}
        </span>
      ),
    },
    {
      key: 'ngayhethan',
      title: 'Hết hạn',
      render: (v) => (
        <span className={isExpired(v) ? 'text-red-600 font-medium' : 'text-green-700'}>
          {formatDate(v)}
          {isExpired(v) && ' (HH)'}
        </span>
      ),
    },
    {
      key: 'tienno',
      title: 'Tiền nợ',
      render: (v) => (
        <span className={+v > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
          {+v > 0 ? formatCurrency(v) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, row) => (
        <div className="flex gap-1.5">
          <button onClick={() => openEdit(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Sửa">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleGiaHan(row)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Gia hạn thẻ">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => handleDelete(row)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Xóa">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Lập thẻ độc giả
        </Button>
      </div>

      <Table columns={columns} data={readers} loading={loading} />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchReaders} />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, target: null })}
        onConfirm={confirmDelete}
        title="Xóa thẻ độc giả"
        message={`Bạn có chắc muốn xóa thẻ độc giả "${confirmModal.target?.hoten}"?`}
        confirmLabel="Xóa"
      />

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === 'create' ? 'Lập thẻ độc giả mới' : 'Cập nhật độc giả'}
        size="md"
      >
        <div className="space-y-3">
          <Input
            label="Họ tên *"
            value={form.hoten}
            onChange={(e) => setForm({ ...form, hoten: e.target.value })}
            placeholder="Nguyễn Văn A"
          />
          <Input
            label="Ngày sinh *"
            type="date"
            value={form.ngaysinh}
            onChange={(e) => setForm({ ...form, ngaysinh: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="example@email.com"
          />
          <Input
            label="Địa chỉ"
            value={form.diachi}
            onChange={(e) => setForm({ ...form, diachi: e.target.value })}
            placeholder="Số nhà, đường, quận..."
          />
          <Select
            label="Loại độc giả *"
            value={form.maloaidocgia}
            onChange={(e) => setForm({ ...form, maloaidocgia: e.target.value })}
          >
            <option value="">-- Chọn loại --</option>
            {loaiList.map((l) => (
              <option key={l.maloaidocgia} value={l.maloaidocgia}>
                {l.tenloaidocgia}
              </option>
            ))}
          </Select>

          <Select
            label="Liên kết tài khoản (MaNguoiDung)"
            value={form.manguoidung}
            onChange={(e) => setForm({ ...form, manguoidung: e.target.value })}
          >
            <option value="">-- Không liên kết --</option>
            {userList.map((u) => (
              <option key={u.manguoidung} value={u.manguoidung}>
                #{u.manguoidung} — {u.tendangnhap}
              </option>
            ))}
          </Select>

          {modal.mode === 'create' && (
            <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
              Hệ thống sẽ tự động kiểm tra tuổi (TuoiToiThieu → TuoiToiDa) và
              tính NgayHetHan = hôm nay + ThoiHanTheThang tháng theo THAMSO.
              Liên kết tài khoản giúp độc giả đăng nhập xem thẻ mà không cần khớp email.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setModal({ open: false })}>
            Hủy
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {modal.mode === 'create' ? 'Lập thẻ' : 'Lưu'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
