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