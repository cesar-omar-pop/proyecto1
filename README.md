# Inventario PWA

Aplicación Web Progresiva de inventario hecha con HTML, CSS y JavaScript sin frameworks. Permite crear, consultar, buscar, editar y eliminar productos. Los datos se guardan en IndexedDB, por lo que siguen disponibles sin conexión después de cargar la aplicación una primera vez.

## Funcionalidades técnicas
- `manifest.json`: metadatos, colores, modo standalone e iconos PNG de 192×192 y 512×512.
- App Shell responsiva con renderizado del lado del cliente (CSR).
- `sw.js`: precaché del App Shell, estrategia cache-first para recursos y fallback offline para navegación.
- IndexedDB: almacenamiento persistente asíncrono de productos y fotos pequeñas.
- Web APIs: geolocalización, notificaciones del navegador y selección/captura de fotografía mediante `input type=file` con `capture`.
- Prompt de instalación cuando el navegador emite `beforeinstallprompt`.

## Ejecutar localmente
No abras `index.html` directamente con `file://`. Desde una terminal, dentro de esta carpeta, ejecuta:

### Opción Python
```bash
python -m http.server 8080
```
Abre `http://localhost:8080`.

### Opción Node.js
```bash
npx serve .
```

Service Worker, instalación y APIs sensibles requieren `localhost` o HTTPS. La geolocalización y las notificaciones solicitan permiso al usuario.

## Despliegue HTTPS
1. Sube el contenido de la carpeta `PWA` a un repositorio GitHub.
2. En Netlify, importa el repositorio y publica la carpeta raíz (`/`). No se necesita comando de build.
3. Verifica que la URL publicada use HTTPS.
4. Prueba instalación desde un navegador compatible y prueba el modo offline desde DevTools → Application → Service Workers / Cache Storage.

## Versionamiento Git
```bash
git init
git add .
git commit -m "feat: crear estructura inicial de Inventario PWA"
git add .
git commit -m "feat: agregar IndexedDB y operaciones CRUD"
git add .
git commit -m "feat: implementar Service Worker y modo offline"
git add .
git commit -m "feat: integrar geolocalización, notificaciones e instalación"
```
Estos comandos crean commits reales conforme los ejecutes; no simulan un historial ya existente.

## Consideraciones
- Los datos se almacenan en el navegador y dispositivo actuales; no se sincronizan automáticamente con otros dispositivos.
- La geolocalización muestra coordenadas localmente y no las envía a un servidor.
- Para mantener un almacenamiento confiable, usa imágenes menores de 2 MB.
- Las notificaciones implementadas son locales; las notificaciones push remotas requieren backend y suscripción Push API adicional.
