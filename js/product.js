// ==================== МОДУЛЬ КАРТОЧКИ ТОВАРА (PRODUCT.JS) ====================
// Отвечает за отображение детальной информации о конкретном товаре.
// ID товара извлекается из параметров URL, затем данные берутся из глобального массива products.

/**
 * Извлекает ID товара из параметров строки запроса URL.
 * Например, для "product.html?id=3" вернёт число 3.
 * @returns {number|null} ID товара или null, если параметр отсутствует/некорректен
 */
// ==================== МОДУЛЬ КАРТОЧКИ ТОВАРА (PRODUCT.JS) ====================

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'));
}

async function renderProductDetail() {
    const container = document.getElementById('product-detail');
    if (!container) return;

    // Ждём, пока товары загрузятся из Supabase (если ещё нет)
    if (!products || products.length === 0) {
        await loadProducts();
    }

    const productId = getProductIdFromUrl();
    const product = products.find(p => p.id === productId);

    if (!product) {
        container.innerHTML = '<p>Товар не найден.</p>';
        return;
    }

    container.innerHTML = `
        <div style="display: flex; gap: 40px; flex-wrap: wrap;">
            <img src="${getImagePath(product.image)}" alt="${product.name}" style="max-width: 400px; width: 100%; border-radius: 8px;">
            <div style="flex: 1;">
                <h1>${product.name}</h1>
                <p style="font-size: 28px; color: #27ae60; font-weight: bold; margin: 20px 0;">${product.price.toLocaleString()} ₽</p>
                <p style="margin: 20px 0; font-size: 18px;">${product.description}</p>
                <button class="btn" style="font-size: 18px; padding: 12px 30px;" onclick="addToCart(${product.id})">Добавить в корзину</button>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', async () => {
    await renderProductDetail();
    updateCartCount();
});