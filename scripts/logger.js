const winston = require('winston');
const path = require('path');

/**
 * 统一日志系统
 * 
 * 用法：
 * const logger = require('./logger');
 * 
 * logger.info('Webhook verified', { type: 'github' });
 * logger.error('Webhook failed', { error });
 * logger.warn('Rate limit approaching', { remaining: 10 });
 */

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台输出格式（彩色）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// 日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 创建 logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  
  // 生产环境：只写文件
  // 开发环境：同时输出到控制台
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(process.env.HOME || '/tmp', '.clawd', 'logs', 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 所有日志
    new winston.transports.File({
      filename: path.join(process.env.HOME || '/tmp', '.clawd', 'logs', 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// 确保日志目录存在
const fs = require('fs');
const logDir = path.join(process.env.HOME || '/tmp', '.clawd', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 快捷方法
const log = {
  error: (message, meta) => logger.error(message, meta),
  warn: (message, meta) => logger.warn(message, meta),
  info: (message, meta) => logger.info(message, meta),
  http: (message, meta) => logger.http(message, meta),
  debug: (message, meta) => logger.debug(message, meta),
  
  // 任务相关日志
  task: {
    created: (taskId, plan) => logger.info(`[Task] Created: ${taskId}`, { plan }),
    updated: (taskId, stepId, status) => logger.info(`[Task] Updated: ${taskId} #${stepId} -> ${status}`),
    completed: (taskId) => logger.info(`[Task] Completed: ${taskId}`),
    failed: (taskId, error) => logger.error(`[Task] Failed: ${taskId}`, { error })
  },
  
  // Webhook 相关日志
  webhook: {
    received: (type, ip) => logger.info(`[Webhook] Received: ${type} from ${ip}`),
    verified: (type) => logger.info(`[Webhook] Verified: ${type}`),
    failed: (type, error) => logger.error(`[Webhook] Failed: ${type}`, { error })
  },
  
  // Agent 相关日志
  agent: {
    spawned: (agentId, task) => logger.info(`[Agent] Spawned: ${agentId}`, { task }),
    completed: (agentId, result) => logger.info(`[Agent] Completed: ${agentId}`, { result }),
    failed: (agentId, error) => logger.error(`[Agent] Failed: ${agentId}`, { error })
  }
};

module.exports = log;
