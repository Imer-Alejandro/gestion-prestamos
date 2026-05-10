import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PermissionGuard
 * Envoltorio para proteger elementos de la UI basados en los permisos del usuario.
 * El Administrador tiene acceso total por defecto.
 */
export default function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { user } = useAuth();

  // 1. Si no hay usuario, no mostrar nada
  if (!user) return <>{fallback}</>;

  // 2. El Administrador siempre tiene permiso
  if (user.role === 'admin') return <>{children}</>;

  // 3. Verificar permisos del empleado
  try {
    const userPermissions = user.permissions 
      ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions)
      : {};
    
    if (userPermissions[permission]) {
      return <>{children}</>;
    }
  } catch (error) {
    console.error("Error checking permissions in PermissionGuard:", error);
  }

  // 4. Si no tiene el permiso, retornar el fallback
  return <>{fallback}</>;
}
