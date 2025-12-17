# Руководство по развёртыванию АСУ-Оповещение

## Требования

- Docker и Docker Compose
- Или: Node.js 20+, PostgreSQL 15+

## Production-зависимости

Основные зависимости для работы приложения:

### Backend
- `express` - веб-сервер
- `drizzle-orm` - ORM для PostgreSQL
- `pg` - драйвер PostgreSQL
- `passport` + `passport-local` - авторизация
- `bcryptjs` - хэширование паролей
- `express-session` + `connect-pg-simple` - сессии в PostgreSQL
- `axios` - HTTP-клиент для SMS API
- `node-cron` - планировщик задач
- `zod` - валидация данных
- `xlsx` - работа с Excel файлами

### Frontend
- `react` + `react-dom` - UI фреймворк
- `@tanstack/react-query` - управление серверным состоянием
- `wouter` - маршрутизация
- `tailwindcss` - стилизация
- Компоненты shadcn/ui (Radix UI)

## Развёртывание с Docker

### 1. Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd asu-opoveshchenie

# Создайте файл переменных окружения
cp .env.example .env
```

### 2. Настройка переменных окружения

Отредактируйте файл `.env`:

```env
# База данных
POSTGRES_USER=asu_user
POSTGRES_PASSWORD=<сильный-пароль>
POSTGRES_DB=asu_db

# Секрет сессий (обязательно измените!)
SESSION_SECRET=<ваш-уникальный-секрет-минимум-32-символа>

# SMS-PROSTO API
SMS_API_KEY=<ваш-api-ключ-от-sms-prosto>
SMS_SENDER=INFO
```

### 3. Запуск

```bash
# Сборка и запуск
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f app
```

> **Примечание:** Миграции базы данных запускаются **автоматически** при старте контейнера. Не нужно выполнять их вручную.

## Развёртывание без Docker

### 1. Установка зависимостей

```bash
npm ci --only=production
```

### 2. Сборка фронтенда

```bash
npm run build
```

### 3. Настройка PostgreSQL

Создайте базу данных и пользователя:

```sql
CREATE USER asu_user WITH PASSWORD 'your_password';
CREATE DATABASE asu_db OWNER asu_user;
```

### 4. Переменные окружения

```bash
export DATABASE_URL="postgresql://asu_user:your_password@localhost:5432/asu_db"
export SESSION_SECRET="your-secret-key"
export SMS_API_KEY="your-sms-api-key"
export SMS_SENDER="INFO"
export NODE_ENV="production"
export PORT="5000"
```

### 5. Миграция базы данных

```bash
# Применить миграции из папки migrations/
npx tsx server/migrate.ts

# Или использовать push (для разработки)
npm run db:push
```

### 6. Запуск

```bash
npm start
```

## Авторизация

Приложение использует **локальную авторизацию** по логину и паролю:
- Первый пользователь регистрируется на странице входа
- Пароли хэшируются с помощью bcrypt
- Сессии хранятся в PostgreSQL

> **Примечание:** Replit OIDC не используется. Авторизация полностью локальная.

## API SMS-PROSTO

Для отправки SMS необходим API-ключ от сервиса [sms-prosto.ru](https://sms-prosto.ru):
1. Зарегистрируйтесь на сайте
2. Получите API-ключ в личном кабинете
3. Укажите его в переменной `SMS_API_KEY`

## Проверка работоспособности

```bash
# Health check
curl http://localhost:5000/api/health

# Ожидаемый ответ:
# {"status":"ok","timestamp":"2024-12-17T12:00:00.000Z"}
```

## Миграции базы данных

Файлы миграций находятся в папке `migrations/`:

```
migrations/
  ├── 0000_rainy_black_crow.sql   # Начальная миграция
  ├── meta/
  │   ├── _journal.json           # Журнал миграций
  │   └── 0000_snapshot.json      # Снимок схемы
```

### Генерация новых миграций

При изменении схемы в `shared/schema.ts`:

```bash
# Генерация SQL миграции
npx drizzle-kit generate

# Применение миграций
npx tsx server/migrate.ts
```

## Обновление

```bash
# Остановка
docker-compose down

# Получение обновлений
git pull

# Пересборка и запуск (миграции применятся автоматически)
docker-compose up -d --build
```

## Резервное копирование

```bash
# Бэкап базы данных
docker-compose exec postgres pg_dump -U asu_user asu_db > backup.sql

# Восстановление
docker-compose exec -T postgres psql -U asu_user asu_db < backup.sql
```
