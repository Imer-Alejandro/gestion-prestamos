/**
 * Datos de autenticación para el sistema
 * En producción, estos datos vendrían del backend
 */

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
  email: string;
}

// Usuarios de prueba del sistema
export const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    name: "Imer Alejandro",
    role: "Gestor operador",
    email: "admin@gestionprestamos.com",
  },
  {
    id: "2",
    username: "operador",
    password: "operador123",
    name: "María González",
    role: "Operador",
    email: "maria@gestionprestamos.com",
  },
  {
    id: "3",
    username: "gestor",
    password: "gestor123",
    name: "Carlos Ramírez",
    role: "Gestor",
    email: "carlos@gestionprestamos.com",
  },
];

/**
 * Valida las credenciales de un usuario
 * @param username Nombre de usuario
 * @param password Contraseña
 * @returns Usuario si las credenciales son correctas, null si no
 */
export const validateCredentials = (
  username: string,
  password: string
): User | null => {
  const user = mockUsers.find(
    (u) => u.username === username && u.password === password
  );
  return user || null;
};

/**
 * Obtiene un usuario por su username
 * @param username Nombre de usuario
 * @returns Usuario si existe, null si no
 */
export const getUserByUsername = (username: string): User | null => {
  const user = mockUsers.find((u) => u.username === username);
  return user || null;
};
