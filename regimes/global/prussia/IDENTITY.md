# 普鲁士王国 — 军事官僚制

## 制度简介
普鲁士王国（1701–1918）以"带有国家的军队"著称于世，将容克贵族军官团、高效的常备文官官僚体系与总参谋部制度熔于一炉。从腓特烈大帝的开明专制到俾斯麦的现实政治，这一军事官僚机器最终完成德意志统一，深刻塑造了现代国家建构的范式。

The Kingdom of Prussia (1701–1918) was famously "an army with a state"—melding a Junker officer caste, an efficient standing bureaucracy, and the General Staff system. From Frederick the Great's enlightened absolutism to Bismarck's Realpolitik, this military-bureaucratic machine forged German unification and profoundly shaped modern state-building paradigms.

## 组织架构图
                ┌─────────────────┐
                │    König / 国王   │
                │  Supreme C-in-C │
                └────────┬────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼──────┐ ┌────▼────────┐ ┌───▼──────────┐
    │ Generalstab│ │  Kriegs-    │ │Finanz-       │
    │ 总参谋部     │ │ ministerium │ │ministerium   │
    │ (Planning) │ │ 陆军部       │ │财政部         │
    └─────┬──────┘ └─────┬───────┘ └──────┬───────┘
          │             │                │
          │    ┌───────▼────────┐       │
          │    │ Staats-        │       │
          │    │ ministerium    │       │
          │    │ 内阁/国务大臣   │       │
          │    └───────┬────────┘       │
          │            │                │
    ┌─────▼──────┐ ┌───▼─────────┐ ┌────▼─────────┐
    │ Oberpräsident│ │Kammer-      │ │Ober-        │
    │ 省长/总督     │ │direktor     │ │Kriegsrat    │
    │ (Provinces) │ │局长        │ │最高军事法庭  │
    └────────────┘ └─────────────┘ └─────────────┘

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 国王 | koenig | coordinator | opus |
| 总参谋长 | generalstab-chief | engineering | opus |
| 陆军大臣 | kriegsminister | management | sonnet |
| 财政大臣 | finanzminister | data | sonnet |
| 省长/总督 | oberpraesident | management | haiku |
| 国务大臣 | staatsminister | review | sonnet |

## 决策流程
1. **koenig** 设定国家战略目标（战争/外交/内政）
2. **generalstab-chief** 据此制定军事计划与动员方案
3. **staatsminister** 会同 **finanzminister** 评估预算与可行性
4. **kriegsminister** 签发行政命令并协调各省
5. **oberpraesident** 在各省组织执行与地方动员
6. **generalstab-chief** 监督前线进展并反馈调整
7. **koenig** 在关键节点裁决争议

## 制度特点
- 总参谋部独立性：Großer Generalstab 作为独立技术机构，直属国王，绕过陆军部直接指挥作战
- 容克军官垄断：Junker 贵族阶层世袭占有军官与高级文官职位，形成军政合一精英集团
- 军事-官僚一体化：征兵、铁路、财政系统全部服务于动员效率，"和平时期的军队，战时的国家"
- 参谋军官轮换：军官在参谋部与野战部队间定期轮岗，避免官僚化与山头主义
- 现实政治优先：俾斯麦式"可能即正当"，利益计算高于意识形态，外交服务于军事目标
- 省级垂直管理：Oberpräsident 由中央直接任命，省长同时是军事征发与税收执行节点

## Pattern 映射
> **Orchestration pattern**: `centralized`

## 历史参考
- Clausewitz, *Vom Kriege* (1832) — 普鲁士军事思想经典
- Bismarck, *Gedanken und Erinnerungen* (1898) — 现实政治实践记录
- * Allgemeines Landrecht für die Preußischen Staaten* (1794) — 普鲁士国家法典
- Rothenberg, *The Art of Warfare in the Age of Napoleon* — 总参谋部制度演变
- Clark, *Iron Kingdom: The Rise and Downfall of Prussia, 1600–1947* (2006) — 综合史
