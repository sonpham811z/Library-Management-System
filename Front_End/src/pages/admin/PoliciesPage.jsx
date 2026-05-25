import { useEffect, useState } from 'react';
import { thamsoApi } from '../../api/thamso.api';
import toast from 'react-hot-toast';

// Human-readable labels for known THAMSO keys
const THAMSO_LABELS = {
  TuoiToiThieu: { label: 'Tuổi tối thiểu độc giả', unit: 'tuổi' },
  TuoiToiDa: { label: 'Tuổi tối đa độc giả', unit: 'tuổi' },
  ThoiHanTheThang: { label: 'Thời hạn thẻ độc giả', unit: 'tháng' },
  SoNgayMuonToiDa: { label: 'Số ngày mượn tối đa', unit: 'ngày' },
  SoSachMuonToiDa: { label: 'Số sách mượn tối đa', unit: 'quyển' },
  TienPhatTreHanMotNgay: { label: 'Tiền phạt mỗi ngày trễ', unit: 'VNĐ' },
};

export const PoliciesPage = () => {
  // rows: [{ tenthamso, giatri }]
  const [rows, setRows] = useState([]);
  // editing: { [tenthamso]: string } — tracks live input values
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    thamsoApi.getAll()
      .then(({ data }) => {
        const fetched = data.data; // [{ tenthamso, giatri }]
        setRows(fetched);
        const map = {};
        fetched.forEach(({ tenthamso, giatri }) => { map[tenthamso] = String(giatri); });
        setEditing(map);
      })
      .catch(() => toast.error('Không thể tải tham số hệ thống'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setEditing((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Validate all values are positive numbers
    for (const [key, val] of Object.entries(editing)) {
      if (val === '' || isNaN(Number(val)) || Number(val) < 0) {
        toast.error(`Giá trị không hợp lệ cho: ${THAMSO_LABELS[key]?.label || key}`);
        return;
      }
    }

    setSaving(true);
    try {
      const params = Object.entries(editing).map(([tenthamso, giatri]) => ({
        tenthamso,
        giatri: Number(giatri),
      }));
      await thamsoApi.updateMany(params);
      // Sync saved state
      const updatedRows = rows.map((r) => ({
        ...r,
        giatri: Number(editing[r.tenthamso]),
      }));
      setRows(updatedRows);
      toast.success('Cập nhật tham số thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const map = {};
    rows.forEach(({ tenthamso, giatri }) => { map[tenthamso] = String(giatri); });
    setEditing(map);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Tham Số Hệ Thống (THAMSO)</h2>
          <p className="text-sm text-gray-500 mt-1">
            Các giá trị này được áp dụng trực tiếp cho toàn bộ nghiệp vụ hệ thống
          </p>
        </div>

        <div className="p-5 space-y-4">
          {rows.map(({ tenthamso }) => {
            const meta = THAMSO_LABELS[tenthamso];
            return (
              <div key={tenthamso} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {meta?.label || tenthamso}
                  </label>
                  <p className="text-xs text-gray-400 font-mono">{tenthamso}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={editing[tenthamso] ?? ''}
                    onChange={(e) => handleChange(tenthamso, e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-500 w-14">{meta?.unit ?? ''}</span>
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Không có tham số nào. Hãy chạy schema.sql để seed dữ liệu.
            </p>
          )}
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Hủy thay đổi
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu tham số'}
          </button>
        </div>
      </div>
    </div>
  );
};
