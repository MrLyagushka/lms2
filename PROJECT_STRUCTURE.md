# Структура проекта (Next.js 14 + Prisma + Tailwind + Zustand)

```
learning-platform/
├── prisma/
│   ├── schema.prisma               — модели User, TeacherProfile, StudentProfile, Homework, Task, Submission
│   ├── dev.db                      — SQLite-база данных (файл БД)
│   └── seed.ts                     — сиды: демо-учитель, демо-ученик, пример ДЗ
│
├── public/
│   └── favicon.ico                 — иконка сайта
│
├── src/
│   ├── app/                        — маршруты App Router
│   │   ├── layout.tsx              — корневой layout: <html>, шрифты, ThemeProvider, глобальные стили
│   │   ├── page.tsx                — лендинг / редирект на /login или /dashboard
│   │   ├── globals.css             — Tailwind-директивы + CSS-переменные тем (light/dark)
│   │   │
│   │   ├── (auth)/                 — группа публичных маршрутов
│   │   │   ├── layout.tsx          — центрированный card-layout для форм входа/регистрации
│   │   │   ├── login/
│   │   │   │   └── page.tsx        — страница входа (форма LoginForm)
│   │   │   └── register/
│   │   │       └── page.tsx        — страница регистрации (выбор роли Ученик/Учитель)
│   │   │
│   │   └── (dashboard)/            — группа защищённых маршрутов
│   │       ├── layout.tsx          — серверная проверка сессии + AppShell (sidebar/topbar)
│   │       ├── profile/
│   │       │   └── page.tsx        — личный профиль текущего пользователя (общий для обеих ролей)
│   │       │
│   │       ├── teacher/            — раздел учителя
│   │       │   ├── page.tsx        — дашборд учителя (сводка: ученики, активные ДЗ)
│   │       │   ├── students/
│   │       │   │   ├── page.tsx    — список привязанных учеников
│   │       │   │   └── [studentId]/
│   │       │   │       └── page.tsx— карточка/редактирование конкретного ученика
│   │       │   └── homework/
│   │       │       ├── page.tsx    — список созданных ДЗ
│   │       │       ├── new/
│   │       │       │   └── page.tsx— форма создания ДЗ (N задач, формулы, фото-требование)
│   │       │       └── [homeworkId]/
│   │       │           ├── page.tsx— просмотр ДЗ + прогресс/проверки учеников
│   │       │           └── edit/
│   │       │               └── page.tsx — редактирование ДЗ
│   │       │
│   │       └── student/            — раздел ученика
│   │           ├── page.tsx        — дашборд ученика (список назначенных ДЗ)
│   │           ├── connect/
│   │           │   └── page.tsx    — привязка к учителю по уникальному ID учителя
│   │           └── homework/
│   │               └── [homeworkId]/
│   │                   └── page.tsx— решение ДЗ: карточки задач, автосохранение, отправка
│   │
│   ├── components/                 — переиспользуемые UI-компоненты
│   │   ├── ui/                     — атомарные примитивы
│   │   │   ├── button.tsx          — кнопка (варианты: primary/secondary/ghost/destructive)
│   │   │   ├── input.tsx           — текстовый input
│   │   │   ├── textarea.tsx        — многострочный ввод (текст задачи с формулами)
│   │   │   ├── label.tsx           — подпись поля
│   │   │   ├── card.tsx            — контейнер-карточка
│   │   │   ├── badge.tsx           — бейджи статусов (new/in progress/submitted/checked)
│   │   │   ├── select.tsx          — нативный select (роль, фильтры)
│   │   │   ├── checkbox.tsx        — чекбокс (требование фото и т.п.)
│   │   │   ├── dialog.tsx          — модальное окно (подтверждения)
│   │   │   └── spinner.tsx         — индикатор загрузки
│   │   ├── forms/                  — формы (React Hook Form + Zod)
│   │   │   ├── login-form.tsx      — форма входа (email + пароль)
│   │   │   ├── register-form.tsx   — форма регистрации с выбором роли
│   │   │   ├── homework-form.tsx   — форма создания/редактирования ДЗ (родительская)
│   │   │   ├── task-form.tsx       — форма одной задачи (_repeatable_ внутри homework-form)
│   │   │   ├── student-edit-form.tsx— форма редактирования данных ученика учителем
│   │   │   └── solution-form.tsx   — форма ответов ученика (поле ввода + загрузка фото)
│   │   ├── layout/                 — компоненты оболочки
│   │   │   ├── app-shell.tsx       — каркас dashboard (sidebar + topbar + children)
│   │   │   ├── sidebar.tsx         — навигация по ролям (разные пункты для teacher/student)
│   │   │   ├── topbar.tsx          — шапка: имя пользователя, тема, выход
│   │   │   ├── theme-toggle.tsx    — переключатель тёмной/светлой темы
│   │   │   └── user-menu.tsx       — меню пользователя (аватар, logout Server Action)
│   │   ├── homework/               — доменные компоненты ДЗ
│   │   │   ├── homework-card.tsx   — карточка ДЗ в списке (title, дедлайн, статус)
│   │   │   ├── task-card.tsx       — карточка задачи при решении учеником
│   │   │   ├── formula-renderer.tsx— рендер текста задачи с математическими формулами
│   │   │   ├── autosave-indicator.tsx — индикатор «сохранено / сохраняем…» (debounce)
│   │   │   ├── photo-upload.tsx    — загрузка фото-решения учеником
│   │   │   ├── grade-summary.tsx   — сводка автопроверки (правильно/неправильно/баллы)
│   │   │   └── homework-list.tsx   — список ДЗ с фильтрами по статусу
│   │   └── profile/                — компоненты профилей
│   │       ├── teacher-profile.tsx — карточка профиля учителя (+ его уникальный ID для связи)
│   │       ├── student-profile.tsx — карточка профиля ученика
│   │       └── profile-header.tsx  — общая шапка профиля (имя, роль, email)
│   │
│   ├── lib/                        — утилиты и клиенты сервисов
│   │   ├── db.ts                   — singleton PrismaClient
│   │   ├── auth.ts                 — создание/верификация JWT, хеш/сравнение паролей (bcryptjs)
│   │   ├── session.ts              — getCurrentUser(): чтение сессии из cookie на сервере
│   │   ├── utils.ts                — cn() (clsx+tailwind-merge), formatDate(), генерация teacherId
│   │   └── constants.ts            — пути маршрутов, имена cookie, лимиты, тексты ошибок
│   │
│   ├── server/                     — Server Actions ('use server')
│   │   ├── auth.actions.ts         — registerAction, loginAction, logoutAction
│   │   ├── user.actions.ts         — updateProfileAction, connectToTeacherAction, editStudentAction
│   │   └── homework.actions.ts     — createHomeworkAction, saveSolutionDraftAction (автосейв), submitHomeworkAction (автопроверка)
│   │
│   ├── hooks/                      — кастомные React-хуки
│   │   ├── use-debounce.ts         — debounce-значение (для автосохранения ответов)
│   │   ├── use-autosave.ts         — хук автосохранения черновика решения через Server Action
│   │   └── use-theme.ts            — чтение/переключение темы (обёртка над ThemeProvider)
│   │
│   ├── store/                      — Zustand-сторы (только клиентский state)
│   │   ├── theme-store.ts          — текущая тема + persist в localStorage
│   │   ├── homework-draft-store.ts — локальный черновик создаваемого ДЗ (до отправки на сервер)
│   │   └── solution-store.ts       — ответы ученика в полёте (dirty-state, статус автосохранения)
│   │
│   ├── types/                      — глобальные TypeScript-типы
│   │   ├── index.ts                — re-export всех типов
│   │   ├── auth.types.ts           — SessionUser, UserRole enum, AuthState
│   │   ├── homework.types.ts       — HomeworkDTO, TaskDTO, SubmissionDTO, SubmissionStatus
│   │   └── api.types.ts            — ActionResult<T> (успех/ошибка) для Server Actions
│   │
│   └── validators/                 — Zod-схемы (валидация форм и действий)
│       ├── auth.schema.ts          — loginSchema, registerSchema
│       ├── homework.schema.ts      — homeworkSchema, taskSchema (формулы, опц. ответ, фото)
│       ├── solution.schema.ts      — answerSchema, photoSchema
│       └── user.schema.ts          — profileSchema, connectTeacherSchema
│
├── .env                            — DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_*
├── next.config.mjs                 — конфиг Next.js
├── tsconfig.json                   — strict: true, paths alias "@/*": ["./src/*"]
├── tailwind.config.ts              — darkMode: 'class', content-пути, theme-токены
├── postcss.config.mjs              — плагины tailwind/autoprefixer
├── package.json                    — зависимости и скрипты (dev, build, prisma:migrate, db:seed)
└── README.md                       — краткая документация проекта
```
