// ==================== АДМИН-ПАНЕЛЬ (SUPABASE) ====================
const ADMIN_PASSWORD = 'admin';

// DOM-элементы
const loginBlock = document.getElementById('loginBlock');
const adminPanel = document.getElementById('adminPanel');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const productForm = document.getElementById('productForm');
const productIdInput = document.getElementById('productId');
const productNameInput = document.getElementById('productName');
const productCategoryInput = document.getElementById('productCategory');
const productPriceInput = document.getElementById('productPrice');
const productImageInput = document.getElementById('productImage');
const productDescriptionInput = document.getElementById('productDescription');
const productFeaturedInput = document.getElementById('productFeatured');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const tableBody = document.getElementById('tableBody');
const customersBtn = document.getElementById('customersBtn');
const customersPanel = document.getElementById('customersPanel');
const backToProductsBtn = document.getElementById('backToProductsBtn');
const ordersTableBody = document.getElementById('ordersTableBody');

// Модальное окно
let orderModal, closeModalBtn, modalBody;
let confirmModal, confirmModalMessage, confirmModalYes, confirmModalNo;
let pendingDeleteId = null;

// ==================== АВТОРИЗАЦИЯ ====================
function checkAuth() {
    const isAuth = sessionStorage.getItem('adminAuth') === 'true';
    if (isAuth) {
        loginBlock.style.display = 'none';
        adminPanel.style.display = 'block';
        loadProductsAndRender();
        showProductsPanel();
    } else {
        loginBlock.style.display = 'block';
        adminPanel.style.display = 'none';
    }
}

async function loadProductsAndRender() {
    await loadProducts();
    renderProductsTable();
}

loginBtn.addEventListener('click', () => {
    if (passwordInput.value === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuth', 'true');
        checkAuth();
        showNotification('Добро пожаловать в админ-панель', 'success');
    } else {
        showNotification('Неверный пароль', 'error');
    }
    passwordInput.value = '';
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminAuth');
    checkAuth();
    resetForm();
});

// ==================== УПРАВЛЕНИЕ ТОВАРАМИ ====================
function renderProductsTable() {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    products.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${categoryNames[p.category] || p.category}</td>
            <td>${p.price.toLocaleString()} ₽</td>
            <td style="text-align: center; cursor: pointer;" data-featured-id="${p.id}">
                ${p.featured ? '✅' : '❌'}
            </td>
            <td>
                <button class="btn-small btn" data-id="${p.id}" data-action="edit">Ред.</button>
                <button class="btn-small btn-danger" data-id="${p.id}" data-action="delete">Уд.</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => editProduct(parseInt(e.target.dataset.id)));
    });
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Удалить товар?')) {
                await deleteProduct(id);
                renderProductsTable();
            }
        });
    });
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productCategoryInput.value = product.category;
    productPriceInput.value = product.price;
    productImageInput.value = product.image;
    productDescriptionInput.value = product.description || '';
    productFeaturedInput.checked = product.featured || false;
    saveBtn.textContent = 'Обновить';
}

function resetForm() {
    productForm.reset();
    productIdInput.value = '';
    productFeaturedInput.checked = false;
    saveBtn.textContent = 'Сохранить';
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let image = productImageInput.value.trim();
    image = image.replace(/^(\.\.\/)?images\//, '');
    if (!image) {
        showNotification('Введите имя файла изображения', 'error');
        return;
    }

    const productData = {
        name: productNameInput.value.trim(),
        category: productCategoryInput.value,
        price: parseInt(productPriceInput.value),
        image: image,
        description: productDescriptionInput.value.trim(),
        featured: productFeaturedInput.checked
    };

    const id = productIdInput.value ? parseInt(productIdInput.value) : null;
    if (id) {
        const success = await updateProduct(id, productData);
        if (success) showNotification('Товар обновлён', 'success');
        else showNotification('Ошибка обновления', 'error');
    } else {
        const newProduct = await addProduct(productData);
        if (newProduct) showNotification('Товар добавлен', 'success');
        else showNotification('Ошибка добавления', 'error');
    }

    resetForm();
    renderProductsTable();
});

cancelBtn.addEventListener('click', resetForm);

// ==================== ПАНЕЛИ ====================
function showProductsPanel() {
    document.querySelectorAll('.admin-container:not(#customersPanel)').forEach(el => el.style.display = 'block');
    if (customersPanel) customersPanel.style.display = 'none';
}

function showCustomersPanel() {
    document.querySelectorAll('.admin-container:not(#customersPanel)').forEach(el => el.style.display = 'none');
    if (customersPanel) customersPanel.style.display = 'block';
    renderOrdersTable();
}

