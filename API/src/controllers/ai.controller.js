const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { createLibraryAgent } = require('../services/ai.agent');
const docgiaModel = require('../models/docgia.model');
const { sendSuccess, sendError } = require('../utils/response');

const buildContext = async (user) => {
  const docgia = user?.maNguoiDung
    ? await docgiaModel.findByNguoiDung(user.maNguoiDung)
    : null;

  return {
    maNguoiDung: user?.maNguoiDung || null,
    tenDangNhap: user?.tenDangNhap || null,
    role: user?.role || null,
    hoten: docgia?.hoten || user?.hoten || user?.tenDangNhap || 'bạn',
    madocgia: docgia?.madocgia || null,
    ngayhethan: docgia?.ngayhethan || null,
    tienno: docgia?.tienno ?? null,
    email: docgia?.email || user?.tenDangNhap || null,
  };
};

const toLangChainMessage = (item) => {
  if (!item || !item.content) return null;

  const role = item.role || item.type;
  if (role === 'assistant') return new AIMessage(String(item.content));
  if (role === 'system') return new SystemMessage(String(item.content));
  return new HumanMessage(String(item.content));
};

const parseToolPayload = (content) => {
  if (typeof content !== 'string') return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
};

const buildSafeHistory = (rawMessages = [], currentMessage = '') => {
  const normalized = Array.isArray(rawMessages)
    ? rawMessages
      .filter((item) => item && item.content)
      // Agent already injects the system prompt. Dropping client system messages
      // avoids "System message should be the first one" errors in Gemini.
      .filter((item) => (item.role || item.type) !== 'system')
      .map(toLangChainMessage)
      .filter(Boolean)
    : [];

  const current = String(currentMessage || '').trim();
  if (!current) return normalized;

  const last = normalized[normalized.length - 1];
  const isDuplicatedLastHuman =
    last?._getType?.() === 'human' && String(last.content || '').trim() === current;

  if (!isDuplicatedLastHuman) {
    normalized.push(new HumanMessage(current));
  }

  return normalized;
};

const handleAgentChat = async (req, res, next) => {
  try {
    const { message, messages = [] } = req.body;

    if (!message && !Array.isArray(messages)) {
      return sendError(res, 'message là bắt buộc', 400);
    }

    const chatContext = await buildContext(req.user);
    const agent = await createLibraryAgent(chatContext);

    const history = buildSafeHistory(messages, message);

    const result = await agent.invoke({ messages: history });
    const resultMessages = result?.messages || [];
    const lastAssistantMessage = [...resultMessages].reverse().find((item) => item?._getType?.() === 'ai');

    const toolPayloads = resultMessages
      .filter((item) => item?._getType?.() === 'tool')
      .map((item) => parseToolPayload(item.content))
      .filter(Boolean);

    const searchResults = toolPayloads.find((item) => item.type === 'search_results') || null;
    const imageResults = toolPayloads.filter((item) => item.type === 'image_result') || [];
    const inventoryStatus = toolPayloads.find((item) => item.type === 'inventory_status') || null;
    const reservationResult = toolPayloads.find((item) => item.type === 'reservation_result') || null;
    const userStatus = toolPayloads.find((item) => item.type === 'user_status') || null;

    console.log(imageResults);

    return sendSuccess(res, {
      answer: lastAssistantMessage?.content || 'Tôi đã xử lý yêu cầu của bạn.',
      context: chatContext,
      data: {
        books: searchResults?.items || [],
        images: imageResults,
        inventory: inventoryStatus,
        reservation: reservationResult,
        userStatus,
      },
    });
  } catch (error) {
    const message = error?.message || '';

    // Gemini free-tier quota exceeded (429)
    if (message.includes('429') || message.includes('Too Many Requests') || message.includes('quota')) {
      return sendError(
        res,
        'Trợ lý AI đang bận (đã đạt giới hạn miễn phí hôm nay). Vui lòng thử lại sau ít phút.',
        429,
      );
    }

    next(error);
  }
};

module.exports = { handleAgentChat };