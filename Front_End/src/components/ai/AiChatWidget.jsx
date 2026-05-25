import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, BookMarked, Clock3, CornerDownLeft, HelpCircle, Loader2, MessageCircleMore, Search, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiApi } from '../../api/ai.api';
import { Button } from '../common/Button';
import { AI_CHAT_EVENT } from './aiChatUtils';

const STORAGE_PREFIX = 'libra-byte-ai-chat';

const defaultMessages = [
  {
    role: 'assistant',
    content: 'Xin chào, tôi là trợ lý thư viện. Bạn có thể hỏi tôi về tìm sách, tình trạng còn bản hay đặt trước sách.',
  },
];

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

/** Strip markdown for storage (books list is rendered separately) */
const BookCard = ({ book }) => {
  const title = book.tentuasach || `Tựa sách #${book.matuasach}`;
  const authors = Array.isArray(book.tacgias) && book.tacgias.length > 0
    ? book.tacgias.join(', ')
    : 'Không rõ tác giả';
  const availability = Number.isFinite(book.availableCount)
    ? book.availableCount > 0
      ? `${book.availableCount} bản có sẵn`
      : 'Hết bản'
    : 'Chưa rõ';

  return (
    <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 p-2">
      {book.anhbia ? (
        <img
          src={book.anhbia}
          alt={`Bìa sách: ${title}`}
          className="h-16 w-12 flex-shrink-0 rounded-md object-cover shadow-sm"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="flex h-16 w-12 flex-shrink-0 items-center justify-center rounded-md bg-[#354336]/10 text-[#354336]">
          <BookMarked size={20} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-snug text-gray-800 line-clamp-2">{title}</p>
        <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">{authors}</p>
        <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${book.availableCount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {availability}
        </span>
      </div>
    </div>
  );
};

/** Render markdown text content with proper formatting */
const MarkdownContent = ({ content }) => (
  <ReactMarkdown
    components={{
      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
      ul: ({ children }) => <ul className="mb-1 ml-3 list-disc space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="mb-1 ml-3 list-decimal space-y-0.5">{children}</ol>,
      li: ({ children }) => <li>{children}</li>,
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      code: ({ children }) => <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px] font-mono">{children}</code>,
      h1: ({ children }) => <p className="font-bold">{children}</p>,
      h2: ({ children }) => <p className="font-bold">{children}</p>,
      h3: ({ children }) => <p className="font-semibold">{children}</p>,
    }}
  >
    {content}
  </ReactMarkdown>
);

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
      // Only persist text/role, not book data (it can be re-fetched)
      const toStore = messages.slice(-20).map(({ role, content }) => ({ role, content }));
      localStorage.setItem(storageKey, JSON.stringify(toStore));
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

      // Extra text parts appended below the main answer
      const extraParts = [];
      if (inventory?.message) extraParts.push(inventory.message);
      if (reservation?.message) extraParts.push(reservation.message);
      if (userStatus?.message) extraParts.push(userStatus.message);

      const fullContent = extraParts.length > 0
        ? `${answer}\n\n${extraParts.join('\n')}`
        : answer;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fullContent,
          // Attach book objects so we can render covers
          books: Array.isArray(books) && books.length > 0 ? books.slice(0, 5) : [],
        },
      ]);
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể kết nối trợ lý AI lúc này.';
      setMessages((prev) => [...prev, { role: 'assistant', content: message, books: [] }]);
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
          <div className="pointer-events-auto flex h-[min(82vh,800px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-black/20">
            {/* Header */}
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-[#faf9f6] px-4 py-4">
              {messages.map((message, index) => {
                const isAssistant = message.role === 'assistant';
                const hasBooks = isAssistant && Array.isArray(message.books) && message.books.length > 0;
                return (
                  <div key={`${message.role}-${index}`} className={`mb-3 flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isAssistant ? 'bg-white text-gray-700 shadow-sm border border-gray-100' : 'bg-[#354336] text-white shadow-sm'}`}>
                      {isAssistant ? (
                        <>
                          <MarkdownContent content={message.content} />
                          {hasBooks && (
                            <div className="mt-2 grid grid-cols-1 gap-2">
                              {message.books.map((book) => (
                                <BookCard key={book.matuasach} book={book} />
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
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

            {/* Footer */}
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
