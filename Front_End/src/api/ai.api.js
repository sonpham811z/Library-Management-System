import api from './axios';

export const aiApi = {
  chat: ({ message, messages = [] }) => api.post('/ai/chat', { message, messages }),
};
