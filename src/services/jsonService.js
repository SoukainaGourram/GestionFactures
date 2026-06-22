import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

// Default mock database structure matching db.json
const DEFAULT_DB = {
  articles: [
    {
      id: 2,
      designation: "Écran 27 Pouces 4K",
      prix_unitaire: 3200,
      categorie_id: 1
    },
    {
      id: 3,
      designation: "Consulting Cloud (heure)",
      prix_unitaire: 800,
      categorie_id: 2
    },
    {
      id: 4,
      designation: "Formation React & Node.js",
      prix_unitaire: 15000,
      categorie_id: 3
    }
  ],
  categories: [
    {
      id: 1,
      nom: "Informatique"
    },
    {
      id: 3,
      nom: "Formation"
    }
  ],
  users: [
    {
      id: 1,
      email: "admin@test.com",
      password: "admin123",
      role: "admin",
      name: "Administrateur"
    },
    {
      id: 2,
      email: "client1@test.com",
      password: "client123",
      role: "client",
      clientId: 1,
      name: "Acme Corp"
    },
    {
      id: 3,
      email: "client2@test.com",
      password: "client123",
      role: "client",
      clientId: 2,
      name: "Globex Corp"
    },
    {
      email: "doha@gmail.com",
      password: "client123",
      role: "client",
      clientId: 4,
      name: "doha",
      id: 5
    }
  ],
  clients: [
    {
      id: 1,
      nom: "Acme Corp",
      email: "client1@test.com",
      telephone: "+212 522-123456",
      adresse: "Boulevard Anfa, Casablanca",
      codeClient: "CLI-2026-0001"
    },
    {
      id: 2,
      nom: "Globex Corp",
      email: "client2@test.com",
      telephone: "+212 654-987654",
      adresse: "Avenue Mohammed V, Rabat",
      codeClient: "CLI-2026-0002"
    },
    {
      nom: "doha",
      email: "doha@gmail.com",
      telephone: "0682342022",
      adresse: "Maarif\n",
      codeClient: "CLI-2026-0003",
      id: 4
    }
  ],
  factures: [
    {
      id: 1,
      numero: "FAC-2026-0001",
      date: "2026-06-01",
      date_echeance: "2026-07-01",
      client_id: 1,
      client_nom: "Acme Corp",
      status: "payee",
      items: [
        {
          article_id: 1,
          designation: "Ordinateur Portable Dell",
          prix_unitaire: 7500,
          quantite: 2,
          total: 15000
        },
        {
          article_id: 2,
          designation: "Écran 27 Pouces 4K",
          prix_unitaire: 3200,
          quantite: 1,
          total: 3200
        }
      ],
      total_ht: 18200,
      tva: 20,
      total_ttc: 21840
    },
    {
      id: 3,
      numero: "FAC-2026-0003",
      date: "2026-06-15",
      date_echeance: "2026-07-15",
      client_id: 2,
      client_nom: "Globex Corp",
      status: "refusee",
      items: [
        {
          article_id: 4,
          designation: "Formation React & Node.js",
          prix_unitaire: 15000,
          quantite: 1,
          total: 15000
        }
      ],
      total_ht: 15000,
      tva: 20,
      total_ttc: 18000
    },
    {
      id: 4,
      numero: "FAC-2026-0004",
      date: "2026-06-20",
      date_echeance: "2026-07-20",
      client_id: 2,
      client_nom: "Globex Corp",
      status: "en_attente",
      items: [
        {
          article_id: 2,
          designation: "Écran 27 Pouces 4K",
          prix_unitaire: 3200,
          quantite: 3,
          total: 9600
        }
      ],
      total_ht: 9600,
      tva: 20,
      total_ttc: 11520
    },
    {
      id: 5,
      numero: "FAC-2026-0004",
      date: "2026-06-22",
      date_echeance: "2026-07-22",
      client_id: 2,
      client_nom: "Globex Corp",
      status: "en_attente",
      items: [
        {
          article_id: 4,
          designation: "Formation React & Node.js",
          prix_unitaire: 15000,
          quantite: 6,
          total: 90000
        }
      ],
      total_ht: 90000,
      tva: 20,
      total_ttc: 108000
    }
  ]
};

