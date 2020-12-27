declare module '@via-profit-services/accounts' {
  import { Algorithm } from 'jsonwebtoken';
  import { InputFilter, Middleware, Context, ErrorHandler, OutputFilter, ListResponse, Phone } from '@via-profit-services/core';
  import { IncomingMessage } from 'http';
  import { GraphQLFieldResolver } from 'graphql';
  import { EventEmitter } from 'events';

  export type AccountStatus = 'allowed' | 'forbidden';
  export type TokenType = 'access' | 'refresh';
  export type AccountRole = string;

  export class AccountsEmitter extends EventEmitter {
    on(event: 'authentification', callback: (tokenPackage: TokenPackage) => void): this;
    on(event: 'got-access-token', callback: (tokenPayload: AccessTokenPayload) => void): this;
  }

  /**
   * JWT configuration.
   * @see [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
   */
  export interface Configuration {

    permissionsMap: unknown;
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
     * Default: `1800`
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

  export interface User {
    id: string;
    account: {
      id: string;
    };
    name: string;
    phones: Phone[];
    createdAt: Date;
    updatedAt: Date;
    deleted: boolean;
  }

  export interface Account {
    id: string;
    login: string;
    password: string;
    status: AccountStatus;
    roles: AccountRole[];
    createdAt: Date;
    updatedAt: Date;
    deleted: boolean;
  }

  export type MyAccount = Omit<Account, 'deleted'>;

  export type AccountTableModelOutput = Omit<Account, 'roles'> & {
    roles: string[];
    totalCount: number;
  }

  export type AccountInputInfo = Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'roles'> & {
    id?: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    roles: string[] | string;
    deleted?: boolean;
  };

  interface UpdateArgs {
    id: string;
    input: AccountInputInfo;
  }

  interface CreateArgs {
    input: AccountInputInfo;
  }

  interface CheckLoginExistsArgs {
    login: string;
    skipId?: string;
  }


  interface GetTokenArgs {
    login: string;
    password: string;
  }


  export type AccountsMiddlewareFactory = (config: Configuration) => Promise<Middleware>;

  /**
   * Accounts service constructor props
   */
  export interface AccountsServiceProps {
    context: Context;
  }

  interface AccountParent {
    id: string;
  }

  interface UserParent {
    id: string;
  }

  export type AccountResolver = {
    id: GraphQLFieldResolver<AccountParent, Context>;
    createdAt: GraphQLFieldResolver<AccountParent, Context>;
    updatedAt: GraphQLFieldResolver<AccountParent, Context>;
    status: GraphQLFieldResolver<AccountParent, Context>;
    login: GraphQLFieldResolver<AccountParent, Context>;
    password: GraphQLFieldResolver<AccountParent, Context>;
    roles: GraphQLFieldResolver<AccountParent, Context>;
    deleted: GraphQLFieldResolver<AccountParent, Context>;
  }

  export type MyAccountResolver = {
    id: GraphQLFieldResolver<unknown, Context>;
    createdAt: GraphQLFieldResolver<unknown, Context>;
    updatedAt: GraphQLFieldResolver<unknown, Context>;
    status: GraphQLFieldResolver<unknown, Context>;
    login: GraphQLFieldResolver<unknown, Context>;
    password: GraphQLFieldResolver<unknown, Context>;
    roles: GraphQLFieldResolver<unknown, Context>;
  }

  export type UserResolver = {
    id: GraphQLFieldResolver<UserParent, Context>;
    createdAt: GraphQLFieldResolver<UserParent, Context>;
    updatedAt: GraphQLFieldResolver<UserParent, Context>;
    name: GraphQLFieldResolver<UserParent, Context>;
    phones: GraphQLFieldResolver<UserParent, Context>;
    deleted: GraphQLFieldResolver<UserParent, Context>;
  }

  export type Resolvers = {
    Query: {
      accounts: GraphQLFieldResolver<unknown, Context>;
      users: GraphQLFieldResolver<unknown, Context>;
    };
    Mutation: {
      accounts: GraphQLFieldResolver<unknown, Context>;
    };
    AccountsQuery: {
      list: GraphQLFieldResolver<unknown, Context, InputFilter>;
      statusesList: GraphQLFieldResolver<unknown, Context>;
      me: GraphQLFieldResolver<unknown, Context>;
      account: GraphQLFieldResolver<{id: string}, Context>;
      checkLoginExists: GraphQLFieldResolver<CheckLoginExistsArgs, Context>;
    };
    UsersQuery: {
      list: GraphQLFieldResolver<unknown, Context, InputFilter>;
      user: GraphQLFieldResolver<unknown, Context, { id: string }>;
    };
    AccountsMutation: {
      update:  GraphQLFieldResolver<unknown, Context, UpdateArgs>;
      createToken:  GraphQLFieldResolver<unknown, Context, GetTokenArgs>;
    };
    Account: AccountResolver;
    MyAccount: MyAccountResolver;
    User: UserResolver;
    TokenBag: {
      accessToken: GraphQLFieldResolver<TokenRegistrationResponseSuccess, Context>;
      refreshToken: GraphQLFieldResolver<TokenRegistrationResponseSuccess, Context>;
    };
  }

  /**
   * Accounts service
   */
  class AccountsService {
    props: AccountsServiceProps;
    constructor(props: AccountsServiceProps);
    /**
     * Just crypt password
     */
    static cryptUserPassword(password: string): string;
    static getAccountStatusesList(): string[];
    /**
     * Generate token pair (access + refresh)
     */
    generateTokens(payload: {
        uuid: string;
        roles: string[];
    }, exp?: {
        access: number;
        refresh: number;
    }): TokenPackage;
    /**
     * Generate new tokens pair and register it
     */
    registerTokens(data: {
        uuid: string;
    }): Promise<TokenPackage>;
    getDefaultTokenPayload(): AccessTokenPayload;
    getDefaultAccountData(): AccountInputInfo;
    prepareDataToInsert(accountInputData: Partial<AccountInputInfo>): Partial<AccountInputInfo>;
    getAccounts(filter: Partial<OutputFilter>): Promise<ListResponse<Account>>;
    getAccountsByIds(ids: string[]): Promise<Account[]>;
    getAccount(id: string): Promise<Account | false>;
    getAccountByLogin(login: string): Promise<Account | false>;
    updateAccount(id: string, accountData: Partial<AccountInputInfo>): Promise<void>;
    createAccount(accountData: Partial<AccountInputInfo>): Promise<string>;
    deleteAccount(id: string): Promise<void>;
    checkLoginExists(login: string, skipId?: string): Promise<boolean>;
    getAccountByCredentials(login: string, password: string): Promise<Account | false>;
    extractTokenFromRequest(request: IncomingMessage): string | false;
    verifyToken(token: string): Promise<AccessTokenPayload | false>;
    getUsers(filter: Partial<OutputFilter>): Promise<ListResponse<User>>;
    getUsersByIds(ids: string[]): Promise<User[]>;
    getUser(id: string): Promise<User | false>;
    clearExpiredTokens(): void;
  }



  export class UnauthorizedError extends Error implements ErrorHandler {
    metaData: any;
    status: number;
    constructor(message: string, metaData?: any);
  }

  export const ROLES_LIST: string[];
  export const DEFAULT_ACCESS_TOKEN_EXPIRED: number;
  export const DEFAULT_REFRESH_TOKEN_EXPIRED: number;
  export const DEFAULT_SIGNATURE_ALGORITHM: 'RS256';
  export const DEFAULT_SIGNATURE_ISSUER: string;
  export const LOG_FILENAME_AUTH: string;
  export const ACCESS_TOKEN_EMPTY_ID: string;
  export const ACCESS_TOKEN_EMPTY_UUID: string;
  export const ACCESS_TOKEN_EMPTY_ISSUER: string;
  export const TOKEN_BEARER_KEY: string;
  export const TOKEN_BEARER: string;
  export const REDIS_TOKENS_BLACKLIST: string;

  export const resolvers: Resolvers;
  export const typeDefs: string;
  export const factory: AccountsMiddlewareFactory;
}


declare module '@via-profit-services/core' {
  import DataLoader from 'dataloader';
import { JwtConfig, AccessTokenPayload, Account, User, AccountsService, AccountsEmitter } from '@via-profit-services/accounts';

  interface Context {
    /**
     * JWT configuration.
     * @see [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
     */
    jwt: JwtConfig;
    token: AccessTokenPayload;
  }

  interface EmitterCollection {
    accounts: AccountsEmitter;
  }

  
  interface DataLoaderCollection {
    /**
     * Accounts dataloader
     */
    accounts: DataLoader<string, Node<Account>>;

    /**
     * Users dataloader
     */
    users: DataLoader<string, Node<User>>;
  }

  interface ServicesCollection {

    /**
     * Accounts service
     */
    accounts: AccountsService;
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