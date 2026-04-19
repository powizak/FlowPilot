export const I18nKeys = {
  AUTH_INVALID_CREDENTIALS: 'auth.invalidCredentials',
  AUTH_UNAUTHORIZED: 'auth.unauthorized',
  AUTH_FORBIDDEN: 'auth.forbidden',
  COMMON_NOT_FOUND: 'common.notFound',
  COMMON_VALIDATION_ERROR: 'common.validationError',
  COMMON_INTERNAL_ERROR: 'common.internalError',
  COMMON_SUCCESS: 'common.success',
} as const;

export type I18nKey = (typeof I18nKeys)[keyof typeof I18nKeys];
