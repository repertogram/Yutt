// ==================== МОДУЛЬ УПРАВЛЕНИЯ ТОВАРАМИ (DATA.JS) ====================
// Отвечает за хранение, загрузку, добавление, обновление и удаление товаров.
// Данные сохраняются в localStorage под ключом STORAGE_KEY.
// Также содержит механизм синхронизации между вкладками через событие 'storage'.

// ---------- 1. КОНСТАНТЫ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ----------

/** Ключ для хранения массива товаров в localStorage */
const STORAGE_KEY = 'furniture_products';

/** Начальный набор товаров, используемый при первом запуске или сбросе данных */
const defaultProducts = [
    {
        id: 1,
        name: "Диван «Комфорт»",
        category: "soft",
        price: 45990,
        image: "sofa.jpg",
        description: "Этот диван привлекает внимание своей яркой оранжевой обивкой, которая добавит жизнерадостности любому интерьеру. Удобные подушки и компактные размеры делают его идеальным выбором для небольших помещений. Металлические ножки придают легкость и современность дизайну. Такой диван станет ярким акцентом в гостиной или зоне отдыха.",
        featured: true
    },
    {
        id: 2,
        name: "Кровать «Соня»",
        category: "bedroom",
        price: 32900,
        image: "bed.png",
        description: "Эта кровать премиум-класса станет настоящим украшением вашей спальни. Качественный матрас обеспечивает ортопедическую поддержку, гарантируя здоровый сон. Элегантная спинка с мягкими вставками создает ощущение роскоши и комфорта. Темно-коричневый каркас добавляет изысканности и долговечности. Подходящее решение для тех, кто ценит качество и уют своего спального места.",
        featured: false
    },
    {
        id: 3,
        name: "Стол обеденный, деревянный",
        category: "dining",
        price: 18990,
        image: "table.jpg",
        description: "Этот стол обладает мощным и лаконичным дизайном, выполненным в черном цвете. Массивная столешница и основание создают впечатление надежности и прочности. Структура стола подчеркивает его устойчивость и долговечность. Подходит для столовой зоны или рабочего кабинета, придавая помещению строгий и стильный вид.",
        featured: false
    },
    {
        id: 4,
        name: "Шкаф «Нарния»",
        category: "storage",
        price: 52400,
        image: "wardrobe.jpg",
        description: "Обычный шкаф в нарнию.",
        featured: false
    },
    {
        id: 5,
        name: "Кресло «Релакс»",
        category: "soft",
        price: 21700,
        image: "armchair.jpg",
        description: "Это элегантное кресло сочетает в себе современный дизайн и комфорт. Обивка из прочной ткани серого цвета придает изделию стильный вид, а удобные подлокотники обеспечивают дополнительную поддержку. Черные металлические ножки добавляют легкости и устойчивости конструкции. Идеально подойдет для гостиной или домашнего офиса, создавая атмосферу уюта и стиля.",
        featured: false
    },
    {
        id: 6,
        name: "Комод «Винтаж»",
        category: "storage",
        price: 14900,
        image: "dresser.png",
        description: "Этот комод выполнен в стиле минимализм, что делает его универсальным элементом интерьера. Три вместительных выдвижных ящика позволят организовать хранение вещей. Лаконичный белый цвет легко впишется в любой декор, будь то спальня, гостиная или прихожая. Простота линий и функциональность делают этот комод незаменимым помощником в организации пространства.",
        featured: false
    },
    {
        id: 11,
        name: "Кровать «Атлант»",
        category: "bedroom",
        price: 47800,
        image: "bed2.jpeg",
        description: "Двуспальная кровать с высоким изголовьем и мягкими вставками из экокожи. Основание с ламелями обеспечивает ортопедическую поддержку. Цвет – серый.",
        featured: false
    },
    {
        id: 12,
        name: "Диван-кровать «Орфей»",
        category: "soft",
        price: 38700,
        image: "sofa2.jpeg",
        description: "Раскладной диван с механизмом «аккордеон». В собранном виде занимает минимум места, в разложенном — полноценное спальное место. Обивка — рогожка.",
        featured: false
    },
    {
        id: 13,
        name: "Письменный стол «Студент»",
        category: "dining",
        price: 7400,
        image: "desk.jpeg",
        description: "Компактный письменный стол с ящиком для канцелярии. Изготовлен из ЛДСП, цвет — белый/дуб. Подходит для рабочего кабинета или детской комнаты.",
        featured: false
    },
    {
        id: 14,
        name: "Зеркало «Элегия»",
        category: "storage",
        price: 5300,
        image: "mirror.jpeg",
        description: "Настенное зеркало в алюминиевой раме с фацетом. Размер 60х80 см. Может использоваться в прихожей, спальне или ванной комнате.",
        featured: false
    },
    {
        id: 15,
        name: "Кресло-качалка «Бабушкино»",
        category: "soft",
        price: 15300,
        image: "rocking.jpeg",
        description: "Уютное кресло-качалка с подушкой на сиденье. Каркас из ротанга, обивка — хлопок. Идеально для отдыха на веранде или в гостиной.",
        featured: false
    },
    {
        id: 16,
        name: "Журнальный столик «Квадро»",
        category: "dining",
        price: 6200,
        image: "coffee.jpeg",
        description: "Журнальный столик с двумя ящиками. Столешница из закалённого стекла, ножки — хромированный металл. Современный дизайн.",
        featured: false
    }
];

/**
 * Глобальный массив товаров.
 * Изначально загружается из localStorage. Если данных нет, используется defaultProducts.
 * @type {Array<Object>}
 */
let products = JSON.parse(localStorage.getItem(STORAGE_KEY));

