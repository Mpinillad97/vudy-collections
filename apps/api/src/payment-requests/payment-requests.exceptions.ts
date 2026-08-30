import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Vudy created the payment request successfully, but saving our local
 * record failed. The vudyRequestId is included on purpose — it is Vudy's
 * own public identifier, not a secret, and it's what lets this be
 * reconciled manually.
 */
export class PaymentRequestPersistenceError extends HttpException {
  constructor(vudyRequestId: string) {
    super(
      {
        code: 'PAYMENT_REQUEST_PERSISTENCE_FAILED',
        message: `The Vudy payment request (${vudyRequestId}) was created successfully, but saving the local record failed.`,
        vudyRequestId,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * No local record matches the requested id. The id echoed back is the
 * caller's own input, not internal data.
 */
export class PaymentRequestNotFoundError extends HttpException {
  constructor(id: string) {
    super(
      {
        code: 'PAYMENT_REQUEST_NOT_FOUND',
        message: `No payment request found with id "${id}".`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * An unexpected error occurred while reading from PostgreSQL. Never
 * includes the underlying Prisma error message or stack trace.
 */
export class PaymentRequestQueryError extends HttpException {
  constructor() {
    super(
      {
        code: 'PAYMENT_REQUEST_QUERY_FAILED',
        message: 'The payment request(s) could not be retrieved.',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
