// ==================== МОДУЛЬ УПРАВЛЕНИЯ КОРЗИНОЙ ====================
// Скрипт отвечает за хранение корзины в localStorage, добавление/удаление товаров,
// изменение количества, подсчёт общей суммы и обновление счётчика в шапке.

/**
 * Получает текущую корзину из localStorage.
 * Если корзина пуста или отсутствует, возвращает пустой массив.
 * @returns {Array} Массив объектов корзины [{ id: number, quantity: number }, ...]
 */
// ==================== МОДУЛЬ УПРАВЛЕНИЯ КОРЗИНОЙ (С ПОДДЕРЖКОЙ SUPABASE) ====================

function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Добавляем товар, предварительно убедившись, что products загружены
async function addToCart(productId, quantity = 1) {
    // Если товары ещё не загружены, ждём их
    if (!products || products.length === 0) {
        await loadProducts();
    }
    
    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ id: productId, quantity });
    }
    saveCart(cart);
    updateCartCount();
    
    const product = products.find(p => p.id === productId);
    if (typeof showNotification === 'function') {
        showNotification(`${product ? product.name : 'Товар'} добавлен в корзину`, 'success');
    } else {
        alert(`${product ? product.name : 'Товар'} добавлен в корзину`);
    }
}

// Остальные функции (removeFromCart, changeQuantity, updateCartCount, getCartTotal) остаются без изменений
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    updateCartCount();
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }
}

function changeQuantity(productId, delta) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart(cart);
            if (window.location.pathname.includes('cart.html')) {
                renderCart();
            }
        }
    }
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = totalItems);
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.id);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}