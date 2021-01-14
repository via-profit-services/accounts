export const DEFAULT_ACCESS_TOKEN_EXPIRED = 1800;
export const DEFAULT_REFRESH_TOKEN_EXPIRED = 2.592e6;
export const DEFAULT_SIGNATURE_ALGORITHM = 'RS256';
export const DEFAULT_SIGNATURE_ISSUER = 'via-profit-services';
export const LOG_FILENAME_AUTH = 'auth-%DATE%.log';
export const ACCESS_TOKEN_EMPTY_ID = 'NOT_ASSIGNED';
export const ACCESS_TOKEN_EMPTY_UUID = 'NOT_ASSIGNED';
export const ACCESS_TOKEN_EMPTY_ISSUER = 'NOT_ASSIGNED';
export const TOKEN_BEARER_KEY = 'Authorization';
export const TOKEN_BEARER = 'Bearer';
export const REDIS_TOKENS_BLACKLIST = 'tokensBlackList';
export const SERVICE_PRIVILEGES = {
  authorized: 'authorized',
  asterisk: '*',
};
export const RESET_PASSWORD_MESSAGE = 'New password: {password}';
export const INTROSPECTION_FIELDS = ['Query.__schema', 'Query.__type', 'Query.__Directive']