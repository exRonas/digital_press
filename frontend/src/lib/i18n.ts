import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// In a real app, move these to public/locales/ru/translation.json
const resources = {
  ru: {
    translation: {
      // Header
      "site.title": "Цифровой банк печати",
      "site.subtitle": "Toraigyrov Kitaphanasy",
      "accessibility": "Доступность",
      
      // Home
      "hero.title": "Цифровой банк печати Павлодарской области",
      "hero.description": "Добро пожаловать в цифровой архив отсканированных газет. Здесь вы можете найти и просмотреть исторические выпуски газет в формате PDF.",
      "search.placeholder": "Поиск по названию...",
      "search.button": "Найти",
      "filter.newspaper": "Название издания",
      "filter.dateFrom": "Дата от",
      "filter.dateTo": "Дата до",
      "filter.allNewspapers": "Все издания",
      "recent.title": "Недавно добавленные выпуски",
      "recent.viewAll": "Смотреть все",
      
      // Catalog
      "catalog.title": "Каталог газет и журналов",
      "catalog.subtitle": "Архив газет и журналов",
      "catalog.filters": "Фильтры",
      "catalog.search": "Поиск",
      "catalog.year": "Год",
      "catalog.month": "Месяц",
      "catalog.newspaper": "Издание",
      "catalog.select_newspaper": "Выберите издание",
      "catalog.select_year": "Выберите год",
      "catalog.select_month": "Выберите месяц",
      "catalog.issueNumber": "Номер выпуска",
      "catalog.language": "Язык",
      "catalog.allLanguages": "Все языки",
      "catalog.apply": "Применить",
      "catalog.reset": "Сбросить",
      "catalog.results": "результатов",
      "catalog.noResults": "Издания не найдены",
      "catalog.view": "Просмотр",
      "catalog.download": "Скачать",
      "catalog.issue": "Выпуск",
      "catalog.all_years": "Все годы",
      "catalog.all_months": "Все месяцы",
      "catalog.search_placeholder": "Название или номер...",
      "catalog.showing": "Показано",
      "catalog.of": "из",
      
      // Publication
      "publication.history": "История издания",
      "publication.histories_description": "История создания и развития периодических изданий",
      "publication.no_history": "История этого издания пока не добавлена",
      "publication.view_issues": "Смотреть выпуски",
      "publication.issues_available": "Всего доступно выпусков",
      "publication.go_to_catalog": "Перейти в каталог",
      
      // Document
      "document.breadcrumb.home": "Главная",
      "document.breadcrumb.catalog": "Каталог",
      "document.download": "Скачать PDF",
      "document.date": "Дата выпуска",
      "document.issue": "Номер выпуска",
      "document.language": "Язык",
      "document.not_found": "Документ не найден",
      "document.back_to_catalog": "Вернуться в каталог",
      "document.views": "Просмотров",
      "document.downloads": "Скачиваний",
      "document_read_online": "Читать онлайн",
      
      // Footer
      "footer.copyright": "Все права защищены",
      "footer.library": "Toraigyrov Kitaphanasy",
      "footer.histories": "История изданий",
      
      // Publication
      "publication.back_to_histories": "К списку историй",
      "publication.read_more": "Читать историю",

      // Admin
      "admin.dashboard": "Панель управления",
      "admin.documents": "Документы",
      "admin.upload": "Загрузить выпуск",
      "admin.statistics": "Статистика",
      "admin.users": "Пользователи",
      "admin.title": "Название",
      "admin.date": "Дата",
      "admin.views": "Просмотры",
      "admin.downloads": "Загрузки",
      "admin.actions": "Действия",
      "admin.edit": "Редактировать",
      "admin.delete": "Удалить",
      "admin.rerunOCR": "Повторить OCR",
      "admin.uploadTitle": "Загрузка нового выпуска",
      "admin.dropzone": "Перетащите PDF файл сюда или нажмите для выбора",
      "admin.metadata": "Метаданные",
      "admin.save": "Сохранить",
      "admin.cancel": "Отмена",
      
      // Viewer
      "viewer.page_counter": "Стр. {{current}} из {{total}}",
      "viewer.reading_mode": "Режим чтения",
      "viewer.loading": "Загрузка документа...",

      // Common
      "language.ru": "Русский",
      "language.kz": "Казахский",
      
      // Months
      "months.january": "январь",
      "months.february": "февраль",
      "months.march": "март",
      "months.april": "апрель",
      "months.may": "май",
      "months.june": "июнь",
      "months.july": "июль",
      "months.august": "август",
      "months.september": "сентябрь",
      "months.october": "октябрь",
      "months.november": "ноябрь",
      "months.december": "декабрь"
    }
  },
  kz: {
    translation: {
      // Header
      "site.title": "Цифрлық баспа банкі",
      "site.subtitle": "Toraigyrov Kitaphanasy",
      "accessibility": "Қолжетімділік",
      
      // Home
      "hero.title": "Павлодар облысының цифрлық баспа банкі",
      "hero.description": "Сканерленген газеттердің цифрлық мұрағатына қош келдіңіз. Мұнда сіз тарихи газет шығарылымдарын PDF форматында таба және қарай аласыз.",
      "search.placeholder": "Басылым атауы бойынша іздеу...",
      "search.button": "Табу",
      "filter.newspaper": "Басылым атауы",
      "filter.dateFrom": "Күні бастап",
      "filter.dateTo": "Күні дейін",
      "filter.allNewspapers": "Барлық басылымдар",
      "recent.title": "Жақында қосылған шығарылымдар",
      "recent.viewAll": "Барлығын көру",
      
      // Catalog
      "catalog.title": "Басылымдар каталогы",
      "catalog.subtitle": "Басылымдар мұрағаты",
      "catalog.filters": "Сүзгілер",
      "catalog.search": "Іздеу",
      "catalog.year": "Жыл",
      "catalog.month": "Ай",
      "catalog.newspaper": "Басылым",
      "catalog.select_newspaper": "Басылымды таңдаңыз",
      "catalog.select_year": "Жылды таңдаңыз",
      "catalog.select_month": "Айды таңдаңыз",
      "catalog.issueNumber": "Шығарылым нөмірі",
      "catalog.language": "Тіл",
      "catalog.allLanguages": "Барлық тілдер",
      "catalog.apply": "Қолдану",
      "catalog.reset": "Қалпына келтіру",
      "catalog.results": "нәтиже",
      "catalog.noResults": "Газеттер табылмады",
      "catalog.view": "Қарау",
      "catalog.download": "Жүктеу",
      "catalog.issue": "Шығарылым",
      "catalog.all_years": "Барлық жылдар",
      "catalog.all_months": "Барлық айлар",
      "catalog.search_placeholder": "Атауы немесе нөмір...",
      "catalog.showing": "Көрсетілді:",
      "catalog.of": "/",

      // Publication
      "publication.history": "Басылым тарихы",
      "publication.histories_description": "Басылымдардың шығу тарихы мен қызықты деректер",
      "publication.no_history": "Бұл басылым туралы тарихи мәлімет әлі қосылмаған",
      "publication.view_issues": "Шығарылымдарды қарау",
      "publication.issues_available": "Барлығы қол жетімді шығарылымдар",
      "publication.go_to_catalog": "Каталогқа өту",
      "publication.back_to_histories": "Тарихтар тізіміне",
      "publication.read_more": "Толығырақ оқу",

      // Document
      "document.breadcrumb.home": "Басты бет",
      "document.breadcrumb.catalog": "Каталог",
      "document.download": "PDF жүктеу",
      "document.date": "Шығарылған күні",
      "document.issue": "Шығарылым нөмірі",
      "document.language": "Тіл",
      "document.not_found": "Құжат табылмады",
      "document.back_to_catalog": "Каталогқа оралу",
      "document.views": "Қаралды",
      "document.downloads": "Жүктелді",
      "document_read_online": "Онлайн оқу",

      // Footer
      "footer.copyright": "Барлық құқықтар қорғалған",
      "footer.library": "Toraigyrov Kitaphanasy",
      "footer.histories": "Басылымдар тарихы",

      // Admin
      "admin.dashboard": "Басқару тақтасы",
      "admin.documents": "Құжаттар",
      "admin.upload": "Шығарылымды жүктеу",
      "admin.statistics": "Статистика",
      "admin.users": "Пайдаланушылар",
      "admin.title": "Атауы",
      "admin.date": "Күні",
      "admin.views": "Қаралымдар",
      "admin.downloads": "Жүктеулер",
      "admin.actions": "Әрекеттер",
      "admin.edit": "Өңдеу",
      "admin.delete": "Жою",
      "admin.rerunOCR": "OCR қайталау",
      "admin.uploadTitle": "Жаңа шығарылымды жүктеу",
      "admin.dropzone": "PDF файлын осында сүйреңіз немесе таңдау үшін басыңыз",
      "admin.metadata": "Метадеректер",
      "admin.save": "Сақтау",
      "admin.cancel": "Болдырмау",

      // Viewer
      "viewer.page_counter": "{{current}} / {{total}} бет",
      "viewer.reading_mode": "Оқу режимі",
      "viewer.loading": "Құжат жүктелуде...",

      // Common
      "language.ru": "Орыс тілі",
      "language.kz": "Қазақ тілі",

      // Months
      "months.january": "қаңтар",
      "months.february": "ақпан",
      "months.march": "наурыз",
      "months.april": "сәуір",
      "months.may": "мамыр",
      "months.june": "маусым",
      "months.july": "шілде",
      "months.august": "тамыз",
      "months.september": "қыркүйек",
      "months.october": "қазан",
      "months.november": "қараша",
      "months.december": "желтоқсан"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ru",
    fallbackLng: "ru",
    keySeparator: false, 
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
