declare module '@via-profit-services/accounts' {
  import { Algorithm, JsonWebTokenError } from 'jsonwebtoken';
  import { InputFilter, Middleware, Context, ErrorHandler, OutputFilter, ListResponse, Phone, MiddlewareProps, MaybePromise } from '@via-profit-services/core';
  import { IncomingMessage } from 'http';
  import { GraphQLFieldResolver, ValidationRule } from 'graphql';

  export type AccountStatus = 'allowed' | 'forbidden';
  export type TokenType = 'access' | 'refresh';
  export type AccountRole = 'developer' | 'administrator' | 'viewer';

  export interface Configuration {

    /**
     * If `true` then all fields will be required authorization \
     * Default: `true`
     */
    requireAuthorization?: boolean;
    
    /**
     * Introspection control \
     * Default: `false` or `true` if is `development` mode
     */
    enableIntrospection?: boolean;

    /**
     * Default permissions map
     */
    defaultPermissions?: {
      grant?: string[];
      restrict?: string[];
    };
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

  export interface AccountsTableModel {
    readonly id: string;
    readonly login: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly password: string;
    readonly roles: string;
    readonly status: string;
    readonly deleted: boolean;
    readonly recoveryPhones: string;
    readonly totalCount: number;
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
    readonly recoveryPhones: Phone[];
    readonly deleted: boolean;
  }

  
  export interface UsersTableModel {
    readonly id: string;
    readonly name: string;
    readonly account: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly phones: string;
    readonly deleted: boolean;
    readonly totalCount: number;
  }

  export interface UsersTableModelResult {
    readonly id: string;
    readonly name: string;
    readonly account: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly phones: Phone[];
    readonly deleted: boolean;
    readonly totalCount: number;
  }



  export interface Account {
    id: string;
    login: string;
    password: string;
    status: AccountStatus;
    roles: AccountRole[];
    createdAt: Date;
    updatedAt: Date;
    recoveryPhones: Phone[];
    deleted: boolean;
  }

  export type MyAccount = Omit<Account, 'deleted'>;

  export type PrivilegesMap = {
    id: 'common';
    createdAt: Date;
    updatedAt: Date;
    map: Record<string, string[]>;
  };

  export type PermissionsMap = {
    id: 'common';
    createdAt: Date;
    updatedAt: Date;
    map: Record<string, PermissionsMapResolver>;
  };

  export type PermissionsMapResolver = {
    grant: string[];
    restrict: string[];
  };
  
  export type AccountsMiddlewareFactory = (config: Configuration) => Promise<Middleware>;


  export type ValidatioRuleMiddleware = (props: {
    context: Context;
    configuration: Configuration;
    config: MiddlewareProps['config'];
  }) => MaybePromise<ValidationRule>;



