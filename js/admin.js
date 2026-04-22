// ==================== АДМИН-ПАНЕЛЬ (SUPABASE) ====================
// Этот скрипт управляет авторизацией, товарами и заказами в админке.
// Все операции с данными идут через Supabase (облачную БД).

const ADMIN_PASSWORD = 'admin';   // Пароль для входа в админку (можно сменить)

// ---------- ПОЛУЧАЕМ ССЫЛКИ НА DOM-ЭЛЕМЕНТЫ (чтобы работать с HTML) ----------
const loginBlock = document.getElementById('loginBlock');                 // Блок с формой входа
const adminPanel = document.getElementById('adminPanel');                 // Основная панель управления (скрыта до входа)
const passwordInput = document.getElementById('passwordInput');           // Поле ввода пароля
const loginBtn = document.getElementById('loginBtn');                     // Кнопка "Войти"
const logoutBtn = document.getElementById('logoutBtn');                   // Кнопка "Выйти"
const productForm = document.getElementById('productForm');               // Форма добавления/редактирования товара
const productIdInput = document.getElementById('productId');              // Скрытое поле с ID (пустое при добавлении)
const productNameInput = document.getElementById('productName');          // Поле "Название"
const productCategoryInput = document.getElementById('productCategory');  // Выпадающий список категорий
const productPriceInput = document.getElementById('productPrice');        // Поле "Цена"
const productImageInput = document.getElementById('productImage');        // Поле "Имя файла изображения"
const productDescriptionInput = document.getElementById('productDescription'); // Поле "Описание"
const productFeaturedInput = document.getElementById('productFeatured');  // Чекбокс "Показывать на главной"
const saveBtn = document.getElementById('saveBtn');                       // Кнопка "Сохранить"
const cancelBtn = document.getElementById('cancelBtn');                   // Кнопка "Отмена"
const tableBody = document.getElementById('tableBody');                   // Тело таблицы со списком товаров
const customersBtn = document.getElementById('customersBtn');             // Кнопка "Покупатели"
const customersPanel = document.getElementById('customersPanel');         // Панель с заказами
const backToProductsBtn = document.getElementById('backToProductsBtn');   // Кнопка возврата к товарам
const ordersTableBody = document.getElementById('ordersTableBody');       // Тело таблицы заказов

// Переменные для модального окна просмотра заказа и подтверждения удаления
let orderModal, closeModalBtn, modalBody;
let confirmModal, confirmModalMessage, confirmModalYes, confirmModalNo;
let pendingDeleteId = null;   // ID заказа, ожидающего удаления (сейчас не используется)

// ==================== АВТОРИЗАЦИЯ ====================
/**
 * Проверяет, авторизован ли пользователь (по флагу в sessionStorage).
 * Если да — показывает панель управления, иначе — форму входа.
 */
function checkAuth() {
    const isAuth = sessionStorage.getItem('adminAuth') === 'true';  // Читаем флаг
    if (isAuth) {
        loginBlock.style.display = 'none';      // Прячем логин
        adminPanel.style.display = 'block';     // Показываем панель
        loadProductsAndRender();                // Загружаем товары и отрисовываем таблицу
        showProductsPanel();                    // Показываем именно панель товаров (не покупателей)
    } else {
        loginBlock.style.display = 'block';     // Показываем форму входа
        adminPanel.style.display = 'none';      // Прячем панель
    }
}

/** Загружает товары из БД и перерисовывает таблицу товаров. */
async function loadProductsAndRender() {
    await loadProducts();          // Функция из data.js – загружает товары в массив products
    renderProductsTable();         // Отрисовываем таблицу
}

// Обработчик кнопки "Войти"
loginBtn.addEventListener('click', () => {
    if (passwordInput.value === ADMIN_PASSWORD) {           // Проверяем пароль
        sessionStorage.setItem('adminAuth', 'true');        // Запоминаем, что вошли
        checkAuth();                                        // Обновляем интерфейс
        showNotification('Добро пожаловать в админ-панель', 'success');
    } else {
        showNotification('Неверный пароль', 'error');
    }
    passwordInput.value = '';   // Очищаем поле пароля
});

// Обработчик кнопки "Выйти"
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminAuth');   // Удаляем флаг авторизации
    checkAuth();                              // Обновляем интерфейс (вернёт форму входа)
    resetForm();                              // Сбрасываем форму добавления товара
});

// ==================== УПРАВЛЕНИЕ ТОВАРАМИ ====================
/**
 * Отрисовывает таблицу со списком товаров на основе массива products.
 * Для каждого товара создаёт строку с кнопками "Ред." и "Уд.".
 */
