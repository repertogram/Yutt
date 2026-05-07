(function() {
    // Функция, которая показывает или скрывает предупреждение
    function updateOnlineStatus() {
        if (navigator.onLine) {
            // Интернет есть – если висело предупреждение, убираем его
            // (просто скрываем все уведомления, можно не заморачиваться)
            // Но showNotification создаёт новые, а мы не можем удалить конкретное.
            // Поэтому используем отдельный элемент, чтобы не мешать основным уведомлениям.
            const offlineBanner = document.getElementById('offline-banner');
            if (offlineBanner) offlineBanner.style.display = 'none';
        } else {
            // Интернета нет – показываем баннер
            let banner = document.getElementById('offline-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'offline-banner';
                banner.style.cssText = `
                    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                    background: #f39c12; color: white; padding: 12px 24px;
                    border-radius: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    z-index: 99999; font-weight: bold; text-align: center;
                    white-space: nowrap;
                `;
                banner.textContent = '⚠️ Нет подключения к интернету.';
                document.body.appendChild(banner);
            }
            banner.style.display = 'block';
        }
    }

    // Проверяем сразу при загрузке
    updateOnlineStatus();

    // Слушаем изменения состояния сети
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
})();