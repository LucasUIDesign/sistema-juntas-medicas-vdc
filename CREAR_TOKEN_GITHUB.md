# 🔑 Crear Personal Access Token de GitHub

## Problema Actual
Git no puede hacer push porque las credenciales no están sincronizadas correctamente.

## ✅ Solución: Crear un Personal Access Token

### Paso 1: Crear el Token

1. Ve a: https://github.com/settings/tokens
2. Haz clic en **"Generate new token"** → **"Generate new token (classic)"**
3. Dale un nombre: `Kiro - Sistema Juntas Médicas`
4. Selecciona el alcance: **`repo`** (marca toda la sección)
5. Haz clic en **"Generate token"**
6. **COPIA EL TOKEN** (solo se muestra una vez)

### Paso 2: Usar el Token

Ejecuta en la terminal de Kiro:

```bash
git remote set-url origin https://SantiagoEBern:TU_TOKEN_AQUI@github.com/LucasUIDesign/sistema-juntas-medicas-vdc.git
```

Reemplaza `TU_TOKEN_AQUI` con el token que copiaste.

### Paso 3: Hacer Push

```bash
git push origin main
```

Ahora debería funcionar sin problemas.

---

## 🔄 Alternativa Más Rápida

Si no quieres crear un token, pídele a LucasUIDesign que haga el merge desde su PC:

1. Comparte tus cambios con él
2. Él puede hacer:
   ```bash
   git remote add santiago-local /ruta/a/tu/repo
   git fetch santiago-local
   git merge santiago-local/rama-santiago
   git push origin main
   ```

---

## ✅ Verificar que Funcionó

Después del push, ve a:
https://github.com/LucasUIDesign/sistema-juntas-medicas-vdc/commits/main

Deberías ver tus 3 commits:
1. feat: agregar selector de médico evaluador...
2. fix: cargar turnos desde base de datos...
3. docs: agregar guía de configuración de Turso...

---

## 🎯 Una Vez Configurado

Después de esto, el flujo será simple:

```bash
# Hacer cambios
git add .
git commit -m "descripción"
git push origin rama-santiago

# Crear Pull Request
gh pr create --title "Título" --body "Descripción"
```

¡Y listo! Tus compañeros verán tus cambios en GitHub.
