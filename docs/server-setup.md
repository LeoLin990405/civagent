# 🖥️ 领一台免费服务器（可选）

> ⏱️ 预计耗时：10-15 分钟 | **已有服务器的用户请直接跳过本文**
>
> ← [返回 README](../README.md) | [下一步：选择平台 →](../README.md#-第二步选平台)

---

## 你需要什么样的服务器？

| 配置 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 1 核 | 2-4 核 |
| 内存 | 2 GB（单 Agent） | 4 GB+（多 Agent） |
| 系统 | Ubuntu 22.04+ | Ubuntu 24.04 |
| 架构 | x86 或 ARM | ARM（省钱） |
| 公网 IP | 需要 | 需要 |

---

## 推荐云服务商

| 平台 | 推荐配置 | 费用 | 说明 |
|------|----------|------|------|
| **Oracle Cloud** ⭐ | ARM 4核24G | **永久免费** | [Always Free](https://www.oracle.com/cloud/free/) |
| **阿里云** | ECS 2核4G | 免费试用 / ¥40/月 | [领取免费试用](https://free.aliyun.com/) |
| **腾讯云** | 轻量 2核4G | 免费试用 / ¥40/月 | [领取免费试用](https://cloud.tencent.com/act/free) |
| **AWS** | t4g.medium | 免费 12 个月 | [Free Tier](https://aws.amazon.com/free/) |
| **GCP** | e2-medium | $300 试用额度 | [Free Trial](https://cloud.google.com/free) |
| **华为云** | HECS 2核4G | 免费试用 | [华为云](https://www.huaweicloud.com/) |

> 💡 国内用户推荐阿里云/腾讯云（延迟低）；海外用户推荐 Oracle Cloud（永久免费）。

---

## Oracle Cloud 注册流程（以此为例）

### 1. 注册账号

1. 访问 https://cloud.oracle.com → 点击 "Sign Up"
2. 填写信息：
   - **Country/Territory**：China
   - **Name**：真实姓名（拼音）
   - **Email**：推荐 Gmail/Outlook（QQ 邮箱可能收不到验证码）
3. 验证邮箱（6 位验证码）
4. 设置密码（至少 8 字符，含大小写+数字+特殊字符）

### 2. 选择主区域（⚠️ 选定后不可更改！）

| 区域 | 推荐度 | 说明 |
|------|--------|------|
| 🇯🇵 日本东京 | ⭐⭐⭐⭐⭐ | 延迟低，容量足 |
| 🇯🇵 日本大阪 | ⭐⭐⭐⭐ | 备选 |
| 🇺🇸 美西凤凰城 | ⭐⭐⭐⭐ | 容量大 |

> ❗ **不要选新加坡/首尔**——经常缺货抢不到！

### 3. 添加信用卡

🔒 **不会扣费！** 只是身份验证，预授权 $1 之后退回。

- ✅ Visa / MasterCard 信用卡或借记卡
- ❌ 银联卡不支持
- ❌ 预付费卡大概率失败

### 4. 创建服务器实例

1. 登录 → 左上角 ☰ → **Compute → Instances** → "Create Instance"
2. 配置：

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| Name | `openclaw-server` | 随便起 |
| Image | **Ubuntu 24.04** | ⚠️ 必须改！默认不是 Ubuntu |
| Shape | **VM.Standard.A1.Flex** | ARM 架构，免费 |
| OCPUs | 4 | 免费最大 |
| Memory | 24 GB | 免费最大 |
| Public IP | Assign | ⚠️ 必须分配 |
| SSH 密钥 | Generate | ⚠️ 下载私钥！只能下载一次！ |
| Boot Volume | 200 GB | 免费最大 |

3. 点击 "Create" → 等待状态变为 **RUNNING**（2-5 分钟）
4. 记下 **Public IP Address**

### 5. 连接服务器

**Mac / Linux：**
```bash
chmod 400 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@你的服务器IP
```

**Windows（PowerShell）：**
```powershell
icacls "C:\Users\你的用户名\Downloads\ssh-key-*.key" /inheritance:r /grant:r "%USERNAME%:R"
ssh -i "C:\Users\你的用户名\Downloads\ssh-key-*.key" ubuntu@你的服务器IP
```

首次会提示 `Are you sure you want to continue connecting?`，输入 `yes`。

> 📍 成功标志：看到 `ubuntu@openclaw-server:~$` ✅
>
> ❗ 用户名是 `ubuntu`，不是 `root`！

---

## ⚠️ 中国大陆用户特别说明

| 问题 | 解决方案 |
|------|----------|
| 大陆 IP 注册被限制 | 🟢 挂梯子（港/日/新节点），成功率 90%+ |
| 显示 "Out of capacity" | 换区域 / 换时间段（凌晨成功率高）/ 等几天 |
| 收不到手机验证码 | +86 多试几次或换时间段 |
| 没有 Visa/MasterCard | 用阿里云/腾讯云学生机代替（¥9.9/月） |

---

## 为什么不推荐本地电脑？

| | 云服务器 | 本地电脑 |
|---|---|---|
| Agent 能动的文件 | 仅服务器工作区 | **你的所有个人文件** |
| 搞坏了怎么办 | 重建服务器，5 分钟 | 个人文件可能丢失 |
| 24 小时在线 | ✅ | ❌ 关电脑就停了 |

> 🔴 Agent 拥有工作区内**完整读写权限**。云服务器出问题随时重建，个人电脑上就是安全隐患。
> 详见 [安全须知](./security.md)。

---

✅ **服务器就绪后** → [返回 README 选择平台](../README.md#-第二步选平台)