// ==================== ЗАКАЗЫ ====================
async function loadOrders() {
    if (!window.supabaseClient) return [];
    const { data, error } = await window.supabaseClient
        .from('orders')
        .select(`*, order_items (*)`)
        .order('id', { ascending: false });
    if (error) {
        console.error('Ошибка загрузки заказов:', error);
        return [];
    }
    return data;
}

async function renderOrdersTable() {
    if (!ordersTableBody) return;
    const orders = await loadOrders();
    if (orders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Заказов пока нет</td></tr>';
        return;
    }

    ordersTableBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.date}</td>
            <td>${order.customer_name}</td>
            <td>${order.phone}</td>
            <td>${order.total.toLocaleString()} ₽</td>
            <td>
                <button class="btn-small btn" data-order-id="${order.id}" data-action="view-order" title="Просмотр">👁️</button>
                <button class="btn-small btn-danger" data-order-id="${order.id}" data-action="delete-order" title="Удалить">🗑️</button>
            </td>
        </tr>
    `).join('');

    document.querySelectorAll('[data-action="view-order"]').forEach(btn => {
        btn.addEventListener('click', (e) => showOrderDetails(parseInt(e.target.dataset.orderId)));
    });
}

function showOrderDetails(orderId) {
    loadOrders().then(orders => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        if (!modalBody) modalBody = document.getElementById('modalBody');
        if (!modalBody) return;

        let itemsHtml = '';
        order.order_items.forEach(item => {
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>${item.product_name} x ${item.quantity}</span>
                    <span>${(item.price * item.quantity).toLocaleString()} ₽</span>
                </div>
            `;
        });

        modalBody.innerHTML = `
            <p><strong>Заказ #${order.id}</strong></p>
            <p><strong>Дата:</strong> ${order.date}</p>
            <p><strong>Покупатель:</strong> ${order.customer_name}</p>
            <p><strong>Телефон:</strong> ${order.phone}</p>
            <p><strong>Адрес:</strong> ${order.address}</p>
            <div style="margin: 15px 0;"><strong>Состав заказа:</strong>${itemsHtml}</div>
            <p style="font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px;">
                Итого: ${order.total.toLocaleString()} ₽
            </p>
        `;
        orderModal.style.display = 'flex';
    });
}

// ==================== БЫСТРОЕ ПЕРЕКЛЮЧЕНИЕ FEATURED ====================
document.addEventListener('click', async (e) => {
    const target = e.target.closest('td[data-featured-id]');
    if (!target) return;
    const productId = parseInt(target.dataset.featuredId);
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newFeatured = !product.featured;
    const success = await updateProduct(productId, { featured: newFeatured });
    if (success) {
        renderProductsTable();
        showNotification(`Товар "${product.name}" ${newFeatured ? 'добавлен на' : 'убран с'} главной`, 'info');
    } else {
        showNotification('Не удалось изменить статус', 'error');
    }
});

function showConfirmModal(message, onConfirm) {
    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirmModal';   // ← добавили id
        confirmModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10001;display:flex;align-items:center;justify-content:center;';
        confirmModal.innerHTML = `
            <div>
                <p id="confirmMessage"></p>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button class="btn" id="confirmYes" style="background:#e74c3c;">Да, удалить</button>
                    <button class="btn" id="confirmNo" style="background:#95a5a6;">Отмена</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
        confirmModal.querySelector('#confirmNo').addEventListener('click', () => confirmModal.style.display = 'none');
        confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) confirmModal.style.display = 'none'; });
    }
    document.getElementById('confirmMessage').textContent = message;
    const yesBtn = document.getElementById('confirmYes');
    const oldHandler = yesBtn.onclick;
    yesBtn.onclick = () => {
        confirmModal.style.display = 'none';
        onConfirm();
        yesBtn.onclick = oldHandler;
    };
    confirmModal.style.display = 'flex';
}

document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="delete-order"]');
    if (!btn) return;
    const orderId = parseInt(btn.dataset.orderId);
    showConfirmModal('Вы уверены, что хотите удалить этот заказ навсегда?', async () => {
        const { error } = await window.supabaseClient.from('orders').delete().eq('id', orderId);
        if (error) {
            showNotification('Ошибка удаления заказа', 'error');
        } else {
            showNotification('Заказ удалён', 'warning');
            renderOrdersTable();
        }
    });
});

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateCartCount();

    orderModal = document.getElementById('orderModal');
    closeModalBtn = document.getElementById('closeModalBtn');
    modalBody = document.getElementById('modalBody');

    if (closeModalBtn) closeModalBtn.addEventListener('click', () => orderModal.style.display = 'none');
    if (orderModal) orderModal.addEventListener('click', (e) => { if (e.target === orderModal) orderModal.style.display = 'none'; });
    if (customersBtn) customersBtn.addEventListener('click', showCustomersPanel);
    if (backToProductsBtn) backToProductsBtn.addEventListener('click', showProductsPanel);
});