  export type Resolvers = {
    Query: {
      accounts: GraphQLFieldResolver<unknown, Context>;
      users: GraphQLFieldResolver<unknown, Context>;
      authentification: GraphQLFieldResolver<unknown, Context>;
    };
    Mutation: {
      accounts: GraphQLFieldResolver<unknown, Context>;
      authentification: GraphQLFieldResolver<unknown, Context>;
      users: GraphQLFieldResolver<unknown, Context>;
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
    UsersMutation: {
      update: GraphQLFieldResolver<unknown, Context, {
        id: string;
        input: {
          id?: string;
          account?: string;
          name?: string;
          phones?: Phone[];
        };
      }>;
      create: GraphQLFieldResolver<unknown, Context, {
        input: {
          id?: string;
          account?: string;
          name: string;
          phones?: Phone[];
        };
      }>;
    };
    AccountsMutation: {
      update:  GraphQLFieldResolver<unknown, Context, {
        id: string;
        input: {
          id?: string;
          login?: string;
          password?: string;
          status?: AccountStatus;
          roles?: AccountRole[];
          recoveryPhones?: Phone[];
        };
      }>;
      create:  GraphQLFieldResolver<unknown, Context, {
        input: {
          id?: string;
          login: string;
          password: string;
          roles: AccountRole[];
          recoveryPhones: Phone[];
        };
      }>;
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
    UsersQuery: {
      list: GraphQLFieldResolver<unknown, Context, InputFilter>;
      user: GraphQLFieldResolver<unknown, Context, { id: string }>;
    };
    Account: AccountResolver;
    MyAccount: MyAccountResolver;
    User: UserResolver;
    TokenBag: TokenBagResolver;
  }


  export type TokenBagResolver = Record<
    | 'accessToken'
    | 'refreshToken',
    GraphQLFieldResolver<TokenRegistrationResponseSuccess, Context>>;

  export type AccountResolver = Record<
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'login'
  | 'password'
  | 'roles'
  | 'deleted'
  | 'recoveryPhones',
  GraphQLFieldResolver<{  id: string }, Context>>


  export type MyAccountResolver = Record<
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'login'
  | 'password'
  | 'roles'
  | 'recoveryPhones',
  GraphQLFieldResolver<{  id: string }, Context>>;

  export type UserResolver = Record<
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'phones'
  | 'deleted',
  GraphQLFieldResolver<{  id: string }, Context>>;


  

  /**
   * Permissions service constructor props
   */
  export interface PermissionsServiceProps {
    context: Context;
  }

  /**
   * Accounts service constructor props
   */
  export interface AccountsServiceProps {
    context: Context;
  }

  /**
   * Users service constructor props
   */
  export interface UsersServiceProps {
    context: Context;
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
    cryptUserPassword(password: string): string;
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

    /**
     * Revoke all tokens by Account ID
     */
    revokeAccountTokens(account: string): Promise<string[]>;
  }


  export type ResolvePermissionsProps = {
    permissionsMap: PermissionsMap;
    typeName: string;
    fieldName: string;
    privileges: string[];
    enableIntrospection?: boolean;
    requireAuthorization?: boolean;
    defaultPermissions?: {
      grant?: string[];
      restrict?: string[];
    };
  };

  class PermissionsService {
    props: PermissionsServiceProps;
    constructor(props: PermissionsServiceProps);

    getPrivilegesMap(): Promise<PrivilegesMap>;
    getPermissionsMap(): Promise<PermissionsMap>;
    resolvePermissions(props: ResolvePermissionsProps): boolean;
  }

  /**
   * Accounts service
   */
  class AccountsService {
    props: AccountsServiceProps;
    constructor(props: AccountsServiceProps);
    
    getAccountStatusesList(): string[];
    getDefaultAccountData(): Account;
    prepareDataToInsert(accountInputData: Partial<Account>): Partial<AccountsTableModel>;
    getAccounts(filter: Partial<OutputFilter>): Promise<ListResponse<Account>>;
    getAccountsByIds(ids: string[]): Promise<Account[]>;
    getAccount(id: string): Promise<Account | false>;
    getAccountByLogin(login: string): Promise<Account | false>;
    updateAccount(id: string, accountData: Partial<Account>): Promise<void>;
    createAccount(accountData: Partial<Account>): Promise<string>;
    deleteAccount(id: string): Promise<void>;
    checkLoginExists(login: string, skipId?: string): Promise<boolean>;
    getAccountByCredentials(login: string, password: string): Promise<Account | false>;
  }

  /**
   * Users service
   */
  class UsersService {
    props: UsersServiceProps;
    constructor(props: UsersServiceProps);
    
    getUsers(filter: Partial<OutputFilter>): Promise<ListResponse<User>>;
    getUsersByIds(ids: string[]): Promise<User[]>;
    getUser(id: string): Promise<User | false>;
    prepareDataToInsert(input: Partial<User>): Partial<UsersTableModel>;
    createUser(userData: Partial<User>): Promise<string>;
    updateUser(id: string, userData: Partial<User>): Promise<void>;
    deleteUser(id: string): Promise<void>;
  }



  export class UnauthorizedError extends Error implements ErrorHandler {
    metaData: any;
    status: number;
    constructor(message: string, metaData?: any);
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
  export const INTROSPECTION_FIELDS: string[];

  export const resolvers: Resolvers;
  export const typeDefs: string;
  export const factory: AccountsMiddlewareFactory;
}


declare module '@via-profit-services/core' {
  import DataLoader from 'dataloader';
  import {
    JwtConfig, AccessTokenPayload, Account, User, UsersService,
    AccountsService, TokenPackage, PermissionsService, AuthentificationService,
    PrivilegesMap, PermissionsMap,
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
    once(event: 'got-access-token', callback: (tokenBag: AccessTokenPayload) => void): this;
    once(event: 'authentification-success', callback: (tokenBag: TokenPackage) => void): this;
    once(event: 'refresh-token-success', callback: (tokenBag: TokenPackage) => void): this;
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

    /**
     * Privileges map dataloader
     */
    privilegesMaps: DataLoader<string, Node<PrivilegesMap>>;

    /**
     * Permissions map dataloader
     */
    permissionsMap: DataLoader<string, Node<PermissionsMap>>;
  }

  interface ServicesCollection {

    /**
     * Accounts service
     */
    accounts: AccountsService;

    /**
     * Permissions service
     */
    permissions: PermissionsService;

    /**
     * Users service
     */
    users: UsersService;

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