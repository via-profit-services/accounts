declare module '@via-profit-services/accounts' {
  import { Algorithm } from 'jsonwebtoken';
  import { CountryCode } from 'libphonenumber-js';
  import { InputFilter, Middleware, Context, OutputFilter, ListResponse, MiddlewareProps, MaybePromise } from '@via-profit-services/core';
  import { IncomingMessage } from 'http';
  import { GraphQLFieldResolver, ValidationRule } from 'graphql';

  export type AccountStatus = 'allowed' | 'forbidden';
  export type TokenType = 'access' | 'refresh';
  export type AccountRole = 'developer' | 'administrator' | 'viewer';

  export interface Configuration {

    /**
     * You can add Account entities.\
     * The entities that will be passed here will be added 
     * to the types: \
     * `enum AccountType` \
     * `union AccountEntity`
     */
    entities?: string[];

    /**
     * Signature algorithm. Could be one of these values :
     * - HS256:    HMAC using SHA-256 hash algorithm (default)
     * - HS384:    HMAC using SHA-384 hash algorithm
     * - HS512:    HMAC using SHA-512 hash algorithm
     * - RS256:    RSASSA using SHA-256 hash algorithm
     * - RS384:    RSASSA using SHA-384 hash algorithm
     * - RS512:    RSASSA using SHA-512 hash algorithm
     * - ES256:    ECDSA using P-256 curve and SHA-256 hash algorithm
     * - ES384:    ECDSA using P-384 curve and SHA-384 hash algorithm
     * - ES512:    ECDSA using P-521 curve and SHA-512 hash algorithm
     * - none:     No digital signature or MAC value included
     * \
     * \
     * Default: `RS256`
     */
    algorithm?: Algorithm;

    /**
     * A case-sensitive string or URI that is the unique identifier of the token-generating party\
     * \
     * Default: `via-profit-service`
     */
    issuer?: string;

    /**
     * Unix time that determines the moment when the Access Token becomes invalid\
     * (the access token lifetime in seconds)\
     * \
     * Default: `1800` (30 minutes)
     */
    accessTokenExpiresIn?: number;

    /**
     * Unix time that determines the moment when the Refresh Token becomes invalid\
     * (the refresh token lifetime in seconds)\
     * \
     * Default: `2.592e6`
     */
    refreshTokenExpiresIn?: number;
    /**
     * Cert private key file path or key content
     */
    privateKey: string | Buffer;
    /**
     * Cert public key file path or key content
     */
    publicKey: string | Buffer;
  }

  export interface JwtConfig {
    algorithm?: Algorithm;
    issuer?: string;
    accessTokenExpiresIn?: number;
    refreshTokenExpiresIn?: number;
    privateKey: Buffer;
    publicKey: Buffer;
  }


  export type TokenRegistrationResponseSuccess = TokenPackage & {
    __typename: 'TokenBag'
  }
  
  export type TokenRegistrationResponseFailure = {
    name: string;
    msg: string;
    __typename: 'TokenRegistrationError'
  } 

  export type TokenRegistrationResponse = TokenRegistrationResponseSuccess | TokenRegistrationResponseFailure;

  export interface TokenPackage {
    accessToken: {
      token: string;
      payload: AccessTokenPayload;
    };
    refreshToken: {
      token: string;
      payload: RefreshTokenPayload;
    };
  }

  export type AccessTokenPayload = {
    /**
     * Token type (only for internal identify)
     */
    type: 'access';
    /**
     * Token ID
     */
    id: string;

    /**
     * Account ID
     */
    uuid: string;

    /**
     * Account roles array
     */
    roles: AccountRole[];

    /**
     * Unix time that determines the moment when the Token becomes invalid
     */
    exp: number;

    /**
     * A case-sensitive string or URI that is the unique identifier of the token-generating party
     */
    iss: string;
  }

  export type RefreshTokenPayload = Omit<AccessTokenPayload, 'type'> & {
    /**
     * Token type (only for internal identify)
     */
    type: 'refresh';

    /**
     * Access token ID associated value
     */
    associated: string;
  }

  export interface AccessToken {
    token: string;
    payload: AccessTokenPayload;
  }

  export interface RefreshToken {
    token: string;
    payload: RefreshTokenPayload;
  }


  export interface AccountsTableModel {
    readonly id: string;
    readonly login: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly password: string;
    readonly roles: string;
    readonly status: string;
    readonly entity: string;
    readonly type: string;
    readonly deleted: boolean;
  }

  export interface AccountsTableModelResult {
    readonly id: string;
    readonly login: string;
    readonly password: string;
    readonly roles: AccountRole[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly totalCount: number;
    readonly status: AccountStatus;
    readonly entity: string;
    readonly type: string;
    readonly recoveryPhones: string;
    readonly deleted: boolean;
  }

  
  export interface Account {
    id: string;
    login: string;
    password: string;
    status: AccountStatus;
    roles: AccountRole[];
    createdAt: Date;
    updatedAt: Date;
    recoveryPhones: Array<{ id: string }> | null;
    deleted: boolean;
    type: string;
    entity: {
      id: string;
    };
  }

  export type AccountInputCreate = {
    id?: string;
    status?: AccountStatus;
    login: string;
    password: string;
    roles: AccountRole[];
    type: string;
    entity: string;
  }

  export type AccountInputUpdate = Partial<AccountInputCreate> & {
    deleted?: boolean;
  }



  export type AccountsMiddlewareFactory = (config: Configuration) => Promise<{
    resolvers: Resolvers;
    typeDefs: string;
    middleware: Middleware;
  }>;


  export type ValidatioRuleMiddleware = (props: {
    context: Context;
    configuration: Configuration;
    config: MiddlewareProps['config'];
  }) => MaybePromise<ValidationRule>;

  export type DeleteAccountResult = {
    deletedAccounts: string[];
  }

  export type Resolvers = {
    Query: {
      accounts: GraphQLFieldResolver<unknown, Context>;
      authentification: GraphQLFieldResolver<unknown, Context>;
    };
    Mutation: {
      accounts: GraphQLFieldResolver<unknown, Context>;
      authentification: GraphQLFieldResolver<unknown, Context>;
    };
    AuthentificationMutation: {
      create: GraphQLFieldResolver<unknown, Context, {
        login: string;
        password: string;
      }>;
      revoke: GraphQLFieldResolver<unknown, Context, {
        tokenID?: string;
        accountID?: string;
      }>;
      refresh: GraphQLFieldResolver<unknown, Context, {
        refreshToken: string;
      }>;
      reset: GraphQLFieldResolver<unknown, Context, {
        login: string;
      }>;
    };
    AccountsMutation: {
      update: GraphQLFieldResolver<unknown, Context, {
        id: string;
        input: {
          id?: string;
          login?: string;
          password?: string;
          status?: AccountStatus;
          type?: string;
          entity?: string;
          roles?: AccountRole[];
          recoveryPhones?: Array<{
            id: string;
            country?: CountryCode;
            number?: string;
            primary?: boolean;
            confirmed?: boolean;
          }>;
        };
      }>;
      create: GraphQLFieldResolver<unknown, Context, {
        input: {
          id?: string;
          login: string;
          password: string;
          roles: AccountRole[];
          type: string;
          entity: string;
          recoveryPhones: Array<{
            id?: string;
            country: CountryCode;
            number: string;
            primary: boolean;
            confirmed?: boolean;
          }>;
        };
      }>;
      delete: GraphQLFieldResolver<unknown, Context, {
        id?: string;
        ids?: string[];
      }>
    };
    AuthentificationQuery: {
      tokenPayload: GraphQLFieldResolver<unknown, Context>;
      verifyToken: GraphQLFieldResolver<unknown, Context, {
        token: string;
      }>;
    };
    AccountsQuery: {
      list: GraphQLFieldResolver<unknown, Context, InputFilter>;
      statusesList: GraphQLFieldResolver<unknown, Context>;
      me: GraphQLFieldResolver<unknown, Context>;
      account: GraphQLFieldResolver<unknown, Context, {
        id: string;
      }>;
      checkLoginExists: GraphQLFieldResolver<{
        login: string;
        skipId?: string;
      }, Context>;
    };
    Account: AccountResolver;
    TokenBag: TokenBagResolver;
  }



  export type TokenBagResolver = Record<keyof TokenPackage, GraphQLFieldResolver<TokenRegistrationResponseSuccess, Context>>;
  export type AccountResolver = Record<keyof Account, GraphQLFieldResolver<{  id: string }, Context>>;



  /**
   * Accounts service constructor props
   */
  export interface AccountsServiceProps {
    context: Context;
    entities: string[];
  }


  /**
   * Authentification service constructor props
   */
  export interface AuthentificationServiceProps {
    context: Context;
  }

  class AuthentificationService {
    props: AuthentificationServiceProps;
    constructor(props: AuthentificationServiceProps);

    /**
     * Just crypt password
     */
    cryptPassword(login: string, password: string): string;
    /**
     * Compose credentials before crypt the password
     */
    composeCredentials(login: string, password: string): string;
    /**
     * Generate token pair (access + refresh)
     */
    generateTokens(payload: {
        uuid: string;
        roles: AccountRole[];
    }, exp?: {
        access: number;
        refresh: number;
    }): TokenPackage;
    /**
     * Generate new tokens pair and register it
     */
    registerTokens(data: { uuid: string }): Promise<TokenPackage>;
    getDefaultTokenPayload(): AccessTokenPayload;
    extractTokenFromRequest(request: IncomingMessage): string | false;
    verifyToken(token: string): Promise<AccessTokenPayload | RefreshTokenPayload | never>;
    clearExpiredTokens(): void;
    isAccessTokenPayload(payload: AccessTokenPayload | RefreshTokenPayload): payload is AccessTokenPayload;
    isRefreshTokenPayload(payload: AccessTokenPayload | RefreshTokenPayload): payload is RefreshTokenPayload;
    revokeToken(accessTokenIdOrIds: string | string[]): Promise<void>;
    revokeAccountTokens(account: string): Promise<string[]>;
    loadPrivileges(): Promise<Record<string, string[]>>;
    extractTokenPrivileges(token: AccessTokenPayload): Promise<string[]>;
  }


  
  /**
   * Accounts service
   */
  class AccountsService {
    props: AccountsServiceProps;
    constructor(props: AccountsServiceProps);
    getAccountStatusesList(): string[];
    getDefaultAccountData(): Account;
    prepareDataToInsert(accountInputData: Partial<AccountInputCreate | AccountInputUpdate>): Partial<AccountsTableModel>;
    getAccounts(filter: Partial<OutputFilter>, skipDeleted?: boolean): Promise<ListResponse<Account>>;
    getAccountsByIds(ids: string[]): Promise<Account[]>;
    getAccount(id: string): Promise<Account | false>;
    getAccountByLogin(login: string): Promise<Account | false>;
    updateAccount(id: string, accountData: AccountInputUpdate): Promise<void>;
    createAccount(accountData: AccountInputCreate): Promise<string>;
    deleteAccount(id: string): Promise<void>;
    deleteAccounts(ids: string[]): Promise<void>;
    checkLoginExists(login: string, skipId?: string): Promise<boolean>;
    getAccountByCredentials(login: string, password: string): Promise<Account | false>;
    rebaseTypes(types: string[]): Promise<void>;
    getEntitiesTypes(): string[];
    getAccountsByEntities(entitiesIDs: string[]): Promise<ListResponse<Account>>;
    getAccountsByEntity(entityID: string): Promise<ListResponse<Account>>;
  }

  export const DEFAULT_ACCESS_TOKEN_EXPIRED: number;
  export const DEFAULT_REFRESH_TOKEN_EXPIRED: number;
  export const DEFAULT_SIGNATURE_ALGORITHM: 'RS256';
  export const DEFAULT_SIGNATURE_ISSUER: string;
  export const LOG_FILENAME_AUTH: string;
  export const ACCESS_TOKEN_EMPTY_ID: string;
  export const ACCESS_TOKEN_EMPTY_UUID: string;
  export const ACCESS_TOKEN_EMPTY_ISSUER: string;
  export const TOKEN_BEARER_KEY: 'Authorization';
  export const TOKEN_BEARER: 'Bearer';
  export const REDIS_TOKENS_BLACKLIST: string;
  export const factory: AccountsMiddlewareFactory;
}


declare module '@via-profit-services/core' {
  import DataLoader from '@via-profit/dataloader';
  import { IncomingMessage } from 'http';
  import {
    JwtConfig, AccessTokenPayload, Account,
    AccountsService, TokenPackage, AuthentificationService,
  } from '@via-profit-services/accounts';

  interface Context {
    /**
     * JWT configuration.
     * @see [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
     */
    jwt: JwtConfig;
    /**
     * Access token payload
     */
    token: AccessTokenPayload;
  }


  interface CoreEmitter {
    on(event: 'got-access-token', callback: (tokenBag: AccessTokenPayload) => void): this;
    on(event: 'refresh-token-success', callback: (tokenBag: AccessTokenPayload) => void): this;
    on(event: 'authentification-success', callback: (tokenBag: TokenPackage) => void): this;
    on(event: 'account-was-deleted', callback: (accountID: string) => void): this;
    on(event: 'account-was-updated', callback: (account: Account) => void): this;
    on(event: 'token-was-revoked', callback: (revokedTokenID: string) => void): this;

    once(event: 'got-access-token', callback: (tokenBag: AccessTokenPayload) => void): this;
    once(event: 'authentification-success', callback: (tokenBag: TokenPackage) => void): this;
    once(event: 'refresh-token-success', callback: (tokenBag: TokenPackage) => void): this;
    once(event: 'account-was-deleted', callback: (accountID: string) => void): this;
    once(event: 'account-was-updated', callback: (account: Account) => void): this;
    once(event: 'token-was-revoked', callback: (revokedTokenID: string) => void): this;
  }
  
  interface DataLoaderCollection {
    /**
     * Accounts dataloader
     */
    accounts: DataLoader<Account>;
  }

  interface ServicesCollection {

    /**
     * Accounts service
     */
    accounts: AccountsService;

    /**
     * Authentification service
     */
    authentification: AuthentificationService;
  }
  

  interface LoggersCollection {
    /**
     * Accounts logger \
     * \
     * Transports:
     *  - `debug` - File transport
     *  - `error` - Console transport
     */
    auth: Logger;
  }

}