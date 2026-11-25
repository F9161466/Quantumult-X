/**
 * 京东 secondFloor 响应体过滤：清理活动、营销、小游戏与信贷推广卡片
 */
const body = $response && $response.body;

if (body) {
  try {
    const obj = JSON.parse(body);
    const data = obj && obj.data;

    if (data && data.remindFloor) {
      const rf = data.remindFloor;

      // 常见营销/活动/信贷/拉新/小游戏业务码
      const promoBusinessCodes = new Set([
        "festival",      // 各类活动/小游戏/频道推广
        "countdown",     // 限时抢购倒计时活动
        "healthNewUser", // 健康拉新/秒杀推广
        "repay",         // 白条取现/额度推广
        "hongbao",       // 互动赚红包
        "plus",          // PLUS 权益推广
        "benefits"       // 权益中心推广
      ]);

      if (Array.isArray(rf.result)) {
        rf.result = rf.result.filter((item) => {
          if (!item || typeof item !== "object") return false;

          const bizCode = String(item.businessCode || "");
          const name = String(item.name || "");
          const openUrl = String(item.openAppUrl || item.openAppUrlBg || item.jumpUrl || "");

          // 若是秒送专区且跳往订单详情，保留进度提醒；否则过滤
          if (bizCode === "mszq") {
            return openUrl.includes('"des":"orderDetail"') || openUrl.includes("orderId=");
          }

          // 过滤明确的活动/营销业务码
          if (promoBusinessCodes.has(bizCode)) {
            return false;
          }

          // 兜底过滤名称或链接中明显带活动/领券/抽奖/白条/拉新特征的卡片
          if (/红包|抽奖|挖宝|农场|餐厅|扭蛋|白条|额度|拉新|抢购|babelChannel/i.test(name + " " + openUrl)) {
            return false;
          }

          return true;
        });
      }

      if (Array.isArray(rf.floorList)) {
        rf.floorList = [];
      }
    }

    // 清理下拉提示中偏营销/活动的话术，保留基础刷新提示
    if (data && Array.isArray(data.pullText)) {
      data.pullText = data.pullText.filter(
        (txt) => typeof txt === "string" && !/二楼|消息|管家|福利|红包|活动/.test(txt)
      );
      if (data.pullText.length === 0) {
        data.pullText = ["下拉刷新", "刷新中", "刷新完成"];
      }
    }

    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    // 解析异常时放行原响应，避免误伤正常请求
    $done({ body });
  }
} else {
  $done({});
}
