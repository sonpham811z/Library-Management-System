import { useEffect, useState, useCallback } from 'react';
import { Search, BookMarked, BookOpen, Bot } from 'lucide-react';
import { tuasachApi } from '../../api/tuasach.api';
import { theloaiApi } from '../../api/theloai.api';
import { sachApi } from '../../api/sach.api';
import { datchoApi } from '../../api/datcho.api';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Table';
import { openAiChat } from '../../components/ai/aiChatUtils';
import toast from 'react-hot-toast';

const BookCard = ({ book, onViewDetail }) => {
  const authors = (book.ct_tacgia || [])
    .map((ct) => ct.tacgia?.tentacgia)
    .filter(Boolean)
    .join(', ') || 'Không rõ tác giả';

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer"
      onClick={() => onViewDetail(book)}
    >
      <div className="relative">
        <img
          src={book.anhbia || `https://placehold.co/200x280/e2e8f0/64748b?text=${encodeURIComponent(book.tentuasach?.[0] || 'S')}`}
          alt={book.tentuasach}
          className="w-full h-52 object-cover"
          onError={(e) => { e.target.src = `https://placehold.co/200x280/e2e8f0/64748b?text=S`; }}
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem]">{book.tentuasach}</h3>
        <p className="text-xs text-gray-500 mt-1 truncate">{authors}</p>
        <p className="text-xs text-gray-400">{book.theloai?.tentheloai}</p>
      </div>
    </div>
  );
};

