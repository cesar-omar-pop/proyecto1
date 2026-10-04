// Manejador de clics en las notificaciones
self.addEventListener('notificationclick', e => {
  const notification = e.notification;
  console.log('Notificación presionada:', notification);
  notification.close();

  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('./');
    })
  );
});