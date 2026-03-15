// novel-openviking 插件
// 功能完全由 skills/novel-openviking/SKILL.md 提供
// 插件安装时自动注入 skill，agent 即可感知 OpenViking 增强能力
// 无需额外注册 tool — OpenViking 自带的 viking.sh 已在 skill 中说明用法

export default function register(_api: any) {
  // skill 由 openclaw.plugin.json 的 "skills" 字段声明，自动加载
  // 此入口文件仅作为插件系统的必要 entry point
}
