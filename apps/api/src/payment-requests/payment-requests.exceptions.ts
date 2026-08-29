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
