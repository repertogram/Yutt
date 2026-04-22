// ==================== ИНИЦИАЛИЗАЦИЯ КЛИЕНТА SUPABASE ====================
// Этот скрипт подключает наш сайт к облачной базе данных Supabase.
// Он создаёт объект supabaseClient, через который все остальные скрипты
// (data.js, admin.js и т.д.) будут общаться с БД.

// Самовызывающаяся функция – чтобы не засорять глобальную область видимости
// и сразу выполнить код при загрузке файла.
(function() {
    // URL нашего проекта в Supabase. Это адрес, по которому находятся наши таблицы.
    const SUPABASE_URL = 'https://uxbbgowyzhtaiuvjzuxh.supabase.co';
    
    // Публичный анонимный ключ (anon key). Он нужен для доступа к БД из браузера.
    // Этот ключ не секретный, его можно хранить в открытом виде.
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YmJnb3d5emh0YWl1dmp6dXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTE5OTAsImV4cCI6MjA5MjM2Nzk5MH0.Pc0PsZCmyJuMkEnJYqOTfYC18EpRMabsmJz0mktbpk0';

    /**
     * Функция initSupabase() – ждёт, пока загрузится библиотека Supabase
     * (она подключается в HTML через тег <script>), и как только библиотека готова,
     * создаёт клиент для работы с нашей БД.
     */
    function initSupabase() {
        // Проверяем, что библиотека Supabase загружена и доступна через window.supabase
        // и что у неё есть метод createClient.
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            // Создаём клиент и сохраняем его в глобальную переменную window.supabaseClient,
            // чтобы другие скрипты могли его использовать.
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // Выводим в консоль сообщение, что всё готово – для отладки.
            console.log('✅ Supabase client готов');
            
            // Генерируем пользовательское событие 'supabase-ready' на случай,
            // если кому-то нужно дождаться готовности клиента.
            document.dispatchEvent(new Event('supabase-ready'));
        } else {
            // Если библиотека ещё не загрузилась, ждём 100 миллисекунд
            // и пробуем снова (рекурсивный вызов через setTimeout).
            setTimeout(initSupabase, 100);
        }
    }

    // Запускаем процесс инициализации – начинаем ждать библиотеку.
    initSupabase();
})();