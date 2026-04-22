// ==================== МОДУЛЬ УПРАВЛЕНИЯ ТОВАРАМИ (SUPABASE) ====================
// Этот скрипт отвечает за загрузку, добавление, обновление и удаление товаров
// через облачную базу данных Supabase. Раньше данные хранились в localStorage,
// но теперь всё перенесено в настоящую БД.

// Глобальный массив, в котором будут храниться товары после загрузки с сервера
let products = [];

// Словарь для перевода технических ключей категорий в читаемые названия
// Используется при отображении категорий в интерфейсе
const categoryNames = {
    soft: 'Мягкая мебель',
    bedroom: 'Спальня',
    dining: 'Столовая',
    storage: 'Хранение'
};

// ---------- ЗАГРУЗКА ТОВАРОВ С СЕРВЕРА ----------
/**
 * Загружает все товары из таблицы 'products' в Supabase.
 * Сохраняет их в глобальную переменную products и вызывает перерисовку интерфейса.
 * @returns {Array} Массив товаров или undefined при ошибке
 */
async function loadProducts() {
    // Проверяем, что клиент Supabase (supabaseClient) уже создан и доступен
    if (!window.supabaseClient) {
        console.error('Supabase client не готов');   // выводим ошибку в консоль, если клиента нет
        return;                                      // прекращаем выполнение функции
    }

    // Выполняем запрос к Supabase: выбираем все поля из таблицы products,
    // сортируем по возрастанию id (чтобы товары шли по порядку)
    const { data, error } = await window.supabaseClient
        .from('products')           // обращаемся к таблице products
        .select('*')                // выбираем все столбцы
        .order('id', { ascending: true });   // сортировка по id от меньшего к большему

    // Если сервер вернул ошибку (например, проблемы с сетью или правами доступа)
    if (error) {
        console.error('Ошибка загрузки товаров:', error);   // логируем ошибку в консоль
        // Если на странице есть функция показа уведомлений, сообщаем пользователю
        if (typeof showNotification === 'function') {
            showNotification('Не удалось загрузить товары', 'error');
        }
        return;   // выходим, загрузка не удалась
    }

    // Сохраняем полученные данные в глобальный массив products
    products = data;

    // После успешной загрузки обновляем интерфейс:
    // если на странице есть каталог – перерисовываем его с текущим фильтром
    if (typeof renderCatalog === 'function') renderCatalog(currentFilter);
    // если на странице есть блок популярных товаров – обновляем и его
    if (typeof renderPopular === 'function') renderPopular();

    // Возвращаем массив товаров (может пригодиться)
    return products;
}

// ---------- ДОБАВЛЕНИЕ НОВОГО ТОВАРА ----------
/**
 * Добавляет новый товар в базу данных Supabase.
 * @param {Object} product - объект с полями товара (name, category, price, image, description, featured)
 * @returns {Object|null} Созданный товар (с присвоенным id) или null при ошибке
 */
async function addProduct(product) {
    // Проверяем наличие клиента Supabase
    if (!window.supabaseClient) return null;

    // Выполняем запрос на вставку одной записи и сразу возвращаем вставленную строку
    const { data, error } = await window.supabaseClient
        .from('products')
        .insert([product])          // передаём массив из одного объекта
        .select();                  // просим вернуть добавленную запись

    if (error) {
        console.error('Ошибка добавления:', error);
        showNotification && showNotification('Ошибка добавления товара', 'error');
        return null;
    }

    // Supabase возвращает массив добавленных записей, берём первый элемент
    const newProduct = data[0];
    // Добавляем новый товар в локальный массив products для синхронизации интерфейса
    products.push(newProduct);

    // Обновляем каталог и популярные товары, если соответствующие функции есть на странице
    if (typeof renderCatalog === 'function') renderCatalog(currentFilter);
    if (typeof renderPopular === 'function') renderPopular();

    // Показываем уведомление об успехе
    showNotification && showNotification(`Товар "${newProduct.name}" добавлен`, 'success');

    return newProduct;   // возвращаем созданный товар
}

// ---------- ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕГО ТОВАРА ----------
/**
 * Обновляет данные товара по его ID.
 * @param {number} id - идентификатор товара
 * @param {Object} updatedData - объект с полями, которые нужно изменить
 * @returns {boolean} true, если обновление прошло успешно, иначе false
 */
async function updateProduct(id, updatedData) {
    if (!window.supabaseClient) return false;

    // Выполняем запрос на обновление записи с указанным id
    const { data, error } = await window.supabaseClient
        .from('products')
        .update(updatedData)        // какие поля обновить
        .eq('id', id)               // условие: где id равен переданному
        .select();                  // возвращаем обновлённую запись

    if (error) {
        console.error('Ошибка обновления:', error);
        showNotification && showNotification('Ошибка обновления товара', 'error');
        return false;
    }

    const updatedProduct = data[0];                     // обновлённый товар с сервера
    const index = products.findIndex(p => p.id === id); // ищем индекс в локальном массиве
    if (index !== -1) {
        products[index] = updatedProduct;               // заменяем старый объект новым
    }

    // Обновляем интерфейс
    if (typeof renderCatalog === 'function') renderCatalog(currentFilter);
    if (typeof renderPopular === 'function') renderPopular();

    showNotification && showNotification(`Товар "${updatedProduct.name}" обновлён`, 'success');
    return true;
}

// ---------- УДАЛЕНИЕ ТОВАРА ----------
/**
 * Удаляет товар из базы данных по ID.
 * @param {number} id - идентификатор товара
 * @returns {boolean} true, если удаление успешно, иначе false
 */
async function deleteProduct(id) {
    if (!window.supabaseClient) return false;

    // Выполняем запрос на удаление записи с указанным id
    const { error } = await window.supabaseClient
        .from('products')
        .delete()
        .eq('id', id);               // удаляем только ту запись, у которой id совпадает

    if (error) {
        console.error('Ошибка удаления:', error);
        showNotification && showNotification('Ошибка удаления товара', 'error');
        return false;
    }

    // Удаляем товар из локального массива (фильтруем, оставляя все, кроме удаляемого)
    products = products.filter(p => p.id !== id);

    // Обновляем интерфейс
    if (typeof renderCatalog === 'function') renderCatalog(currentFilter);
    if (typeof renderPopular === 'function') renderPopular();

    showNotification && showNotification('Товар удалён', 'warning');
    return true;
}

// ---------- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПУТИ К ИЗОБРАЖЕНИЮ ----------
/**
 * Возвращает правильный относительный путь к файлу изображения.
 * Если страница находится в папке html/, добавляет "../" перед images/.
 * Это нужно для корректной загрузки картинок как с главной, так и из вложенных страниц.
 * @param {string} imageName - имя файла (например, "sofa.jpg")
 * @returns {string} полный путь, например "images/sofa.jpg" или "../images/sofa.jpg"
 */
function getImagePath(imageName) {
    // Проверяем, содержит ли текущий URL путь "/html/"
    const isInHtmlFolder = window.location.pathname.includes('/html/');
    // Если мы в папке html, то базовый путь – "../images/", иначе просто "images/"
    const basePath = isInHtmlFolder ? '../images/' : 'images/';
    // Склеиваем базовый путь с именем файла и возвращаем
    return basePath + imageName;
}