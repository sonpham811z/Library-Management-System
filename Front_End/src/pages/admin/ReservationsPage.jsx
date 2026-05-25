import { useEffect, useState, useCallback } from 'react';
import {
  BookMarked, Clock, CheckCircle, XCircle, PartyPopper,
  RefreshCw, AlertTriangle, Zap,
} from 'lucide-react';
import { datchoApi } from '../../api/datcho.api';
import { Table, Pagination } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  'Đang chờ':   { Icon: Clock,        pill: 'bg-amber-100 text-amber-700'   },
  'Đã có sách': { Icon: CheckCircle,  pill: 'bg-green-100 text-green-700'   },
  'Đã hủy':     { Icon: XCircle,      pill: 'bg-gray-100  text-gray-500'    },
  'Hoàn tất':   { Icon: PartyPopper,  pill: 'bg-indigo-100 text-indigo-600' },
};

const ALL_STATUSES = ['Tất cả', 'Đang chờ', 'Đã có sách', 'Đã hủy', 'Hoàn tất'];

const StatusPill = ({ trangthai }) => {
  const cfg = STATUS_CFG[trangthai];
  if (!cfg) return <span className="text-xs text-gray-400">{trangthai}</span>;
  const { Icon, pill } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${pill}`}>
      <Icon size={11} />
      {trangthai}
    </span>
  );
};

const DeadlineBadge = ({ ngayhethan }) => {
  if (!ngayhethan) return <span className="text-xs text-gray-400">—</span>;
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const deadline = new Date(ngayhethan); deadline.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
        <AlertTriangle size={10} /> Hết hạn
      </span>
    );
  }
  if (daysLeft === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200">
        <AlertTriangle size={10} /> Hôm nay
      </span>
    );
  }
  const color = daysLeft <= 2
    ? 'text-orange-600 bg-orange-50 border-orange-200'
    : 'text-green-700 bg-green-50 border-green-200';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full border ${color}`}>
      <Clock size={10} /> {daysLeft}n
    </span>
  );
};

