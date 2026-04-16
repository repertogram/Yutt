// ==================== МОДУЛЬ ПЕРЕКЛЮЧЕНИЯ ТЕМЫ (THEME.JS) ====================
// Скрипт реализует переключение между светлой и тёмной темой оформления.
// Выбор пользователя сохраняется в localStorage и восстанавливается при следующем посещении.

// Всё обёрнуто в самовызывающуюся функцию (IIFE) для изоляции переменных от глобальной области.
(function() {
    // ---------- 1. ПОЛУЧЕНИЕ КНОПКИ ПЕРЕКЛЮЧЕНИЯ ----------
    const themeToggle = document.getElementById('themeToggle'); // Находим кнопку по ID
    if (!themeToggle) return;  // Если кнопка отсутствует на странице — прекращаем выполнение

    // ---------- 2. ВОССТАНОВЛЕНИЕ СОХРАНЁННОЙ ТЕМЫ ИЗ LOCALSTORAGE ----------
    const savedTheme = localStorage.getItem('theme');  // Читаем значение по ключу 'theme'
    
    if (savedTheme === 'dark') {
        // Если сохранена тёмная тема, добавляем класс 'dark-theme' к body
        document.body.classList.add('dark-theme');
        // Меняем текст на кнопке на "Светлая" (пользователь может переключить обратно)
        themeToggle.textContent = '☀️ Светлая';
    } else {
        // Иначе (светлая тема или нет сохранения) убираем класс и ставим текст "Тёмная"
        document.body.classList.remove('dark-theme');
        themeToggle.textContent = '🌙 Тёмная';
    }

    // ---------- 3. ОБРАБОТЧИК КЛИКА ПО КНОПКЕ ----------
    themeToggle.addEventListener('click', () => {
        // Переключаем класс 'dark-theme' у body: добавляет, если нет; удаляет, если есть
        document.body.classList.toggle('dark-theme');
        
        // Проверяем, присутствует ли теперь класс (текущее состояние после переключения)
        const isDark = document.body.classList.contains('dark-theme');
        
        // Сохраняем выбор пользователя в localStorage:
        // если тёмная тема активна — записываем 'dark', иначе 'light'
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Обновляем текст на кнопке в зависимости от нового состояния
        themeToggle.textContent = isDark ? '☀️ Светлая' : '🌙 Тёмная';
    });
})();  // Завершение и немедленный вызов функции