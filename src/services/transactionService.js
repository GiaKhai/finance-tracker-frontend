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
};
