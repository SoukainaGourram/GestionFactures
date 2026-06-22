import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

// Articles
export const getArticles = () => axios.get(`${BASE_URL}/articles`);
export const addArticle = (data) => axios.post(`${BASE_URL}/articles`, data);
export const updateArticle = (id, data) => axios.put(`${BASE_URL}/articles/${id}`, data);
export const deleteArticle = (id) => axios.delete(`${BASE_URL}/articles/${id}`);

// Categories
export const getCategories = () => axios.get(`${BASE_URL}/categories`);
export const addCategorie = (data) => axios.post(`${BASE_URL}/categories`, data);
export const updateCategorie = (id, data) => axios.put(`${BASE_URL}/categories/${id}`, data);
export const deleteCategorie = (id) => axios.delete(`${BASE_URL}/categories/${id}`);

// Clients
export const getClients = () => axios.get(`${BASE_URL}/clients`);
export const addClient = (data) => axios.post(`${BASE_URL}/clients`, data);
export const updateClient = (id, data) => axios.put(`${BASE_URL}/clients/${id}`, data);
export const deleteClient = (id) => axios.delete(`${BASE_URL}/clients/${id}`);

// Factures
export const getFactures = () => axios.get(`${BASE_URL}/factures`);
export const addFacture = (data) => axios.post(`${BASE_URL}/factures`, data);
export const updateFacture = (id, data) => axios.put(`${BASE_URL}/factures/${id}`, data);
export const deleteFacture = (id) => axios.delete(`${BASE_URL}/factures/${id}`);

// Users (for auth)
export const getUsers = () => axios.get(`${BASE_URL}/users`);
export const addUser = (data) => axios.post(`${BASE_URL}/users`, data);
export const updateUser = (id, data) => axios.put(`${BASE_URL}/users/${id}`, data);
export const deleteUser = (id) => axios.delete(`${BASE_URL}/users/${id}`);