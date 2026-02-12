# 🔐 Sistema de Autenticación - Gestión de Préstamos

## ✅ Implementación Completada

Se ha implementado un sistema completo de autenticación con persistencia de sesión para tu aplicación de gestión de préstamos.

---

## 📦 Archivos Creados/Modificados

### **Nuevos Archivos:**
- `contexts/AuthContext.tsx` - Context de autenticación global
- `hooks/useAuth.ts` - Hook personalizado para acceder al auth
- `services/storage.service.ts` - Servicio de almacenamiento seguro

### **Archivos Modificados:**
- `database/db.js` - Agregada función `getDb()` 
- `app/_layout.tsx` - Inicializa BD y AuthProvider
- `app/login/index.tsx` - Conectado con AuthContext
- `app/login/completar-informacion.tsx` - Guarda usuarios en BD
- `app/home/index.tsx` - Muestra usuario logueado
- `components/home/DrawerMenu.tsx` - Función de logout

---

## 🚀 Cómo Funciona

### **1. Registro de Usuario**
```typescript
// El usuario completa el formulario en:
// /login/registro-organizacion → /login/completar-informacion

// Los datos se guardan en la tabla users de SQLite:
{
  full_name: "Juan Pérez",
  email: "juan@example.com",
  phone: "+18091234567",
  password_hash: "SHA256_HASH",
  created_at: "2026-02-11T...",
  is_active: 1
}

// Automáticamente se loguea y guarda la sesión
```

### **2. Login**
```typescript
// El usuario ingresa su contraseña en /login/index
await login(password);

// Se valida contra la BD
// Se guarda el user_id en SecureStore/AsyncStorage
// Se actualiza el estado global
// Se redirige automáticamente a /home
```

### **3. Persistencia de Sesión**
```typescript
// Al abrir la app:
1. AuthProvider se inicializa
2. Busca user_id en storage
3. Si existe, carga los datos del usuario desde BD
4. El usuario permanece logueado

// No necesita reloguearse cada vez
```

### **4. Protección de Rutas**
```typescript
// AuthContext monitorea las rutas automáticamente:

❌ Sin autenticación + /home → Redirect a /login
✅ Con autenticación + /login → Redirect a /home
✅ Con autenticación + /home → Acceso permitido
```

### **5. Logout**
```typescript
// Desde el DrawerMenu:
await logout();

// Limpia el storage
// Limpia el estado
// Redirige a /login
```

---

## 💻 Uso en Código

### **Acceder al usuario actual:**
```typescript
import { useAuth } from "@/hooks/useAuth";

export default function MiComponente() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <View>
      <Text>Hola {user?.full_name}</Text>
      <Text>Email: {user?.email}</Text>
    </View>
  );
}
```

### **Hacer login programáticamente:**
```typescript
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login(password);
      // Redirige automáticamente
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };
}
```

### **Registrar nuevo usuario:**
```typescript
import { useAuth } from "@/hooks/useAuth";

export default function RegistroScreen() {
  const { register } = useAuth();
  
  const handleRegister = async () => {
    try {
      await register({
        full_name: "Juan Pérez",
        email: "juan@example.com",
        phone: "+18091234567",
        password: "mipassword123"
      });
      // Loguea automáticamente y redirige
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };
}
```

---

## 🗄️ Base de Datos

### **Tabla users:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  password_hash TEXT NOT NULL,  -- SHA256
  pin_hash TEXT,
  created_at TEXT NOT NULL,
  last_login TEXT,
  is_active INTEGER DEFAULT 1
);
```

### **Inicialización:**
La base de datos se inicializa automáticamente al abrir la app en `_layout.tsx`.

---

## 🔒 Seguridad

### **Contraseñas:**
- Hasheadas con SHA256 usando expo-crypto
- Nunca se guardan en texto plano

### **Sesión:**
- Se usa expo-secure-store (encriptado en hardware)
- Fallback a AsyncStorage si no está disponible
- Solo se guarda el `user_id`, no datos sensibles

### **Validaciones:**
- Email válido
- Contraseña mínimo 6 caracteres
- Usuario debe estar activo (is_active = 1)

---

## 📱 Flujo Completo de Usuario

```
1. Usuario abre la app
   └─> AuthContext verifica sesión guardada
       ├─> Si existe: Carga usuario y va a /home
       └─> Si no existe: Muestra pantalla inicial

2. Usuario va a Registrarse
   └─> /login/registro
   └─> /login/registro-organizacion (datos básicos)
   └─> /login/completar-informacion (datos completos + contraseña)
       └─> AuthContext.register()
           ├─> Crea usuario en BD
           ├─> Guarda sesión
           └─> Redirige a /home ✅

3. Usuario hace Login
   └─> /login/index
   └─> Ingresa contraseña
       └─> AuthContext.login()
           ├─> Valida en BD
           ├─> Guarda sesión
           └─> Redirige a /home ✅

4. Usuario usa la app
   └─> /home - Muestra nombre del usuario
   └─> Cualquier pantalla tiene acceso a: user, isAuthenticated
   └─> Rutas protegidas automáticamente

5. Usuario hace Logout
   └─> DrawerMenu > Cerrar sesión
       └─> AuthContext.logout()
           ├─> Limpia storage
           ├─> Limpia estado
           └─> Redirige a /login ✅
```

---

## 🎯 Próximos Pasos (Opcional)

1. **Agregar PIN de 4 dígitos:**
   - Modificar `user.service.js` para manejar `pin_hash`
   - Crear pantalla de login con PIN
   - Validar PIN en lugar de contraseña

2. **Sistema de roles:**
   - Agregar campo `role` en tabla users
   - Implementar permisos por rol
   - Proteger rutas según rol

3. **Refresh token:**
   - Implementar expiración de sesión
   - Renovar token automáticamente

4. **Biometría:**
   - Usar expo-local-authentication
   - Login con huella/Face ID

5. **Multi-usuario:**
   - Permitir múltiples cuentas en el dispositivo
   - Cambiar de cuenta sin cerrar sesión

---

## 🐛 Debugging

### **Ver logs de auth:**
Los logs aparecen en la consola de Metro:
```
✅ Base de datos inicializada
✅ Login exitoso: Juan Pérez
✅ Logout exitoso
❌ Error en login: Contraseña incorrecta
```

### **Inspeccionar BD:**
```bash
# Ubicación de la BD SQLite:
# Android: /data/data/<package>/databases/loan_manager.db
# iOS: ~/Library/Developer/CoreSimulator/.../Documents/SQLExpo/loan_manager.db

# Puedes usar:
npx expo-sqlite-viewer
```

---

## ✅ Testing

### **Probar registro:**
1. Abrir app
2. Ir a Registro
3. Completar formulario
4. Verificar que se crea el usuario en BD
5. Verificar redirección a /home
6. Cerrar y reabrir app → debe mantener sesión

### **Probar login:**
1. Hacer logout
2. Volver a /login
3. Ingresar contraseña
4. Verificar acceso a /home

### **Probar persistencia:**
1. Loguearse
2. Cerrar app completamente
3. Reabrir app
4. Debe estar aún logueado

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que la BD esté inicializada (ver logs)
2. Revisa que expo-crypto esté instalado
3. Asegúrate de tener un usuario creado en la BD
4. Verifica los logs de errores en la consola

---

**¡Sistema de autenticación implementado exitosamente! 🎉**
