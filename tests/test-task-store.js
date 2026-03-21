#!/usr/bin/env node
/**
 * Task Store 单元测试
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 导入被测试模块
const taskStore = require('../scripts/task-store');

// 测试数据库文件（使用临时文件）
const TEST_DB = path.join(__dirname, 'test-tasks.json');
process.env.TASK_STORE_DIR = __dirname;

// 清理函数
function cleanup() {
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
}

// 测试：创建任务
function testCreateTask() {
  console.log('🧪 测试：创建任务');
  
  cleanup();
  
  const plan = {
    description: '测试任务',
    steps: [
      { id: 1, agent: 'bingbu', task: '实现 API', dependencies: [] },
      { id: 2, agent: 'libu', task: '编写文档', dependencies: [1] }
    ]
  };
  
  const task = taskStore.createTask('test_task_001', plan);
  
  assert.strictEqual(task.id, 'test_task_001');
  assert.strictEqual(task.steps.length, 2);
  assert.strictEqual(task.steps[0].status, taskStore.TaskState.PENDING);
  assert.strictEqual(task.steps[1].dependencies[0], 1);
  
  console.log('  ✅ 通过');
}

// 测试：更新步骤状态
function testUpdateStep() {
  console.log('🧪 测试：更新步骤状态');
  
  const output = { result: '测试完成' };
  const step = taskStore.updateStep('test_task_001', 1, {
    status: taskStore.TaskState.SUCCESS,
    output: output
  });
  
  assert.strictEqual(step.status, taskStore.TaskState.SUCCESS);
  assert.deepStrictEqual(step.output, output);
  assert(step.completedAt !== null);
  
  console.log('  ✅ 通过');
}

// 测试：获取输入（自动聚合上游输出）
function testGetInput() {
  console.log('🧪 测试：获取输入');
  
  const input = taskStore.getInput('test_task_001', 2);
  
  assert.strictEqual(input.stepId, 2);
  assert.strictEqual(input.agent, 'libu');
  assert(input.upstreamOutputs !== null);
  assert(input.upstreamOutputs['1'] !== undefined);
  assert.strictEqual(input.upstreamOutputs['1'].output.result, '测试完成');
  
  console.log('  ✅ 通过');
}

// 测试：获取任务状态
function testGetTaskStatus() {
  console.log('🧪 测试：获取任务状态');
  
  const status = taskStore.getTaskStatus('test_task_001');
  
  assert.strictEqual(status.id, 'test_task_001');
  assert.strictEqual(status.progress, '1/2');
  assert(status.steps.length === 2);
  
  console.log('  ✅ 通过');
}

// 测试：任务状态计算
function testCalculateTaskStatus() {
  console.log('🧪 测试：任务状态计算');
  
  // 更新第二个步骤为成功
  taskStore.updateStep('test_task_001', 2, {
    status: taskStore.TaskState.SUCCESS,
    output: { result: '文档完成' }
  });
  
  const status = taskStore.getTaskStatus('test_task_001');
  assert.strictEqual(status.status, taskStore.TaskState.SUCCESS);
  assert.strictEqual(status.progress, '2/2');
  
  console.log('  ✅ 通过');
}

// 测试：列出任务
function testListTasks() {
  console.log('🧪 测试：列出任务');
  
  const tasks = taskStore.listTasks(10);
  
  assert(Array.isArray(tasks));
  assert(tasks.length >= 1);
  assert(tasks[0].id === 'test_task_001');
  
  console.log('  ✅ 通过');
}

// 运行所有测试
function runTests() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Task Store 单元测试                  ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
  
  try {
    testCreateTask();
    testUpdateStep();
    testGetInput();
    testGetTaskStatus();
    testCalculateTaskStatus();
    testListTasks();
    
    console.log('');
    console.log('✅ 所有测试通过！');
    console.log('');
    
    cleanup();
    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('❌ 测试失败:', error.message);
    console.log('');
    
    cleanup();
    process.exit(1);
  }
}

// 运行
runTests();
