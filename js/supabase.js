(function() {
    const SUPABASE_URL = 'https://uxbbgowyzhtaiuvjzuxh.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YmJnb3d5emh0YWl1dmp6dXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTE5OTAsImV4cCI6MjA5MjM2Nzk5MH0.Pc0PsZCmyJuMkEnJYqOTfYC18EpRMabsmJz0mktbpk0';

    // Ждём загрузку библиотеки Supabase
    function initSupabase() {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client готов');
            // Если нужно, можно вызвать событие готовности
            document.dispatchEvent(new Event('supabase-ready'));
        } else {
            setTimeout(initSupabase, 100);
        }
    }

    initSupabase();
})();