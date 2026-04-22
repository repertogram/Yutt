// ==================== МОДУЛЬ УПРАВЛЕНИЯ ТОВАРАМИ (SUPABASE) ====================
let products = [];

const categoryNames = {
    soft: 'Мягкая мебель',
    bedroom: 'Спальня',
    dining: 'Столовая',
    storage: 'Хранение'
};

// ---------- ЗАГРУЗКА ТОВАРОВ ----------
async function loadProducts() {
    if (!window.supabaseClient) {
        console.error('Supabase client не готов');
        return;
    }
    const { data, error } = await window.supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Ошибка загрузки товаров:', error);
        if (typeof showNotification === 'function') {
            showNotification('Не удалось загрузить товары', 'error');
        }
        return;
    }
    products = data;
    if (typeof renderCatalog === 'function') renderCatalog(currentFilter);
    if (typeof renderPopular === 'function') renderPopular();
    return products;
}

// ---------- ДОБАВЛЕНИЕ ТОВАРА ----------
async function addProduct(product) {
    if (!window.supabaseClient) return null;
    const { data, error } = await window.supabaseClient
        .from('products')
        .insert([product])
        .select();

    if (error) {
        console.error('Ошибка добавления:', error);
        showNotification && showNotification('Ошибка добавления товара', 'error');
        return null;
    }
    const newProduct = data[0];
    products.push(newProduct);
    if (typeof renderCatalog === 'function') renderCatalog(currentFilter);
    if (typeof renderPopular === 'function') renderPopular();
    showNotification && showNotification(`Товар "${newProduct.name}" добавлен`, 'success');
    return newProduct;
}

// ---------- ОБНОВЛЕНИЕ ТОВАРА ----------
async function updateProduct(id, updatedData) {
    if (!window.supabaseClient) return false;
    const { data, error } = await window.supabaseClient
        .from('products')
        .update(updatedData)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Ошибка обновления:', error);
        showNotification && showNotification('Ошибка обновления товара', 'error');
        return false;
    }
    const updatedProduct = data[0];
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) products[index] = updatedProduct;
    if (typeof renderCatalog === 'function') renderCatalog(currentFilter);
    if (typeof renderPopular === 'function') renderPopular();
    showNotification && showNotification(`Товар "${updatedProduct.name}" обновлён`, 'success');
    return true;
}

// ---------- УДАЛЕНИЕ ТОВАРА ----------
async function deleteProduct(id) {
    if (!window.supabaseClient) return false;
    const { error } = await window.supabaseClient
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Ошибка удаления:', error);
        showNotification && showNotification('Ошибка удаления товара', 'error');
        return false;
    }
    products = products.filter(p => p.id !== id);
    if (typeof renderCatalog === 'function') renderCatalog(currentFilter);
    if (typeof renderPopular === 'function') renderPopular();
    showNotification && showNotification('Товар удалён', 'warning');
    return true;
}

// ---------- ПУТЬ К ИЗОБРАЖЕНИЮ ----------
function getImagePath(imageName) {
    const isInHtmlFolder = window.location.pathname.includes('/html/');
    const basePath = isInHtmlFolder ? '../images/' : 'images/';
    return basePath + imageName;
}