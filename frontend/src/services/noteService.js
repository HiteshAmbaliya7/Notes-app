import api from './api.js';

export const getNotes = async ({ search, tag } = {}) => {
  const params = {};
  if (search) params.search = search;
  if (tag) params.tag = tag;
  return (await api.get('/notes', { params })).data.data.notes;
};

export const getTags = async () => (await api.get('/notes/tags')).data.data.tags;
export const getNote = async (id) => (await api.get(`/notes/${id}`)).data.data.note;
export const createNote = async (payload) => (await api.post('/notes', payload)).data.data.note;
export const updateNote = async (id, payload) => (await api.patch(`/notes/${id}`, payload)).data.data.note;
export const deleteNote = async (id) => api.delete(`/notes/${id}`);