// Local storage request handler simulation
const handleLocalRequest = (method, path, data) => {
  if (!localStorage.getItem('gestion_factures_db')) {
    localStorage.setItem('gestion_factures_db', JSON.stringify(DEFAULT_DB));
  }
  const db = JSON.parse(localStorage.getItem('gestion_factures_db'));

  const parts = path.split('/').filter(Boolean); // e.g. ["articles"] or ["articles", "2"]
  const collectionName = parts[0];
  const idStr = parts[1];

  if (method.toLowerCase() === 'get') {
    if (idStr) {
      const item = db[collectionName]?.find(x => String(x.id) === String(idStr));
      if (!item) {
        return Promise.reject(new Error(`Not Found: ${path}`));
      }
      return Promise.resolve({ data: item });
    }
    return Promise.resolve({ data: db[collectionName] || [] });
  }

  if (method.toLowerCase() === 'post') {
    const collection = db[collectionName] || [];
    // generate new numeric ID
    const newId = collection.length > 0 ? Math.max(...collection.map(x => Number(x.id) || 0)) + 1 : 1;
    const newItem = { ...data, id: newId };
    collection.push(newItem);
    db[collectionName] = collection;
    localStorage.setItem('gestion_factures_db', JSON.stringify(db));
    return Promise.resolve({ data: newItem });
  }

  if (method.toLowerCase() === 'put') {
    const collection = db[collectionName] || [];
    const index = collection.findIndex(x => String(x.id) === String(idStr));
    if (index === -1) {
      return Promise.reject(new Error(`Not Found: ${path}`));
    }
    const updatedItem = { ...collection[index], ...data, id: collection[index].id };
    collection[index] = updatedItem;
    db[collectionName] = collection;
    localStorage.setItem('gestion_factures_db', JSON.stringify(db));
    return Promise.resolve({ data: updatedItem });
  }

  if (method.toLowerCase() === 'delete') {
    const collection = db[collectionName] || [];
    const index = collection.findIndex(x => String(x.id) === String(idStr));
    if (index === -1) {
      return Promise.reject(new Error(`Not Found: ${path}`));
    }
    const deletedItem = collection.splice(index, 1)[0];
    db[collectionName] = collection;
    localStorage.setItem('gestion_factures_db', JSON.stringify(db));
    return Promise.resolve({ data: deletedItem });
  }

  return Promise.reject(new Error(`Unsupported local request: ${method} ${path}`));
};

// Generic request wrapper
const request = async (method, path, data = null) => {
  try {
    // Attempt standard network request
    const response = await axios({
      method,
      url: `${BASE_URL}${path}`,
      data,
      timeout: 1500 // short timeout to quickly switch to offline mode
    });
    return response;
  } catch (error) {
    // Fallback to local storage if it's a network error (no response or timeout)
    if (!error.response) {
      console.warn(`[API Fallback] Serveur injoignable, basculement en mode local : ${method.toUpperCase()} ${path}`);
      return handleLocalRequest(method, path, data);
    }
    throw error;
  }
};

// Articles
export const getArticles = () => request('get', '/articles');
export const addArticle = (data) => request('post', '/articles', data);
export const updateArticle = (id, data) => request('put', `/articles/${id}`, data);
export const deleteArticle = (id) => request('delete', `/articles/${id}`);

// Categories
export const getCategories = () => request('get', '/categories');
export const addCategorie = (data) => request('post', '/categories', data);
export const updateCategorie = (id, data) => request('put', `/categories/${id}`, data);
export const deleteCategorie = (id) => request('delete', `/categories/${id}`);

// Clients
export const getClients = () => request('get', '/clients');
export const addClient = (data) => request('post', '/clients', data);
export const updateClient = (id, data) => request('put', `/clients/${id}`, data);
export const deleteClient = (id) => request('delete', `/clients/${id}`);

// Factures
export const getFactures = () => request('get', '/factures');
export const addFacture = (data) => request('post', '/factures', data);
export const updateFacture = (id, data) => request('put', `/factures/${id}`, data);
export const deleteFacture = (id) => request('delete', `/factures/${id}`);

// Users (for auth)
export const getUsers = () => request('get', '/users');
export const addUser = (data) => request('post', '/users', data);
export const updateUser = (id, data) => request('put', `/users/${id}`, data);
export const deleteUser = (id) => request('delete', `/users/${id}`);