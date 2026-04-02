FROM php:8.3-cli

ARG SERVICE_PATH

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Install dependencies first for better Docker layer caching.
COPY ${SERVICE_PATH}/composer.json ${SERVICE_PATH}/composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Copy the target Laravel service source.
COPY ${SERVICE_PATH}/ ./

# Ensure runtime directories exist even when host cache/session folders are ignored.
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
