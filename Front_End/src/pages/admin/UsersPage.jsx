import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { nguoidungApi } from '../../api/nguoidung.api';
import { nhomnguoidungApi } from '../../api/nhomnguoidung.api';
import { Table, Pagination } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const EMPTY_FORM = { tendangnhap: '', matkhau: '', manhom: '' };

export const UsersPage = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [nhoms, setNhoms] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Load groups once
  useEffect(() => {
    nhomnguoidungApi.getAll()
      .then(({ data }) => setNhoms(data.data || []))
      .catch(() => toast.error('Không thể tải danh sách nhóm'));
  }, []);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await nguoidungApi.getAll({ page, limit: 15 });
      setUsers(data.data || []);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch {
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, manhom: nhoms[0]?.manhom ?? '' });
    setModal({ open: true, mode: 'create' });
  };

  const openEdit = (u) => {
    setForm({ tendangnhap: u.tendangnhap, matkhau: '', manhom: u.manhom });
    setModal({ open: true, mode: 'edit', data: u });
  };

  const handleSave = async () => {
    if (!form.tendangnhap || !form.manhom) {
      toast.error('Tên đăng nhập và nhóm là bắt buộc');
      return;
    }
    if (modal.mode === 'create' && !form.matkhau) {
      toast.error('Mật khẩu là bắt buộc khi tạo mới');
      return;
    }

    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await nguoidungApi.create({
          tendangnhap: form.tendangnhap.trim(),
          matkhau: form.matkhau,
          manhom: +form.manhom,
        });
        toast.success('Tạo tài khoản thành công');
      } else {
        await nguoidungApi.update(modal.data.manguoidung, { manhom: +form.manhom });
        toast.success('Cập nhật nhóm thành công');
      }
      setModal({ open: false });
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Xóa tài khoản "${u.tendangnhap}"?`)) return;
    try {
      await nguoidungApi.remove(u.manguoidung);
      toast.success('Đã xóa tài khoản');
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getNhomName = (maNhom) =>
    nhoms.find((n) => n.manhom === maNhom)?.tennhom || `Nhóm ${maNhom}`;

  const nhomColor = (tenNhom) => {
    const upper = (tenNhom || '').toUpperCase();
    if (upper === 'ADMIN') return 'bg-red-100 text-red-700';
    if (upper === 'STAFF') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const columns = [
    {
      key: 'manguoidung',
      title: 'ID',
      render: (v) => <span className="text-xs text-gray-400 font-mono">#{v}</span>,
    },
    {
      key: 'tendangnhap',
      title: 'Tên đăng nhập',
      render: (v) => <span className="font-medium text-gray-800">{v}</span>,
    },
    {
      key: 'manhom',
      title: 'Nhóm',
      render: (v) => {
        const name = getNhomName(v);
        return (
          
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${nhomColor(name)}`}>
            {console.log(name)}
            {name}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
            title="Đổi nhóm"
          >
            <Edit2 size={14} />
          </button>
          {isAdmin && row.manguoidung !== currentUser?.maNguoiDung && (
            <button
              onClick={() => handleDelete(row)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
              title="Xóa tài khoản"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Tạo tài khoản
        </Button>
      </div>

      <Table columns={columns} data={users} loading={loading} />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={fetchUsers}
      />

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === 'create' ? 'Tạo tài khoản mới' : 'Đổi nhóm tài khoản'}
      >
        <div className="space-y-4">
          <Input
            label="Tên đăng nhập *"
            value={form.tendangnhap}
            onChange={(e) => setForm({ ...form, tendangnhap: e.target.value })}
            disabled={modal.mode === 'edit'}
            placeholder="Nhập tên đăng nhập"
          />
          {modal.mode === 'create' && (
            <Input
              label="Mật khẩu *"
              type="password"
              value={form.matkhau}
              onChange={(e) => setForm({ ...form, matkhau: e.target.value })}
              placeholder="Tối thiểu 6 ký tự"
            />
          )}
          <Select
            label="Nhóm người dùng *"
            value={form.manhom}
            onChange={(e) => setForm({ ...form, manhom: e.target.value })}
          >
            <option value="">-- Chọn nhóm --</option>
            {nhoms.map((n) => (
              <option key={n.manhom} value={n.manhom}>
                {n.tennhom}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="secondary" onClick={() => setModal({ open: false })}>
            Hủy
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {modal.mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
