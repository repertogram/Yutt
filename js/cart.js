// ==================== МОДУЛЬ УПРАВЛЕНИЯ КОРЗИНОЙ ====================
// Этот скрипт управляет корзиной покупателя: хранит её в localStorage,
// добавляет/удаляет товары, меняет количество, считает сумму и обновляет счётчик.
// Товары для отображения названий и цен загружаются из облачной базы Supabase.

/**
 * Получает корзину из localStorage.
 * Корзина хранится в виде JSON-строки. Если её нет, возвращается пустой массив.
 * @returns {Array} Массив объектов { id: number, quantity: number }
 */
function getCart() {
    const cart = localStorage.getItem('cart');   // читаем строку из localStorage по ключу 'cart'
    return cart ? JSON.parse(cart) : [];         // если строка есть – парсим в массив, иначе возвращаем []
}

/**
 * Сохраняет массив корзины в localStorage в виде JSON-строки.
 * @param {Array} cart - массив объектов корзины
 */
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart)); // преобразуем массив в строку и кладём в хранилище
}

/**
 * Добавляет товар в корзину. Если товар уже есть – увеличивает его количество.
 * Перед добавлением проверяет, загружены ли данные о товарах из Supabase, и при необходимости ждёт их.
 * @param {number} productId - ID товара
 * @param {number} [quantity=1] - количество (по умолчанию 1)
 */
async function addToCart(productId, quantity = 1) {
    // Если глобальный массив products пуст (ещё не загрузились из Supabase), ждём загрузки
    if (!products || products.length === 0) {
        await loadProducts();   // функция из data.js – загружает товары из БД
    }

    const cart = getCart();                               // получаем текущую корзину
    const existingItem = cart.find(item => item.id === productId); // ищем, есть ли уже товар с таким ID

    if (existingItem) {
        existingItem.quantity += quantity;                // увеличиваем количество
    } else {
        cart.push({ id: productId, quantity });           // добавляем новую позицию
    }

    saveCart(cart);                                       // сохраняем обновлённую корзину
    updateCartCount();                                    // обновляем счётчик в шапке

    // Находим товар в массиве products, чтобы показать его название в уведомлении
    const product = products.find(p => p.id === productId);
    if (typeof showNotification === 'function') {
        showNotification(`${product ? product.name : 'Товар'} добавлен в корзину`, 'success');
    } else {
        alert(`${product ? product.name : 'Товар'} добавлен в корзину`); // fallback, если уведомления не работают
    }
}

/**
 * Удаляет позицию товара из корзины по ID.
 * Если мы находимся на странице cart.html, перерисовывает таблицу корзины.
 * @param {number} productId - ID товара для удаления
 */
function removeFromCart(productId) {
    let cart = getCart();                                 // текущая корзина
    cart = cart.filter(item => item.id !== productId);    // оставляем только позиции с другими ID
    saveCart(cart);                                       // сохраняем
    updateCartCount();                                    // обновляем счётчик

    // Если текущая страница – корзина, вызываем её перерисовку
    if (window.location.pathname.includes('cart.html')) {
        renderCart();   // функция renderCart определена на странице cart.html
    }
}

/**
 * Изменяет количество товара в корзине на величину delta.
 * Если после изменения количество <= 0, товар удаляется.
 * @param {number} productId - ID товара
 * @param {number} delta - изменение (положительное – добавить, отрицательное – убавить)
 */
function changeQuantity(productId, delta) {
    const cart = getCart();                               // текущая корзина
    const item = cart.find(item => item.id === productId); // ищем позицию

    if (item) {
        item.quantity += delta;                           // прибавляем delta (может быть отрицательным)

        if (item.quantity <= 0) {
            removeFromCart(productId);                    // если количество стало 0 или меньше – удаляем
        } else {
            saveCart(cart);                               // иначе просто сохраняем
            // Если мы на странице корзины – перерисовываем таблицу
            if (window.location.pathname.includes('cart.html')) {
                renderCart();
            }
        }
    }

    updateCartCount();                                    // в любом случае обновляем счётчик
}

/**
 * Обновляет счётчик товаров в шапке сайта.
 * Суммирует количество всех позиций в корзине и выводит в элементы с классом cart-count.
 */
function updateCartCount() {
    const cart = getCart();                               // получаем корзину
    // Считаем общее количество товаров (сумма quantity)
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    // Находим все элементы с классом cart-count и устанавливаем им текст
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = totalItems);
}

/**
 * Вычисляет общую стоимость всех товаров в корзине.
 * Для каждой позиции ищет товар в массиве products и умножает цену на количество.
 * @returns {number} Общая сумма
 */
function getCartTotal() {
    const cart = getCart();                               // получаем корзину
    return cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.id); // ищем товар по ID
        return total + (product ? product.price * item.quantity : 0); // добавляем стоимость позиции
    }, 0);                                                // начальное значение суммы – 0
}