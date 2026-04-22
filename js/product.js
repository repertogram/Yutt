// ==================== МОДУЛЬ КАРТОЧКИ ТОВАРА (PRODUCT.JS) ====================
// Этот скрипт отвечает за отображение страницы с детальной информацией о товаре.
// Он берёт ID товара из адресной строки (например, product.html?id=5),
// загружает данные из облачной базы Supabase (если ещё не загружены)
// и рисует карточку с названием, ценой, описанием и кнопкой "В корзину".

/**
 * Извлекает ID товара из URL.
 * Параметр id должен быть передан после знака вопроса, например: product.html?id=3
 * @returns {number} – целое число, идентификатор товара
 */
function getProductIdFromUrl() {
    // URLSearchParams – встроенный объект для разбора строки запроса
    const params = new URLSearchParams(window.location.search);
    // Берём значение параметра 'id' и преобразуем в целое число
    return parseInt(params.get('id'));
}

/**
 * Асинхронная функция, которая отрисовывает карточку товара на странице.
 * Если данные о товарах ещё не загружены из Supabase, она сначала загружает их.
 */
async function renderProductDetail() {
    // Находим на странице контейнер, куда будем вставлять информацию о товаре
    const container = document.getElementById('product-detail');
    // Если контейнера нет (например, мы не на странице товара), выходим
    if (!container) return;

    // Проверяем, загружены ли товары из Supabase (глобальный массив products из data.js)
    if (!products || products.length === 0) {
        // Если массив пуст – вызываем функцию loadProducts из data.js и ждём загрузки
        await loadProducts();
    }

    // Получаем ID товара из адресной строки
    const productId = getProductIdFromUrl();
    // Ищем товар с таким ID в массиве products
    const product = products.find(p => p.id === productId);

    // Если товар не найден – выводим сообщение и прекращаем
    if (!product) {
        container.innerHTML = '<p>Товар не найден.</p>';
        return;
    }

    // Формируем HTML-разметку карточки товара и вставляем в контейнер
    container.innerHTML = `
        <div style="display: flex; gap: 40px; flex-wrap: wrap;">
            <!-- Картинка товара. Путь получаем через вспомогательную функцию getImagePath -->
            <img src="${getImagePath(product.image)}" alt="${product.name}" 
                style="max-width: 400px; width: 100%; border-radius: 8px;">
            <!-- Правая часть с описанием -->
            <div style="flex: 1;">
                <h1>${product.name}</h1>   <!-- Название товара -->
                <!-- Цена: крупным шрифтом, зелёным цветом (стили из style.css) -->
                <p style="font-size: 28px; color: #27ae60; font-weight: bold; margin: 20px 0;">
                    ${product.price.toLocaleString()} ₽
                </p>
                <!-- Полное описание товара -->
                <p style="margin: 20px 0; font-size: 18px;">${product.description}</p>
                <!-- Кнопка добавления в корзину. При клике вызывает глобальную функцию addToCart -->
                <button class="btn" style="font-size: 18px; padding: 12px 30px;" 
                        onclick="addToCart(${product.id})">
                    Добавить в корзину
                </button>
            </div>
        </div>
    `;
}

// Ждём полной загрузки DOM-дерева, затем отрисовываем карточку товара
// и обновляем счётчик корзины в шапке сайта.
document.addEventListener('DOMContentLoaded', async () => {
    await renderProductDetail();   // рисуем страницу товара
    updateCartCount();            // обновляем цифру рядом со значком корзины
});