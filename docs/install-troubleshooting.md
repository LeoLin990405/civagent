# 常见安装问题排查

## 问题 1: npm install -g openclaw 失败

### 症状
```
npm ERR! code EACCES
npm ERR! syscall mkdir
npm ERR! path /usr/local/lib/node_modules
npm ERR! errno -13
```

### 原因
npm 全局安装需要 root 权限

### 解决方案

**方案 A: 使用 sudo（推荐）**
```bash
sudo npm install -g openclaw@latest
```

**方案 B: 配置 npm 全局目录（无需 sudo）**
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g openclaw@latest
```

---

## 问题 2: curl 下载失败

### 症状
```
curl: (6) Could not resolve host: raw.githubusercontent.com
```

### 原因
DNS 解析问题或网络被墙

### 解决方案

**方案 A: 使用 GitHub 镜像**
```bash
# 使用 jsdelivr 镜像
curl -fsSL https://cdn.jsdelivr.net/gh/wanikua/danghuangshang/install-lite.sh -o install-lite.sh
bash install-lite.sh
```

**方案 B: 手动克隆仓库**
```bash
git clone --depth 1 https://github.com/wanikua/danghuangshang.git
cd danghuangshang
bash install-lite.sh
```

**方案 C: 修改 hosts（中国大陆用户）**
```bash
# 添加到 /etc/hosts
185.199.108.133 raw.githubusercontent.com
185.199.109.133 raw.githubusercontent.com
185.199.110.133 raw.githubusercontent.com
185.199.111.133 raw.githubusercontent.com
```

---

## 问题 3: 权限不足

### 症状
```
bash: install-lite.sh: Permission denied
```

### 原因
脚本没有执行权限

### 解决方案
```bash
chmod +x install-lite.sh
bash ./install-lite.sh
```

或直接用 bash 运行：
```bash
bash install-lite.sh
```

---

## 问题 4: Node.js 版本过低

### 症状
```
Error: OpenClaw requires Node.js 18 or higher
```

### 原因
系统 Node.js 版本过旧

### 解决方案

**使用 nvm 安装最新版本**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
npm install -g openclaw@latest
```

---

## 问题 5: 配置文件生成失败

### 症状
```
Error: Failed to generate configuration
```

### 原因
jq 未安装或配置模板损坏

### 解决方案

**安装 jq**
```bash
# Ubuntu/Debian
sudo apt-get install -y jq

# macOS
brew install jq

# CentOS/RHEL
sudo yum install -y jq
```

**手动下载配置**
```bash
curl -fsSL https://raw.githubusercontent.com/wanikua/danghuangshang/main/configs/ming-neige/openclaw.json -o ~/.openclaw/openclaw.json
```

---

## 问题 6: 人设注入失败

### 症状
安装后 agent 的人设是占位符文本

### 原因
人设注入逻辑未执行或 agents 目录不存在

### 解决方案

**手动注入人设**
```bash
cd danghuangshang
CONFIG_FILE=~/.openclaw/openclaw.json
AGENTS_DIR=configs/ming-neige/agents

for agent_file in "$AGENTS_DIR"/*.md; do
  agent_id=$(basename "$agent_file" .md)
  persona=$(tail -n +3 "$agent_file")
  persona_escaped=$(echo "$persona" | jq -Rs '.')
  
  jq --arg id "$agent_id" --argjson p "$persona_escaped" \
    '.agents.list = [.agents.list[] | if .id == $id then .identity.theme = $p else . end]' \
    "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
done
```

---

## 问题 7: Windows PowerShell 执行策略

### 症状
```
cannot be loaded because running scripts is disabled on this system
```

### 原因
PowerShell 执行策略限制

### 解决方案

**临时允许执行**
```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

**或永久修改策略（需要管理员权限）**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 问题 8: Docker 安装失败

### 症状
```
Cannot connect to the Docker daemon
```

### 原因
Docker 服务未启动或权限不足

### 解决方案

**启动 Docker 服务**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

**添加用户到 docker 组**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**或使用 sudo**
```bash
sudo docker compose up -d
```

---

## 快速诊断命令

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 权限
npm config get prefix

# 检查网络连接
curl -I https://raw.githubusercontent.com

# 检查 jq 是否安装
jq --version

# 检查 git 是否安装
git --version

# 检查 Docker 是否运行
docker ps
```

---

## 获取帮助

如果以上方案都无法解决问题，请提供：

1. **操作系统信息**: `uname -a` 或 `ver`
2. **Node.js 版本**: `node --version`
3. **npm 版本**: `npm --version`
4. **完整错误信息**: 复制完整的报错输出
5. **安装方式**: curl / git clone / Docker

提交 Issue: https://github.com/wanikua/danghuangshang/issues
