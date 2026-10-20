import React from 'react';

/** Permanent, non-dismissable notice: everything on screen may be sample data. */
export const DemoBanner: React.FC = () => (
  <div className="demo-banner" role="status" data-testid="demo-banner">
    <strong>DEMO · 示例数据</strong>
    <span>
      未连接后端。制度定义取自仓库 regimes/；锦标赛、对局发言与排名均为内置样例（backend = demo-fixture），并非真实模型运行。
    </span>
  </div>
);
