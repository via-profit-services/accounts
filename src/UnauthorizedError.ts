import { ForbiddenError } from '@via-profit-services/core';

export default class UnauthorizedError extends ForbiddenError {
  public metaData: any;

  public status: number;

  constructor(message: string, metaData?: any) {
    super(message);

    this.name = 'UnauthorizedError';
    this.message = message;
    this.metaData = metaData;
    this.status = 401;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
