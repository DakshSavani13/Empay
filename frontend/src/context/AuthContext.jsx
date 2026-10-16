import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('empay_user');
    if (api.token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);

        // Validate token in background
        api.getMe().then(res => {
          if (res.success && res.data) {
            const freshUser = {
              _id: res.data._id,
              name: res.data.name,
              email: res.data.email,
              role: res.data.role,
              employeeId: res.data.employeeId
            };
            localStorage.setItem('empay_user', JSON.stringify(freshUser));
            setUser(freshUser);
          }
        }).catch(() => {
          logout();
        }).finally(() => setLoading(false));
      } catch (e) {
        console.error('Invalid user data', e);
        api.clearToken();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await api.login(email, password);
    if (response.success) {
      api.setToken(response.data.token);
      localStorage.setItem('empay_user', JSON.stringify(response.data));
      setUser(response.data);
    }
    return response;
  };

  const signup = async (data) => {
    const response = await api.signup(data);
    return response;
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