function renderProductsTable() {
    if (!tableBody) return;          // Если таблицы нет на странице – выходим
    tableBody.innerHTML = '';        // Очищаем текущее содержимое

    products.forEach(p => {          // Перебираем все товары
        const row = document.createElement('tr');   // Создаём строку
        // Заполняем строку HTML-кодом с данными товара
        row.innerHTML = `
            <td>${p.id}</td>                                           <!-- ID -->
            <td>${p.name}</td>                                         <!-- Название -->
            <td>${categoryNames[p.category] || p.category}</td>        <!-- Категория (человеческое название) -->
            <td>${p.price.toLocaleString()} ₽</td>                     <!-- Цена с разделителями -->
            <td style="text-align: center; cursor: pointer;" data-featured-id="${p.id}">
                ${p.featured ? '✅' : '❌'}                             <!-- Статус "На главной" -->
            </td>
            <td>
                <button class="btn-small btn" data-id="${p.id}" data-action="edit">Ред.</button>
                <button class="btn-small btn-danger" data-id="${p.id}" data-action="delete">Уд.</button>
            </td>
        `;
        tableBody.appendChild(row);    // Добавляем строку в таблицу
    });

    // Навешиваем обработчики на кнопки "Ред."
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => editProduct(parseInt(e.target.dataset.id)));
    });
    // Навешиваем обработчики на кнопки "Уд."
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Удалить товар?')) {          // Подтверждение через стандартный диалог
                await deleteProduct(id);              // Удаляем из БД
                renderProductsTable();                // Перерисовываем таблицу
            }
        });
    });
}

/**
 * Заполняет форму редактирования данными выбранного товара.
 * @param {number} id - ID товара
 */
function editProduct(id) {
    const product = products.find(p => p.id === id);   // Находим товар по ID
    if (!product) return;                              // Если не найден – выходим

    // Заполняем поля формы
    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productCategoryInput.value = product.category;
    productPriceInput.value = product.price;
    productImageInput.value = product.image;
    productDescriptionInput.value = product.description || '';
    productFeaturedInput.checked = product.featured || false;
    saveBtn.textContent = 'Обновить';                  // Меняем текст кнопки
}

/** Сбрасывает форму добавления/редактирования в исходное состояние. */
function resetForm() {
    productForm.reset();                     // Очищаем все поля
    productIdInput.value = '';               // Явно очищаем скрытое поле ID
    productFeaturedInput.checked = false;    // Снимаем чекбокс
    saveBtn.textContent = 'Сохранить';       // Возвращаем текст кнопки
}

// Обработчик отправки формы (добавление или обновление товара)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();   // Не даём странице перезагрузиться

    // Получаем имя файла изображения и убираем возможные префиксы (images/ или ../images/)
    let image = productImageInput.value.trim();
    image = image.replace(/^(\.\.\/)?images\//, '');
    if (!image) {
        showNotification('Введите имя файла изображения', 'error');
        return;
    }

    // Собираем объект с данными товара
    const productData = {
        name: productNameInput.value.trim(),
        category: productCategoryInput.value,
        price: parseInt(productPriceInput.value),
        image: image,
        description: productDescriptionInput.value.trim(),
        featured: productFeaturedInput.checked
    };

    const id = productIdInput.value ? parseInt(productIdInput.value) : null;   // Если есть ID – редактирование, иначе добавление

    if (id) {
        // Обновляем существующий товар
        const success = await updateProduct(id, productData);
        if (success) showNotification('Товар обновлён', 'success');
        else showNotification('Ошибка обновления', 'error');
    } else {
        // Добавляем новый товар
        const newProduct = await addProduct(productData);
        if (newProduct) showNotification('Товар добавлен', 'success');
        else showNotification('Ошибка добавления', 'error');
    }

    resetForm();               // Очищаем форму
    renderProductsTable();     // Обновляем таблицу
});

cancelBtn.addEventListener('click', resetForm);   // Кнопка "Отмена" сбрасывает форму

// ==================== ПЕРЕКЛЮЧЕНИЕ МЕЖДУ ПАНЕЛЯМИ ====================
/** Показывает панель управления товарами, скрывает панель покупателей. */
function showProductsPanel() {
    // Показываем все контейнеры с классом .admin-container, кроме панели покупателей
    document.querySelectorAll('.admin-container:not(#customersPanel)').forEach(el => el.style.display = 'block');
    if (customersPanel) customersPanel.style.display = 'none';   // Скрываем панель покупателей
}

/** Показывает панель покупателей (заказы), скрывает всё остальное. */
function showCustomersPanel() {
    // Скрываем все обычные контейнеры админки
    document.querySelectorAll('.admin-container:not(#customersPanel)').forEach(el => el.style.display = 'none');
    if (customersPanel) customersPanel.style.display = 'block';  // Показываем панель покупателей
    renderOrdersTable();   // Отрисовываем таблицу заказов
}

// ==================== ЗАКАЗЫ (РАБОТА С SUPABASE) ====================
/**
 * Загружает заказы из таблицы orders вместе с позициями (order_items).
 * @returns {Array} Массив заказов
 */
async function loadOrders() {
    if (!window.supabaseClient) return [];   // Если клиент Supabase не готов – возвращаем пустой массив
    const { data, error } = await window.supabaseClient
        .from('orders')
        .select(`*, order_items (*)`)        // Загружаем заказ и связанные позиции
        .order('id', { ascending: false });  // Сортируем по убыванию ID (новые сверху)
    if (error) {
        console.error('Ошибка загрузки заказов:', error);
        return [];
    }
    return data;
}

