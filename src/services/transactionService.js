import api from "./api";

export const transactionService = {
  getTransactions: async (params) => {
    const response = await api.get("/transactions", { params });
    return response.data;
  },

    getAllTransactions: async (params) => {
    const response = await api.get("/transactions/all", { params });
    return response.data;
  },

  getTransactionById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (data) => {
    const response = await api.post("/transactions", data);
    return response.data;
  },

  updateTransaction: async (id, data) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  uploadImage: async (formData) => {
    const response = await api.post("/upload/image", formData);
    return response.data;
  },

  uploadTransactionPhoto: async (data) => {
    const response = await api.post("/transactions/upload", data);
    return response.data;
  },

  getPhotosByDate: async (params) => {
    const response = await api.get("/transactions/photos/calendar", { params });
    return response.data;
  },

  getPhotos: async (params) => {
    const response = await api.get("/transactions/photos", { params });
    return response.data;
  },

  deletePhoto: async (id) => {
    const response = await api.delete(`/transactions/photos/${id}`);
    return response.data;
  },
};
