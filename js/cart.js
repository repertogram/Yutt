// ==================== МОДУЛЬ УПРАВЛЕНИЯ КОРЗИНОЙ ====================
// Скрипт отвечает за хранение корзины в localStorage, добавление/удаление товаров,
// изменение количества, подсчёт общей суммы и обновление счётчика в шапке.

/**
 * Получает текущую корзину из localStorage.
 * Если корзина пуста или отсутствует, возвращает пустой массив.
 * @returns {Array} Массив объектов корзины [{ id: number, quantity: number }, ...]
 */
function getCart() {
    const cart = localStorage.getItem('cart');   // Читаем строку из localStorage по ключу 'cart'
    return cart ? JSON.parse(cart) : [];         // Если есть — парсим JSON, иначе возвращаем []
}

/**
 * Сохраняет переданный массив корзины в localStorage.
 * @param {Array} cart - Массив объектов корзины для сохранения
 */
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));  // Преобразуем массив в JSON-строку и сохраняем
}

/**
 * Добавляет товар в корзину.
 * Если товар уже есть — увеличивает его количество на переданное значение.
 * Если нет — добавляет новую позицию.
 * После сохранения обновляет счётчик в шапке и показывает уведомление.
 * @param {number} productId - ID добавляемого товара
 * @param {number} [quantity=1] - Количество для добавления (по умолчанию 1)
 */
function addToCart(productId, quantity = 1) {
    const cart = getCart();                          // Получаем текущую корзину
    const existingItem = cart.find(item => item.id === productId);  // Ищем, есть ли уже товар с таким ID

    if (existingItem) {
        // Если товар уже в корзине — увеличиваем количество
        existingItem.quantity += quantity;
    } else {
        // Иначе добавляем новую позицию с указанным количеством
        cart.push({ id: productId, quantity });
    }

    saveCart(cart);                                  // Сохраняем обновлённую корзину в localStorage
    updateCartCount();                               // Обновляем цифру на значке корзины в шапке

    // Находим товар в глобальном массиве products (из data.js), чтобы показать его название
    const product = products.find(p => p.id === productId);
    // Показываем всплывающее уведомление об успешном добавлении
    showNotification(`${product ? product.name : 'Товар'} добавлен в корзину`, 'success');
}

/**
 * Полностью удаляет позицию товара из корзины по его ID.
 * После удаления обновляет счётчик и, если мы на странице корзины, перерисовывает её.
 * @param {number} productId - ID товара, который нужно удалить
 */
function removeFromCart(productId) {
    let cart = getCart();                            // Получаем текущую корзину
    cart = cart.filter(item => item.id !== productId); // Оставляем только те позиции, ID которых не совпадает с удаляемым
    saveCart(cart);                                  // Сохраняем обновлённую корзину
    updateCartCount();                               // Обновляем счётчик в шапке

    // Если текущая страница — корзина (cart.html), вызываем её перерисовку
    if (window.location.pathname.includes('cart.html')) {
        renderCart();                                // Функция renderCart должна быть глобально доступна на странице корзины
    }
}

/**
 * Изменяет количество конкретного товара в корзине на величину delta.
 * Если после изменения количество становится <= 0, товар удаляется из корзины.
 * После изменения обновляет счётчик и, при необходимости, перерисовывает страницу корзины.
 * @param {number} productId - ID товара
 * @param {number} delta - Изменение количества (положительное или отрицательное число)
 */
function changeQuantity(productId, delta) {
    const cart = getCart();                          // Текущая корзина
    const item = cart.find(item => item.id === productId);  // Ищем позицию по ID

    if (item) {
        item.quantity += delta;                      // Прибавляем delta (может быть отрицательным)

        if (item.quantity <= 0) {
            // Если количество стало 0 или меньше — удаляем товар полностью
            removeFromCart(productId);
        } else {
            // Иначе просто сохраняем обновлённую корзину
            saveCart(cart);
            // Если находимся на странице корзины — перерисовываем таблицу
            if (window.location.pathname.includes('cart.html')) {
                renderCart();
            }
        }
    }

    updateCartCount();                               // В любом случае обновляем счётчик в шапке
}

/**
 * Обновляет счётчик товаров в шапке сайта.
 * Суммирует количество всех позиций в корзине и выводит в элементы с классом 'cart-count'.
 */
function updateCartCount() {
    const cart = getCart();                          // Получаем корзину
    // Считаем общее количество товаров (сумма quantity по всем позициям)
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Находим все элементы с классом 'cart-count' (обычно в шапке)
    const countElements = document.querySelectorAll('.cart-count');
    // Устанавливаем им текстовое содержимое равным totalItems
    countElements.forEach(el => el.textContent = totalItems);
}

/**
 * Вычисляет общую стоимость всех товаров в корзине.
 * Для каждой позиции находит соответствующий товар в массиве products и умножает цену на количество.
 * @returns {number} Общая сумма корзины
 */
function getCartTotal() {
    const cart = getCart();                          // Получаем текущую корзину
    // Проходим по всем позициям и суммируем цену * количество
    return cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.id);  // Находим товар по ID
        return total + (product ? product.price * item.quantity : 0);  // Если товар найден — добавляем его стоимость
    }, 0);                                           // Начальное значение суммы — 0
}