/** Отрисовывает таблицу заказов в панели покупателей. */
async function renderOrdersTable() {
    if (!ordersTableBody) return;
    const orders = await loadOrders();   // Загружаем заказы

    if (orders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Заказов пока нет</td></tr>';
        return;
    }

    // Генерируем строки таблицы
    ordersTableBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>                                    <!-- ID заказа -->
            <td>${order.date}</td>                                   <!-- Дата -->
            <td>${order.customer_name}</td>                          <!-- Покупатель -->
            <td>${order.phone}</td>                                  <!-- Телефон -->
            <td>${order.total.toLocaleString()} ₽</td>               <!-- Сумма -->
            <td>
                <button class="btn-small btn" data-order-id="${order.id}" data-action="view-order" title="Просмотр">👁️</button>
                <button class="btn-small btn-danger" data-order-id="${order.id}" data-action="delete-order" title="Удалить">🗑️</button>
            </td>
        </tr>
    `).join('');

    // Навешиваем обработчики на кнопки просмотра
    document.querySelectorAll('[data-action="view-order"]').forEach(btn => {
        btn.addEventListener('click', (e) => showOrderDetails(parseInt(e.target.dataset.orderId)));
    });
}

/**
 * Отображает модальное окно с деталями заказа.
 * @param {number} orderId - ID заказа
 */
function showOrderDetails(orderId) {
    loadOrders().then(orders => {
        const order = orders.find(o => o.id === orderId);   // Находим нужный заказ
        if (!order) return;
        if (!modalBody) modalBody = document.getElementById('modalBody');
        if (!modalBody) return;

        // Формируем список позиций заказа
        let itemsHtml = '';
        order.order_items.forEach(item => {
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>${item.product_name} x ${item.quantity}</span>
                    <span>${(item.price * item.quantity).toLocaleString()} ₽</span>
                </div>
            `;
        });

        // Заполняем тело модального окна
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
        orderModal.style.display = 'flex';   // Показываем модальное окно
    });
}

// ==================== БЫСТРОЕ ПЕРЕКЛЮЧЕНИЕ FEATURED (✅/❌) ====================
// Обработчик клика по ячейке с атрибутом data-featured-id
document.addEventListener('click', async (e) => {
    const target = e.target.closest('td[data-featured-id]');   // Ищем родительскую ячейку
    if (!target) return;

    const productId = parseInt(target.dataset.featuredId);     // ID товара
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newFeatured = !product.featured;                    // Инвертируем статус
    const success = await updateProduct(productId, { featured: newFeatured });
    if (success) {
        renderProductsTable();   // Обновляем таблицу
        showNotification(`Товар "${product.name}" ${newFeatured ? 'добавлен на' : 'убран с'} главной`, 'info');
    } else {
        showNotification('Не удалось изменить статус', 'error');
    }
});

// ==================== КАСТОМНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ ====================
/**
 * Показывает модальное окно подтверждения с заданным сообщением.
 * @param {string} message - Текст вопроса
 * @param {Function} onConfirm - Функция, которая выполнится при подтверждении
 */
function showConfirmModal(message, onConfirm) {
    // Если окно ещё не создано – создаём его динамически
    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirmModal';   // Присваиваем id для стилизации
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
        // Закрытие по кнопке "Отмена"
        confirmModal.querySelector('#confirmNo').addEventListener('click', () => confirmModal.style.display = 'none');
        // Закрытие по клику на фон
        confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) confirmModal.style.display = 'none'; });
    }
    // Устанавливаем текст сообщения
    document.getElementById('confirmMessage').textContent = message;
    const yesBtn = document.getElementById('confirmYes');
    const oldHandler = yesBtn.onclick;
    // Назначаем обработчик на кнопку "Да"
    yesBtn.onclick = () => {
        confirmModal.style.display = 'none';
        onConfirm();                     // Выполняем переданную функцию
        yesBtn.onclick = oldHandler;     // Восстанавливаем старый обработчик (если был)
    };
    confirmModal.style.display = 'flex'; // Показываем окно
}

// Обработчик клика по кнопке удаления заказа (🗑️)
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
            renderOrdersTable();   // Обновляем таблицу заказов
        }
    });
});

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();                // Проверяем авторизацию
    updateCartCount();          // Обновляем счётчик корзины в шапке

    // Получаем элементы модального окна просмотра заказа
    orderModal = document.getElementById('orderModal');
    closeModalBtn = document.getElementById('closeModalBtn');
    modalBody = document.getElementById('modalBody');

    // Настраиваем закрытие модального окна
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => orderModal.style.display = 'none');
    if (orderModal) orderModal.addEventListener('click', (e) => { if (e.target === orderModal) orderModal.style.display = 'none'; });

    // Кнопки переключения панелей
    if (customersBtn) customersBtn.addEventListener('click', showCustomersPanel);
    if (backToProductsBtn) backToProductsBtn.addEventListener('click', showProductsPanel);
});