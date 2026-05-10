import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import { Alert } from "react-native";
import {
  createUser,
  getUserById,
  loginWithEmail,
  changePassword,
  resetPassword,
} from "../services/user.service.js";
import {
  createEmailValidation,
  verifyEmailCode,
  createPasswordReset,
  verifyPasswordResetCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/email.service.js";
import * as StorageService from "../services/storage.service";
import { syncService } from "../services/sync.service";
import { auth as firebaseAuth } from "../firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

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
  organization?: {
    id: number;
    name: string;
    type: string;
    slogan?: string;
    logo_path?: string;
    address?: string;
    phone?: string;
    email?: string;
    rnc?: string;
    currency?: string;
    plan_type?: string;
    plan_hash?: string;
    join_code?: string;
    remote_id?: string;
  } | null;
  role?: 'admin' | 'employee';
  permissions?: Record<string, boolean>;
  remote_id?: string;
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
  // Validación de email
  requestEmailVerification: (userId: number, email: string) => Promise<{ code: string }>;
  verifyEmail: (userId: number, email: string, code: string) => Promise<void>;
  // Recuperación de contraseña
  requestPasswordReset: (email: string, fullName: string) => Promise<{ code: string }>;
  verifyPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
  joinOrganization: (joinCode: string) => Promise<void>;
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

  // Manejar el inicio/parada de la sincronización
  useEffect(() => {
    if (user && user.organization && user.organization.plan_type !== 'basic') {
      const orgId = user.organization.remote_id || user.organization.name || ""; 
      const planType = user.organization.plan_type || "basic";
      syncService.startSync(orgId, planType, user.id);
    } else {
      syncService.stopSync();
    }
  }, [user]);

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

      // Llamar al service que valida email y contraseña (Local SQLite)
      const userData = await loginWithEmail(email, password);

      if (userData) {
        // Intentar login en Firebase para sincronización
        try {
          await signInWithEmailAndPassword(firebaseAuth, email, password);
          console.log("✅ Firebase Auth exitoso");
        } catch (firebaseError) {
          console.warn("⚠️ Firebase Auth falló (modo offline o no registrado en nube):", firebaseError);
        }

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

      // Crear el usuario en la BD (Local)
      const userId = await createUser(userData);

      if (userData.email) {
        try {
          await createUserWithEmailAndPassword(firebaseAuth, userData.email, userData.password);
          console.log("✅ Firebase User creado");
        } catch (firebaseError) {
          console.warn("⚠️ No se pudo crear usuario en Firebase:", firebaseError);
        }
      }

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

      // Cerrar sesión en Firebase
      try {
        await signOut(firebaseAuth);
      } catch (e) {}

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

  // Solicitar verificación de correo electrónico
  const requestEmailVerification = async (userId: number, email: string) => {
    try {
      const user = await getUserById(userId);
      if (!user) throw new Error("Usuario no encontrado");

      const result = await createEmailValidation(userId, email);
      await sendVerificationEmail(email, user.full_name, result.code);
      
      // Mostrar alerta en DESARROLLO con el código
      console.log("🔐 CÓDIGO DE VALIDACIÓN (DESARROLLO):", result.code);
      Alert.alert(
        "📧 Código Enviado",
        `Tu código de validación es:\n\n${result.code}\n\n(Válido por 10 minutos)`,
        [{ text: "OK" }]
      );

      return { code: result.code };
    } catch (error) {
      console.error("❌ Error solicitando verificación:", error);
      throw error;
    }
  };

  // Verificar código de correo electrónico
  const verifyEmail = async (userId: number, email: string, code: string) => {
    try {
      await verifyEmailCode(userId, email, code);
      // Actualizar el usuario actual si es el mismo
      if (user?.id === userId) {
        const updatedUser = await getUserById(userId);
        if (updatedUser) setUser(updatedUser);
      }
      console.log("✅ Correo verificado correctamente");
    } catch (error) {
      console.error("❌ Error verificando correo:", error);
      throw error;
    }
  };

  // Solicitar recuperación de contraseña
  const requestPasswordReset = async (email: string, fullName: string) => {
    try {
      // Obtener el usuario por email
      const dbUser = await getUserById(0); // Necesitamos una función para obtener por email
      // Por ahora haremos una búsqueda directa en la BD

      const db = await (await import("../database/db.js")).getDb();
      const foundUser = await db.getFirstAsync(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (!foundUser) {
        throw new Error("Usuario no encontrado");
      }

      const result = await createPasswordReset(foundUser.id, email);
      await sendPasswordResetEmail(email, fullName, result.code);

      // Mostrar alerta en DESARROLLO con el código
      console.log("🔐 CÓDIGO DE RECUPERACIÓN (DESARROLLO):", result.code);
      Alert.alert(
        "📧 Código de Recuperación Enviado",
        `Tu código es:\n\n${result.code}\n\n(Válido por 15 minutos)`,
        [{ text: "OK" }]
      );

      return { code: result.code };
    } catch (error) {
      console.error("❌ Error solicitando reset:", error);
      throw error;
    }
  };

  // Verificar código y resetear contraseña
  const verifyPasswordReset = async (email: string, code: string, newPassword: string) => {
    try {
      const result = await verifyPasswordResetCode(email, code);
      await resetPassword(result.userId, newPassword);
      console.log("✅ Contraseña resetada correctamente");
    } catch (error) {
      console.error("❌ Error resetando contraseña:", error);
      throw error;
    }
  };

  // Función para unirse a una organización mediante código
  const joinOrganization = async (joinCode: string) => {
    try {
      setIsLoading(true);
      if (!user) throw new Error("Debe estar autenticado");

      // Llamar a nuestra API de Next.js
      const token = await firebaseAuth.currentUser?.getIdToken();
      const response = await fetch("https://api.kannicash.com/v1/org/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ joinCode })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al unirse");

      // Actualizar usuario localmente con la nueva organización
      const db = await (await import("../database/db.js")).getDb();
      
      // 1. Actualizar el organization_id del usuario actual
      await db.runAsync(
        "UPDATE users SET organization_id = (SELECT id FROM organizations WHERE user_id = ?) WHERE id = ?",
        [user.id, user.id]
      );

      // 2. Actualizar los datos de la organización
      await db.runAsync(
        "UPDATE organizations SET remote_id = ?, name = ?, plan_type = ? WHERE user_id = ?",
        [result.orgId, result.name, result.plan || 'standard', user.id]
      );

      await refreshUser();
      Alert.alert("¡Éxito!", `Te has unido a ${result.name}`);
    } catch (error: any) {
      console.error("❌ Error joining org:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
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
    requestEmailVerification,
    verifyEmail,
    requestPasswordReset,
    verifyPasswordReset,
    joinOrganization,
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
