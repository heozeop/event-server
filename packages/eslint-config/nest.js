module.exports = {
  extends: [
    './index',
    'plugin:@nestjs/recommended',
  ],
  plugins: ['@nestjs'],
  rules: {
    '@nestjs/use-validation-pipe': 'error',
    '@nestjs/use-guards': 'warn',
  },
} 