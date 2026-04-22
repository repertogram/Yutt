// ==================== МОДУЛЬ КАТАЛОГА ТОВАРОВ ====================
// Отвечает за отрисовку сетки товаров с фильтрацией по категориям.
// Данные о товарах берутся из глобального массива products (data.js).

/**
 * Глобальная переменная, хранящая текущий выбранный фильтр категории.
 * По умолчанию 'all' — показаны все товары.
 * @type {string}
 */
var currentFilter = 'all';

/**
 * Внутренняя функция отрисовки каталога с учётом заданного фильтра.
 * Формирует HTML-карточки для товаров и вставляет их в контейнер #catalog-products.
 * @param {string} [filter='all'] - Ключ категории для фильтрации ('all', 'soft', 'bedroom' и т.д.)
 */
function renderCatalogInternal(filter = 'all') {
    // Находим контейнер для сетки товаров
    const container = document.getElementById('catalog-products');
    if (!container) return;  // Если контейнер отсутствует (например, не на странице каталога), выходим

    // Фильтруем массив products в зависимости от выбранной категории
    const filtered = filter === 'all'
        ? products                                   // Если фильтр 'all' — берём все товары
        : products.filter(p => p.category === filter); // Иначе оставляем только товары с соответствующей категорией

    // Генерируем HTML-разметку для каждой карточки товара
    container.innerHTML = filtered.map(p => `
        <div class="product-card">
            <!-- Обёртка для изображения с кнопкой быстрого добавления -->
            <div class="product-image-wrapper">
                <!-- Ссылка на страницу товара, обёрнутая вокруг картинки -->
                <a href="product.html?id=${p.id}">
                    <img src="${getImagePath(p.image)}" alt="${p.name}">
                </a>
                <!-- Кнопка-плюсик для быстрого добавления в корзину -->
                <button class="quick-add" onclick="addToCart(${p.id})" title="Добавить в корзину">+</button>
            </div>
            <!-- Блок с текстовой информацией о товаре -->
            <div class="product-info">
                <h3>${p.name}</h3>                         <!-- Название товара -->
                <div class="price">${p.price.toLocaleString()} ₽</div>  <!-- Цена с форматированием -->
            </div>
        </div>
    `).join('');  // Объединяем массив строк в одну HTML-строку
}

/**
 * Глобальная функция-обёртка для вызова отрисовки каталога извне.
 * Используется, например, в data.js для обновления каталога после изменения товаров в админке.
 * @param {string} [filter] - Категория для фильтрации. Если не передана, используется currentFilter.
 */
window.renderCatalog = function(filter) {
    if (filter === undefined) filter = currentFilter;  // Если фильтр не указан, берём текущий
    renderCatalogInternal(filter);                     // Вызываем внутреннюю функцию отрисовки
};

/**
 * Настраивает обработчики кликов на кнопки фильтрации.
 * При клике на кнопку снимает класс 'active' со всех кнопок,
 * добавляет его на текущую, обновляет currentFilter и перерисовывает каталог.
 */
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');  // Получаем все кнопки фильтров
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Убираем класс 'active' у всех кнопок
            filterBtns.forEach(b => b.classList.remove('active'));
            // Добавляем класс 'active' на нажатую кнопку
            btn.classList.add('active');
            // Получаем значение фильтра из data-атрибута
            const filter = btn.dataset.filter;
            currentFilter = filter;    // Сохраняем текущий фильтр
            renderCatalog(filter);     // Перерисовываем каталог с новым фильтром
        });
    });
}

/**
 * Инициализация после полной загрузки DOM.
 * Выполняет первичную отрисовку каталога, настраивает фильтры и обновляет счётчик корзины.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();        // ← загружаем товары из Supabase
    renderCatalogInternal();     // ← рендерим каталог
    setupFilters();
    updateCartCount();
});