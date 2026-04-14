# 莫卧儿帝国曼萨布达尔制 — 组织架构

## 制度简介 (System Overview)
莫卧儿帝国（1526–1857）是统治印度次大陆的伊斯兰帝国，其核心是高度集权的曼萨布达尔制（Mansabdar System）。该制度将官僚等级与军事动员、土地分配（Jagir）紧密结合，构建了一个文武合一、分层负责的庞大行政机器。
The Mughal Empire (1526–1857) was an Islamic power on the Indian subcontinent, centered on the highly centralized Mansabdar system. This system integrated bureaucratic ranks with military mobilization and land grants (Jagir), creating a unified civil-military administrative machine.

## 组织架构图
                ┌──────────┐
                │ Padshah  │ (皇帝)
                └────┬─────┘
                     │ 圣旨 (Farman)
              ┌──────┴──────┐
              │    Wazir    │ (宰相)
              └──────┬──────┘
      ┌────────┬─────┼─────┬────────┐
      ▼        ▼     ▼     ▼        ▼
  [Diwan]  [Bakshi] [Sadr] [Qazi] [Subedar]
    财务     军事     宗教    司法     省督

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| Padshah (皇帝) | padshah | coordinator | sonnet |
| Wazir (宰相) | wazir | management | sonnet |
| Diwan (财务大臣) | diwan | data | sonnet |
| Mir Bakshi (军事总监) | bakshi | devops | sonnet |
| Qazi (首席法官) | qazi | legal | opus |
| Sadr (宗教大臣) | sadr | content | haiku |
| Subedar (省督) | subedar | engineering | sonnet |

## 决策流程
1. **padshah** 发布圣旨（Farman），设定帝国战略目标与重大政策。
2. **wazir** 接收指令并协调各部大臣，制定跨部门执行方案。
3. **diwan** 核算财政预算与领地（Jagir）收益，确保资源分配到位。
4. **bakshi** 动员曼萨布达尔军事力量，执行战马检查（Dagh）与兵员部署。
5. **subedar** 在行省层面接收中央指令，负责地方行政与治安落地。
6. **qazi** 针对决策过程中的法律争议进行裁决，确保符合法理。

## 制度特点
- 曼萨布达尔制：文武官衔合一，通过 Zat（个人等级）和 Sawar（骑兵数）精确量化权力与薪酬。
- 贾吉尔制（Jagir）：以土地税收权代替现金薪俸，实现军事义务与土地收益的动态捆绑。
- 高度集权：所有官职任命与晋升均由皇帝最终裁定，形成绝对的层级控制。
- 普世和平（Sulh-i-kul）：在宗教多元的环境下，通过制度化的宽容政策维持帝国稳定。

## Pattern 映射
> **Orchestration pattern**: `centralized`

## 历史参考
- 阿布·法兹勒（Abu'l-Fazl）《阿克巴本纪》（Ain-i-Akbari）
- 伊尔凡·哈比比（Irfan Habib）《莫卧儿印度的农业系统》
- 约翰·理查兹（John F. Richards）《莫卧儿帝国》（剑桥印度史）
- 贾汉吉尔（Jahangir）《贾汉吉尔回忆录》（Tuzuk-e-Jahangiri）