// Если массив пуст или отсутствует, инициализируем его значениями по умолчанию и сохраняем
if (!products || products.length === 0) {
    products = defaultProducts;
    saveProducts();      // Сохраняем начальные товары в localStorage
}

// ---------- 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----------

/**
 * Искусственно вызывает событие 'storage' для текущей вкладки.
 * Необходимо для того, чтобы изменения, сделанные в текущей вкладке (например, в админке),
 * немедленно отразились на других частях интерфейса этой же вкладки (главная, каталог),
 * так как браузерное событие storage срабатывает только при изменении localStorage из другой вкладки.
 */
function triggerStorageUpdate() {
    // Создаём объект StorageEvent с данными об изменении ключа STORAGE_KEY
    const event = new StorageEvent('storage', {
        key: STORAGE_KEY,                                      // Ключ, который изменился
        newValue: localStorage.getItem(STORAGE_KEY),           // Новое значение (текущее содержимое)
        oldValue: null,                                        // Старое значение не указываем
        url: window.location.href                              // URL страницы, где произошло изменение
    });
    window.dispatchEvent(event);                               // Отправляем событие глобально
}

/**
 * Сохраняет текущий массив products в localStorage.
 */
function saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

/**
 * Возвращает максимальный ID среди существующих товаров.
 * Используется для генерации нового уникального идентификатора при добавлении товара.
 * @returns {number} Максимальный ID или 0, если массив пуст
 */
function getMaxId() {
    return products.reduce((max, p) => Math.max(max, p.id), 0);
}

// ---------- 3. CRUD-ОПЕРАЦИИ С ТОВАРАМИ ----------

/**
 * Добавляет новый товар в массив и сохраняет изменения.
 * Генерирует новый ID автоматически.
 * @param {Object} product - Объект с данными товара (без id)
 * @returns {Object} Созданный объект товара с присвоенным id
 */
function addProduct(product) {
    const newId = getMaxId() + 1;                 // Вычисляем следующий ID
    const newProduct = { 
        ...product, 
        id: newId,
        featured: product.featured !== undefined ? product.featured : true  // по умолчанию true
    };
    products.push(newProduct);                    // Добавляем в конец массива
    saveProducts();                               // Сохраняем в localStorage
    triggerStorageUpdate();                       // Оповещаем текущую вкладку об изменении
    return newProduct;                            // Возвращаем созданный товар
}

/**
 * Обновляет существующий товар по ID.
 * @param {number} id - ID товара для обновления
 * @param {Object} updatedData - Объект с полями, которые нужно изменить
 * @returns {boolean} true, если товар найден и обновлён, иначе false
 */
function updateProduct(id, updatedData) {
    const index = products.findIndex(p => p.id === id); // Ищем индекс товара по ID
    if (index !== -1) {
        // Объединяем старый объект с новыми данными (поверхностное копирование)
        products[index] = { ...products[index], ...updatedData };
        saveProducts();                // Сохраняем изменения
        triggerStorageUpdate();        // Оповещаем об изменении (добавлено для единообразия)
        return true;
    }
    return false;
}

/**
 * Удаляет товар по ID.
 * @param {number} id - ID товара для удаления
 * @returns {boolean} true, если товар был удалён, иначе false
 */
function deleteProduct(id) {
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);  // Оставляем все товары, кроме удаляемого
    if (products.length !== initialLength) {       // Если длина изменилась, значит товар был удалён
        saveProducts();                            // Сохраняем новый массив
        triggerStorageUpdate();                    // Оповещаем об изменении
        return true;
    }
    return false;
}

// ---------- 4. ВСПОМОГАТЕЛЬНЫЙ МАППИНГ КАТЕГОРИЙ ----------

/** Объект для преобразования ключа категории в читаемое название (используется в интерфейсе) */
const categoryNames = {
    soft: 'Мягкая мебель',
    bedroom: 'Спальня',
    dining: 'Столовая',
    storage: 'Хранение'
};


// ---------- 5. ФУНКЦИЯ ДЛЯ ПРАВИЛЬНОГО ПУТИ К КАРТИНКЕ (ГЛОБАЛЬНАЯ) ----------
/**
 * Возвращает корректный относительный путь к изображению.
 * Для главной страницы (index.html) возвращает "images/имя_файла".
 * Для страниц в папке html/ возвращает "../images/имя_файла".
 */
    function getImagePath(imageName) {
    // Определяем, где мы находимся: в корне или в папке html/
    const isInHtmlFolder = window.location.pathname.includes('/html/');
    const basePath = isInHtmlFolder ? '../images/' : 'images/';
    return basePath + imageName;
}



// ---------- 6. СИНХРОНИЗАЦИЯ МЕЖДУ ВКЛАДКАМИ ----------

/**
 * Обработчик события 'storage', которое срабатывает при изменении localStorage
 * в другой вкладке или окне с тем же origin.
 * Обновляет глобальный массив products и вызывает перерисовку интерфейса.
 */
window.addEventListener('storage', (e) => {
    // Проверяем, что изменился именно наш ключ с товарами
    if (e.key === STORAGE_KEY) {
        // Загружаем актуальный массив из localStorage (или defaultProducts, если вдруг null)
        products = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultProducts;

        // Если на странице доступна функция renderCatalog (из catalog.js), перерисовываем каталог
        if (typeof renderCatalog === 'function') {
            renderCatalog(currentFilter);   // currentFilter — глобальная переменная из catalog.js
        }

        // Если доступна renderPopular (из главной страницы), обновляем блок популярных товаров
        if (typeof renderPopular === 'function') {
            renderPopular();
        }

        // Обновляем счётчик корзины, так как удалённый товар мог быть в корзине
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
    }
});