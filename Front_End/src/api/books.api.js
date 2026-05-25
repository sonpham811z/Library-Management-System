import api from './axios';

export const booksApi = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  getPopular: (limit = 8) => api.get('/books/popular', { params: { limit } }),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),

  getCategories: () => api.get('/books/categories'),
  createCategory: (data) => api.post('/books/categories', data),
  updateCategory: (id, data) => api.put(`/books/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/books/categories/${id}`),

  getAuthors: () => api.get('/books/authors'),
  createAuthor: (data) => api.post('/books/authors', data),
  updateAuthor: (id, data) => api.put(`/books/authors/${id}`, data),
  deleteAuthor: (id) => api.delete(`/books/authors/${id}`),

  getPublishers: () => api.get('/books/publishers'),
  createPublisher: (data) => api.post('/books/publishers', data),
  updatePublisher: (id, data) => api.put(`/books/publishers/${id}`, data),
  deletePublisher: (id) => api.delete(`/books/publishers/${id}`),
};
