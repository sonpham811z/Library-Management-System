export const AI_CHAT_EVENT = 'library-ai:open';

/**
 * Programmatically open the AI chat widget, optionally pre-filling a prompt
 * or injecting a context object.
 *
 * @param {{ prompt?: string, context?: object }} payload
 */
export const openAiChat = (payload = {}) => {
  window.dispatchEvent(new CustomEvent(AI_CHAT_EVENT, { detail: payload }));
};
