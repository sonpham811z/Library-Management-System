import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, BookMarked, Clock3, CornerDownLeft, HelpCircle, Loader2, MessageCircleMore, Search, X } from 'lucide-react';
import { aiApi } from '../../api/ai.api';
import { Button } from '../common/Button';

const AI_CHAT_EVENT = 'library-ai:open';
const STORAGE_PREFIX = 'libra-byte-ai-chat';

const defaultMessages = [
  {
    role: 'assistant',
    content: 'Xin chào, tôi là trợ lý thư viện. Bạn có thể hỏi tôi về tìm sách, tình trạng còn bản hay đặt trước sách.',
  },
];

const formatBookLine = (book) => {
  const title = book.tentuasach || `Tựa sách #${book.matuasach}`;
  const authors = Array.isArray(book.tacgias) && book.tacgias.length > 0
    ? book.tacgias.join(', ')
    : 'Không rõ tác giả';
  const availability = Number.isFinite(book.availableCount)
    ? `${book.availableCount} bản có sẵn`
    : 'Chưa rõ tình trạng';

  return `${title} · ${authors} · ${availability}`;
};

const quickPrompts = [
  {
    label: 'Tìm sách theo chủ đề',
    icon: Search,
    prompt: 'Tôi muốn tìm sách theo chủ đề hoặc nhu cầu học tập, hãy gợi ý một vài tựa phù hợp.',
  },
  {
    label: 'Kiểm tra sách có sẵn',
    icon: BookMarked,
    prompt: 'Hãy kiểm tra xem một tựa sách tôi đang quan tâm còn bản nào có sẵn để mượn trực tiếp hay không.',
  },
  {
    label: 'Hỏi về đặt trước',
    icon: Clock3,
    prompt: 'Tôi muốn biết khi nào nên đặt trước sách và các điều kiện cần có.',
  },
];

export const AiChatWidget = () => {
  const storageKey = useMemo(() => `${STORAGE_PREFIX}:messages`, []);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return defaultMessages;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultMessages;
    } catch {
      return defaultMessages;
    }
  });
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingContext, setPendingContext] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
    } catch {
      // Ignore storage failures.
    }
  }, [messages, storageKey]);

  useEffect(() => {
    const handleOpen = (event) => {
      const detail = event.detail || {};
      setOpen(true);
      if (detail.prompt) {
        setDraft(String(detail.prompt));
      }
      if (detail.context) {
        setPendingContext(detail.context);
      }
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    window.addEventListener(AI_CHAT_EVENT, handleOpen);
    return () => window.removeEventListener(AI_CHAT_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open, sending]);

  const sendMessage = async (text) => {
    const content = text.trim();
    if (!content || sending) return;

    const userMessage = { role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setSending(true);

    try {
      const payloadMessages = nextMessages
        .filter((item) => item.role === 'user' || item.role === 'assistant')
        .map((item) => ({ role: item.role, content: item.content }));

      if (pendingContext) {
        payloadMessages.unshift({
          role: 'system',
          content: `Ngữ cảnh nhanh từ giao diện: ${JSON.stringify(pendingContext)}`,
        });
      }

      const { data } = await aiApi.chat({ message: content, messages: payloadMessages });
      const answer = data?.data?.answer || data?.answer || 'Tôi đã ghi nhận yêu cầu của bạn.';
      const books = data?.data?.data?.books || [];
      const reservation = data?.data?.data?.reservation || null;
      const inventory = data?.data?.data?.inventory || null;
      const userStatus = data?.data?.data?.userStatus || null;

      const assistantParts = [answer];
      if (Array.isArray(books) && books.length > 0) {
        assistantParts.push('Kết quả liên quan:', ...books.slice(0, 5).map((book) => `- ${formatBookLine(book)}`));
      }
      if (inventory?.message) assistantParts.push(inventory.message);
      if (reservation?.message) assistantParts.push(reservation.message);
      if (userStatus?.message) assistantParts.push(userStatus.message);

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantParts.join('\n') }]);
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể kết nối trợ lý AI lúc này.';
      setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(draft);
  };

  const openFromPrompt = (prompt) => {
    setOpen(true);
    setDraft(prompt);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#354336] px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-black/15 transition-transform hover:-translate-y-0.5 hover:bg-[#263227]"
      >
        <MessageCircleMore size={18} />
        Hỏi AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
          <div className="pointer-events-auto flex h-[min(78vh,760px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-black/20">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-[#354336] to-[#4d5e48] px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Bot size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Trợ lý thư viện AI</p>
                  <p className="text-xs text-white/80">Tìm sách, kiểm tra tình trạng và hỗ trợ đặt trước</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#faf9f6] px-4 py-4">
              {messages.map((message, index) => {
                const isAssistant = message.role === 'assistant';
                return (
                  <div key={`${message.role}-${index}`} className={`mb-3 flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${isAssistant ? 'bg-white text-gray-700 shadow-sm border border-gray-100' : 'bg-[#354336] text-white shadow-sm'}`}>
                      {message.content}
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="mb-3 flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Đang trả lời...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-100 bg-white p-4">
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {quickPrompts.map(({ label, icon: Icon, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => openFromPrompt(prompt)}
                    className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-600 transition-colors hover:border-[#354336]/30 hover:bg-[#F4EFE7] hover:text-[#354336]"
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <div className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-[#354336]">
                  <textarea
                    ref={inputRef}
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ví dụ: Tìm sách về lập trình web hoặc đặt trước tựa sách tôi vừa xem"
                    className="w-full resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSubmit(event);
                      }
                    }}
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="inline-flex items-center gap-1"><HelpCircle size={12} />Có thể hỏi bằng tiếng Việt tự nhiên</span>
                    <span className="inline-flex items-center gap-1"><CornerDownLeft size={12} />Enter để gửi, Shift+Enter để xuống dòng</span>
                  </div>
                </div>
                <Button type="submit" loading={sending} className="h-[52px] rounded-2xl px-4">
                  Gửi
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const openAiChat = (payload = {}) => {
  window.dispatchEvent(new CustomEvent(AI_CHAT_EVENT, { detail: payload }));
};
