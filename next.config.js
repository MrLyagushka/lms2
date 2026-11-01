/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // загрузка фото-ответов учеников
    },
  },
  webpack: (config) => {
    // katex использует .ttf/.woff2 шрифты — разрешаем их импорт
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf)$/,
      type: 'asset/resource',
    });
    return config;
  },
};

module.exports = nextConfig;
