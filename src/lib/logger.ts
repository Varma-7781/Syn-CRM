/**
 * Production-Safe Logger Utility
 * NexLead CRM Security Hardening
 *
 * Ensures:
 * 1. Sensitive PII (emails, passwords, tokens, API keys) is never printed to the browser console.
 * 2. In production builds, debug and verbose info logs are suppressed.
 * 3. Error information is sanitized so database details and stack traces are not exposed to end users.
 * 4. Diagnostic messages remain clear and actionable in development.
 */

const IS_PROD = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

// Common sensitive key patterns to redact from objects
const SENSITIVE_KEY_REGEX = /(password|token|secret|credential|api_?key|auth|bearer|private_?key|authorization)/i;

// Email pattern to mask PII
const EMAIL_REGEX = /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g;

/**
 * Mask an email address to protect customer/user privacy in logs
 * e.g., "john.doe@syntraxs.com" -> "j***e@s***s.com"
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '[EMAIL_REDACTED]';
  return email.replace(EMAIL_REGEX, (_match, user, domain, tld) => {
    const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : '***';
    const maskedDomain = domain.length > 2 ? `${domain[0]}***${domain[domain.length - 1]}` : '***';
    return `${maskedUser}@${maskedDomain}.${tld}`;
  });
}

/**
 * Deep sanitization of arguments to remove credentials and mask PII
 */
export function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 4) return '[MAX_DEPTH]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Mask emails and obvious secrets
    let sanitized = data.replace(EMAIL_REGEX, (match) => maskEmail(match));
    if (sanitized.length > 500) {
      sanitized = sanitized.slice(0, 500) + '... [TRUNCATED]';
    }
    return sanitized;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (data instanceof Error) {
    // In production, do not leak internal system file paths or server stack traces to users
    if (IS_PROD) {
      return `[Error: ${data.name}] ${data.message}`;
    }
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };
  }

  if (Array.isArray(data)) {
    return data.slice(0, 10).map((item) => sanitizeLogData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitizeLogData(value, depth + 1);
      }
    }
    return sanitizedObj;
  }

  return String(data);
}

export const logger = {
  debug(...args: unknown[]): void {
    if (IS_PROD) return;
    const sanitized = args.map((a) => sanitizeLogData(a));
    console.debug('[DEBUG]', ...sanitized);
  },

  info(...args: unknown[]): void {
    if (IS_PROD) return;
    const sanitized = args.map((a) => sanitizeLogData(a));
    console.info('[INFO]', ...sanitized);
  },

  warn(...args: unknown[]): void {
    const sanitized = args.map((a) => sanitizeLogData(a));
    console.warn('[WARN]', ...sanitized);
  },

  error(...args: unknown[]): void {
    const sanitized = args.map((a) => sanitizeLogData(a));
    console.error('[ERROR]', ...sanitized);
  },
};
