import { useEffect, useState, useCallback } from 'react';
import { FileBarChart, AlertTriangle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { baocaoApi } from '../../api/baocao.api';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatCurrency = (v) =>
  Number(v).toLocaleString('vi-VN') + ' đ';

const currentMonthYear = () => {
  const d = new Date();
  return { thang: d.getMonth() + 1, nam: d.getFullYear() };
};

/* ─── Tab: BCTINHHINHMUONSACH ─────────────────────────────────────────────── */
const MuonSachTab = () => {
  const [{ thang, nam }, setFilter] = useState(currentMonthYear());
  const [reports, setReports]       = useState([]);
  const [detail, setDetail]         = useState(null);   // expanded report
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await baocaoApi.getAllMuonSach();
      setReports(data.data || []);
    } catch {
      toast.error('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleGenerate = async () => {
    if (thang < 1 || thang > 12) { toast.error('Tháng không hợp lệ (1–12)'); return; }
    setGenerating(true);
    try {
      const { data } = await baocaoApi.generateMuonSach({ thang: +thang, nam: +nam });
      toast.success(data.message || 'Đã tạo báo cáo');
      setDetail(data.data);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setGenerating(false);
    }
  };

  const handleView = async (id) => {
    if (detail?.mabaocao === id) { setDetail(null); return; }
    try {
      const { data } = await baocaoApi.getMuonSachById(id);
      setDetail(data.data);
    } catch {
      toast.error('Không thể tải chi tiết');
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tháng</label>
          <input
            type="number" min={1} max={12}
            value={thang}
            onChange={(e) => setFilter((f) => ({ ...f, thang: +e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Năm</label>
          <input
            type="number" min={2000}
            value={nam}
            onChange={(e) => setFilter((f) => ({ ...f, nam: +e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button onClick={handleGenerate} loading={generating}>
          <RefreshCw size={14} /> Tạo / Cập nhật báo cáo
        </Button>
      </div>

      {/* Report list */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={thStyle}>Mã BC</th>
              <th style={thStyle}>Tháng</th>
              <th style={thStyle}>Năm</th>
              <th style={thStyle}>Tổng lượt mượn</th>
              <th style={thStyle}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Đang tải...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Chưa có báo cáo nào</td></tr>
            ) : reports.map((r) => {
              const isOpen = detail?.mabaocao === r.mabaocao;
              return (
                <>
                  <tr key={r.mabaocao} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>{r.mabaocao}</td>
                    <td style={tdStyle}>{r.thang}</td>
                    <td style={tdStyle}>{r.nam}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#4f46e5' }}>{r.tongsoluotmuon}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleView(r.mabaocao)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4f46e5', fontSize: 13 }}
                      >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {isOpen ? 'Thu gọn' : 'Xem chi tiết'}
                      </button>
                    </td>
                  </tr>
                  {isOpen && detail && (
                    <tr key={`detail-${r.mabaocao}`}>
                      <td colSpan={5} style={{ padding: '0 0 12px 32px', background: '#f8faff' }}>
                        <DetailTableMuonSach rows={detail.ct_bctinhhinhmuonsach || []} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DetailTableMuonSach = ({ rows }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
    <thead>
      <tr style={{ background: '#eff6ff' }}>
        <th style={thStyle}>Thể loại</th>
        <th style={thStyle}>Số lượt mượn</th>
        <th style={thStyle}>Tỉ lệ (%)</th>
      </tr>
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr><td colSpan={3} style={{ textAlign: 'center', padding: 12, color: '#9ca3af' }}>Không có dữ liệu</td></tr>
      ) : rows.sort((a, b) => b.soluotmuon - a.soluotmuon).map((row) => (
        <tr key={row.matheloai} style={{ borderBottom: '1px solid #e0e7ff' }}>
          <td style={tdStyle}>{row.theloai?.tentheloai ?? `#${row.matheloai}`}</td>
          <td style={{ ...tdStyle, fontWeight: 600 }}>{row.soluotmuon}</td>
          <td style={tdStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 8, background: '#e0e7ff', borderRadius: 4 }}>
                <div style={{ width: `${row.tile}%`, height: '100%', background: '#4f46e5', borderRadius: 4 }} />
              </div>
              <span style={{ minWidth: 44, textAlign: 'right' }}>{Number(row.tile).toFixed(2)}%</span>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

/* ─── Tab: BCSACHTRATRE ──────────────────────────────────────────────────── */
const SachTraTreTab = () => {
  const [reports, setReports]       = useState([]);
  const [detail, setDetail]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await baocaoApi.getAllSachTraTre();
      setReports(data.data || []);
    } catch {
      toast.error('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await baocaoApi.generateSachTraTre();
      toast.success(data.message || 'Đã tạo báo cáo');
      setDetail(data.data);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setGenerating(false);
    }
  };

  const handleView = async (id) => {
    if (detail?.mabaocao === id) { setDetail(null); return; }
    try {
      const { data } = await baocaoApi.getSachTraTreById(id);
      setDetail(data.data);
    } catch {
      toast.error('Không thể tải chi tiết');
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleGenerate} loading={generating}>
          <RefreshCw size={14} /> Chụp báo cáo hôm nay
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Mỗi lần nhấn tạo sẽ lưu một snapshot mới ghi nhận tất cả sách đang mượn và đã quá hạn tính đến hôm nay.
      </p>

      {/* Report list */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={thStyle}>Mã BC</th>
              <th style={thStyle}>Ngày lập</th>
              <th style={thStyle}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Đang tải...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Chưa có báo cáo nào</td></tr>
            ) : reports.map((r) => {
              const isOpen = detail?.mabaocao === r.mabaocao;
              return (
                <>
                  <tr key={r.mabaocao} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>{r.mabaocao}</td>
                    <td style={tdStyle}>{formatDate(r.ngay)}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleView(r.mabaocao)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4f46e5', fontSize: 13 }}
                      >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {isOpen ? 'Thu gọn' : 'Xem chi tiết'}
                      </button>
                    </td>
                  </tr>
                  {isOpen && detail && (
                    <tr key={`detail-${r.mabaocao}`}>
                      <td colSpan={3} style={{ padding: '0 0 12px 32px', background: '#fff7f7' }}>
                        <DetailTableSachTraTre rows={detail.ct_bcsachtratre || []} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DetailTableSachTraTre = ({ rows }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
    <thead>
      <tr style={{ background: '#fff1f1' }}>
        <th style={thStyle}>Mã sách</th>
        <th style={thStyle}>Tên tựa sách</th>
        <th style={thStyle}>Số ngày trả trễ</th>
      </tr>
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr><td colSpan={3} style={{ textAlign: 'center', padding: 12, color: '#9ca3af' }}>
          Không có sách trả trễ
        </td></tr>
      ) : rows.sort((a, b) => b.songaytratre - a.songaytratre).map((row) => (
        <tr key={row.masach} style={{ borderBottom: '1px solid #ffe4e4' }}>
          <td style={tdStyle}>{row.masach}</td>
          <td style={tdStyle}>{row.sach?.tuasach?.tentuasach ?? '—'}</td>
          <td style={tdStyle}>
            <span style={{
              fontWeight: 700,
              color: row.songaytratre > 7 ? '#dc2626' : '#ea580c',
              background: row.songaytratre > 7 ? '#fee2e2' : '#ffedd5',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 12,
            }}>
              {row.songaytratre} ngày
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

/* ─── Shared table styles ─────────────────────────────────────────────────── */
const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
};
const tdStyle = {
  padding: '10px 14px',
  color: '#374151',
};

/* ─── ReportsPage (tabbed) ────────────────────────────────────────────────── */
const TABS = [
  { key: 'muonsach',   label: 'Tình hình mượn sách', icon: FileBarChart },
  { key: 'sachtratre', label: 'Sách trả trễ',         icon: AlertTriangle },
];

export const ReportsPage = () => {
  const [tab, setTab] = useState('muonsach');

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e5e7eb' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              fontSize: 14,
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? '#4f46e5' : '#6b7280',
              borderBottom: tab === key ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: -2,
              background: 'none',
              border: 'none',
              borderBottomWidth: 2,
              cursor: 'pointer',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'muonsach'   && <MuonSachTab />}
      {tab === 'sachtratre' && <SachTraTreTab />}
    </div>
  );
};
