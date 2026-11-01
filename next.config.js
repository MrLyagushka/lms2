/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Разрешаем локальные изображения (фото-решения учеников из /uploads)
    domains: ['localhost'],
  },
  experimental: {
    // Server Actions доступны по умолчанию в Next 14,
    // флаг оставлен для явной конфигурации
    serverActions: {
      bodySizeLimit: '5mb', // загрузка фото-решений
    },
  },
};

module.exports = nextConfig;