export const SearchPage = () => {
  const [books, setBooks]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [theloaiFilter, setTheloaiFilter] = useState('');
  const [theloaiList, setTheloaiList]     = useState([]);
  const [featuredByCategory, setFeaturedByCategory] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [selectedBook, setSelectedBook]   = useState(null);
  const [hasSearched, setHasSearched]     = useState(false);

  // Availability state for the detail modal
  const [availability, setAvailability]       = useState(null); // { available: [], total: number }
  const [loadingAvail, setLoadingAvail]         = useState(false);
  const [reserving, setReserving]               = useState(false);

  useEffect(() => {
    const loadInitialBooks = async () => {
      setLoadingFeatured(true);
      try {
        const { data } = await theloaiApi.getAll();
        const categories = data.data || [];
        setTheloaiList(categories);

        const grouped = await Promise.all(
          categories.map(async (tl) => {
            const { data: bookRes } = await tuasachApi.getAll({
              page: 1,
              limit: 4,
              matheloai: tl.matheloai,
            });
            return {
              matheloai: tl.matheloai,
              tentheloai: tl.tentheloai,
              books: bookRes.data || [],
            };
          })
        );

        setFeaturedByCategory(grouped.filter((g) => g.books.length > 0));
      } catch {
        setFeaturedByCategory([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    loadInitialBooks();
  }, []);

  const fetchBooks = useCallback(async (page = 1) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const { data } = await tuasachApi.getAll({
        page, limit: 12,
        search: search || undefined,
        matheloai: theloaiFilter || undefined,
      });
      setBooks(data.data || []);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages });
    } catch {
      toast.error('Không thể tải sách');
    } finally {
      setLoading(false);
    }
  }, [search, theloaiFilter]);

  /* Load availability when a book detail modal opens */
  const openDetail = async (book) => {
    setSelectedBook(book);
    setAvailability(null);
    setLoadingAvail(true);
    try {
      // Use sach.getAll to count copies and available ones
      const { data } = await sachApi.getAll({ matuasach: book.matuasach, limit: 200 });
      const all       = data.data || [];
      const available = all.filter((s) => s.trangthai === 'Có sẵn');
      setAvailability({ available, total: all.length });
    } catch {
      setAvailability(null);
    } finally {
      setLoadingAvail(false);
    }
  };

  const handleReserve = async () => {
    if (!selectedBook) return;
    setReserving(true);
    try {
      await datchoApi.create(selectedBook.matuasach);
      toast.success('Đặt trước thành công! Chúng tôi sẽ thông báo khi sách có sẵn.');
      // Reload availability to update button state
      const { data } = await sachApi.getAll({ matuasach: selectedBook.matuasach, limit: 200 });
      const all = data.data || [];
      setAvailability({ available: all.filter(s => s.trangthai === 'Có sẵn'), total: all.length });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setReserving(false);
    }
  };

  const allBorrowed = availability && availability.available.length === 0 && availability.total > 0;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên sách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
              className="pl-9 pr-3 py-2.5 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={theloaiFilter}
            onChange={(e) => setTheloaiFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả thể loại</option>
            {theloaiList.map((tl) => (
              <option key={tl.matheloai} value={tl.matheloai}>{tl.tentheloai}</option>
            ))}
          </select>
          <Button onClick={() => fetchBooks()}>Tìm kiếm</Button>
        </div>
      </div>

      {/* Results */}
      {!hasSearched && (
        <>
          {loadingFeatured ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : featuredByCategory.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Search size={48} className="mx-auto mb-3 opacity-30" />
              <p>Nhập tên sách hoặc chọn thể loại rồi bấm <strong>Tìm kiếm</strong></p>
            </div>
          ) : (
            <div className="space-y-8">
              {featuredByCategory.map((section) => (
                <section key={section.matheloai} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">{section.tentheloai}</h2>
                    <span className="text-xs text-gray-500">Hiển thị {section.books.length} quyển</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {section.books.map((book) => (
                      <BookCard key={book.matuasach} book={book} onViewDetail={openDetail} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {hasSearched && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {books.map((book) => (
                  <BookCard key={book.matuasach} book={book} onViewDetail={openDetail} />
                ))}
              </div>
              {books.length === 0 && (
                <p className="text-center text-gray-400 py-8">Không tìm thấy sách nào phù hợp</p>
              )}
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchBooks} />
            </>
          )}
        </>
      )}

      {/* Book Detail Modal */}
      {selectedBook && (
        <Modal isOpen={!!selectedBook} onClose={() => setSelectedBook(null)} title="Chi tiết sách" size="lg">
          <div className="flex gap-5">
            <img
              src={selectedBook.anhbia || `https://placehold.co/140x200/e2e8f0/64748b?text=S`}
              alt={selectedBook.tentuasach}
              className="w-36 h-48 object-cover rounded-lg border border-gray-200 shrink-0"
              onError={(e) => { e.target.src = `https://placehold.co/140x200/e2e8f0/64748b?text=S`; }}
            />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedBook.tentuasach}</h3>
                <p className="text-gray-500 text-sm">
                  {(selectedBook.ct_tacgia || []).map((ct) => ct.tacgia?.tentacgia).filter(Boolean).join(', ') || 'Không rõ tác giả'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Thể loại: </span>
                  <span className="font-medium">{selectedBook.theloai?.tentheloai || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Mã tựa sách: </span>
                  <span className="font-mono font-medium">#{selectedBook.matuasach}</span>
                </div>
              </div>

              {/* Availability */}
              <div className="pt-1">
                {loadingAvail ? (
                  <p className="text-sm text-gray-400">Đang kiểm tra tình trạng sách...</p>
                ) : availability ? (
                  <div>
                    <div className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${
                      availability.available.length > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <BookOpen size={14} />
                      {availability.available.length > 0
                        ? `${availability.available.length} / ${availability.total} bản sao có sẵn`
                        : `Tất cả ${availability.total} bản sao đã được mượn`}
                    </div>

                    {/* Reserve button — only shown when all copies are borrowed */}
                    {allBorrowed && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          onClick={handleReserve}
                          loading={reserving}
                          className="gap-2"
                        >
                          <BookMarked size={14} />
                          Đặt trước — nhận thông báo khi có sách
                        </Button>
                        <p className="text-xs text-gray-400 mt-1">
                          Bạn sẽ được thông báo khi có bản sao được trả lại.
                        </p>
                      </div>
                    )}

                    {availability.available.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Vui lòng đến thư viện để mượn sách. Thủ thư sẽ lập phiếu mượn cho bạn.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Không thể tải tình trạng sách.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openAiChat({
                    prompt: `Hãy tư vấn nhanh cho tôi về tựa sách "${selectedBook.tentuasach}" (mã ${selectedBook.matuasach}). Nếu cần, hãy kiểm tra xem có nên đặt trước hay không.`,
                    context: {
                      matuasach: selectedBook.matuasach,
                      tentuasach: selectedBook.tentuasach,
                      theloai: selectedBook.theloai?.tentheloai || null,
                    },
                  })}
                  className="gap-2"
                >
                  <Bot size={14} />
                  Hỏi AI về sách này
                </Button>

                {selectedBook?.theloai?.tentheloai && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAiChat({
                      prompt: `Tôi thích sách thể loại ${selectedBook.theloai.tentheloai}. Hãy gợi ý thêm sách phù hợp trong thư viện.`,
                      context: { theloai: selectedBook.theloai.tentheloai },
                    })}
                    className="gap-2"
                  >
                    <Search size={14} />
                    Tìm thêm sách cùng thể loại
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
