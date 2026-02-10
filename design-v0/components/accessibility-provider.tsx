"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

type Language = "ru" | "kz"

interface AccessibilityContextType {
  highContrast: boolean
  toggleHighContrast: () => void
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Header
    "site.title": "Цифровой банк печати",
    "site.subtitle": "Toraigyrov Kitaphanasy",
    accessibility: "Доступность",
    // Home
    "hero.title": "Цифровой банк печати Павлодарской области",
    "hero.description":
      "Добро пожаловать в цифровой архив отсканированных газет. Здесь вы можете найти и просмотреть исторические выпуски газет в формате PDF.",
    "search.placeholder": "Поиск по названию газеты...",
    "search.button": "Найти",
    "filter.newspaper": "Название газеты",
    "filter.dateFrom": "Дата от",
    "filter.dateTo": "Дата до",
    "filter.allNewspapers": "Все газеты",
    "recent.title": "Недавно добавленные выпуски",
    "recent.viewAll": "Смотреть все",
    // Catalog
    "catalog.title": "Каталог газет и журналов",
    "catalog.filters": "Фильтры",
    "catalog.issueNumber": "Номер выпуска",
    "catalog.language": "Язык",
    "catalog.allLanguages": "Все языки",
    "catalog.apply": "Применить",
    "catalog.reset": "Сбросить",
    "catalog.results": "результатов",
    "catalog.noResults": "Газеты не найдены",
    "catalog.view": "Просмотр",
    "catalog.download": "Скачать",
    "catalog.issue": "Выпуск",
    // Document
    "document.breadcrumb.home": "Главная",
    "document.breadcrumb.catalog": "Каталог",
    "document.download": "Скачать PDF",
    "document.date": "Дата выпуска",
    "document.issue": "Номер выпуска",
    "document.language": "Язык",
    // Footer
    "footer.copyright": "Все права защищены",
    "footer.histories": "История изданий",
    // Admin    "footer.library": "Toraigyrov Kitaphanasy",
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
  },
  kz: {
    // Header
    "site.title": "Цифрлық баспа банкі",
    "site.subtitle": "Toraigyrov Kitaphanasy",
    accessibility: "Қолжетімділік",
    // Home
    "hero.title": "Павлодар облысының цифрлық баспа банкі",
    "hero.description":
      "Сканерленген газеттердің цифрлық мұрағатына қош келдіңіз. Мұнда сіз тарихи газет шығарылымдарын PDF форматында таба және қарай аласыз.",
    "search.placeholder": "Газет атауы бойынша іздеу...",
    "search.button": "Табу",
    "filter.newspaper": "Газет атауы",
    "filter.dateFrom": "Күні бастап",
    "filter.dateTo": "Күні дейін",
    "filter.allNewspapers": "Барлық газеттер",
    "recent.title": "Жақында қосылған шығарылымдар",
    "recent.viewAll": "Барлығын көру",
    // Catalog
    "catalog.title": "Газеттер мен журналдар каталогы",
    "catalog.filters": "Сүзгілер",
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
    // Document
    "document.breadcrumb.home": "Басты бет",
    "document.breadcrumb.catalog": "Каталог",
    "document.download": "PDF жүктеу",
    "document.date": "Шығарылым күні",
    "document.issue": "Шығарылым нөмірі",
    "document.language": "Тіл",
    // Footer
    "footer.copyright": "Барлық құқықтар қорғалған",
    "footer.histories": "Басылымдар тарихы",
    // Admin    "footer.library": "Toraigyrov Kitaphanasy",
    // Admin
    "admin.dashboard": "Басқару панелі",
    "admin.documents": "Құжаттар",
    "admin.upload": "Шығарылым жүктеу",
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
    "admin.uploadTitle": "Жаңа шығарылым жүктеу",
    "admin.dropzone": "PDF файлды осында сүйреңіз немесе таңдау үшін басыңыз",
    "admin.metadata": "Метадеректер",
    "admin.save": "Сақтау",
    "admin.cancel": "Бас тарту",
  },
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(
  undefined
)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(false)
  const [language, setLanguage] = useState<Language>("ru")

  useEffect(() => {
    const savedContrast = localStorage.getItem("highContrast")
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedContrast === "true") {
      setHighContrast(true)
      document.documentElement.classList.add("high-contrast")
    }
    if (savedLanguage && (savedLanguage === "ru" || savedLanguage === "kz")) {
      setLanguage(savedLanguage)
    }
  }, [])

  const toggleHighContrast = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    localStorage.setItem("highContrast", String(newValue))
    if (newValue) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }
  }

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
    document.documentElement.lang = lang
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        language,
        setLanguage: handleSetLanguage,
        t,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    )
  }
  return context
}
