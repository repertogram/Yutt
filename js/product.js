// ==================== МОДУЛЬ КАРТОЧКИ ТОВАРА (PRODUCT.JS) ====================
// Отвечает за отображение детальной информации о конкретном товаре.
// ID товара извлекается из параметров URL, затем данные берутся из глобального массива products.

/**
 * Извлекает ID товара из параметров строки запроса URL.
 * Например, для "product.html?id=3" вернёт число 3.
 * @returns {number|null} ID товара или null, если параметр отсутствует/некорректен
 */
function getProductIdFromUrl() {
    // URLSearchParams предоставляет удобный доступ к параметрам после '?'
    const params = new URLSearchParams(window.location.search);
    // Получаем значение параметра 'id' и преобразуем в целое число
    return parseInt(params.get('id'));
}

/**
 * Отрисовывает карточку товара в контейнере #product-detail.
 * Если товар не найден, выводит соответствующее сообщение.
 */
function renderProductDetail() {
    // Находим контейнер, куда будет вставлена детальная информация
    const container = document.getElementById('product-detail');
    if (!container) return;  // Если контейнера нет (страница не предназначена для товара), выходим

    // Получаем ID товара из URL
    const productId = getProductIdFromUrl();
    // Ищем товар в глобальном массиве products (из data.js) по ID
    const product = products.find(p => p.id === productId);

    // Если товар с таким ID не найден
    if (!product) {
        container.innerHTML = '<p>Товар не найден.</p>';
        return;
    }

    // Формируем HTML-разметку детальной страницы
    container.innerHTML = `
        <!-- Flex-контейнер для адаптивного расположения картинки и информации -->
        <div style="display: flex; gap: 40px; flex-wrap: wrap;">
            <!-- Изображение товара с максимальной шириной 400px и скруглёнными углами -->
            <img src="${getImagePath(product.image)}" alt="${product.name}" style="max-width: 400px; width: 100%; border-radius: 8px;">
            
            <!-- Блок с текстовой информацией, занимает оставшееся пространство -->
            <div style="flex: 1;">
                <!-- Название товара -->
                <h1>${product.name}</h1>
                
                <!-- Цена: крупный зелёный шрифт с форматированием разрядов -->
                <p style="font-size: 28px; color: #27ae60; font-weight: bold; margin: 20px 0;">
                    ${product.price.toLocaleString()} ₽
                </p>
                
                <!-- Описание товара -->
                <p style="margin: 20px 0; font-size: 18px;">${product.description}</p>
                
                <!-- Кнопка добавления в корзину, при клике вызывает глобальную addToCart -->
                <button class="btn" style="font-size: 18px; padding: 12px 30px;" onclick="addToCart(${product.id})">
                    Добавить в корзину
                </button>
            </div>
        </div>
    `;
}

/**
 * Инициализация после полной загрузки DOM.
 * Выполняет отрисовку карточки товара и обновляет счётчик корзины в шапке.
 */
document.addEventListener('DOMContentLoaded', () => {
    renderProductDetail();   // Отрисовываем информацию о товаре
    updateCartCount();       // Обновляем цифру на значке корзины (функция из cart.js)
});