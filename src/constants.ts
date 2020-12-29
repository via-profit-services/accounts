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
export const RECOVERY_PERMISSIONS_MAP_ID = 'ff11ef55-d26b-46ba-8c9c-3f93b899f09e';
export const DEFAULT_PERMISSIONS_MAP_ID = '63833b93-b253-414c-a3fc-ca5211430222';
export const DEFAULT_PERMISSIONS_MAP = {
  AuthentificationMutation: {
    grant: ['*'],
  },
  TokenBag: {
    grant: ['*'],
  },
  TokenRegistrationError: {
    grant: ['*'],
  },
  AccessToken: {
    grant: ['*'],
  },
  RefreshToken: {
    grant: ['*'],
  },
  AccessTokenPayload: {
    grant: ['*'],
  },
  RefreshTokenPayload: {
    grant: ['*'],
  },
};