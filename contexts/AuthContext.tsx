import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import {
  createUser,
  getUserById,
  loginWithEmail,
  changePassword,
} from "../services/user.service.js";
import * as StorageService from "../services/storage.service";

// Tipos de datos
export interface User {
  displayName: string;
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_login: string | null;
  is_active: number;
}

export interface RegisterData {
  full_name: string;
  email?: string;
  phone?: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserName: (newName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// Claves para SecureStore
const USER_ID_KEY = "user_id";

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider del contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Al iniciar la app, verificar si hay sesión guardada
  useEffect(() => {
    loadStoredSession();
  }, []);

  // Protección de rutas - redirigir según el estado de autenticación
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login";

    if (!user && !inAuthGroup) {
      // No está autenticado y está intentando acceder a rutas protegidas
      router.replace("/login");
    } else if (user && inAuthGroup) {
      // Ya está autenticado pero está en pantallas de login
      router.replace("/home");
    }
  }, [user, segments, isLoading, router]);

  // Cargar sesión guardada desde SecureStore
  const loadStoredSession = async () => {
    try {
      const storedUserId = await StorageService.getItemAsync(USER_ID_KEY);
      
      if (storedUserId) {
        // Recuperar los datos del usuario desde la BD
        const userData = await getUserById(parseInt(storedUserId));
        
        if (userData && userData.is_active === 1) {
          setUser(userData);
        } else {
          // Usuario inactivo o no existe, limpiar sesión
          await StorageService.deleteItemAsync(USER_ID_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading stored session:", error);
      await StorageService.deleteItemAsync(USER_ID_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Llamar al service que valida email y contraseña
      const userData = await loginWithEmail(email, password);
      
      if (userData) {
        // Guardar el ID del usuario en SecureStore
        await StorageService.setItemAsync(USER_ID_KEY, userData.id.toString());
        
        // Actualizar el estado
        setUser(userData);
        
        console.log("✅ Login exitoso:", userData.full_name);
      }
    } catch (error) {
      console.error("❌ Error en login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función de registro
  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      
      // Crear el usuario en la BD
      const userId = await createUser(userData);
      
      // Recuperar los datos completos del usuario
      const newUser = await getUserById(userId);
      
      if (newUser) {
        // Guardar la sesión
        await StorageService.setItemAsync(USER_ID_KEY, userId.toString());
        
        // Actualizar el estado
        setUser(newUser);
        
        console.log("✅ Registro exitoso:", newUser.full_name);
      }
    } catch (error) {
      console.error("❌ Error en registro:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      // Limpiar SecureStore
      await StorageService.deleteItemAsync(USER_ID_KEY);
      
      // Limpiar el estado
      setUser(null);
      
      console.log("✅ Logout exitoso");
      
      // Redirigir al login
      router.replace("/login");
    } catch (error) {
      console.error("❌ Error en logout:", error);
    }
  };

  // Refrescar datos del usuario
  const refreshUser = async () => {
    if (user) {
      try {
        const updatedUser = await getUserById(user.id);
        if (updatedUser) {
          setUser(updatedUser);
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    }
  };

  // Actualizar nombre del usuario
  const updateUserName = async (newName: string) => {
    if (!user) {
      throw new Error("No hay usuario autenticado");
    }

    try {
      const { updateUser } = await import("../services/user.service.js");
      
      await updateUser(user.id, {
        full_name: newName,
        phone: user.phone,
        is_active: user.is_active,
      });

      // Actualizar el estado local
      const updatedUser = await getUserById(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        console.log("✅ Nombre actualizado:", newName);
      }
    } catch (error) {
      console.error("❌ Error actualizando nombre:", error);
      throw error;
    }
  };

  // Cambiar contraseña del usuario
  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error("No hay usuario autenticado");
    }

    try {
      await changePassword(user.id, currentPassword, newPassword);
      console.log("✅ Contraseña actualizada correctamente");
    } catch (error) {
      console.error("❌ Error cambiando contraseña:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    updateUserName,
    changePassword: handleChangePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  
  return context;
}
