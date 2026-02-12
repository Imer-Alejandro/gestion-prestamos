# 🧪 GUÍA DE PRUEBA - Sistema de Autenticación

## 🚀 Cómo Probar el Sistema

### **Opción 1: Usuario de Prueba Automático (Recomendado)**

1. **Iniciar la aplicación:**
   ```bash
   pnpm start
   # o
   npx expo start
   ```

2. **El sistema creará automáticamente un usuario de prueba:**
   - **Email:** test@example.com
   - **Contraseña:** `test123`
   - **Nombre:** Usuario de Prueba

3. **Ir a la pantalla de Login:**
   - Ingresa la contraseña: `test123`
   - Presiona "iniciar"
   - Deberías ser redirigido a `/home` ✅

4. **Verificar persistencia:**
   - Cierra la app completamente
   - Vuelve a abrirla
   - Deberías estar aún logueado ✅

5. **Probar logout:**
   - En `/home`, abre el menú lateral (hamburguesa)
   - Presiona "Cerrar sesión"
   - Deberías volver a `/login` ✅

---

### **Opción 2: Registrar un Nuevo Usuario**

1. **Ir a Registro:**
   - Desde `/login`, presiona "registrarse"
   - Selecciona "Organización"

2. **Paso 1 - Datos de Organización:**
   - Nombre organización: "Mi Empresa"
   - Tipo: Selecciona uno (Prestamistas/Comercios/Venta a crédito)
   - Presiona "continuar"

3. **Paso 2 - Completar Información:**
   - Representante: "Juan Pérez"
   - Correo: "juan@example.com"
   - Teléfono: "8091234567"
   - Nueva contraseña: "mipassword123"
   - Repetir contraseña: "mipassword123"
   - Presiona "continuar"

4. **Resultado:**
   - Usuario creado en la BD ✅
   - Sesión guardada automáticamente ✅
   - Redirigido a `/home` ✅

---

## 📋 Checklist de Funcionalidades

### ✅ **Registro**
- [ ] Pantalla de tipo de registro (/login/registro)
- [ ] Formulario de organización (/login/registro-organizacion)
- [ ] Formulario completo (/login/completar-informacion)
- [ ] Validación de email
- [ ] Validación de contraseña (mínimo 6 caracteres)
- [ ] Contraseñas coinciden
- [ ] Usuario se guarda en SQLite
- [ ] Usuario se loguea automáticamente
- [ ] Redirige a /home

### ✅ **Login**
- [ ] Campo de contraseña
- [ ] Toggle mostrar/ocultar contraseña
- [ ] Checkbox "Guardar inicio de sesión"
- [ ] Validación de contraseña
- [ ] Usuario encontrado en BD
- [ ] Sesión guardada en storage
- [ ] Redirige a /home
- [ ] Mensaje de error si contraseña incorrecta

### ✅ **Persistencia**
- [ ] Sesión guardada al cerrar app
- [ ] Sesión cargada al abrir app
- [ ] Usuario permanece logueado
- [ ] Datos del usuario disponibles globalmente

### ✅ **Home**
- [ ] Muestra nombre del usuario
- [ ] Menu lateral funciona
- [ ] Datos del usuario disponibles

### ✅ **Logout**
- [ ] Botón "Cerrar sesión" en drawer
- [ ] Confirmación de logout
- [ ] Limpia storage
- [ ] Limpia estado global
- [ ] Redirige a /login

### ✅ **Protección de Rutas**
- [ ] Sin autenticación → redirige a /login
- [ ] Con autenticación + /login → redirige a /home
- [ ] Con autenticación + /home → acceso permitido

---

## 🔍 Verificar en Consola

Busca estos logs en la consola de Metro:

```
✅ Base de datos inicializada
✅ Usuario de prueba creado:
   Nombre: Usuario de Prueba
   Email: test@example.com
   Contraseña: test123
   ID: 1

// Al hacer login:
✅ Login exitoso: Usuario de Prueba

// Al hacer logout:
✅ Logout exitoso
```

---

## 🐛 Solución de Problemas

### **Problema: "No existe usuario registrado"**
**Solución:**
- Verifica que la BD esté inicializada
- Mira los logs en consola
- Si el usuario de prueba no se creó, créalo manualmente

### **Problema: "Contraseña incorrecta"**
**Solución:**
- Para el usuario de prueba, usa: `test123`
- Si registraste un usuario nuevo, usa la contraseña que pusiste
- Verifica que no haya espacios extra

### **Problema: "La app no redirige al login"**
**Solución:**
- Revisa que AuthProvider esté en _layout.tsx
- Verifica que el usuario tenga is_active = 1
- Limpia el storage y reinicia

### **Problema: "No mantiene la sesión"**
**Solución:**
- Verifica que expo-secure-store esté instalado o AsyncStorage
- Mira los logs de error en consola
- Prueba reinstalar las dependencias:
  ```bash
  pnpm install
  ```

---

## 🎯 Escenarios de Prueba Recomendados

### **Escenario 1: Flujo Completo de Registro**
1. Abrir app → debe ir a index
2. Ir a registro
3. Completar formulario de organización
4. Completar información personal
5. Verificar que va a /home
6. Verificar que muestra el nombre correcto
7. Cerrar y reabrir app → debe seguir logueado

### **Escenario 2: Login con Usuario Existente**
1. Si ya hay usuario, hacer logout
2. Ir a /login
3. Ingresar contraseña correcta
4. Verificar acceso a /home
5. Cerrar app
6. Reabrir app → debe seguir logueado

### **Escenario 3: Contraseña Incorrecta**
1. Ir a /login
2. Ingresar contraseña incorrecta
3. Debe mostrar error
4. No debe dejar acceder
5. Ingresar contraseña correcta
6. Debe permitir acceso

### **Escenario 4: Protección de Rutas**
1. Hacer logout
2. Intentar navegar a /home manualmente
3. Debe redirigir a /login
4. Hacer login
5. Intentar ir a /login manualmente
6. Debe redirigir a /home

---

## 📱 Prueba en Dispositivo Físico

1. **Escanea el QR con Expo Go**
2. **Primera vez:**
   - Debe crear el usuario de prueba
   - Login con: `test123`
3. **Cerrar Expo Go completamente**
4. **Volver a abrir**
   - Debe seguir logueado ✅

---

## 🎉 Si Todo Funciona...

¡Felicidades! El sistema de autenticación está funcionando correctamente:

✅ Base de datos SQLite funcionando
✅ Registro de usuarios funcional
✅ Login con validación
✅ Persistencia de sesión
✅ Protección de rutas automática
✅ Context API configurado
✅ Logout funcional

**Siguiente paso:** Empezar a construir las funcionalidades de gestión de préstamos usando el usuario logueado.

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa la consola de errores
2. Verifica los logs de autenticación
3. Asegúrate de tener todas las dependencias instaladas
4. Revisa el archivo AUTH_IMPLEMENTATION.md para más detalles

**¡Éxito con tu proyecto! 🚀**
