/**
 * 插件系统接口定义
 * 
 * 用法：
 * class MySkill extends Skill {
 *   async execute(context) {
 *     // 实现
 *   }
 * }
 */

/**
 * Skill 基类
 */
class Skill {
  constructor(config = {}) {
    this.name = 'base-skill';
    this.version = '1.0.0';
    this.description = 'Base skill';
    this.config = config;
    this.initialized = false;
  }
  
  /**
   * 初始化插件
   * @param {object} config - 配置
   * @returns {Promise<void>}
   */
  async init(config) {
    this.config = { ...this.config, ...config };
    this.initialized = true;
  }
  
  /**
   * 执行插件
   * @param {object} context - 执行上下文
   * @returns {Promise<SkillResult>}
   */
  async execute(context) {
    throw new Error('Skill.execute() must be implemented by subclass');
  }
  
  /**
   * 销毁插件
   * @returns {Promise<void>}
   */
  async destroy() {
    this.initialized = false;
  }
  
  /**
   * 获取元信息
   * @returns {object}
   */
  getMeta() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      initialized: this.initialized
    };
  }
}

/**
 * Skill 执行结果
 */
class SkillResult {
  constructor(success, data, error = null) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
  
  static ok(data) {
    return new SkillResult(true, data);
  }
  
  static fail(error, data = null) {
    return new SkillResult(false, data, error);
  }
}

/**
 * Skill 注册表
 */
class SkillRegistry {
  constructor() {
    this.skills = new Map();
  }
  
  /**
   * 注册 Skill
   * @param {Skill} skill 
   */
  register(skill) {
    if (!(skill instanceof Skill)) {
      throw new Error('Must register a Skill instance');
    }
    this.skills.set(skill.name, skill);
  }
  
  /**
   * 获取 Skill
   * @param {string} name 
   * @returns {Skill}
   */
  get(name) {
    return this.skills.get(name);
  }
  
  /**
   * 注销 Skill
   * @param {string} name 
   */
  async unregister(name) {
    const skill = this.skills.get(name);
    if (skill) {
      await skill.destroy();
      this.skills.delete(name);
    }
  }
  
  /**
   * 列出所有 Skill
   * @returns {Array}
   */
  list() {
    return Array.from(this.skills.values()).map(s => s.getMeta());
  }
  
  /**
   * 执行 Skill
   * @param {string} name 
   * @param {object} context 
   * @returns {Promise<SkillResult>}
   */
  async execute(name, context) {
    const skill = this.get(name);
    if (!skill) {
      throw new Error(`Skill not found: ${name}`);
    }
    if (!skill.initialized) {
      await skill.init(this.config);
    }
    return await skill.execute(context);
  }
}

module.exports = {
  Skill,
  SkillResult,
  SkillRegistry
};
