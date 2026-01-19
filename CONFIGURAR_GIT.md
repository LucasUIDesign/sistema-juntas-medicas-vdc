# 🔧 Configurar Git y GitHub para Trabajo Colaborativo

## ✅ Paso 1: Autenticarse con GitHub CLI

Acabamos de instalar GitHub CLI. Ahora necesitas autenticarte:

### 1.1 Cierra y vuelve a abrir Kiro
- Esto es necesario para que reconozca el comando `gh`

### 1.2 Ejecuta en la terminal de Kiro:
```bash
gh auth login
```

### 1.3 Sigue las instrucciones:
1. Selecciona: **GitHub.com**
2. Selecciona: **HTTPS**
3. Selecciona: **Login with a web browser**
4. Copia el código que te muestra
5. Presiona Enter (se abrirá el navegador)
6. Pega el código y autoriza

### 1.4 Verifica que funcionó:
```bash
gh auth status
```

Deberías ver: ✓ Logged in to github.com as SantiagoEBern

---

## 🚀 Paso 2: Hacer Push de tus Cambios

Una vez autenticado, ejecuta:

```bash
cd sistema-juntas-medicas-vdc
git push origin main
```

Ahora debería funcionar sin problemas.

---

## 📋 Flujo de Trabajo Colaborativo

### Cuando INICIES a trabajar:

```bash
# 1. Actualizar tu código con los cambios del equipo
git checkout main
git pull origin main

# 2. Crear tu rama de trabajo
git checkout -b tu-nombre-feature

# 3. Hacer tus cambios...
# (Kiro te ayudará con esto)

# 4. Guardar cambios
git add .
git commit -m "descripción de tus cambios"

# 5. Subir tu rama
git push origin tu-nombre-feature
```

### Cuando TERMINES una funcionalidad:

```bash
# 1. Asegúrate de estar en tu rama
git status

# 2. Actualiza main
git checkout main
git pull origin main

# 3. Vuelve a tu rama y mergea main
git checkout tu-nombre-feature
git merge main

# 4. Si hay conflictos, resuélvelos

# 5. Sube tus cambios
git push origin tu-nombre-feature

# 6. Crea un Pull Request en GitHub
# Ve a: https://github.com/LucasUIDesign/sistema-juntas-medicas-vdc
# Verás un botón "Compare & pull request"
```

---

## 🔄 Ver Cambios de tus Compañeros

### Opción 1: Actualizar tu main
```bash
git checkout main
git pull origin main
```

### Opción 2: Ver todas las ramas remotas
```bash
git fetch --all
git branch -a
```

### Opción 3: Ver cambios de una rama específica
```bash
git fetch origin
git log origin/rama-de-tu-amigo
```

---

## 🎯 Comandos Útiles

### Ver el estado actual:
```bash
git status
```

### Ver historial de commits:
```bash
git log --oneline -10
```

### Ver qué cambió en un archivo:
```bash
git diff archivo.ts
```

### Ver ramas:
```bash
git branch -a
```

### Cambiar de rama:
```bash
git checkout nombre-rama
```

### Descartar cambios locales:
```bash
git restore archivo.ts
```

---

## 🚨 Solución de Problemas

### Error: "Permission denied"
- Verifica que estés autenticado: `gh auth status`
- Re-autentica: `gh auth login`

### Error: "Merge conflict"
1. Abre los archivos en conflicto
2. Busca las marcas: `<<<<<<< HEAD`, `=======`, `>>>>>>>`
3. Edita manualmente para resolver
4. Guarda los archivos
5. `git add .`
6. `git commit -m "resolve conflicts"`

### Error: "Your branch is behind"
```bash
git pull origin main
```

---

## 📝 Buenas Prácticas

1. **Siempre trabaja en una rama**, nunca directamente en main
2. **Haz commits frecuentes** con mensajes descriptivos
3. **Actualiza main regularmente** para evitar conflictos grandes
4. **Comunica con tu equipo** antes de hacer cambios grandes
5. **Revisa los Pull Requests** de tus compañeros

---

## 🎓 Resumen del Flujo

```
TÚ                          GITHUB                      TU EQUIPO
│                              │                            │
├─ git pull ──────────────────>│                            │
│  (actualizar)                │                            │
│                              │                            │
├─ Hacer cambios               │                            │
│  (con ayuda de Kiro)         │                            │
│                              │                            │
├─ git commit                  │                            │
│  (guardar local)             │                            │
│                              │                            │
├─ git push ──────────────────>│                            │
│  (subir cambios)             │                            │
│                              │                            │
│                              │<──── git pull ─────────────┤
│                              │      (ellos ven tus        │
│                              │       cambios)             │
│                              │                            │
│                              │<──── git push ─────────────┤
│                              │      (ellos suben          │
│                              │       sus cambios)         │
│                              │                            │
├─ git pull ──────────────────>│                            │
│  (ves sus cambios)           │                            │
```

---

## ✅ Checklist de Configuración

- [ ] GitHub CLI instalado
- [ ] Autenticado con `gh auth login`
- [ ] Verificado con `gh auth status`
- [ ] Primer push exitoso
- [ ] Compañeros pueden ver tus cambios en GitHub
- [ ] Puedes ver cambios de tus compañeros con `git pull`

---

¡Listo! Ahora estás configurado para trabajar colaborativamente con tu equipo.
