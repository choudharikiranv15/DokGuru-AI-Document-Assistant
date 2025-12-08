import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { supabase } from '../services/supabaseClient';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: true,

      // Login function
      login: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          const { session, user } = data;
          const token = session.access_token;

          // Set token for API requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Fetch full profile from backend
          try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
              set({ 
                user: { ...user, ...response.data.user }, // Merge Supabase user with backend profile
                token, 
                isAuthenticated: true,
                loading: false
              });
              return { success: true };
            }
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);
            // Fallback to basic user data if backend fetch fails
            set({ 
              user, 
              token, 
              isAuthenticated: true,
              loading: false
            });
            return { success: true };
          }

          return { success: true };
        } catch (error) {
          return { success: false, message: error.message };
        }
      },

      // Login with Google
      loginWithGoogle: async () => {
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin + '/app',
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            }
          });

          if (error) throw error;
          return { success: true };
        } catch (error) {
          return { success: false, message: error.message };
        }
      },

      // Signup function
      signup: async (email, password, role = '', institution = '', occupation = '') => {
        try {
          // 1. Sign up with Supabase
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) throw error;

          const { session, user } = data;
          
          if (session) {
             const token = session.access_token;
             api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
             
             // 2. Create/Update profile in backend (The trigger might handle creation, but we need to update extra fields)
             // Since the trigger only does basic fields, we might want to call an update endpoint
             // OR relies on the trigger and then update.
             // For now, let's just update the local state. The backend trigger handles the row creation.
             // We might need a separate call to update role/institution if the trigger defaults them.
             
             // Let's try to update the profile immediately if we have extra data
             if (role || institution || occupation) {
                 try {
                     await api.put('/auth/update-profile', {
                         role,
                         institution,
                         occupation
                     });
                 } catch (e) {
                     console.warn("Failed to update extended profile on signup", e);
                 }
             }

             // Fetch final profile
             const response = await api.get('/auth/me');
             const fullUser = response.data.success ? response.data.user : user;

             set({
               user: fullUser,
               token,
               isAuthenticated: true,
               loading: false
             });
             
             return { success: true };
          } else {
              // Email confirmation required case
              return { success: true, message: "Please check your email to confirm your account." };
          }

        } catch (error) {
          return { success: false, message: error.message };
        }
      },

      // Logout function
      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('auth-storage');
      },

      // Update user state
      updateUser: (updatedUser) => {
        set((state) => ({
          user: { ...state.user, ...updatedUser }
        }));
      },

      // Initialize auth on app load
      initializeAuth: async () => {
        set({ loading: true });
        
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const token = session.access_token;
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
              set({ 
                user: response.data.user, 
                token, 
                isAuthenticated: true,
                loading: false 
              });
            }
          } catch (error) {
            console.error("Failed to refresh user data:", error);
            // If backend fails (e.g. 401), maybe clear session?
            // For now, keep session but maybe retry later.
            set({ loading: false });
          }
        } else {
            set({ 
                user: null, 
                token: null, 
                isAuthenticated: false,
                loading: false
            });
        }

        // Listen for changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const token = session.access_token;
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                // We could fetch profile here, but initializeAuth usually handles the initial load
                // and login/signup handle the explicit actions. 
                // This listener helps with token refreshes.
                if (get().token !== token) {
                    set({ token });
                }
            } else {
                set({ user: null, token: null, isAuthenticated: false });
                delete api.defaults.headers.common['Authorization'];
            }
        });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
