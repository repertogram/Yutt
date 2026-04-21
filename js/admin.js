// ==================== АДМИН-ПАНЕЛЬ: УПРАВЛЕНИЕ ТОВАРАМИ ====================
// Скрипт реализует авторизацию по паролю, CRUD-операции с товарами
// и синхронизацию с localStorage через глобальные функции из data.js

// ---------- 1. КОНФИГУРАЦИЯ ----------
const ADMIN_PASSWORD = 'admin';                     // Пароль для входа в админ-панель (можно изменить)

// ---------- 2. ПОЛУЧЕНИЕ ССЫЛОК НА DOM-ЭЛЕМЕНТЫ ----------
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
const saveBtn = document.getElementById('saveBtn');                       // Кнопка "Сохранить" (меняет текст)
const cancelBtn = document.getElementById('cancelBtn');                   // Кнопка "Отмена"
const tableBody = document.getElementById('tableBody');                   // Тело таблицы со списком товаров
const customersBtn = document.getElementById('customersBtn');
const customersPanel = document.getElementById('customersPanel');
const backToProductsBtn = document.getElementById('backToProductsBtn');
const ordersTableBody = document.getElementById('ordersTableBody');

// ---------- 3. ПРОВЕРКА СТАТУСА АВТОРИЗАЦИИ ----------
/**
 * Проверяет, сохранён ли флаг авторизации в sessionStorage.
 * Если да — показывает панель управления и скрывает форму входа.
 * Иначе — показывает форму входа и скрывает панель.
 */
function checkAuth() {
    const isAuth = sessionStorage.getItem('adminAuth') === 'true';
    if (isAuth) {
        loginBlock.style.display = 'none';
        adminPanel.style.display = 'block';
        renderProductsTable();
        showProductsPanel(); // ← добавлено
    } else {
        loginBlock.style.display = 'block';
        adminPanel.style.display = 'none';
    }
}

// ---------- 4. ОБРАБОТЧИК ВХОДА ----------
loginBtn.addEventListener('click', () => {
    // Сравниваем введённый пароль с константой ADMIN_PASSWORD
    if (passwordInput.value === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuth', 'true');   // Сохраняем флаг авторизации
        checkAuth();                                   // Обновляем интерфейс
        showNotification('Добро пожаловать в админ-панель', 'success');  // Уведомление об успехе
    } else {
        showNotification('Неверный пароль', 'error');  // Уведомление об ошибке
    }
    passwordInput.value = '';                          // Очищаем поле пароля
});

// ---------- 5. ОБРАБОТЧИК ВЫХОДА ----------
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminAuth');  // Удаляем флаг авторизации
    checkAuth();                             // Обновляем интерфейс (вернёт форму входа)
    resetForm();                             // Сбрасываем форму добавления/редактирования
});

// ---------- 6. ОТМЕНА РЕДАКТИРОВАНИЯ ----------
cancelBtn.addEventListener('click', resetForm);  // При клике на "Отмена" вызываем сброс формы

// ---------- 7. ОТРИСОВКА ТАБЛИЦЫ ТОВАРОВ ----------
/**
 * Заполняет <tbody> таблицы строками с информацией о товарах.
 * Для каждой строки создаются кнопки "Ред." и "Уд." с data-атрибутами.
 */
function renderProductsTable() {
    if (!tableBody) return;                     // Если таблицы нет на странице — выходим
    tableBody.innerHTML = '';                   // Очищаем текущее содержимое

    // Перебираем массив products (глобальный из data.js)
    products.forEach(p => {
        const row = document.createElement('tr');   // Создаём строку таблицы
        // Заполняем строку HTML с данными товара
        row.innerHTML = `
            <td>${p.id}</td>                                          <!-- ID товара -->
            <td>${p.name}</td>                                        <!-- Название -->
            <td>${categoryNames[p.category] || p.category}</td>       <!-- Категория (через маппинг) -->
            <td>${p.price.toLocaleString()} ₽</td>                    <!-- Форматированная цена -->
            <td>
                <!-- Кнопка редактирования с data-атрибутами -->
                <button class="btn-small btn" data-id="${p.id}" data-action="edit">Ред.</button>
                <!-- Кнопка удаления -->
                <button class="btn-small btn-danger" data-id="${p.id}" data-action="delete">Уд.</button>
            </td>
        `;
        tableBody.appendChild(row);                // Добавляем строку в таблицу
    });

    // ---------- НАВЕШИВАНИЕ ОБРАБОТЧИКОВ НА КНОПКИ "РЕДАКТИРОВАТЬ" ----------
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);  // Получаем ID товара из data-атрибута
            editProduct(id);                           // Заполняем форму для редактирования
        });
    });

    // ---------- НАВЕШИВАНИЕ ОБРАБОТЧИКОВ НА КНОПКИ "УДАЛИТЬ" ----------
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);  // ID удаляемого товара
            if (confirm('Удалить товар?')) {           // Запрос подтверждения
                deleteProduct(id);                     // Вызов функции удаления из data.js
                renderProductsTable();                 // Перерисовываем таблицу
                // Изменения в localStorage автоматически подхватятся на других страницах при обновлении
            }
        });
    });
}

// ---------- 8. ЗАПОЛНЕНИЕ ФОРМЫ ДЛЯ РЕДАКТИРОВАНИЯ ----------
/**
 * Находит товар по ID и подставляет его данные в поля формы.
 * Меняет текст кнопки сохранения на "Обновить".
 */
