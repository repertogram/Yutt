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

// ---------- 3. ПРОВЕРКА СТАТУСА АВТОРИЗАЦИИ ----------
/**
 * Проверяет, сохранён ли флаг авторизации в sessionStorage.
 * Если да — показывает панель управления и скрывает форму входа.
 * Иначе — показывает форму входа и скрывает панель.
 */
function checkAuth() {
    const isAuth = sessionStorage.getItem('adminAuth') === 'true';  // Читаем флаг из sessionStorage
    if (isAuth) {
        loginBlock.style.display = 'none';      // Скрываем блок входа
        adminPanel.style.display = 'block';     // Показываем панель управления
        renderProductsTable();                  // Отрисовываем таблицу товаров
    } else {
        loginBlock.style.display = 'block';     // Показываем форму входа
        adminPanel.style.display = 'none';      // Скрываем панель управления
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
    renderProductsTable();                 // Обновляем таблицу
});

// ---------- 11. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ----------
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();                // Проверяем авторизацию и показываем нужный блок
    updateCartCount();          // Обновляем счётчик товаров в шапке (функция из cart.js)
});