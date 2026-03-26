/**
 * 统一错误处理类
 * 
 * 用法：
 * const { AppError, ErrorCode } = require('./error');
 * 
 * throw new AppError(
 *   ErrorCode.TASK_NOT_FOUND,
 *   '任务不存在',
 *   { taskId: 'xxx' }
 * );
 */

/**
 * 错误代码枚举
 */
const ErrorCode = {
  // 任务相关 (1000-1999)
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TASK_ALREADY_EXISTS: 'TASK_ALREADY_EXISTS',
  TASK_INVALID_PLAN: 'TASK_INVALID_PLAN',
  TASK_STEP_NOT_FOUND: 'TASK_STEP_NOT_FOUND',
  TASK_STEP_INVALID_STATUS: 'TASK_STEP_INVALID_STATUS',
  
  // 上下文相关 (2000-2999)
  CONTEXT_NOT_FOUND: 'CONTEXT_NOT_FOUND',
  CONTEXT_COMPRESS_FAILED: 'CONTEXT_COMPRESS_FAILED',
  CONTEXT_TOO_LARGE: 'CONTEXT_TOO_LARGE',
  
  // Webhook 相关 (3000-3999)
  WEBHOOK_INVALID_SIGNATURE: 'WEBHOOK_INVALID_SIGNATURE',
  WEBHOOK_MISSING_SIGNATURE: 'WEBHOOK_MISSING_SIGNATURE',
  WEBHOOK_SECRET_NOT_CONFIGURED: 'WEBHOOK_SECRET_NOT_CONFIGURED',
  
  // Agent 相关 (4000-4999)
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_EXECUTION_FAILED: 'AGENT_EXECUTION_FAILED',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  
  // 配置相关 (5000-5999)
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  CONFIG_INVALID: 'CONFIG_INVALID',
  CONFIG_VALIDATION_FAILED: 'CONFIG_VALIDATION_FAILED',
  
  // 系统相关 (9000-9999)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
};

/**
 * HTTP 状态码映射
 */
const HTTP_STATUS_MAP = {
  [ErrorCode.TASK_NOT_FOUND]: 404,
  [ErrorCode.TASK_ALREADY_EXISTS]: 409,
  [ErrorCode.TASK_INVALID_PLAN]: 400,
  [ErrorCode.WEBHOOK_INVALID_SIGNATURE]: 401,
  [ErrorCode.WEBHOOK_MISSING_SIGNATURE]: 401,
  [ErrorCode.WEBHOOK_SECRET_NOT_CONFIGURED]: 500,
  [ErrorCode.AGENT_NOT_FOUND]: 404,
  [ErrorCode.CONFIG_NOT_FOUND]: 404,
  [ErrorCode.CONFIG_INVALID]: 400,
  [ErrorCode.PERMISSION_DENIED]: 403,
  [ErrorCode.INTERNAL_ERROR]: 500
};

/**
 * 应用错误类
 */
class AppError extends Error {
  /**
   * @param {string} code - 错误代码
   * @param {string} message - 错误消息
   * @param {object} [details] - 详细上下文
   * @param {Error} [cause] - 原始错误
   */
  constructor(code, message, details = {}, cause = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.cause = cause;
    this.timestamp = new Date().toISOString();
    
    // 捕获堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * 获取 HTTP 状态码
   * @returns {number}
   */
  get statusCode() {
    return HTTP_STATUS_MAP[this.code] || 500;
  }
  
  /**
   * 转换为 JSON
   * @returns {object}
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
        stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
      }
    };
  }
  
  /**
   * 格式化输出
   * @returns {string}
   */
  toString() {
    return `[${this.code}] ${this.message}${Object.keys(this.details).length ? ' - ' + JSON.stringify(this.details) : ''}`;
  }
}

/**
 * 错误处理工具
 */
class ErrorHandler {
  /**
   * 处理错误
   * @param {Error} error 
   * @returns {AppError}
   */
  static handle(error) {
    if (error instanceof AppError) {
      return error;
    }
    
    // 包装未知错误
    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      error.message || 'Internal server error',
      {},
      error
    );
  }
  
  /**
   * 异步错误处理包装器
   * @param {Function} fn 
   * @returns {Function}
   */
  static wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        throw this.handle(error);
      }
    };
  }
}

module.exports = {
  AppError,
  ErrorCode,
  ErrorHandler
};
