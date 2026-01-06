import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { supabase } from '../services/supabaseClient';

// Track if auth listener is already registered to prevent duplicates
let authListenerRegistered = false;

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
              redirectTo: `${window.location.origin}/app`,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
              skipBrowserRedirect: false
            }
          });

          if (error) {
            throw error;
          }

          // The redirect will happen automatically
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
                     // Silent fail - profile will be updated later
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

        try {
          // First, check if we're handling an OAuth callback
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const queryParams = new URLSearchParams(window.location.search);

          if (hashParams.has('access_token') || queryParams.has('code')) {
            // Give Supabase a moment to process the callback
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          // Check current session
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false
            });
            return;
          }

          if (session) {
            const token = session.access_token;
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Retry logic for fetching user profile (in case trigger is slow)
            const maxRetries = 3;
            let attempt = 0;
            let success = false;

            while (attempt < maxRetries && !success) {
              try {
                attempt++;

                const response = await api.get('/auth/me');
                if (response.data.success) {
                  set({
                    user: response.data.user,
                    token,
                    isAuthenticated: true,
                    loading: false
                  });
                  success = true;
                } else {
                  throw new Error('Backend returned success: false');
                }
              } catch (error) {
                // If it's a 404 and we have retries left, wait and try again (trigger might be slow)
                if (error.response?.status === 404 && attempt < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  continue;
                }

                // If backend fails with 401 or we're out of retries, clear the session
                if (error.response?.status === 401 || attempt >= maxRetries) {
                  await supabase.auth.signOut();
                  set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    loading: false
                  });
                  success = true; // Exit loop
                }
              }
            }
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false
            });
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false
          });
        }

        // Listen for auth state changes (only register once)
        if (!authListenerRegistered) {
          authListenerRegistered = true;
          supabase.auth.onAuthStateChange(async (event, session) => {

            if (event === 'SIGNED_IN' && session) {
            const token = session.access_token;
            const supabaseUser = session.user;
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            try {
              // Try to get full profile from backend
              const response = await api.get('/auth/me');
              if (response.data.success) {
                set({
                  user: response.data.user,
                  token,
                  isAuthenticated: true,
                  loading: false
                });
              } else {
                // Fallback to Supabase user data
                set({
                  user: supabaseUser,
                  token,
                  isAuthenticated: true,
                  loading: false
                });
              }
            } catch (error) {
              // Fallback to Supabase user data
              set({
                user: supabaseUser,
                token,
                isAuthenticated: true,
                loading: false
              });
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, token: null, isAuthenticated: false, loading: false });
            delete api.defaults.headers.common['Authorization'];
          } else if (event === 'TOKEN_REFRESHED' && session) {
            const token = session.access_token;
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            set({ token });
          } else if (event === 'USER_UPDATED' && session) {
            const token = session.access_token;
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
              const response = await api.get('/auth/me');
              if (response.data.success) {
                set({
                  user: response.data.user,
                  token,
                  isAuthenticated: true
                });
              }
            } catch (error) {
              // Silent fail - user will see error on next action
            }
          }
          });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
