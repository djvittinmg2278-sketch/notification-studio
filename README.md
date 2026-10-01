# Notification Studio — notificações nativas

Esta versão usa `ServiceWorkerRegistration.showNotification()` para criar uma notificação no sistema do iPhone quando o PWA tem permissão.

## iPhone
1. Publique em HTTPS.
2. Abra no Safari.
3. Compartilhar → Adicionar à Tela de Início.
4. Abra pelo ícone instalado.
5. Toque em **Ativar** e permita notificações.
6. Toque em **Disparar no iPhone**.

As notificações são cenográficas e não têm integração com bancos, Pix ou instituições financeiras.

O evento `push` do Service Worker também está preparado para Web Push remoto. Para disparos quando o app estiver fechado, será necessário um backend de Push/VAPID.
