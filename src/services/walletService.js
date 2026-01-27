import api from "./api";

export const walletService = {
  getWallets: async () => {
    const response = await api.get("/wallets");
    return response.data;
  },

  getWalletById: async (id) => {
    const response = await api.get(`/wallets/${id}`);
    return response.data;
  },

  createWallet: async (data) => {
    const response = await api.post("/wallets", data);
    return response.data;
  },

  updateWallet: async (id, data) => {
    const response = await api.put(`/wallets/${id}`, data);
    return response.data;
  },

  deleteWallet: async (id) => {
    const response = await api.delete(`/wallets/${id}`);
    return response.data;
  },
};
