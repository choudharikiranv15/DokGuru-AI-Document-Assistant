import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });

          if (response.data.success) {
            const { token, user } = response.data;
            set({
              user,
              token,
              isAuthenticated: true
            });
            return { success: true };
          }
          return { success: false, message: response.data.message };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          return { success: false, message };
        }
      },

      signup: async (email, password, role = '', institution = '', occupation = '') => {
        try {
          const response = await api.post('/auth/signup', {
            email,
            password,
            role,
            institution,
            occupation
          });

          if (response.data.success) {
            const { token, user } = response.data;
            set({
              user,
              token,
              isAuthenticated: true
            });
            return { success: true };
          }
          return { success: false, message: response.data.message };
        } catch (error) {
          const message = error.response?.data?.message || 'Signup failed';
          return { success: false, message };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
