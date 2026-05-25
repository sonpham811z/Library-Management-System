const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const sachModel = require('../models/sach.model');
const tuasachModel = require('../models/tuasach.model');
const docgiaModel = require('../models/docgia.model');
const datchoModel = require('../models/datcho.model');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractAuthors = (book) => {
  const relations = Array.isArray(book?.ct_tacgia) ? book.ct_tacgia : [];
  return relations
    .map((relation) => relation?.tacgia?.tentacgia || relation?.tacgia?.tentacgia || relation?.tentacgia || null)
    .filter(Boolean);
};

const serializeTitle = async (book) => {
  const availableCopies = await sachModel.findAvailableByTuaSach(book.matuasach);

  return {
    matuasach: book.matuasach,
    tentuasach: book.tentuasach,
    anhbia: book.anhbia || null,
    matheloai: book.matheloai || null,
    theloai: book.theloai?.tentheloai || null,
    tacgias: extractAuthors(book),
    availableCount: availableCopies.length,
    availableBookIds: availableCopies.map((item) => item.masach),
  };
};

const createSearchBooksTool = () => tool(
  async ({ query, author, genre }) => {
    try {
      const titleSearch = query ? String(query).trim() : undefined;
      const authorSearch = author ? String(author).trim() : undefined;
      const genreSearch = genre ? String(genre).trim() : undefined;

      if (!titleSearch && !authorSearch && !genreSearch) {
        return JSON.stringify({ type: 'search_results', items: [], message: 'Vui lòng nhập nội dung cần tìm.' });
      }

      const { data } = await tuasachModel.search({ titleSearch, authorSearch, genreSearch, page: 1, limit: 8 });
      const titles = await Promise.all((data || []).map((book) => serializeTitle(book)));

      const queryLabel = [
        titleSearch && `"${titleSearch}"`,
        authorSearch && `tác giả "${authorSearch}"`,
        genreSearch && `thể loại "${genreSearch}"`,
      ].filter(Boolean).join(', ');

      return JSON.stringify({
        type: 'search_results',
        query: queryLabel,
        items: titles,
        message: titles.length > 0
          ? `Tìm thấy ${titles.length} tựa sách phù hợp với ${queryLabel}.`
          : `Chưa tìm thấy tựa sách phù hợp với ${queryLabel} trong thư viện.`,
      });
    } catch (error) {
      console.error('Lỗi searchBooksTool:', error);
      return JSON.stringify({
        type: 'search_results',
        items: [],
        message: 'Có lỗi khi tìm sách, bạn thử lại sau nhé.',
      });
    }
  },
  {
    name: 'search_books',
    description: 'Tìm kiếm tựa sách trong thư viện. Hỗ trợ tìm theo tên sách, tên tác giả và thể loại — có thể kết hợp nhiều tiêu chí cùng lúc.',
    schema: z.object({
      query: z.string().optional().describe('Tên sách hoặc từ khóa nội dung (để trống nếu chỉ tìm theo tác giả/thể loại)'),
      author: z.string().optional().describe('Tên tác giả cần tìm (ví dụ: Nguyễn Nhật Ánh, Tô Hoài)'),
      genre: z.string().optional().describe('Thể loại sách cần tìm (ví dụ: tiểu thuyết, trinh thám, khoa học viễn tưởng)'),
    }),
  }
);

const createCheckInventoryTool = () => tool(
  async ({ matuasach }) => {
    try {
      const maTuaSach = toNumber(matuasach);
      if (!maTuaSach) {
        return JSON.stringify({ type: 'inventory_status', matuasach: matuasach ?? null, availableCount: 0, availableBookIds: [], message: 'Mã tựa sách không hợp lệ.' });
      }

      const title = await tuasachModel.findById(maTuaSach);
      const availableCopies = await sachModel.findAvailableByTuaSach(maTuaSach);

      return JSON.stringify({
        type: 'inventory_status',
        matuasach: maTuaSach,
        tentuasach: title?.tentuasach || null,
        availableCount: availableCopies.length,
        availableBookIds: availableCopies.map((item) => item.masach),
        message: availableCopies.length > 0
          ? `Tựa sách "${title?.tentuasach || maTuaSach}" còn ${availableCopies.length} bản có sẵn.`
          : `Tựa sách "${title?.tentuasach || maTuaSach}" hiện chưa có bản nào có sẵn.`,
      });
    } catch (error) {
      console.error('Lỗi checkInventoryTool:', error);
      return JSON.stringify({
        type: 'inventory_status',
        matuasach: toNumber(matuasach),
        availableCount: 0,
        availableBookIds: [],
        message: 'Không kiểm tra được tình trạng sách hiện tại.',
      });
    }
  },
  {
    name: 'check_inventory',
    description: 'Kiểm tra xem một tựa sách có còn bản nào ở trạng thái Có sẵn để mượn trực tiếp hay không.',
    schema: z.object({
      matuasach: z.coerce.number().int().min(1).describe('Mã tựa sách (matuasach) cần kiểm tra'),
    }),
  }
);

