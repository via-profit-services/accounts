declare module '@via-profit-services/accounts' {
  import { Algorithm } from 'jsonwebtoken';
  import { DocumentNode } from 'graphql';
  import { Middleware, DataLoader, Node, Context, ErrorHandler } from '@via-profit-services/core';
  
  export type AccountStatus = 'allowed' | 'forbidden';
  export type TokenType = 'access' | 'refresh';
  export type SubscriptionTriggers = 'account-updated' | 'account-deleted';
  export type AccountRole = string;

  /**
   * JWT configuration.
   * @see [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
   */
  export interface Configuration {
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
     * Cert private key file path
     */
    privateKey: string;
    /**
     * Cert public key file path
     */
    publicKey: string;
  }

  export type JwtConfig = Required<Configuration>;

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

  export interface UpdateArgs {
    id: string;
    input: AccountInputInfo;
  }

  export interface CreateArgs {
    input: AccountInputInfo;
  }

  export interface CheckLoginExistsArgs {
    login: string;
    skipId?: string;
  }

  export interface DataLoadersCollection {
    accounts: DataLoader<string,  Node<Account>>;
  }

  export type AccountsMiddleware = (config: Configuration) => Middleware;
  export const typeDefs: DocumentNode;
  export const resolvers: any;

  /**
   * Accounts service constructor props
   */
  export interface AccountsServiceProps {
    context: Context;
  }

  /**
   * Accounts service
   */
  // export class AccountsService {
  //   private readonly props: AccountsServiceProps;
  //   static getDefaultAccountData(): AccountInputInfo;
  //   prepareDataToInsert(accountInputData: Partial<AccountInputInfo>): Partial<AccountInputInfo>; 
  //   constructor(props: AccountsServiceProps);
  // }


  export class UnauthorizedError extends Error implements ErrorHandler {
    metaData: any;
    status: number;
    constructor(message: string, metaData?: any);
  }

  const accountsMiddleware: AccountsMiddleware;

  export default accountsMiddleware;
}


declare module '@via-profit-services/core' {
  import { JwtConfig, AccessTokenPayload } from '@via-profit-services/accounts';

  interface Context {
    /**
     * JWT configuration.
     * @see [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
     */
    jwt: JwtConfig;
    token: AccessTokenPayload;
  }

  interface LoggersCollection {
    /**
     * Database logger \
     * \
     * Transports:
     *  - `debug` - File transport
     *  - `error` - Console transport
     */
    auth: Logger;
  }

}