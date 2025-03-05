import React, { createContext, useState, useContext, useCallback } from 'react';
import * as loginService from '../services/loginService';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [auth, setAuth] = useState(() => {
    const token = sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");
    return token ? { token } : null;
  });

  const login = async (username, password, rememberMe) => {
    try {
      const data = await loginService.login(username, password);
      console.log("authcontext : data " + JSON.stringify(data.accessToken));
      if (!data?.accessToken) throw new Error("Invalid token received");

      const decodedToken = jwtDecode(data.accessToken);
      console.log("decodedToken", decodedToken);
      setAuth(decodedToken);
      saveToken(data.accessToken, rememberMe);

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      const data = await loginService.register(username, password);
      if (!data?.accessToken) throw new Error("Invalid token received");

      setAuth(jwtDecode(data.accessToken));
      saveToken(data.accessToken);

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const saveToken = (token, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("jwtToken", token);
  };

  const clearToken = () => {
    localStorage.removeItem("jwtToken");
    sessionStorage.removeItem("jwtToken");
  };

  const logout = useCallback(() => {
    setAuth(null);
    clearToken();
  }, []);

  return (
      <AuthContext.Provider value={{ auth, login, register, logout }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
