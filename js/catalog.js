// ==================== МОДУЛЬ КАТАЛОГА ТОВАРОВ ====================
// Этот скрипт отвечает за отображение карточек товаров в каталоге
// и фильтрацию по категориям. Данные о товарах загружаются из облачной БД Supabase.

/**
 * currentFilter – хранит текущую выбранную категорию.
 * По умолчанию 'all', то есть показываются все товары.
 * @type {string}
 */
var currentFilter = 'all';

/**
 * Внутренняя функция, которая рисует карточки товаров с учётом фильтра.
 * @param {string} [filter='all'] – ключ категории ('all', 'soft', 'bedroom' и т.д.)
 */
function renderCatalogInternal(filter = 'all') {
    // Находим на странице контейнер, куда будем вставлять карточки
    const container = document.getElementById('catalog-products');
    // Если контейнера нет (мы не на странице каталога), просто выходим
    if (!container) return;

    // Фильтруем массив products: если фильтр 'all' – берём всё,
    // иначе оставляем только товары с нужной категорией
    const filtered = filter === 'all'
        ? products                                   // все товары
        : products.filter(p => p.category === filter); // только выбранная категория

    // Превращаем каждый товар в HTML-строку с карточкой и вставляем в контейнер
    container.innerHTML = filtered.map(p => `
        <div class="product-card">
            <!-- Обёртка для картинки и кнопки быстрого добавления -->
            <div class="product-image-wrapper">
                <!-- Ссылка на детальную страницу товара, картинка кликабельна -->
                <a href="product.html?id=${p.id}">
                    <img src="${getImagePath(p.image)}" alt="${p.name}">
                </a>
                <!-- Кнопка-плюсик для быстрого добавления в корзину -->
                <button class="quick-add" onclick="addToCart(${p.id})" title="Добавить в корзину">+</button>
            </div>
            <!-- Информация о товаре: название и цена -->
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="price">${p.price.toLocaleString()} ₽</div>
            </div>
        </div>
    `).join('');  // join('') склеивает массив строк в одну большую строку
}

/**
 * Глобальная функция для перерисовки каталога из других скриптов.
 * Например, вызывается из data.js после обновления товаров в админке.
 * @param {string} [filter] – категория, если не указана, берётся currentFilter.
 */
window.renderCatalog = function(filter) {
    if (filter === undefined) filter = currentFilter;
    renderCatalogInternal(filter);
};

/**
 * Настраивает кнопки фильтров: при клике переключает активную категорию
 * и перерисовывает каталог.
 */
function setupFilters() {
    // Находим все кнопки с классом filter-btn
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Снимаем класс 'active' со всех кнопок
            filterBtns.forEach(b => b.classList.remove('active'));
            // Добавляем класс 'active' на нажатую кнопку
            btn.classList.add('active');
            // Получаем значение фильтра из data-атрибута data-filter
            const filter = btn.dataset.filter;
            currentFilter = filter;      // Запоминаем выбранную категорию
            renderCatalog(filter);       // Перерисовываем каталог
        });
    });
}

/**
 * После полной загрузки DOM-дерева:
 * – загружаем товары из Supabase (функция loadProducts из data.js)
 * – отрисовываем каталог
 * – настраиваем фильтры
 * – обновляем счётчик корзины в шапке
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();        // Ждём, пока товары загрузятся из облачной БД
    renderCatalogInternal();     // Показываем карточки (по умолчанию все товары)
    setupFilters();              // Вешаем обработчики на кнопки категорий
    updateCartCount();           // Обновляем цифру рядом со значком корзины
});