// ─── Confirm loan modal ────────────────────────────────────────────────────────
const ConfirmModal = ({ reservation, onClose, onConfirmed }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await datchoApi.confirm(reservation.madatcho);
      toast.success('Đã xác nhận cho mượn thành công!');
      onConfirmed();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi xác nhận');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} title="Xác nhận cho mượn" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Xác nhận tạo phiếu mượn cho lượt đặt trước này?
        </p>

        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 w-24 shrink-0">Độc giả:</span>
            <span className="font-medium text-gray-800">
              {reservation.docgia?.hoten || `#${reservation.madocgia}`}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-24 shrink-0">Tựa sách:</span>
            <span className="font-medium text-gray-800">
              {reservation.tuasach?.tentuasach || `#${reservation.matuasach}`}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-24 shrink-0">Bản sao:</span>
            <span className="font-medium text-gray-800">#{reservation.masach}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-24 shrink-0">Hạn giữ:</span>
            <span className="font-medium text-gray-800">{formatDate(reservation.ngayhethan)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          Thao tác này sẽ tạo phiếu mượn và chuyển trạng thái đặt trước sang <strong>Hoàn tất</strong>.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button onClick={handleConfirm} loading={loading}>
            Xác nhận cho mượn
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Cancel confirmation modal ─────────────────────────────────────────────────
const CancelModal = ({ reservation, onClose, onCancelled }) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await datchoApi.cancel(reservation.madatcho);
      toast.success('Đã hủy lượt đặt trước');
      onCancelled();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi khi hủy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} title="Hủy đặt trước" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Bạn có chắc muốn hủy lượt đặt trước này?
        </p>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 w-24 shrink-0">Độc giả:</span>
            <span className="font-medium">{reservation.docgia?.hoten || `#${reservation.madocgia}`}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-24 shrink-0">Tựa sách:</span>
            <span className="font-medium">{reservation.tuasach?.tentuasach || `#${reservation.matuasach}`}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-24 shrink-0">Trạng thái:</span>
            <StatusPill trangthai={reservation.trangthai} />
          </div>
        </div>
        {reservation.trangthai === 'Đã có sách' && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Bản sao đang giữ sẽ được trả về kho và giao cho người đặt tiếp theo (nếu có).
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Đóng</Button>
          <Button variant="danger" onClick={handleCancel} loading={loading}>Hủy đặt trước</Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export const ReservationsPage = () => {
  const [rows, setRows]             = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [autoCancelling, setAutoCancelling] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [cancelTarget, setCancelTarget]   = useState(null);

  const fetchAll = useCallback(async (page = 1, status = statusFilter) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status !== 'Tất cả') params.trangthai = status;
      const { data } = await datchoApi.getAll(params);
      setRows(data.data || []);
      const p = data.pagination;
      setPagination({ page: p?.page || 1, totalPages: p?.totalPages || 1 });
    } catch {
      toast.error('Không thể tải danh sách đặt trước');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchAll(1, statusFilter); }, [statusFilter]);

  const handleAutoCancel = async () => {
    if (!window.confirm('Tự động hủy tất cả lượt giữ sách đã hết hạn?')) return;
    setAutoCancelling(true);
    try {
      const { data } = await datchoApi.autoCancelExpired();
      toast.success(data.message || 'Đã xử lý các lượt hết hạn');
      fetchAll(1, statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setAutoCancelling(false);
    }
  };

  const columns = [
    {
      key: 'madatcho',
      title: 'Mã',
      render: (_, row) => <span className="text-xs font-mono text-gray-500">#{row.madatcho}</span>,
    },
    {
      key: 'docgia',
      title: 'Độc giả',
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-gray-800 leading-tight">
            {row.docgia?.hoten || `#${row.madocgia}`}
          </p>
          <p className="text-xs text-gray-400">{row.docgia?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'tuasach',
      title: 'Tựa sách',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.tuasach?.anhbia && (
            <img
              src={row.tuasach.anhbia}
              alt=""
              className="w-8 h-11 object-cover rounded border border-gray-100 flex-shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">
              {row.tuasach?.tentuasach || `#${row.matuasach}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'masach',
      title: 'Bản sao',
      render: (value) => value
        ? <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">#{value}</span>
        : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'ngaydatcho',
      title: 'Ngày đặt',
      render: (value) => <span className="text-xs text-gray-600">{formatDate(value)}</span>,
    },
    {
      key: 'ngayhethan',
      title: 'Hạn giữ',
      render: (value) => (
        <div className="space-y-1">
          {value
            ? <p className="text-xs text-gray-600">{formatDate(value)}</p>
            : <span className="text-xs text-gray-400">—</span>
          }
          <DeadlineBadge ngayhethan={value} />
        </div>
      ),
    },
    {
      key: 'trangthai',
      title: 'Trạng thái',
      render: (value) => <StatusPill trangthai={value} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.trangthai === 'Đã có sách' && (
            <button
              onClick={() => setConfirmTarget(row)}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={12} />
              Cho mượn
            </button>
          )}
          {(row.trangthai === 'Đang chờ' || row.trangthai === 'Đã có sách') && (
            <button
              onClick={() => setCancelTarget(row)}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              <XCircle size={12} />
              Hủy
            </button>
          )}
          {(row.trangthai === 'Đã hủy' || row.trangthai === 'Hoàn tất') && (
            <span className="text-xs text-gray-400 italic">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý Đặt trước</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} kết quả</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoCancel}
            disabled={autoCancelling}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-60"
          >
            {autoCancelling
              ? <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              : <Zap size={15} />
            }
            Hủy hết hạn
          </button>
          <button
            onClick={() => fetchAll(1, statusFilter)}
            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2.5 text-sm -mb-px border-b-2 transition-colors whitespace-nowrap ${
              statusFilter === s
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-gray-400 space-y-3">
          <BookMarked size={44} className="opacity-25" />
          <p className="font-medium text-gray-500">Không có lượt đặt trước nào</p>
        </div>
      ) : (
        <>
          <Table columns={columns} data={rows} rowKey="madatcho" />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => fetchAll(p, statusFilter)}
          />
        </>
      )}

      {/* Modals */}
      {confirmTarget && (
        <ConfirmModal
          reservation={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onConfirmed={() => { setConfirmTarget(null); fetchAll(1, statusFilter); }}
        />
      )}
      {cancelTarget && (
        <CancelModal
          reservation={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => { setCancelTarget(null); fetchAll(1, statusFilter); }}
        />
      )}
    </div>
  );
};
