export default function register(api: any) {
  const config = api.getConfig?.() ?? {};
  const vikingScript =
    config.vikingScript ?? "skills/openviking/scripts/viking.sh";

  // 语义搜索工具 — 供翰林院 agent 在 grep 不够精确时调用
  api.registerTool({
    name: "novel_viking_search",
    description:
      "语义搜索小说设定和前文内容（通过 OpenViking）。" +
      "当 grep 关键词搜索不够精确时使用，支持模糊语义匹配。",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            '搜索查询，例如「林晓的性格特征」「青铜匕首的来历」',
        },
      },
      required: ["query"],
    },
    async execute({ query }: { query: string }) {
      const { execSync } = await import("child_process");
      try {
        return execSync(`bash ${vikingScript} search "${query}"`, {
          encoding: "utf-8",
          timeout: 30_000,
        });
      } catch {
        return "OpenViking 未安装或不可用，请回退到文件搜索（grep）。";
      }
    },
  });

  // 索引工具 — 归档后同步文件到 OpenViking 索引
  api.registerTool({
    name: "novel_viking_index",
    description:
      "将小说设定文件或章节摘要索引到 OpenViking。" +
      "在 novel-archiving 归档流程完成后调用，保持语义索引同步。",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "要索引的文件或目录路径",
        },
        recursive: {
          type: "boolean",
          description: "是否递归索引目录",
          default: false,
        },
      },
      required: ["path"],
    },
    async execute({ path, recursive }: { path: string; recursive?: boolean }) {
      const { execSync } = await import("child_process");
      const cmd = recursive ? "add-dir" : "add";
      try {
        return execSync(`bash ${vikingScript} ${cmd} ${path}`, {
          encoding: "utf-8",
          timeout: 60_000,
        });
      } catch {
        return "OpenViking 索引失败，文件系统记忆不受影响。";
      }
    },
  });
}
