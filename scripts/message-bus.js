const EventEmitter = require('events');

/**
 * Agent 消息总线
 * 
 * 用法：
 * const { messageBus } = require('./message-bus');
 * 
 * // 订阅主题
 * messageBus.subscribe('task.created', (data) => {
 *   console.log('Task created:', data);
 * });
 * 
 * // 发布消息
 * messageBus.publish('task.created', { taskId: 'xxx', plan: {} });
 * 
 * // 广播消息
 * messageBus.broadcast({ type: 'system.shutdown' });
 */

class MessageBus extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Map();
    this.messageHistory = [];
    this.maxHistory = 100;
  }
  
  /**
   * 订阅主题
   * @param {string} topic - 主题名称
   * @param {Function} handler - 处理函数
   * @returns {Function} 取消订阅函数
   */
  subscribe(topic, handler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic).add(handler);
    
    this.on(topic, handler);
    
    // 返回取消订阅函数
    return () => this.unsubscribe(topic, handler);
  }
  
  /**
   * 取消订阅
   * @param {string} topic 
   * @param {Function} handler 
   */
  unsubscribe(topic, handler) {
    this.off(topic, handler);
    
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).delete(handler);
    }
  }
  
  /**
   * 发布消息
   * @param {string} topic - 主题名称
   * @param {any} data - 消息数据
   */
  publish(topic, data) {
    const message = {
      topic,
      data,
      timestamp: new Date().toISOString(),
      id: this._generateId()
    };
    
    // 保存到历史
    this._addToHistory(message);
    
    // 发布消息
    this.emit(topic, data, message);
    
    // 日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MessageBus] Published: ${topic}`, data);
    }
  }
  
  /**
   * 广播消息（发送给所有订阅者）
   * @param {any} data 
   */
  broadcast(data) {
    this.publish('broadcast', data);
  }
  
  /**
   * 请求 - 响应模式
   * @param {string} topic 
   * @param {any} data 
   * @param {number} timeout - 超时时间（ms）
   * @returns {Promise<any>}
   */
  async request(topic, data, timeout = 5000) {
    const replyTopic = `reply.${topic}.${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.unsubscribe(replyTopic, handler);
        reject(new Error(`Request timeout: ${topic}`));
      }, timeout);
      
      const handler = (response) => {
        clearTimeout(timer);
        resolve(response);
      };
      
      this.subscribe(replyTopic, handler);
      this.publish(topic, { ...data, replyTo: replyTopic });
    });
  }
  
  /**
   * 获取历史消息
   * @param {number} limit 
   * @returns {Array}
   */
  getHistory(limit = 10) {
    return this.messageHistory.slice(-limit);
  }
  
  /**
   * 清空历史
   */
  clearHistory() {
    this.messageHistory = [];
  }
  
  /**
   * 获取订阅统计
   * @returns {object}
   */
  getStats() {
    return {
      topics: this.subscriptions.size,
      subscribers: Array.from(this.subscriptions.values())
        .reduce((sum, set) => sum + set.size, 0),
      historySize: this.messageHistory.length
    };
  }
  
  /**
   * 添加到历史
   * @private
   */
  _addToHistory(message) {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift();
    }
  }
  
  /**
   * 生成消息 ID
   * @private
   */
  _generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 单例
const messageBus = new MessageBus();

module.exports = {
  MessageBus,
  messageBus
};
