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

WORKDIR /app

# Устанавливаем только production зависимости
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Копируем собранные файлы
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=5000

# Открываем порт
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Запуск приложения
CMD ["npm", "start"]
