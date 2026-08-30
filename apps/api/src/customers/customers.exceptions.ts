import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * No local record matches the requested id. The id echoed back is the
 * caller's own input, not internal data.
 */
export class CustomerNotFoundError extends HttpException {
  constructor(id: string) {
    super(
      {
        code: 'CUSTOMER_NOT_FOUND',
        message: `No customer found with id "${id}".`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * An unexpected error occurred while reading from PostgreSQL. Never
 * includes the underlying Prisma error message or stack trace.
 */
export class CustomerQueryError extends HttpException {
  constructor() {
    super(
      {
        code: 'CUSTOMER_QUERY_FAILED',
        message: 'The customer(s) could not be retrieved.',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * An unexpected error occurred while saving to PostgreSQL. Never includes
 * the underlying Prisma error message or stack trace.
 */
export class CustomerPersistenceError extends HttpException {
  constructor() {
    super(
      {
        code: 'CUSTOMER_PERSISTENCE_FAILED',
        message: 'The customer could not be saved.',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