const createCheckUserStatusTool = (userData = {}) => tool(
  async () => {
    try {
      if (!userData.madocgia) {
        return JSON.stringify({
          type: 'user_status',
          hasReaderCard: false,
          message: 'Tài khoản hiện chưa được liên kết với thẻ độc giả nên chưa thể kiểm tra trạng thái mượn.',
        });
      }

      const docgia = await docgiaModel.findById(userData.madocgia);
      const isExpired = docgia.ngayhethan ? new Date(docgia.ngayhethan) < new Date() : true;

      return JSON.stringify({
        type: 'user_status',
        hasReaderCard: true,
        madocgia: docgia.madocgia,
        hoten: docgia.hoten,
        tienno: Number(docgia.tienno || 0),
        ngayhethan: docgia.ngayhethan || null,
        isExpired,
        message: Number(docgia.tienno || 0) === 0 && !isExpired
          ? `Độc giả ${docgia.hoten} đang ở trạng thái tốt, có thể tiếp tục mượn sách.`
          : `Độc giả ${docgia.hoten} cần xử lý nợ hoặc gia hạn thẻ trước khi mượn tiếp.`,
      });
    } catch (error) {
      console.error('Lỗi checkUserStatusTool:', error);
      return JSON.stringify({
        type: 'user_status',
        hasReaderCard: false,
        message: 'Không tìm thấy thông tin độc giả này trên hệ thống.',
      });
    }
  },
  {
    name: 'check_user_status',
    description: 'Kiểm tra tiền nợ và hạn dùng thẻ của độc giả đang đăng nhập.',
    schema: z.object({}),
  }
);

const createReserveBookTool = (userData = {}) => tool(
  async ({ matuasach }) => {
    try {
      if (!userData.madocgia) {
        return JSON.stringify({
          type: 'reservation_result',
          success: false,
          message: 'Tài khoản hiện chưa liên kết với thẻ độc giả nên không thể đặt trước sách.',
        });
      }

      const maTuaSach = toNumber(matuasach);
      if (!maTuaSach) {
        return JSON.stringify({
          type: 'reservation_result',
          success: false,
          message: 'Mã tựa sách không hợp lệ.',
        });
      }

      const docgia = await docgiaModel.findById(userData.madocgia);
      if (!docgia) {
        return JSON.stringify({
          type: 'reservation_result',
          success: false,
          message: 'Không tìm thấy thẻ độc giả trên hệ thống.',
        });
      }

      if (docgia.ngayhethan && new Date(docgia.ngayhethan) < new Date()) {
        return JSON.stringify({
          type: 'reservation_result',
          success: false,
          message: `Thẻ độc giả của bạn đã hết hạn ngày ${docgia.ngayhethan}. Vui lòng gia hạn trước khi đặt trước.`,
        });
      }

      const title = await tuasachModel.findById(maTuaSach);
      const availableCopies = await sachModel.findAvailableByTuaSach(maTuaSach);
      if (availableCopies.length > 0) {
        return JSON.stringify({
          type: 'reservation_result',
          success: false,
          matuasach: maTuaSach,
          availableCount: availableCopies.length,
          message: `Hiện có ${availableCopies.length} bản "${title?.tentuasach || maTuaSach}" đang sẵn sàng. Bạn nên mượn trực tiếp thay vì đặt trước.`,
        });
      }

      const existing = await datchoModel.findActiveByReaderAndTitle(userData.madocgia, maTuaSach);
      if (existing) {
        return JSON.stringify({
          type: 'reservation_result',
          success: false,
          matuasach: maTuaSach,
          message: `Bạn đã có một lượt đặt trước đang hoạt động cho tựa sách này ở trạng thái "${existing.trangthai}".`,
        });
      }

      const reservation = await datchoModel.create({ madocgia: userData.madocgia, matuasach: maTuaSach });

      return JSON.stringify({
        type: 'reservation_result',
        success: true,
        matuasach: maTuaSach,
        reservation,
        title: {
          matuasach: title?.matuasach || maTuaSach,
          tentuasach: title?.tentuasach || null,
          anhbia: title?.anhbia || null,
        },
        message: `Đặt trước thành công cho tựa sách "${title?.tentuasach || maTuaSach}".`,
      });
    } catch (error) {
      console.error('Lỗi reserveBookTool:', error);
      return JSON.stringify({
        type: 'reservation_result',
        success: false,
        matuasach: toNumber(matuasach),
        message: 'Không thể tạo lượt đặt trước lúc này.',
      });
    }
  },
  {
    name: 'reserve_book',
    description: 'Đặt trước một tựa sách khi không còn bản nào có sẵn.',
    schema: z.object({
      matuasach: z.coerce.number().int().min(1).describe('Mã tựa sách cần đặt trước'),
    }),
  }
);

const createLibraryTools = (userData = {}) => [
  createSearchBooksTool(),
  createCheckInventoryTool(),
  createCheckUserStatusTool(userData),
  createReserveBookTool(userData),
];

module.exports = {
  createLibraryTools,
};