function editProduct(id) {
    const product = products.find(p => p.id === id);  // Ищем товар в массиве
    if (!product) return;                             // Если не найден — выходим

    // Заполняем поля формы
    productIdInput.value = product.id;                 // Сохраняем ID в скрытое поле
    productNameInput.value = product.name;
    productCategoryInput.value = product.category;
    productPriceInput.value = product.price;
    productImageInput.value = product.image;
    productDescriptionInput.value = product.description || '';
    saveBtn.textContent = 'Обновить';                  // Меняем надпись на кнопке
}

// ---------- 9. СБРОС ФОРМЫ ----------
/**
 * Очищает все поля формы, удаляет ID и возвращает кнопке текст "Сохранить".
 */
function resetForm() {
    productForm.reset();                    // Сбрасываем значения полей к начальным
    productIdInput.value = '';              // Явно очищаем скрытое поле ID
    saveBtn.textContent = 'Сохранить';      // Возвращаем исходный текст кнопки
}

// ---------- 10. СОХРАНЕНИЕ (ДОБАВЛЕНИЕ / ОБНОВЛЕНИЕ) ----------
productForm.addEventListener('submit', (e) => {
    e.preventDefault();                     // Отменяем стандартную отправку формы

    // Собираем объект с данными из полей
    const productData = {
        name: productNameInput.value.trim(),            // Убираем лишние пробелы
        category: productCategoryInput.value,
        price: parseInt(productPriceInput.value),       // Преобразуем в число
        image: productImageInput.value.trim(),
        description: productDescriptionInput.value.trim()
    };

    const id = productIdInput.value ? parseInt(productIdInput.value) : null;  // Если есть ID — редактирование, иначе добавление

    if (id) {
        // ---------- ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕГО ТОВАРА ----------
        if (updateProduct(id, productData)) {           // Вызов функции из data.js
            showNotification('Товар обновлён', 'success');
        } else {
            showNotification('Ошибка обновления', 'error');
        }
    } else {
        // ---------- ДОБАВЛЕНИЕ НОВОГО ТОВАРА ----------
        addProduct(productData);                        // Вызов функции из data.js
        showNotification('Товар добавлен', 'success');
    }

    resetForm();                           // Очищаем форму
    // Показать панель управления товарами, скрыть панель покупателей
// Показать панель управления товарами
function showProductsPanel() {
    // Показываем все обычные контейнеры админки
    document.querySelectorAll('.admin-container:not(#customersPanel)').forEach(el => el.style.display = 'block');
    // Скрываем панель покупателей
    if (customersPanel) customersPanel.style.display = 'none';
}

// Показать панель покупателей
function showCustomersPanel() {
    // Скрываем все обычные контейнеры
    document.querySelectorAll('.admin-container:not(#customersPanel)').forEach(el => el.style.display = 'none');
    // Показываем панель покупателей
    if (customersPanel) customersPanel.style.display = 'block';
    // Отрисовываем таблицу заказов
    renderOrdersTable();
}
// Показать панель покупателей, скрыть панели товаров
function showCustomersPanel() {
    document.querySelectorAll('.admin-container:not(#customersPanel)').forEach(el => el.style.display = 'none');
    customersPanel.style.display = 'block';
}
    renderProductsTable();                 // Обновляем таблицу
});

// ==================== УПРАВЛЕНИЕ ПАНЕЛЯМИ (ТОВАРЫ / ПОКУПАТЕЛИ) ====================

function showProductsPanel() {
    // Показываем все обычные контейнеры админки (кроме панели покупателей)
    document.querySelectorAll('.admin-container:not(#customersPanel)').forEach(el => el.style.display = 'block');
    if (customersPanel) customersPanel.style.display = 'none';
}

function showCustomersPanel() {
    // Скрываем все обычные контейнеры
    document.querySelectorAll('.admin-container:not(#customersPanel)').forEach(el => el.style.display = 'none');
    if (customersPanel) customersPanel.style.display = 'block';
    renderOrdersTable();
}

// ==================== ОТОБРАЖЕНИЕ ЗАКАЗОВ ====================

function renderOrdersTable() {
    if (!ordersTableBody) return;

    const orders = JSON.parse(localStorage.getItem('furniture_orders')) || [];

    if (orders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Заказов пока нет</td></tr>';
        return;
    }

    // Сортируем по дате (новые сверху)
    orders.sort((a, b) => b.id - a.id);

    ordersTableBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.date}</td>
            <td>${order.customerName}</td>
            <td>${order.phone}</td>
            <td>${order.total.toLocaleString()} ₽</td>
            <td>
                <button class="btn-small btn" data-order-id="${order.id}" data-action="view-order">📄</button>
            </td>
        </tr>
    `).join('');

    // Обработчики кнопок просмотра деталей
    document.querySelectorAll('[data-action="view-order"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = parseInt(e.target.dataset.orderId);
            showOrderDetails(orderId);
        });
    });
}

function showOrderDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem('furniture_orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let itemsText = '';
    order.items.forEach(item => {
        itemsText += `${item.name} x ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} ₽\n`;
    });

    const message = `
Заказ #${order.id}
Дата: ${order.date}
Покупатель: ${order.customerName}
Телефон: ${order.phone}
Адрес: ${order.address}

Состав заказа:
${itemsText}
----------------
Итого: ${order.total.toLocaleString()} ₽
    `;

    alert(message);
}

// ---------- 11. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ----------
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateCartCount();

    // Обработчики для раздела покупателей
    if (customersBtn) {
        customersBtn.addEventListener('click', showCustomersPanel);
    }
    if (backToProductsBtn) {
        backToProductsBtn.addEventListener('click', showProductsPanel);
    }
});