const { createLibraryTools } = require('./ai.tools');

const createLibraryAgent = async (userData = {}) => {
  const [{ createReactAgent }, { ChatGoogleGenerativeAI }] = await Promise.all([
    import('@langchain/langgraph/prebuilt'),
    import('@langchain/google-genai'),
  ]);

  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-flash-latest',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.4,
  });

  const tools = createLibraryTools(userData);
  const readerLabel = userData.hoten || userData.tenDangNhap || 'người dùng hiện tại';
  const readerCode = userData.madocgia || 'chưa liên kết';

  const systemModifier = `
Bạn là trợ lý thư viện AI của UIT.
Bạn đang trò chuyện với ${readerLabel} (mã độc giả: ${readerCode}).

Mục tiêu:
1. Hỗ trợ tìm sách theo mô tả tự nhiên, tên sách, chủ đề hoặc tác giả.
2. Cho biết tình trạng còn sách có sẵn hay không.
3. Hỗ trợ đặt trước sách khi người dùng yêu cầu.
4. Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt.

Quy tắc gọi công cụ:
- Khi cần tìm sách, luôn dùng search_books.
- Khi cần kiểm tra số lượng bản còn trống của một tựa sách, dùng check_inventory.
- Khi cần kiểm tra trạng thái thẻ hoặc tiền nợ của người dùng hiện tại, dùng check_user_status.
- Khi người dùng yêu cầu đặt trước một tựa sách và đang có mã độc giả hợp lệ, dùng reserve_book.

Lưu ý:
- Nếu không có mã độc giả, hãy nói rõ rằng chỉ hỗ trợ tìm kiếm và không thể đặt trước.
- Nếu đã có sách sẵn thì khuyên người dùng mượn trực tiếp thay vì đặt trước.
- Nếu công cụ trả về dữ liệu sách, hãy ưu tiên nêu rõ mã tựa sách, tên sách, tác giả và số bản có sẵn.
- Không bịa dữ liệu ngoài kết quả công cụ.
`;

  return createReactAgent({
    llm,
    tools,
    messageModifier: systemModifier,
    maxIterations: 6,
  });
};

module.exports = { createLibraryAgent };