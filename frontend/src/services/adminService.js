import api from './api.js';

export const getUsers = async (search) =>
  (await api.get('/admin/users', { params: search ? { search } : {} })).data.data;
export const getUser = async (id) => (await api.get(`/admin/users/${id}`)).data.data.user;
export const getUserNotes = async (id) => (await api.get(`/admin/users/${id}/notes`)).data.data.notes;
export const deleteUser = async (id) => api.delete(`/admin/users/${id}`);
export const deleteNote = async (id) => api.delete(`/admin/notes/${id}`);
