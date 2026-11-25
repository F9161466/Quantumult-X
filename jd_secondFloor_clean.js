/**
 * 京东 secondFloor & delivery_component 响应体过滤
 * - secondFloor: 清理活动、营销、小游戏与信贷推广卡片，保留真实订单/物流提醒
 * - delivery_component: 保留浏览足迹商品 (sort 1 / type 2)，清理频道活动入口与小游戏推荐
 */
const body = $response && $response.body;

if (body) {
  try {
    const obj = JSON.parse(body);
    const data = obj && obj.data;

    // 1. 清理 remindFloor（首页二楼活动/营销/小游戏/信贷推广）
    if (data && data.remindFloor) {
      const rf = data.remindFloor;

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

          if (promoBusinessCodes.has(bizCode)) {
            return false;
          }

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

    // 2. 清理 browseHistoryFloor（delivery_component 中的“足迹”模块）
    // 仅保留 type === 2 / sort === 1 的浏览商品记录，剔除频道活动宫格(type 1)与小游戏推荐(type 3)
    if (data && data.browseHistoryFloor && Array.isArray(data.browseHistoryFloor.browseHistory)) {
      data.browseHistoryFloor.browseHistory = data.browseHistoryFloor.browseHistory.filter(
        (group) => group && group.type === 2 && group.sort === 1
      );
    }

    // 3. 清理下拉提示中偏营销/活动的话术，保留基础刷新提示
    if (data && Array.isArray(data.pullText) && data.pullText.length > 0) {
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

