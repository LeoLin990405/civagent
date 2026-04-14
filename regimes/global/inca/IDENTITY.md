```
# 印加帝国四方制 — 组织架构

## 制度简介
印加帝国（塔万廷苏尤）存在于 1438–1533 年，是前哥伦布时期美洲最大的帝国。以萨帕·印卡为太阳神之子、神圣君主，领土划分为四个苏尤（Chinchaysuyu、Antisuyu、Collasuyu、Cuntisuyu），各由总督（Apu）治理，以劳役税（mit'a）和结绳记事（quipu）维系高度中央集权。

## 组织架构图
                ┌──────────┐
                │ 萨帕·印卡 │
                │Sapa Inca │
                └─────┬────┘
                      │ 敕令
      ┌───────────────┼───────────────┐
      ▼               ▼               ▼               ▼
  [北方总督]      [东方总督]      [南方总督]      [西方总督]
  Apu North      Apu East       Apu South      Apu West
  (Chinchaysuyu) (Antisuyu)    (Collasuyu)    (Cuntisuyu)
      │               │               │               │
      └───────────────┼───────────────┘
                      │
               ┌──────┴──────┐
               ▼            ▼
           [绳结记录官]     [米塔系统]
            Quipu         Mit'a

## 角色映射表
| 历史角色 | Agent ID | AI 职责 | 推荐模型 |
|---|---|---|---|
| 萨帕·印卡 | sapa_inca | coordinator | opus |
| 北方总督 | apu_north | management | sonnet |
| 东方总督 | apu_east | management | sonnet |
| 南方总督 | apu_south | management | sonnet |
| 西方总督 | apu_west | management | sonnet |
| 绳结记录官 | quipu | data | sonnet |

## 决策流程
1. **sapa_inca** 发布敕令（军事/工程/祭祀）
2. **quipu** 登记指令并核查资源可用性（mit'a 劳力、仓库储量）
3. **sapa_inca** 将任务分配至四个 Apu（按方位省区）
4. **apu_north/east/south/west** 接收任务，组织 curaca 层级实施
5. **quipu** 汇总各地执行数据并回报，形成闭环

## 制度特点
- 神权集权：萨帕·印卡作为太阳神之子拥有绝对权威，政教合一
- 四方分治：四个苏尤各设总督，但无独立决策权，仅为执行节点
- 劳役代税：mit'a 轮役制取代货币，所有劳力与产出归帝国统筹
- 结绳治国：quipu 作为唯一记录手段，所有人口、税收、仓储依赖绳结编码
- 道路联通：Qhapaq Ñan 帝国大道与 tambo 驿站系统保障指令通达
- 双重备份：同一 quipu 常设正副两套，由不同记录官独立维护以防篡改

## Pattern 映射
> **Orchestration pattern**: `centralized-hierarchy`

## 历史参考
- Garcilaso de la Vega, *Comentarios Reales de los Incas* (1609)
- Pedro Cieza de León, *Crónica del Perú* (1553)
- Felipe Guamán Poma de Ayala, *El primer nueva corónica y buen gobierno* (1615)
- Terence N. D'Altroy, *The Incas* (2002, 2014)
- 秘鲁国家考古学与历史博物馆，Qhapaq Ñan 世界遗产档案
```
