import { useEffect, useState, useCallback } from 'react';
import {
  BookMarked, X, Clock, CheckCircle, XCircle,
  PartyPopper, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { datchoApi } from '../../api/datcho.api';
import { Button } from '../../components/common/Button';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

// ─── Status configuration ─────────────────────────────────────────────────────
const STATUS_CFG = {
  'Đang chờ':   { Icon: Clock,        pill: 'bg-amber-100 text-amber-700',  card: 'border-amber-200 bg-amber-50/40'  },
  'Đã có sách': { Icon: CheckCircle,  pill: 'bg-green-100 text-green-700',  card: 'border-green-300 bg-green-50/60'  },
  'Đã hủy':     { Icon: XCircle,      pill: 'bg-gray-100  text-gray-500',   card: 'border-gray-200  bg-gray-50/40'   },
  'Hoàn tất':   { Icon: PartyPopper,  pill: 'bg-indigo-100 text-indigo-600', card: 'border-indigo-200 bg-indigo-50/40' },
};

const ACTIVE_STATUSES  = ['Đang chờ', 'Đã có sách'];
const HISTORY_STATUSES = ['Đã hủy', 'Hoàn tất'];

// ─── Deadline countdown ───────────────────────────────────────────────────────
const DeadlineBadge = ({ ngayhethan }) => {
  if (!ngayhethan) return null;
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const deadline  = new Date(ngayhethan); deadline.setHours(0, 0, 0, 0);
  const diffMs    = deadline - today;
  const daysLeft  = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
        <AlertTriangle size={11} /> Hết hạn giữ
      </span>
    );
  }
  if (daysLeft === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 animate-pulse">
        <AlertTriangle size={11} /> Hôm nay là hạn cuối!
      </span>
    );
  }
  const color = daysLeft <= 2 ? 'text-orange-600 bg-orange-50 border-orange-200'
              : 'text-green-700 bg-green-50 border-green-200';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      <Clock size={11} /> Còn {daysLeft} ngày để đến lấy
    </span>
  );
};

// ─── 3-step stepper ──────────────────────────────────────────────────────────
const STEPS = ['Đặt trước', 'Có sách', 'Đã mượn'];
const stepIndex = { 'Đang chờ': 0, 'Đã có sách': 1, 'Hoàn tất': 2 };

const Stepper = ({ trangthai }) => {
  const current = stepIndex[trangthai] ?? -1;
  if (current === -1) return null; // don't show for 'Đã hủy'
  return (
    <div className="flex items-center gap-0 mt-3">
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                done   ? 'bg-indigo-600 border-indigo-600 text-white'
                : active ? 'bg-white border-indigo-600 text-indigo-600'
                : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${
                active ? 'text-indigo-600 font-semibold' : done ? 'text-indigo-500' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-indigo-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Single reservation card ──────────────────────────────────────────────────
const ReservationCard = ({ r, onCancel, cancelling }) => {
  const cfg        = STATUS_CFG[r.trangthai] || STATUS_CFG['Đang chờ'];
  const { Icon }   = cfg;
  const canCancel  = r.trangthai === 'Đang chờ';
  const isHold     = r.trangthai === 'Đã có sách';

  return (
    <div className={`rounded-2xl border p-4 transition-shadow hover:shadow-md ${cfg.card}`}>
      <div className="flex gap-3">
        {/* Book cover */}
        {r.tuasach?.anhbia ? (
          <img
            src={r.tuasach.anhbia}
            alt=""
            className="w-14 h-20 object-cover rounded-lg border border-white/80 shadow-sm flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-14 h-20 bg-white/60 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
            <BookMarked size={22} className="text-gray-400" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-800 leading-snug truncate pr-2">
              {r.tuasach?.tentuasach || `Tựa sách #${r.matuasach}`}
            </p>
            {/* Status pill */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.pill}`}>
              <Icon size={11} />
              {r.trangthai}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-0.5">Ngày đặt: {formatDate(r.ngaydatcho)}</p>

          {/* Hold deadline info */}
          {isHold && (
            <div className="mt-1.5 space-y-1">
              <p className="text-xs text-gray-500">
                Hạn đến lấy: <span className="font-medium text-gray-700">{formatDate(r.ngayhethan)}</span>
              </p>
              <DeadlineBadge ngayhethan={r.ngayhethan} />
              <p className="text-xs text-green-700 mt-1 leading-relaxed">
                Bản sao #{r.masach} đang được giữ cho bạn. Hãy đến thư viện để nhận sách.
              </p>
            </div>
          )}

          {r.trangthai === 'Hoàn tất' && (
            <p className="text-xs text-indigo-600 mt-1">Đã hoàn tất — sách đã được mượn thành công.</p>
          )}

          {r.trangthai === 'Đã hủy' && (
            <p className="text-xs text-gray-400 mt-1">Lượt đặt trước này đã bị hủy.</p>
          )}

          {/* Stepper for non-cancelled */}
          <Stepper trangthai={r.trangthai} />
        </div>

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={() => onCancel(r.madatcho)}
            disabled={cancelling === r.madatcho}
            className="text-gray-400 hover:text-red-500 flex-shrink-0 p-1 self-start rounded-md hover:bg-red-50 transition-colors"
            title="Hủy đặt trước"
          >
            {cancelling === r.madatcho ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <X size={15} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export const MyReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [cancelling, setCancelling]     = useState(null);
  const [tab, setTab]                   = useState('active'); // 'active' | 'history'
  const [confirmModal, setConfirmModal] = useState({ open: false, madatcho: null });

  const fetchMy = useCallback(() => {
    setLoading(true);
    datchoApi.getMy()
      .then(({ data }) => setReservations(data.data || []))
      .catch(() => toast.error('Không thể tải danh sách đặt trước'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMy(); }, [fetchMy]);

  const handleCancel = (madatcho) => {
    setConfirmModal({ open: true, madatcho });
  };

  const confirmCancel = async () => {
    const { madatcho } = confirmModal;
    setConfirmModal({ open: false, madatcho: null });
    setCancelling(madatcho);
    try {
      await datchoApi.cancel(madatcho);
      toast.success('Đã hủy lượt đặt trước');
      fetchMy();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setCancelling(null);
    }
  };

  const active  = reservations.filter((r) => ACTIVE_STATUSES.includes(r.trangthai));
  const history = reservations.filter((r) => HISTORY_STATUSES.includes(r.trangthai));
  const shown   = tab === 'active' ? active : history;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sách đặt trước</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length} đang chờ · {history.length} lịch sử
          </p>
        </div>
        <button
          onClick={fetchMy}
          className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Làm mới"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {[
          { key: 'active',  label: 'Đang chờ & Có sách', count: active.length },
          { key: 'history', label: 'Lịch sử',            count: history.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm -mb-px border-b-2 transition-colors ${
              tab === key
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {shown.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-gray-400 space-y-3">
          <BookMarked size={44} className="opacity-25" />
          <p className="font-medium text-gray-500">
            {tab === 'active' ? 'Không có lượt đặt trước nào đang chờ' : 'Chưa có lịch sử đặt trước'}
          </p>
          {tab === 'active' && (
            <p className="text-sm max-w-xs">
              Khi tất cả bản sao của một tựa sách đã được mượn, bạn có thể đặt trước trong trang <strong>Tra cứu sách</strong>.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <ReservationCard
              key={r.madatcho}
              r={r}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, madatcho: null })}
        onConfirm={confirmCancel}
        title="Hủy đặt trước"
        message="Bạn có chắc muốn hủy lượt đặt trước này?"
        confirmLabel="Hủy đặt trước"
        variant="warning"
      />
    </div>
  );
};
