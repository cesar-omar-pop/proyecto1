const DB_NAME = "inventario-pwa-db";
const DB_VERSION = 1;
const STORE = "products";
let db;
let deferredInstallPrompt = null;
let currentPhotoData = "";
let toastTimer;

const $ = id => document.getElementById(id);
const form = $("productForm");

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("Este navegador no soporta IndexedDB."));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("name", "name", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function storeTransaction(mode = "readonly") {
  return db.transaction(STORE, mode).objectStore(STORE);
}
function getAllProducts() {
  return new Promise((resolve, reject) => {
    const request = storeTransaction().getAll();
    request.onsuccess = () => resolve(request.result.sort((a,b) => b.updatedAt - a.updatedAt));
    request.onerror = () => reject(request.error);
  });
}
function saveProduct(product) {
  return new Promise((resolve, reject) => {
    const request = storeTransaction("readwrite").put(product);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function deleteProduct(id) {
  return new Promise((resolve, reject) => {
    const request = storeTransaction("readwrite").delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
function money(value) {
  return new Intl.NumberFormat("es-MX", {style:"currency",currency:"MXN"}).format(Number(value) || 0);
}
function showToast(message) {
  const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
async function renderProducts() {
  const products = await getAllProducts();
  const query = $("search").value.trim().toLocaleLowerCase("es-MX");
  const filtered = products.filter(p => `${p.name} ${p.category || ""} ${p.description || ""}`.toLocaleLowerCase("es-MX").includes(query));
  $("totalProducts").textContent = products.length;
  $("totalStock").textContent = products.reduce((sum,p) => sum + Number(p.stock || 0), 0);
  $("lowStock").textContent = products.filter(p => Number(p.stock) <= 3).length;
  $("resultCount").textContent = `${filtered.length} ${filtered.length === 1 ? "producto" : "productos"}`;
  $("emptyState").hidden = filtered.length !== 0;
  $("productList").innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-main">
        ${p.photo ? `<img class="product-photo" src="${p.photo}" alt="Foto de ${escapeHTML(p.name)}">` : `<div class="product-photo product-placeholder" aria-hidden="true">▦</div>`}
        <div>
          <h3>${escapeHTML(p.name)}</h3>
          <p>${escapeHTML(p.category || "Sin categoría")} · ${escapeHTML(p.description || "Sin descripción")}</p>
          <div class="product-meta"><span class="pill">${money(p.price)}</span><span class="pill ${Number(p.stock) <= 3 ? "low" : ""}">Stock: ${Number(p.stock)}</span></div>
        </div>
      </div>
      <div class="product-actions"><button class="small-button" data-edit="${p.id}">Editar</button><button class="small-button delete" data-delete="${p.id}">Eliminar</button></div>
    </article>`).join("");
}
function resetForm() {
  form.reset(); $("productId").value = ""; currentPhotoData = "";
  $("formTitle").textContent = "Agregar producto"; $("saveBtn").textContent = "Guardar producto";
  $("cancelEdit").hidden = true; $("formMessage").textContent = "";
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const id = $("productId").value;
  const product = {
    name: $("name").value.trim(), category: $("category").value.trim(),
    price: Number($("price").value), stock: Number($("stock").value),
    description: $("description").value.trim(), updatedAt: Date.now()
  };
  if (currentPhotoData) product.photo = currentPhotoData;
  else if (id) {
    const old = (await getAllProducts()).find(p => p.id === Number(id));
    if (old?.photo) product.photo = old.photo;
  }
  if (id) product.id = Number(id);
  try {
    await saveProduct(product); resetForm(); await renderProducts();
    showToast(id ? "Producto actualizado." : "Producto guardado en este dispositivo.");
  } catch (error) {
    console.error(error); $("formMessage").textContent = "No se pudo guardar. Si agregaste una foto muy grande, intenta con una imagen más pequeña.";
  }
});
$("photo").addEventListener("change", event => {
  const file = event.target.files?.[0]; if (!file) return;
  if (!file.type.startsWith("image/")) { showToast("Selecciona un archivo de imagen."); return; }
  if (file.size > 2 * 1024 * 1024) { showToast("La foto debe pesar menos de 2 MB."); event.target.value = ""; return; }
  const reader = new FileReader();
  reader.onload = () => { currentPhotoData = reader.result; };
  reader.readAsDataURL(file);
});
$("productList").addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const product = (await getAllProducts()).find(p => p.id === Number(editButton.dataset.edit));
    if (!product) return;
    $("productId").value = product.id; $("name").value = product.name; $("category").value = product.category || "";
    $("price").value = product.price; $("stock").value = product.stock; $("description").value = product.description || "";
    currentPhotoData = product.photo || ""; $("formTitle").textContent = "Editar producto";
    $("saveBtn").textContent = "Guardar cambios"; $("cancelEdit").hidden = false;
    form.scrollIntoView({behavior:"smooth",block:"start"});
  }
  if (deleteButton) {
    const id = Number(deleteButton.dataset.delete);
    if (confirm("¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.")) {
      await deleteProduct(id); await renderProducts(); showToast("Producto eliminado.");
    }
  }
});
$("cancelEdit").addEventListener("click", resetForm);
$("search").addEventListener("input", renderProducts);

function updateConnectionStatus() {
  const status = $("connectionStatus");
  status.textContent = navigator.onLine ? "En línea" : "Modo sin conexión";
  status.classList.toggle("offline", !navigator.onLine);
}
window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault(); deferredInstallPrompt = event; $("installBtn").hidden = false;
});
$("installBtn").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null; $("installBtn").hidden = true;
});
window.addEventListener("appinstalled", () => showToast("¡Aplicación instalada!"));

$("locationBtn").addEventListener("click", () => {
  if (!("geolocation" in navigator)) return showToast("Tu navegador no ofrece geolocalización.");
  $("locationText").textContent = "Solicitando permiso de ubicación…";
  navigator.geolocation.getCurrentPosition(position => {
    const {latitude, longitude, accuracy} = position.coords;
    $("locationText").textContent = `Ubicación obtenida: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (precisión aprox. ${Math.round(accuracy)} m).`;
    showToast("Ubicación obtenida. No se envió a ningún servidor.");
  }, error => {
    $("locationText").textContent = error.code === 1 ? "Permiso de ubicación denegado." : "No fue posible obtener la ubicación.";
  }, {enableHighAccuracy:true, timeout:10000, maximumAge:60000});
});
$("notifyBtn").addEventListener("click", async () => {
  if (!("Notification" in window)) return showToast("Este navegador no soporta notificaciones.");
  if (!("serviceWorker" in navigator)) return showToast("Se necesita un Service Worker para las notificaciones.");
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return showToast("No se concedió permiso para notificaciones.");
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Inventario PWA", {
      body: "Las notificaciones están activadas en este dispositivo.",
      icon: "./icons/icon-192.png", badge: "./icons/icon-192.png"
    });
  } catch (error) { console.error(error); showToast("No se pudo mostrar la notificación."); }
});

async function startApp() {
  updateConnectionStatus();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    try { await navigator.serviceWorker.register("./sw.js"); }
    catch (error) { console.error("Error registrando Service Worker:", error); }
  }
  try { db = await openDatabase(); await renderProducts(); }
  catch (error) {
    console.error(error);
    $("formMessage").textContent = "No fue posible iniciar la base de datos local. Usa un navegador actualizado y abre la app mediante localhost o HTTPS.";
  }
}
startApp();