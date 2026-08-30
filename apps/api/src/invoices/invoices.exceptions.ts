import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * The customerId referenced by a new invoice does not match any existing
 * Customer. The id echoed back is the caller's own input, not internal data.
 */
export class InvoiceCustomerNotFoundError extends HttpException {
  constructor(customerId: string) {
    super(
      {
        code: 'INVOICE_CUSTOMER_NOT_FOUND',
        message: `No customer found with id "${customerId}". An invoice cannot be created for a customer that does not exist.`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * No local record matches the requested id. The id echoed back is the
 * caller's own input, not internal data.
 */
export class InvoiceNotFoundError extends HttpException {
  constructor(id: string) {
    super(
      {
        code: 'INVOICE_NOT_FOUND',
        message: `No invoice found with id "${id}".`,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * An unexpected error occurred while reading from PostgreSQL. Never
 * includes the underlying Prisma error message or stack trace.
 */
export class InvoiceQueryError extends HttpException {
  constructor() {
    super(
      {
        code: 'INVOICE_QUERY_FAILED',
        message: 'The invoice(s) could not be retrieved.',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * An unexpected error occurred while saving to PostgreSQL. Never includes
 * the underlying Prisma error message or stack trace.
 */
export class InvoicePersistenceError extends HttpException {
  constructor() {
    super(
      {
        code: 'INVOICE_PERSISTENCE_FAILED',
        message: 'The invoice could not be saved.',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
