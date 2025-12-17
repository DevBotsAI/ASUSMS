# Многоступенчатая сборка для production

# Этап 1: Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем фронтенд
RUN npm run build

# Этап 2: Production образ
FROM node:20-alpine AS production

# Устанавливаем postgresql-client для pg_isready и tsx для миграций
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Устанавливаем tsx для запуска миграций (TypeScript)
RUN npm install tsx --save-dev

# Копируем собранные файлы
COPY --from=builder /app/dist ./dist

# Копируем серверный код и миграции
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/migrations ./migrations
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Копируем entrypoint скрипт
COPY script/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=5000

# Открываем порт
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Запуск через entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
