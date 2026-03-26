/**
 * Error Handler 单元测试
 */

const assert = require('assert');
const { AppError, ErrorCode, ErrorHandler } = require('../scripts/error');

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create AppError with code and message', () => {
      const error = new AppError(ErrorCode.TASK_NOT_FOUND, 'Task not found');
      
      assert.strictEqual(error.code, ErrorCode.TASK_NOT_FOUND);
      assert.strictEqual(error.message, 'Task not found');
      assert(error.timestamp);
    });
    
    it('should include details', () => {
      const error = new AppError(ErrorCode.TASK_NOT_FOUND, 'Task not found', { taskId: '123' });
      
      assert.deepStrictEqual(error.details, { taskId: '123' });
    });
    
    it('should have correct status code', () => {
      const error = new AppError(ErrorCode.TASK_NOT_FOUND, 'Task not found');
      
      assert.strictEqual(error.statusCode, 404);
    });
    
    it('should convert to JSON', () => {
      const error = new AppError(ErrorCode.TASK_NOT_FOUND, 'Task not found', { taskId: '123' });
      const json = error.toJSON();
      
      assert(json.error);
      assert.strictEqual(json.error.code, ErrorCode.TASK_NOT_FOUND);
    });
    
    it('should include cause if provided', () => {
      const cause = new Error('Original error');
      const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Wrapped', {}, cause);
      
      assert.strictEqual(error.cause, cause);
    });
  });
  
  describe('ErrorCode', () => {
    it('should have task-related codes', () => {
      assert(ErrorCode.TASK_NOT_FOUND);
      assert(ErrorCode.TASK_ALREADY_EXISTS);
      assert(ErrorCode.TASK_INVALID_PLAN);
    });
    
    it('should have webhook-related codes', () => {
      assert(ErrorCode.WEBHOOK_INVALID_SIGNATURE);
      assert(ErrorCode.WEBHOOK_MISSING_SIGNATURE);
    });
  });
  
  describe('ErrorHandler', () => {
    it('should return AppError as-is', () => {
      const appError = new AppError(ErrorCode.TASK_NOT_FOUND, 'Test');
      const handled = ErrorHandler.handle(appError);
      
      assert.strictEqual(handled, appError);
    });
    
    it('should wrap unknown error', () => {
      const unknownError = new Error('Unknown');
      const handled = ErrorHandler.handle(unknownError);
      
      assert(handled instanceof AppError);
      assert.strictEqual(handled.code, ErrorCode.INTERNAL_ERROR);
    });
    
    it('should wrap async function', async () => {
      const fn = ErrorHandler.wrap(async () => {
        throw new Error('Test error');
      });
      
      await assert.rejects(fn, AppError);
    });
  });
});
