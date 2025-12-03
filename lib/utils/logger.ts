/**
 * Logger utilitário - todos os logs aparecem na Vercel
 */

const isDev = process.env.NODE_ENV === 'development'

class Logger {
  constructor(private prefix = '') {}

  private fmt(...args: unknown[]) {
    return this.prefix ? [`[${this.prefix}]`, ...args] : args
  }

  log(...args: unknown[]) { console.log(...this.fmt(...args)) }
  info(...args: unknown[]) { console.info(...this.fmt(...args)) }
  warn(...args: unknown[]) { console.warn(...this.fmt(...args)) }
  error(...args: unknown[]) { console.error(...this.fmt(...args)) }
  debug(...args: unknown[]) { isDev && console.debug(...this.fmt(...args)) }

  static create(prefix: string) { return new Logger(prefix) }
}

export const logger = new Logger()
export const checkoutLogger = Logger.create('CHECKOUT')
export const authLogger = Logger.create('AUTH')
export const apiLogger = Logger.create('API')
export const eventLogger = Logger.create('EVENT')
export const paymentLogger = Logger.create('PAYMENT')
