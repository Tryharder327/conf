Студенческий проект - Информационная система для регистрации, отслеживания и организации научных и бизнес-конференций.

🛠 Технологический стек
Node.js - основа структуры , вся логика там
Express - аналог популярного PHP
SQLite - для создания портативной БД
EJS - Шаблоны страниц сайта
Bootstrap - Стилизация и готовые CSS шаблоны
📂 Структура проекта
conferences_rf/
│
├── 📄 package.json                    ← зависимости и скрипты
├── 📄 package-lock.json               ← фиксация версий
├── 📄 .gitignore                      ← исключения Git
├── 📄 server.js                       ← точка входа, маршруты Express
├── 📄 db.js                           ← подключение к БД + классы
├── 📄 conf.db                         ←  скомпилированный файл базы данных SQLite
│
├── 📁 views/                          ← шаблоны EJS
│   ├── 📄 header.ejs                  ← Заголовок сайта
│   ├── 📄 footer.ejs                  ← Подвал сайта
│   ├── 📄 auth.ejs                    ←  моды: регистрация + вход
│   ├── 📄 rooms.ejs                   ← список комнат
│   ├── 📄 requests_list.ejs           ← список заявок
│   ├── 📄 create_request.ejs          ← форма заявки
│   └── 📄 request_detail.ejs          ← детали заявки
│
├── 📁 public/                         ← статика
│   ├── 📁 css/
│   │   ├── 📄 bootstrap.min.css       ← Bootstrap 5.3
│   │   └── 📄 style.css               ← кастомные стили
│   ├── 📁 js/
│   │   └── 📄 bootstrap.bundle.min.js ← JS-часть Bootstrap
│   └── 📁 img/
│       └── 📄 favicon.ico             ← иконка вкладки
│
├── 📁 docs/                           ← документация
│   ├── 📄 er_diagram.png              ← ER-диаграмма
│   ├── 📄 schema.sql                  ← SQL-дамп
│   └── 📄 README.md                   ← описание проекта
│
└── 📁 node_modules/                   ← зависимости
    ├── 📁 express/
    ├── 📁 express-session/
    ├── 📁 ejs/
    ├── 📁 better-sqlite3/
    └── 📁 bcryptjs/
🚀 Запуск страниц
npm start → http://localhost:3000