var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .wrangler/tmp/bundle-JRcDkR/checked-fetch.js
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
var urls;
var init_checked_fetch = __esm({
  ".wrangler/tmp/bundle-JRcDkR/checked-fetch.js"() {
    "use strict";
    urls = /* @__PURE__ */ new Set();
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-JRcDkR/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
var init_strip_cf_connecting_ip_header = __esm({
  ".wrangler/tmp/bundle-JRcDkR/strip-cf-connecting-ip-header.js"() {
    "use strict";
    __name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader.apply(null, argArray)
        ]);
      }
    });
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// src/types/index.ts
var ErrorCodes, PICK_ORDER;
var init_types = __esm({
  "src/types/index.ts"() {
    "use strict";
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    ErrorCodes = {
      GAME_NOT_FOUND: { code: 1001, message: "\u6E38\u620F\u4E0D\u5B58\u5728" },
      NOT_YOUR_TURN: { code: 1002, message: "\u975E\u5F53\u524D\u73A9\u5BB6\u56DE\u5408" },
      COOLDOWN: { code: 1003, message: "\u64CD\u4F5C\u51B7\u5374\u4E2D" },
      ALREADY_ACTED: { code: 1004, message: "\u6B66\u5C06\u5DF2\u884C\u52A8" },
      INVALID_POSITION: { code: 1005, message: "\u76EE\u6807\u4F4D\u7F6E\u4E0D\u53EF\u8FBE" },
      TARGET_OUT_OF_RANGE: { code: 1006, message: "\u653B\u51FB\u76EE\u6807\u4E0D\u5728\u8303\u56F4\u5185" },
      GENERAL_DEAD: { code: 1007, message: "\u6B66\u5C06\u5DF2\u9635\u4EA1" },
      INVALID_ACTION: { code: 1008, message: "\u65E0\u6548\u64CD\u4F5C" },
      GAME_FULL: { code: 1009, message: "\u6E38\u620F\u5DF2\u6EE1" },
      INVALID_GENERAL: { code: 1010, message: "\u65E0\u6548\u6B66\u5C06" },
      GENERAL_BANNED: { code: 1011, message: "\u6B66\u5C06\u5DF2\u88AB\u7981\u7528" },
      GENERAL_PICKED: { code: 1012, message: "\u6B66\u5C06\u5DF2\u88AB\u9009\u62E9" },
      INVALID_DEPLOY_POSITION: { code: 1013, message: "\u65E0\u6548\u90E8\u7F72\u4F4D\u7F6E" },
      CANNOT_RETREAT: { code: 1014, message: "\u65E0\u6CD5\u64A4\u9000\uFF08\u88AB\u5178\u97E6\u6076\u6765\u6280\u80FD\u9650\u5236\uFF09" }
    };
    PICK_ORDER = [
      { phase: 1, action: "ban", player: "p1", count: 1 },
      { phase: 2, action: "ban", player: "p2", count: 1 },
      { phase: 3, action: "ban", player: "p1", count: 1 },
      { phase: 4, action: "ban", player: "p2", count: 1 },
      { phase: 5, action: "pick", player: "p1", count: 1 },
      { phase: 6, action: "pick", player: "p2", count: 2 },
      { phase: 7, action: "pick", player: "p1", count: 2 },
      { phase: 8, action: "pick", player: "p2", count: 2 },
      { phase: 9, action: "pick", player: "p1", count: 2 },
      { phase: 10, action: "pick", player: "p2", count: 1 }
    ];
  }
});

// src/data/generals.ts
var generals_exports = {};
__export(generals_exports, {
  GENERALS: () => GENERALS,
  getAllGeneralIds: () => getAllGeneralIds,
  getGeneralById: () => getGeneralById,
  getGeneralsByFaction: () => getGeneralsByFaction
});
function getGeneralById(id) {
  return GENERALS.find((g) => g.id === id);
}
function getGeneralsByFaction(faction) {
  return GENERALS.filter((g) => g.faction === faction);
}
function getAllGeneralIds() {
  return GENERALS.map((g) => g.id);
}
var GENERALS;
var init_generals = __esm({
  "src/data/generals.ts"() {
    "use strict";
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    GENERALS = [
      // 蜀汉 (10位)
      {
        id: 1,
        name: "\u5218\u5907",
        faction: "\u8700",
        type: "\u541B\u4E3B",
        base_hp: 6,
        base_atk: 4,
        base_def: 5,
        base_mov: 5,
        skill_name: "\u4EC1\u5FB7",
        skill_desc: "\u76F8\u90BB\u53CB\u519B\u653B\u51FB+1",
        skill_type: "passive"
      },
      {
        id: 2,
        name: "\u5173\u7FBD",
        faction: "\u8700",
        type: "\u731B\u5C06",
        base_hp: 7,
        base_atk: 9,
        base_def: 6,
        base_mov: 4,
        skill_name: "\u6B66\u5723",
        skill_desc: "\u653B\u51FB\u65E0\u89C61\u70B9\u9632\u5FA1",
        skill_type: "passive"
      },
      {
        id: 3,
        name: "\u5F20\u98DE",
        faction: "\u8700",
        type: "\u731B\u5C06",
        base_hp: 8,
        base_atk: 8,
        base_def: 4,
        base_mov: 5,
        skill_name: "\u5486\u54EE",
        skill_desc: "HP<3\u65F6\u653B\u51FB+2",
        skill_type: "passive"
      },
      {
        id: 4,
        name: "\u8D75\u4E91",
        faction: "\u8700",
        type: "\u9A91\u5175",
        base_hp: 6,
        base_atk: 7,
        base_def: 6,
        base_mov: 7,
        skill_name: "\u9F99\u80C6",
        skill_desc: "\u51FB\u6740\u540E\u53EF\u518D\u79FB\u52A82\u683C",
        skill_type: "passive"
      },
      {
        id: 5,
        name: "\u8BF8\u845B\u4EAE",
        faction: "\u8700",
        type: "\u8C0B\u58EB",
        base_hp: 4,
        base_atk: 3,
        base_def: 3,
        base_mov: 4,
        skill_name: "\u795E\u7B97",
        skill_desc: "\u53EF\u6307\u63252\u683C\u5185\u53CB\u519B\u884C\u52A8(\u6D88\u8017\u81EA\u5DF1\u884C\u52A8)",
        skill_type: "active"
      },
      {
        id: 6,
        name: "\u9A6C\u8D85",
        faction: "\u8700",
        type: "\u9A91\u5175",
        base_hp: 6,
        base_atk: 8,
        base_def: 5,
        base_mov: 8,
        skill_name: "\u94C1\u9A91",
        skill_desc: "\u672C\u56DE\u5408\u79FB\u52A8\u22653\u683C\u540E\u653B\u51FB+2",
        skill_type: "passive"
      },
      {
        id: 7,
        name: "\u9EC4\u5FE0",
        faction: "\u8700",
        type: "\u5F13\u624B",
        base_hp: 5,
        base_atk: 7,
        base_def: 4,
        base_mov: 4,
        skill_name: "\u767E\u6B65",
        skill_desc: "\u653B\u51FB\u8303\u56F43\u683C",
        skill_type: "passive"
      },
      {
        id: 8,
        name: "\u9B4F\u5EF6",
        faction: "\u8700",
        type: "\u731B\u5C06",
        base_hp: 7,
        base_atk: 7,
        base_def: 5,
        base_mov: 5,
        skill_name: "\u53CD\u9AA8",
        skill_desc: "\u88AB\u653B\u51FB\u65F6\u53CD\u51FB\u4F24\u5BB3+1",
        skill_type: "passive"
      },
      {
        id: 9,
        name: "\u59DC\u7EF4",
        faction: "\u8700",
        type: "\u5747\u8861",
        base_hp: 6,
        base_atk: 6,
        base_def: 5,
        base_mov: 6,
        skill_name: "\u80C6\u7565",
        skill_desc: "\u6BCF\u573A\u6218\u6597\u9996\u6B21\u53D7\u4F24\u51CF\u514D1\u70B9",
        skill_type: "passive"
      },
      {
        id: 10,
        name: "\u5E9E\u7EDF",
        faction: "\u8700",
        type: "\u8C0B\u58EB",
        base_hp: 4,
        base_atk: 4,
        base_def: 3,
        base_mov: 5,
        skill_name: "\u8FDE\u73AF",
        skill_desc: "\u653B\u51FB\u65F6\u5BF9\u76EE\u6807\u76F8\u90BB\u76841\u4E2A\u654C\u4EBA\u9020\u62101\u70B9\u6E85\u5C04\u4F24\u5BB3",
        skill_type: "passive"
      },
      // 魏国 (11位)
      {
        id: 11,
        name: "\u66F9\u64CD",
        faction: "\u9B4F",
        type: "\u541B\u4E3B",
        base_hp: 6,
        base_atk: 6,
        base_def: 5,
        base_mov: 5,
        skill_name: "\u5978\u96C4",
        skill_desc: "\u51FB\u6740\u654C\u4EBA\u56DE\u590D1HP",
        skill_type: "passive"
      },
      {
        id: 12,
        name: "\u5F20\u8FBD",
        faction: "\u9B4F",
        type: "\u9A91\u5175",
        base_hp: 6,
        base_atk: 7,
        base_def: 5,
        base_mov: 7,
        skill_name: "\u5A01\u9707",
        skill_desc: "\u5BF9\u6BCF\u4E2A\u654C\u4EBA\u7684\u9996\u6B21\u653B\u51FB\u4F7F\u5176\u9632\u5FA1-1(\u6301\u7EED\u5230\u6218\u6597\u7ED3\u675F)",
        skill_type: "passive"
      },
      {
        id: 13,
        name: "\u590F\u4FAF\u60C7",
        faction: "\u9B4F",
        type: "\u731B\u5C06",
        base_hp: 8,
        base_atk: 6,
        base_def: 6,
        base_mov: 5,
        skill_name: "\u521A\u70C8",
        skill_desc: "\u53D7\u5230\u4F24\u5BB3\u65F6\u5BF9\u653B\u51FB\u8005\u9020\u62101\u70B9\u53CD\u4F24",
        skill_type: "passive"
      },
      {
        id: 14,
        name: "\u590F\u4FAF\u6E0A",
        faction: "\u9B4F",
        type: "\u9A91\u5175",
        base_hp: 5,
        base_atk: 6,
        base_def: 4,
        base_mov: 9,
        skill_name: "\u6025\u88AD",
        skill_desc: "\u65E0\u989D\u5916\u6548\u679C\uFF0C\u7EAF\u9AD8\u673A\u52A8",
        skill_type: "passive"
      },
      {
        id: 15,
        name: "\u8BB8\u891A",
        faction: "\u9B4F",
        type: "\u731B\u5C06",
        base_hp: 9,
        base_atk: 7,
        base_def: 5,
        base_mov: 4,
        skill_name: "\u864E\u75F4",
        skill_desc: "\u65E0\u989D\u5916\u6548\u679C\uFF0C\u7EAF\u9AD8\u8840\u91CF",
        skill_type: "passive"
      },
      {
        id: 16,
        name: "\u5178\u97E6",
        faction: "\u9B4F",
        type: "\u731B\u5C06",
        base_hp: 8,
        base_atk: 8,
        base_def: 6,
        base_mov: 3,
        skill_name: "\u6076\u6765",
        skill_desc: "\u76F8\u90BB\u654C\u4EBA\u65E0\u6CD5\u4F7F\u7528\u64A4\u9000\u6307\u4EE4",
        skill_type: "passive"
      },
      {
        id: 17,
        name: "\u53F8\u9A6C\u61FF",
        faction: "\u9B4F",
        type: "\u8C0B\u58EB",
        base_hp: 5,
        base_atk: 4,
        base_def: 4,
        base_mov: 5,
        skill_name: "\u9690\u5FCD",
        skill_desc: "\u8FDE\u7EED3\u56DE\u5408\u4E0D\u79FB\u52A8\u4E0D\u653B\u51FB\u540E\uFF0C\u653B\u9632\u5404+2(\u79FB\u52A8\u6216\u653B\u51FB\u540E\u91CD\u7F6E)",
        skill_type: "passive"
      },
      {
        id: 18,
        name: "\u90ED\u5609",
        faction: "\u9B4F",
        type: "\u8C0B\u58EB",
        base_hp: 3,
        base_atk: 3,
        base_def: 2,
        base_mov: 6,
        skill_name: "\u9B3C\u624D",
        skill_desc: "\u53EF\u67E5\u770B5\u683C\u8303\u56F4\u5185\u654C\u4EBA\u4E0B\u4E00\u6B65\u884C\u52A8\u610F\u56FE",
        skill_type: "active"
      },
      {
        id: 19,
        name: "\u5F20\u90C3",
        faction: "\u9B4F",
        type: "\u5747\u8861",
        base_hp: 6,
        base_atk: 6,
        base_def: 6,
        base_mov: 6,
        skill_name: "\u5DE7\u53D8",
        skill_desc: "\u53EF\u659C\u5411\u79FB\u52A8",
        skill_type: "passive"
      },
      {
        id: 20,
        name: "\u5F90\u6643",
        faction: "\u9B4F",
        type: "\u731B\u5C06",
        base_hp: 7,
        base_atk: 7,
        base_def: 5,
        base_mov: 5,
        skill_name: "\u65AD\u7CAE",
        skill_desc: "\u653B\u51FB\u4F4D\u4E8E\u5DF1\u65B9\u51FA\u751F\u533A\u5230\u57CE\u6C60\u8FDE\u7EBF\u4E0A\u7684\u654C\u4EBA\u65F6\u4F24\u5BB3+2",
        skill_type: "passive"
      },
      {
        id: 21,
        name: "\u66F9\u4EC1",
        faction: "\u9B4F",
        type: "\u5B88\u5C06",
        base_hp: 7,
        base_atk: 5,
        base_def: 8,
        base_mov: 4,
        skill_name: "\u575A\u5B88",
        skill_desc: "\u5728\u57CE\u6C60\u5185\u65F6\u989D\u5916\u9632\u5FA1+1",
        skill_type: "passive"
      },
      // 吴国 (8位)
      {
        id: 22,
        name: "\u5B59\u6743",
        faction: "\u5434",
        type: "\u541B\u4E3B",
        base_hp: 5,
        base_atk: 5,
        base_def: 5,
        base_mov: 5,
        skill_name: "\u5236\u8861",
        skill_desc: "\u76F8\u90BB\u53CB\u519B\u5171\u4EAB\u6700\u9AD8\u9632\u5FA1\u503C(\u53D6\u76F8\u90BB\u53CB\u519B\u4E2D\u6700\u9AD8\u9632\u5FA1)",
        skill_type: "passive"
      },
      {
        id: 23,
        name: "\u5B59\u7B56",
        faction: "\u5434",
        type: "\u731B\u5C06",
        base_hp: 6,
        base_atk: 8,
        base_def: 4,
        base_mov: 7,
        skill_name: "\u9738\u738B",
        skill_desc: "\u5468\u56F42\u683C\u5185\u53EA\u67091\u4E2A\u654C\u4EBA\u65F6\u653B\u51FB+3",
        skill_type: "passive"
      },
      {
        id: 24,
        name: "\u5468\u745C",
        faction: "\u5434",
        type: "\u8C0B\u58EB",
        base_hp: 5,
        base_atk: 5,
        base_def: 4,
        base_mov: 5,
        skill_name: "\u706B\u653B",
        skill_desc: '\u653B\u51FB\u540E\u76EE\u6807\u83B7\u5F97"\u707C\u70E7"\u72B6\u6001\uFF0C\u4E0B\u56DE\u5408\u5F00\u59CB\u53D7\u52301\u70B9\u4F24\u5BB3',
        skill_type: "passive"
      },
      {
        id: 25,
        name: "\u9646\u900A",
        faction: "\u5434",
        type: "\u8C0B\u58EB",
        base_hp: 5,
        base_atk: 5,
        base_def: 5,
        base_mov: 6,
        skill_name: "\u8425\u70E7",
        skill_desc: "\u653B\u51FB\u8303\u56F4+1\u683C(\u53EF\u653B\u51FB2\u683C\u5185\u654C\u4EBA)",
        skill_type: "passive"
      },
      {
        id: 26,
        name: "\u7518\u5B81",
        faction: "\u5434",
        type: "\u523A\u5BA2",
        base_hp: 5,
        base_atk: 8,
        base_def: 3,
        base_mov: 8,
        skill_name: "\u7A81\u88AD",
        skill_desc: "\u4ECE\u654C\u4EBA\u80CC\u540E(\u654C\u4EBA\u9762\u671D\u65B9\u5411\u7684\u53CD\u65B9\u5411)\u653B\u51FB\u65F6\u4F24\u5BB3\xD72",
        skill_type: "passive"
      },
      {
        id: 27,
        name: "\u592A\u53F2\u6148",
        faction: "\u5434",
        type: "\u5F13\u624B",
        base_hp: 6,
        base_atk: 7,
        base_def: 5,
        base_mov: 5,
        skill_name: "\u795E\u5C04",
        skill_desc: "\u8FDC\u7A0B\u653B\u51FB(2-3\u683C)\u65F6\u4E0D\u53D7\u53CD\u51FB",
        skill_type: "passive"
      },
      {
        id: 28,
        name: "\u5415\u8499",
        faction: "\u5434",
        type: "\u5747\u8861",
        base_hp: 6,
        base_atk: 6,
        base_def: 5,
        base_mov: 6,
        skill_name: "\u767D\u8863",
        skill_desc: "\u79FB\u52A8\u65F6\u53EF\u7A7F\u8D8A\u654C\u65B9\u5355\u4F4D(\u4E0D\u80FD\u505C\u7559)",
        skill_type: "passive"
      },
      {
        id: 29,
        name: "\u9EC4\u76D6",
        faction: "\u5434",
        type: "\u5B88\u5C06",
        base_hp: 7,
        base_atk: 5,
        base_def: 7,
        base_mov: 4,
        skill_name: "\u82E6\u8089",
        skill_desc: "\u6BCF\u635F\u59311\u70B9HP\uFF0C\u653B\u51FB+1",
        skill_type: "passive"
      },
      // 群雄 (1位)
      {
        id: 30,
        name: "\u5415\u5E03",
        faction: "\u7FA4",
        type: "\u731B\u5C06",
        base_hp: 7,
        base_atk: 9,
        base_def: 5,
        base_mov: 8,
        skill_name: "\u65E0\u53CC",
        skill_desc: "\u653B\u51FB\u65F6\u65E0\u89C6\u6240\u6709\u88AB\u52A8\u51CF\u4F24\u6548\u679C",
        skill_type: "passive"
      }
    ];
    __name(getGeneralById, "getGeneralById");
    __name(getGeneralsByFaction, "getGeneralsByFaction");
    __name(getAllGeneralIds, "getAllGeneralIds");
  }
});

// .wrangler/tmp/bundle-JRcDkR/middleware-loader.entry.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// .wrangler/tmp/bundle-JRcDkR/middleware-insertion-facade.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/index.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/durable-objects/GameRoom.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_types();
init_generals();

// src/data/map.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var TERRAIN_CONFIG = {
  plain: { mov_cost: 1, def_bonus: 0 },
  forest: { mov_cost: 2, def_bonus: 1 },
  mountain: { mov_cost: 3, def_bonus: 2 },
  river: { mov_cost: 999, def_bonus: 0 },
  // 不可通行
  bridge: { mov_cost: 1, def_bonus: 0 },
  road: { mov_cost: 0.5, def_bonus: 0 },
  city: { mov_cost: 1, def_bonus: 2 }
};
var P1_SPAWN = { x1: 0, y1: 0, x2: 19, y2: 19 };
var P2_SPAWN = { x1: 80, y1: 80, x2: 99, y2: 99 };
var CITY_AREA = { x1: 48, y1: 48, x2: 52, y2: 52 };
var CITY_GATES = [
  { x: 48, y: 50 },
  // 西门
  { x: 52, y: 50 },
  // 东门
  { x: 50, y: 48 },
  // 北门
  { x: 50, y: 52 }
  // 南门
];
var NORTH_RIVER_Y = 25;
var SOUTH_RIVER_Y = 75;
var BRIDGES = [
  { x: 33, y: 25 },
  // 北桥1
  { x: 66, y: 25 },
  // 北桥2
  { x: 33, y: 75 },
  // 南桥1
  { x: 66, y: 75 }
  // 南桥2
];
function generateTerrains() {
  const terrains = [];
  for (let y = 0; y < 100; y++) {
    const row = [];
    for (let x = 0; x < 100; x++) {
      row.push(getTerrainAt(x, y));
    }
    terrains.push(row);
  }
  return terrains;
}
__name(generateTerrains, "generateTerrains");
function getTerrainAt(x, y) {
  if (isInArea(x, y, CITY_AREA)) {
    return "city";
  }
  if (y === NORTH_RIVER_Y || y === SOUTH_RIVER_Y) {
    if (BRIDGES.some((b) => b.x === x && b.y === y)) {
      return "bridge";
    }
    return "river";
  }
  if (isOnMainRoad(x, y)) {
    return "road";
  }
  if (isCityRingRoad(x, y)) {
    return "road";
  }
  if (isForest(x, y)) {
    return "forest";
  }
  if (isMountain(x, y)) {
    return "mountain";
  }
  return "plain";
}
__name(getTerrainAt, "getTerrainAt");
function isInArea(x, y, area) {
  return x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2;
}
__name(isInArea, "isInArea");
function isOnMainRoad(x, y) {
  if (y === 50 && (x < 48 || x > 52)) {
    return true;
  }
  if (x === 50 && (y < 48 || y > 52)) {
    return true;
  }
  if (Math.abs(x - y) <= 1 && x < 48 && y < 48 && x >= 10 && y >= 10) {
    return true;
  }
  if (Math.abs(99 - x - (99 - y)) <= 1 && x > 52 && y > 52 && x <= 90 && y <= 90) {
    return true;
  }
  return false;
}
__name(isOnMainRoad, "isOnMainRoad");
function isCityRingRoad(x, y) {
  if (x >= 47 && x <= 53 && y >= 47 && y <= 53) {
    if (x === 47 || x === 53 || y === 47 || y === 53) {
      return true;
    }
  }
  return false;
}
__name(isCityRingRoad, "isCityRingRoad");
function isForest(x, y) {
  if (isInArea(x, y, P1_SPAWN) || isInArea(x, y, P2_SPAWN))
    return false;
  if (isInArea(x, y, { x1: 45, y1: 45, x2: 55, y2: 55 }))
    return false;
  if (y === NORTH_RIVER_Y || y === SOUTH_RIVER_Y)
    return false;
  if (isOnMainRoad(x, y) || isCityRingRoad(x, y))
    return false;
  const hash = simpleHash(x, y, 1);
  return hash % 100 < 15;
}
__name(isForest, "isForest");
function isMountain(x, y) {
  if (isInArea(x, y, P1_SPAWN) || isInArea(x, y, P2_SPAWN))
    return false;
  if (isInArea(x, y, { x1: 43, y1: 43, x2: 57, y2: 57 }))
    return false;
  if (y === NORTH_RIVER_Y || y === SOUTH_RIVER_Y)
    return false;
  if (isOnMainRoad(x, y) || isCityRingRoad(x, y))
    return false;
  if (isForest(x, y))
    return false;
  const hash = simpleHash(x, y, 2);
  const inCornerRegion = x < 30 && y > 30 && y < 70 || // 左侧
  x > 70 && y > 30 && y < 70 || // 右侧
  y < 30 && x > 30 && x < 70 || // 上侧
  y > 70 && x > 30 && x < 70;
  if (inCornerRegion) {
    return hash % 100 < 12;
  }
  return hash % 100 < 5;
}
__name(isMountain, "isMountain");
function simpleHash(x, y, seed) {
  let h = seed;
  h = (h << 5) + h + x;
  h = (h << 5) + h + y;
  h = h ^ h >> 16;
  h = Math.abs(h);
  return h;
}
__name(simpleHash, "simpleHash");
var MAP_TERRAINS = generateTerrains();
var MAP_DATA = {
  width: 100,
  height: 100,
  terrains: MAP_TERRAINS,
  p1_spawn: P1_SPAWN,
  p2_spawn: P2_SPAWN,
  city_area: CITY_AREA,
  city_gates: CITY_GATES
};
function getTerrain(x, y) {
  if (x < 0 || x >= 100 || y < 0 || y >= 100) {
    return { type: "river", mov_cost: 999, def_bonus: 0 };
  }
  const type = MAP_TERRAINS[y][x];
  return {
    type,
    ...TERRAIN_CONFIG[type]
  };
}
__name(getTerrain, "getTerrain");
function isPassable(x, y) {
  const terrain = getTerrain(x, y);
  return terrain.mov_cost < 999;
}
__name(isPassable, "isPassable");
function isInCity(x, y) {
  return isInArea(x, y, CITY_AREA);
}
__name(isInCity, "isInCity");
function getSpawnArea(player) {
  return player === "p1" ? P1_SPAWN : P2_SPAWN;
}
__name(getSpawnArea, "getSpawnArea");
function manhattanDistance(p1, p2) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}
__name(manhattanDistance, "manhattanDistance");
function getAdjacentPositions(pos) {
  return [
    { x: pos.x - 1, y: pos.y },
    { x: pos.x + 1, y: pos.y },
    { x: pos.x, y: pos.y - 1 },
    { x: pos.x, y: pos.y + 1 }
  ].filter((p) => p.x >= 0 && p.x < 100 && p.y >= 0 && p.y < 100);
}
__name(getAdjacentPositions, "getAdjacentPositions");
function getDiagonalAdjacentPositions(pos) {
  const positions = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0)
        continue;
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      if (nx >= 0 && nx < 100 && ny >= 0 && ny < 100) {
        positions.push({ x: nx, y: ny });
      }
    }
  }
  return positions;
}
__name(getDiagonalAdjacentPositions, "getDiagonalAdjacentPositions");

// src/services/combat.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_generals();

// src/services/skill.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_generals();
function defaultSkillEffect() {
  return {
    atkBonus: 0,
    defBonus: 0,
    defPenalty: 0,
    damageMultiplier: 1,
    ignoreDefense: 0,
    extraDamage: 0,
    counterBonus: 0,
    triggered: [],
    special: []
  };
}
__name(defaultSkillEffect, "defaultSkillEffect");
function getAttackSkillEffects(attacker, defender, gameState) {
  const effect = defaultSkillEffect();
  const attackerData = getGeneralById(attacker.general_id);
  const defenderData = getGeneralById(defender.general_id);
  if (!attackerData || !defenderData)
    return effect;
  if (attackerData.skill_name === "\u6B66\u5723") {
    effect.ignoreDefense += 1;
    effect.triggered.push("\u6B66\u5723");
  }
  if (attackerData.skill_name === "\u5486\u54EE" && attacker.current_hp < 3) {
    effect.atkBonus += 2;
    effect.triggered.push("\u5486\u54EE");
  }
  if (attackerData.skill_name === "\u94C1\u9A91") {
    const movedDistance = attacker.moved_distance || 0;
    if (movedDistance >= 3) {
      effect.atkBonus += 2;
      effect.triggered.push("\u94C1\u9A91");
    }
  }
  if (attackerData.skill_name === "\u9738\u738B") {
    const nearbyEnemies = countNearbyEnemies(attacker, gameState, 2);
    if (nearbyEnemies === 1) {
      effect.atkBonus += 3;
      effect.triggered.push("\u9738\u738B");
    }
  }
  if (attackerData.skill_name === "\u7A81\u88AD") {
    if (isAttackingFromBehind(attacker, defender)) {
      effect.damageMultiplier *= 2;
      effect.triggered.push("\u7A81\u88AD");
    }
  }
  if (attackerData.skill_name === "\u82E6\u8089") {
    const lostHp = attackerData.base_hp - attacker.current_hp;
    if (lostHp > 0) {
      effect.atkBonus += lostHp;
      effect.triggered.push("\u82E6\u8089");
    }
  }
  if (attackerData.skill_name === "\u65AD\u7CAE") {
    if (isOnSupplyLine(defender.position, attacker.owner)) {
      effect.extraDamage += 2;
      effect.triggered.push("\u65AD\u7CAE");
    }
  }
  if (attackerData.skill_name === "\u65E0\u53CC") {
    effect.special.push({ type: "ignore_damage_reduction", target: defender.instance_id, value: true });
    effect.triggered.push("\u65E0\u53CC");
  }
  if (attackerData.skill_name === "\u5A01\u9707") {
    const attackKey = `${attacker.instance_id}_${defender.instance_id}`;
    if (!gameState.attacked_enemies[attackKey]) {
      effect.defPenalty += 1;
      effect.special.push({ type: "mark_attacked", target: attackKey, value: true });
      effect.triggered.push("\u5A01\u9707");
    }
  }
  if (attackerData.skill_name === "\u9690\u5FCD") {
    const inactiveRounds = attacker.skill_state.inactive_rounds || 0;
    if (inactiveRounds >= 3) {
      effect.atkBonus += 2;
      effect.triggered.push("\u9690\u5FCD(\u653B\u51FB)");
    }
    effect.special.push({ type: "reset_inactive", target: attacker.instance_id, value: true });
  }
  const adjacentAllies = getAdjacentAllies(attacker, gameState);
  for (const ally of adjacentAllies) {
    const allyData = getGeneralById(ally.general_id);
    if (allyData?.skill_name === "\u4EC1\u5FB7") {
      effect.atkBonus += 1;
      effect.triggered.push("\u4EC1\u5FB7(\u5218\u5907)");
      break;
    }
  }
  return effect;
}
__name(getAttackSkillEffects, "getAttackSkillEffects");
function getDefenseSkillEffects(attacker, defender, gameState, ignoreReduction = false) {
  const effect = defaultSkillEffect();
  const defenderData = getGeneralById(defender.general_id);
  const attackerData = getGeneralById(attacker.general_id);
  if (!defenderData || !attackerData)
    return effect;
  if (ignoreReduction) {
    return effect;
  }
  if (defenderData.skill_name === "\u575A\u5B88") {
    if (isInCity(defender.position.x, defender.position.y)) {
      effect.defBonus += 1;
      effect.triggered.push("\u575A\u5B88");
    }
  }
  if (defenderData.skill_name === "\u80C6\u7565") {
    if (!gameState.first_damage_taken[defender.instance_id]) {
      effect.defBonus += 1;
      effect.special.push({ type: "mark_first_damage", target: defender.instance_id, value: true });
      effect.triggered.push("\u80C6\u7565");
    }
  }
  if (defenderData.skill_name === "\u9690\u5FCD") {
    const inactiveRounds = defender.skill_state.inactive_rounds || 0;
    if (inactiveRounds >= 3) {
      effect.defBonus += 2;
      effect.triggered.push("\u9690\u5FCD(\u9632\u5FA1)");
    }
  }
  const adjacentAllies = getAdjacentAllies(defender, gameState);
  for (const ally of adjacentAllies) {
    const allyData = getGeneralById(ally.general_id);
    if (allyData?.skill_name === "\u5236\u8861") {
      const maxDef = Math.max(
        defenderData.base_def + defender.def_modifier,
        ...adjacentAllies.map((a) => {
          const d = getGeneralById(a.general_id);
          return d ? d.base_def + a.def_modifier : 0;
        })
      );
      const currentDef = defenderData.base_def + defender.def_modifier;
      if (maxDef > currentDef) {
        effect.defBonus += maxDef - currentDef;
        effect.triggered.push("\u5236\u8861(\u5B59\u6743)");
      }
      break;
    }
  }
  return effect;
}
__name(getDefenseSkillEffects, "getDefenseSkillEffects");
function getCounterAttackSkillEffects(attacker, defender, gameState) {
  const effect = defaultSkillEffect();
  const defenderData = getGeneralById(defender.general_id);
  if (!defenderData)
    return effect;
  if (defenderData.skill_name === "\u53CD\u9AA8") {
    effect.counterBonus += 1;
    effect.triggered.push("\u53CD\u9AA8");
  }
  return effect;
}
__name(getCounterAttackSkillEffects, "getCounterAttackSkillEffects");
function getThornsEffects(attacker, defender, damage) {
  const effects = [];
  const defenderData = getGeneralById(defender.general_id);
  if (!defenderData)
    return effects;
  if (defenderData.skill_name === "\u521A\u70C8" && damage > 0) {
    effects.push({
      type: "thorns_damage",
      target: attacker.instance_id,
      value: 1
    });
  }
  return effects;
}
__name(getThornsEffects, "getThornsEffects");
function getKillSkillEffects(attacker, defender, gameState) {
  const effects = [];
  const attackerData = getGeneralById(attacker.general_id);
  if (!attackerData)
    return effects;
  if (attackerData.skill_name === "\u5978\u96C4") {
    effects.push({
      type: "heal",
      target: attacker.instance_id,
      value: 1
    });
  }
  if (attackerData.skill_name === "\u9F99\u80C6") {
    effects.push({
      type: "extra_move",
      target: attacker.instance_id,
      value: 2
    });
  }
  return effects;
}
__name(getKillSkillEffects, "getKillSkillEffects");
function getPostAttackEffects(attacker, defender, gameState) {
  const effects = [];
  const attackerData = getGeneralById(attacker.general_id);
  if (!attackerData)
    return effects;
  if (attackerData.skill_name === "\u706B\u653B" && defender.is_alive) {
    effects.push({
      type: "apply_burn",
      target: defender.instance_id,
      value: 1
      // 1点伤害
    });
  }
  if (attackerData.skill_name === "\u8FDE\u73AF") {
    const adjacentEnemies = getAdjacentEnemies(defender, gameState);
    if (adjacentEnemies.length > 0) {
      effects.push({
        type: "splash_damage",
        target: adjacentEnemies[0].instance_id,
        value: 1
      });
    }
  }
  return effects;
}
__name(getPostAttackEffects, "getPostAttackEffects");
function isCounterAttackImmune(attacker, defender, distance) {
  const attackerData = getGeneralById(attacker.general_id);
  if (!attackerData)
    return false;
  if (attackerData.skill_name === "\u795E\u5C04" && distance >= 2) {
    return true;
  }
  if (distance >= 2) {
    return true;
  }
  return false;
}
__name(isCounterAttackImmune, "isCounterAttackImmune");
function canRetreat(general, gameState) {
  const enemies = general.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  for (const enemy of enemies) {
    if (!enemy.is_alive)
      continue;
    const enemyData = getGeneralById(enemy.general_id);
    if (enemyData?.skill_name === "\u6076\u6765") {
      const dist = manhattanDistance(general.position, enemy.position);
      if (dist === 1) {
        return false;
      }
    }
  }
  return true;
}
__name(canRetreat, "canRetreat");
function canMoveDiagonally(general) {
  const data = getGeneralById(general.general_id);
  if (!data)
    return false;
  return data.skill_name === "\u5DE7\u53D8";
}
__name(canMoveDiagonally, "canMoveDiagonally");
function canPassThroughEnemy(general) {
  const data = getGeneralById(general.general_id);
  if (!data)
    return false;
  return data.skill_name === "\u767D\u8863";
}
__name(canPassThroughEnemy, "canPassThroughEnemy");
function updateInactiveRounds(general, acted) {
  const data = getGeneralById(general.general_id);
  if (data?.skill_name !== "\u9690\u5FCD")
    return;
  if (acted) {
    general.skill_state.inactive_rounds = 0;
  } else {
    general.skill_state.inactive_rounds = (general.skill_state.inactive_rounds || 0) + 1;
  }
}
__name(updateInactiveRounds, "updateInactiveRounds");
function getAdjacentAllies(general, gameState) {
  const allies = general.owner === "p1" ? gameState.p1_generals : gameState.p2_generals;
  const adjacentPositions = getAdjacentPositions(general.position);
  return allies.filter(
    (ally) => ally.instance_id !== general.instance_id && ally.is_alive && adjacentPositions.some((p) => p.x === ally.position.x && p.y === ally.position.y)
  );
}
__name(getAdjacentAllies, "getAdjacentAllies");
function getAdjacentEnemies(general, gameState) {
  const enemies = general.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  const adjacentPositions = getAdjacentPositions(general.position);
  return enemies.filter(
    (enemy) => enemy.is_alive && adjacentPositions.some((p) => p.x === enemy.position.x && p.y === enemy.position.y)
  );
}
__name(getAdjacentEnemies, "getAdjacentEnemies");
function countNearbyEnemies(general, gameState, range) {
  const enemies = general.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  return enemies.filter(
    (enemy) => enemy.is_alive && manhattanDistance(general.position, enemy.position) <= range
  ).length;
}
__name(countNearbyEnemies, "countNearbyEnemies");
function isAttackingFromBehind(attacker, defender) {
  const dx = attacker.position.x - defender.position.x;
  const dy = attacker.position.y - defender.position.y;
  let attackDirection;
  if (Math.abs(dx) > Math.abs(dy)) {
    attackDirection = dx > 0 ? "right" : "left";
  } else {
    attackDirection = dy > 0 ? "down" : "up";
  }
  const behindMap = {
    up: "down",
    down: "up",
    left: "right",
    right: "left"
  };
  return attackDirection === behindMap[defender.facing];
}
__name(isAttackingFromBehind, "isAttackingFromBehind");
function isOnSupplyLine(pos, attackerOwner) {
  if (attackerOwner === "p1") {
    return pos.x >= 50 && pos.x <= 99 && Math.abs(pos.x - pos.y) <= 15;
  } else {
    return pos.x >= 0 && pos.x <= 50 && Math.abs(pos.x - pos.y) <= 15;
  }
}
__name(isOnSupplyLine, "isOnSupplyLine");
function applyBurnBuff(general) {
  general.buffs = general.buffs.filter((b) => b.type !== "burn");
  general.buffs.push({
    type: "burn",
    value: 1,
    duration: 1,
    source: "\u706B\u653B"
  });
}
__name(applyBurnBuff, "applyBurnBuff");

// src/services/combat.ts
function calculateCombat(attacker, defender, gameState) {
  const attackerData = getGeneralById(attacker.general_id);
  const defenderData = getGeneralById(defender.general_id);
  if (!attackerData || !defenderData) {
    throw new Error("Invalid general data");
  }
  const triggeredSkills = [];
  const specialEffects = [];
  const distance = manhattanDistance(attacker.position, defender.position);
  const terrain = getTerrain(defender.position.x, defender.position.y);
  const attackSkillEffects = getAttackSkillEffects(attacker, defender, gameState);
  triggeredSkills.push(...attackSkillEffects.triggered);
  const ignoreReduction = attackSkillEffects.special.some((e) => e.type === "ignore_damage_reduction");
  const defenseSkillEffects = getDefenseSkillEffects(attacker, defender, gameState, ignoreReduction);
  triggeredSkills.push(...defenseSkillEffects.triggered);
  let atk = attackerData.base_atk + attacker.atk_modifier + attackSkillEffects.atkBonus;
  let def = defenderData.base_def + defender.def_modifier + terrain.def_bonus;
  def += defenseSkillEffects.defBonus;
  def -= attackSkillEffects.defPenalty;
  def -= attackSkillEffects.ignoreDefense;
  def = Math.max(0, def);
  let damage = Math.max(1, atk - def);
  damage = Math.floor(damage * attackSkillEffects.damageMultiplier);
  damage += attackSkillEffects.extraDamage;
  damage = Math.max(1, damage);
  let counterDamage = 0;
  if (!isCounterAttackImmune(attacker, defender, distance) && defender.current_hp > damage) {
    const counterSkillEffects = getCounterAttackSkillEffects(attacker, defender, gameState);
    triggeredSkills.push(...counterSkillEffects.triggered);
    const counterAtk = defenderData.base_atk + defender.atk_modifier;
    const counterDef = attackerData.base_def + attacker.def_modifier;
    const baseDamage = Math.max(1, counterAtk - counterDef);
    counterDamage = Math.floor(baseDamage / 2) + counterSkillEffects.counterBonus;
    counterDamage = Math.max(0, counterDamage);
  }
  const targetKilled = defender.current_hp <= damage;
  const attackerKilled = attacker.current_hp <= counterDamage;
  for (const effect of attackSkillEffects.special) {
    if (effect.type === "mark_attacked") {
      specialEffects.push({
        type: "mark_attacked",
        target: effect.target,
        value: effect.value
      });
    }
    if (effect.type === "reset_inactive") {
      specialEffects.push({
        type: "reset_inactive",
        target: effect.target,
        value: effect.value
      });
    }
  }
  for (const effect of defenseSkillEffects.special) {
    if (effect.type === "mark_first_damage") {
      specialEffects.push({
        type: "mark_first_damage",
        target: effect.target,
        value: effect.value
      });
    }
  }
  const thornsEffects = getThornsEffects(attacker, defender, damage);
  for (const effect of thornsEffects) {
    specialEffects.push(effect);
    triggeredSkills.push("\u521A\u70C8");
  }
  if (targetKilled) {
    const killEffects = getKillSkillEffects(attacker, defender, gameState);
    specialEffects.push(...killEffects);
    for (const effect of killEffects) {
      if (effect.type === "heal")
        triggeredSkills.push("\u5978\u96C4");
      if (effect.type === "extra_move")
        triggeredSkills.push("\u9F99\u80C6");
    }
  }
  const postAttackEffects = getPostAttackEffects(attacker, defender, gameState);
  specialEffects.push(...postAttackEffects);
  for (const effect of postAttackEffects) {
    if (effect.type === "apply_burn")
      triggeredSkills.push("\u706B\u653B");
    if (effect.type === "splash_damage")
      triggeredSkills.push("\u8FDE\u73AF");
  }
  return {
    damage,
    counter_damage: counterDamage,
    attacker_killed: attackerKilled,
    target_killed: targetKilled,
    triggered_skills: [...new Set(triggeredSkills)],
    // 去重
    special_effects: specialEffects
  };
}
__name(calculateCombat, "calculateCombat");
function applyCombatResult(attacker, defender, result, gameState) {
  defender.current_hp -= result.damage;
  if (defender.current_hp <= 0) {
    defender.current_hp = 0;
    defender.is_alive = false;
  }
  if (result.counter_damage > 0) {
    attacker.current_hp -= result.counter_damage;
    if (attacker.current_hp <= 0) {
      attacker.current_hp = 0;
      attacker.is_alive = false;
    }
  }
  for (const effect of result.special_effects) {
    applySpecialEffect(effect, attacker, defender, gameState);
  }
  attacker.has_acted = true;
  updateFacing(attacker, defender.position);
  if (defender.is_alive) {
    updateFacing(defender, attacker.position);
  }
}
__name(applyCombatResult, "applyCombatResult");
function applySpecialEffect(effect, attacker, defender, gameState) {
  switch (effect.type) {
    case "mark_attacked":
      gameState.attacked_enemies[effect.target] = true;
      break;
    case "mark_first_damage":
      gameState.first_damage_taken[effect.target] = true;
      break;
    case "reset_inactive":
      const general = findGeneralById(gameState, effect.target);
      if (general) {
        general.skill_state.inactive_rounds = 0;
      }
      break;
    case "thorns_damage":
      attacker.current_hp -= effect.value;
      if (attacker.current_hp <= 0) {
        attacker.current_hp = 0;
        attacker.is_alive = false;
      }
      break;
    case "heal":
      const attackerData = getGeneralById(attacker.general_id);
      if (attackerData) {
        attacker.current_hp = Math.min(attackerData.base_hp, attacker.current_hp + effect.value);
      }
      break;
    case "extra_move":
      attacker.skill_state.extra_move = effect.value;
      break;
    case "apply_burn":
      applyBurnBuff(defender);
      break;
    case "splash_damage":
      const splashTarget = findGeneralById(gameState, effect.target);
      if (splashTarget && splashTarget.is_alive) {
        splashTarget.current_hp -= effect.value;
        if (splashTarget.current_hp <= 0) {
          splashTarget.current_hp = 0;
          splashTarget.is_alive = false;
        }
      }
      break;
  }
}
__name(applySpecialEffect, "applySpecialEffect");
function updateFacing(general, targetPos) {
  const dx = targetPos.x - general.position.x;
  const dy = targetPos.y - general.position.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    general.facing = dx > 0 ? "right" : "left";
  } else {
    general.facing = dy > 0 ? "down" : "up";
  }
}
__name(updateFacing, "updateFacing");
function findGeneralById(gameState, instanceId) {
  return [...gameState.p1_generals, ...gameState.p2_generals].find((g) => g.instance_id === instanceId);
}
__name(findGeneralById, "findGeneralById");
function processBurnDamage(gameState) {
  const results = [];
  const allGenerals = [...gameState.p1_generals, ...gameState.p2_generals];
  for (const general of allGenerals) {
    if (!general.is_alive)
      continue;
    const burnBuff = general.buffs.find((b) => b.type === "burn");
    if (burnBuff) {
      general.current_hp -= burnBuff.value;
      results.push({ target: general.instance_id, damage: burnBuff.value });
      if (general.current_hp <= 0) {
        general.current_hp = 0;
        general.is_alive = false;
      }
      general.buffs = general.buffs.filter((b) => b.type !== "burn");
    }
  }
  return results;
}
__name(processBurnDamage, "processBurnDamage");

// src/services/movement.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_generals();
function getMoveableArea(general, gameState) {
  const data = getGeneralById(general.general_id);
  if (!data) {
    return { positions: [], costs: /* @__PURE__ */ new Map() };
  }
  const maxMov = data.base_mov + general.mov_modifier;
  const canDiagonal = canMoveDiagonally(general);
  const canPassEnemy = canPassThroughEnemy(general);
  const occupiedPositions = getOccupiedPositions(gameState, general.instance_id);
  const enemyPositions = getEnemyPositions(general.owner, gameState);
  const visited = /* @__PURE__ */ new Map();
  const queue = [{
    x: general.position.x,
    y: general.position.y,
    cost: 0,
    parent: null
  }];
  visited.set(posKey(general.position), 0);
  const reachable = [];
  const costs = /* @__PURE__ */ new Map();
  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = canDiagonal ? getDiagonalAdjacentPositions({ x: current.x, y: current.y }) : getAdjacentPositions({ x: current.x, y: current.y });
    for (const neighbor of neighbors) {
      if (!isPassable(neighbor.x, neighbor.y))
        continue;
      const terrain = getTerrain(neighbor.x, neighbor.y);
      let moveCost = terrain.mov_cost;
      if (canDiagonal && current.x !== neighbor.x && current.y !== neighbor.y) {
        moveCost *= 1.4;
      }
      const totalCost = current.cost + moveCost;
      if (totalCost > maxMov)
        continue;
      const key = posKey(neighbor);
      if (visited.has(key) && visited.get(key) <= totalCost)
        continue;
      const isOccupied = occupiedPositions.has(key);
      const isEnemyPos = enemyPositions.has(key);
      if (isOccupied && !isEnemyPos)
        continue;
      if (isEnemyPos && !canPassEnemy)
        continue;
      visited.set(key, totalCost);
      if (!isOccupied) {
        reachable.push({ x: neighbor.x, y: neighbor.y });
        costs.set(key, totalCost);
      }
      queue.push({
        x: neighbor.x,
        y: neighbor.y,
        cost: totalCost,
        parent: current
      });
    }
  }
  return { positions: reachable, costs };
}
__name(getMoveableArea, "getMoveableArea");
function findPath(general, target, gameState) {
  const data = getGeneralById(general.general_id);
  if (!data)
    return null;
  const maxMov = data.base_mov + general.mov_modifier;
  const canDiagonal = canMoveDiagonally(general);
  const canPassEnemy = canPassThroughEnemy(general);
  const occupiedPositions = getOccupiedPositions(gameState, general.instance_id);
  const enemyPositions = getEnemyPositions(general.owner, gameState);
  if (occupiedPositions.has(posKey(target))) {
    return null;
  }
  const openSet = [{
    x: general.position.x,
    y: general.position.y,
    cost: 0,
    parent: null
  }];
  const closedSet = /* @__PURE__ */ new Set();
  const gScore = /* @__PURE__ */ new Map();
  gScore.set(posKey(general.position), 0);
  while (openSet.length > 0) {
    openSet.sort((a, b) => {
      const fA = a.cost + manhattanDistance({ x: a.x, y: a.y }, target);
      const fB = b.cost + manhattanDistance({ x: b.x, y: b.y }, target);
      return fA - fB;
    });
    const current = openSet.shift();
    const currentKey = posKey({ x: current.x, y: current.y });
    if (current.x === target.x && current.y === target.y) {
      return reconstructPath(current);
    }
    closedSet.add(currentKey);
    const neighbors = canDiagonal ? getDiagonalAdjacentPositions({ x: current.x, y: current.y }) : getAdjacentPositions({ x: current.x, y: current.y });
    for (const neighbor of neighbors) {
      const neighborKey = posKey(neighbor);
      if (closedSet.has(neighborKey))
        continue;
      if (!isPassable(neighbor.x, neighbor.y))
        continue;
      const terrain = getTerrain(neighbor.x, neighbor.y);
      let moveCost = terrain.mov_cost;
      if (canDiagonal && current.x !== neighbor.x && current.y !== neighbor.y) {
        moveCost *= 1.4;
      }
      const tentativeG = current.cost + moveCost;
      if (tentativeG > maxMov)
        continue;
      const isOccupied = occupiedPositions.has(neighborKey);
      const isEnemyPos = enemyPositions.has(neighborKey);
      if (neighbor.x === target.x && neighbor.y === target.y && isOccupied)
        continue;
      if (isOccupied && !isEnemyPos)
        continue;
      if (isEnemyPos && !canPassEnemy)
        continue;
      if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
        gScore.set(neighborKey, tentativeG);
        const existingIndex = openSet.findIndex((n) => n.x === neighbor.x && n.y === neighbor.y);
        const newNode = {
          x: neighbor.x,
          y: neighbor.y,
          cost: tentativeG,
          parent: current
        };
        if (existingIndex >= 0) {
          openSet[existingIndex] = newNode;
        } else {
          openSet.push(newNode);
        }
      }
    }
  }
  return null;
}
__name(findPath, "findPath");
function reconstructPath(node) {
  const path = [];
  let current = node;
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  return path;
}
__name(reconstructPath, "reconstructPath");
function executeMove(general, target, gameState) {
  if (general.has_acted) {
    return { success: false, error: "\u6B66\u5C06\u5DF2\u884C\u52A8" };
  }
  if (!general.is_alive) {
    return { success: false, error: "\u6B66\u5C06\u5DF2\u9635\u4EA1" };
  }
  const path = findPath(general, target, gameState);
  if (!path) {
    return { success: false, error: "\u76EE\u6807\u4F4D\u7F6E\u4E0D\u53EF\u8FBE" };
  }
  const moveArea = getMoveableArea(general, gameState);
  const targetKey = posKey(target);
  if (!moveArea.costs.has(targetKey)) {
    return { success: false, error: "\u76EE\u6807\u8D85\u51FA\u79FB\u52A8\u8303\u56F4" };
  }
  const startPos = { ...general.position };
  general.position = target;
  general.moved_distance = (general.moved_distance || 0) + manhattanDistance(startPos, target);
  if (path.length >= 2) {
    const lastMove = path[path.length - 1];
    const secondLast = path[path.length - 2];
    updateFacingFromMove(general, secondLast, lastMove);
  }
  return { success: true, path };
}
__name(executeMove, "executeMove");
function updateFacingFromMove(general, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx > 0)
    general.facing = "right";
  else if (dx < 0)
    general.facing = "left";
  else if (dy > 0)
    general.facing = "down";
  else if (dy < 0)
    general.facing = "up";
}
__name(updateFacingFromMove, "updateFacingFromMove");
function getOccupiedPositions(gameState, excludeId) {
  const positions = /* @__PURE__ */ new Set();
  for (const general of [...gameState.p1_generals, ...gameState.p2_generals]) {
    if (!general.is_alive)
      continue;
    if (excludeId && general.instance_id === excludeId)
      continue;
    positions.add(posKey(general.position));
  }
  return positions;
}
__name(getOccupiedPositions, "getOccupiedPositions");
function getEnemyPositions(myOwner, gameState) {
  const enemies = myOwner === "p1" ? gameState.p2_generals : gameState.p1_generals;
  const positions = /* @__PURE__ */ new Set();
  for (const enemy of enemies) {
    if (enemy.is_alive) {
      positions.add(posKey(enemy.position));
    }
  }
  return positions;
}
__name(getEnemyPositions, "getEnemyPositions");
function posKey(pos) {
  return `${pos.x},${pos.y}`;
}
__name(posKey, "posKey");

// src/services/vision.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_generals();
var BASE_VISION_RANGE = 5;
var FOREST_VISION_PENALTY = 2;
var MOUNTAIN_VISION_BONUS = 2;
var CITY_VISION_BONUS = 3;
function getVisionRange(general) {
  const data = getGeneralById(general.general_id);
  if (!data)
    return BASE_VISION_RANGE;
  let range = BASE_VISION_RANGE;
  switch (data.type) {
    case "\u5F13\u624B":
      range += 2;
      break;
    case "\u8C0B\u58EB":
      range += 1;
      break;
    case "\u9A91\u5175":
      range += 1;
      break;
  }
  const terrain = getTerrain(general.position.x, general.position.y);
  switch (terrain.type) {
    case "mountain":
      range += MOUNTAIN_VISION_BONUS;
      break;
    case "city":
      range += CITY_VISION_BONUS;
      break;
    case "forest":
      break;
  }
  return range;
}
__name(getVisionRange, "getVisionRange");
function isInVision(observer, target, gameState) {
  const visionRange = getVisionRange(observer);
  const distance = manhattanDistance(observer.position, target);
  if (distance > visionRange) {
    return false;
  }
  const targetTerrain = getTerrain(target.x, target.y);
  if (targetTerrain.type === "forest") {
    return distance <= visionRange - FOREST_VISION_PENALTY;
  }
  return true;
}
__name(isInVision, "isInVision");
function getVisibleEnemies(player, gameState) {
  const myGenerals = player === "p1" ? gameState.p1_generals : gameState.p2_generals;
  const enemyGenerals = player === "p1" ? gameState.p2_generals : gameState.p1_generals;
  const visibleEnemies = [];
  for (const enemy of enemyGenerals) {
    if (!enemy.is_alive)
      continue;
    let isVisible = false;
    for (const ally of myGenerals) {
      if (!ally.is_alive)
        continue;
      if (isInVision(ally, enemy.position, gameState)) {
        isVisible = true;
        break;
      }
    }
    if (isVisible) {
      visibleEnemies.push(enemy);
    }
  }
  return visibleEnemies;
}
__name(getVisibleEnemies, "getVisibleEnemies");
function filterGameStateForPlayer(gameState, player) {
  const visibleEnemies = getVisibleEnemies(player, gameState);
  const myGenerals = player === "p1" ? gameState.p1_generals : gameState.p2_generals;
  const enemyGenerals = player === "p1" ? gameState.p2_generals : gameState.p1_generals;
  const filteredEnemies = enemyGenerals.map((enemy) => {
    const isVisible = visibleEnemies.some((v) => v.instance_id === enemy.instance_id);
    if (isVisible) {
      return {
        ...enemy,
        skill_state: {},
        // 隐藏技能状态
        buffs: enemy.buffs.filter((b) => b.type !== "burn" || true)
        // 灼烧可见
      };
    } else {
      return null;
    }
  }).filter((e) => e !== null);
  return {
    ...gameState,
    p1_generals: player === "p1" ? myGenerals : filteredEnemies,
    p2_generals: player === "p2" ? myGenerals : filteredEnemies
  };
}
__name(filterGameStateForPlayer, "filterGameStateForPlayer");

// src/durable-objects/GameRoom.ts
var GameRoom = class {
  state;
  env;
  gameState = null;
  connections = /* @__PURE__ */ new Map();
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
    try {
      switch (url.pathname) {
        case "/ws":
          return this.handleWebSocket(request);
        case "/create":
          return this.handleCreate(request);
        case "/join":
          return this.handleJoin(request);
        case "/ban":
          return this.handleBan(request);
        case "/pick":
          return this.handlePick(request);
        case "/deploy":
          return this.handleDeploy(request);
        case "/action":
          return this.handleAction(request);
        case "/state":
          return this.handleGetState(request);
        case "/checkCooldown":
          return this.handleCheckCooldown(request);
        default:
          return new Response("Not found", { status: 404 });
      }
    } catch (error) {
      console.error("GameRoom error:", error);
      return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
    }
  }
  // WebSocket 处理
  async handleWebSocket(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    const playerId = new URL(request.url).searchParams.get("player");
    server.accept();
    this.connections.set(playerId, server);
    server.addEventListener("close", () => {
      this.connections.delete(playerId);
    });
    server.addEventListener("message", async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ping") {
          server.send(JSON.stringify({ type: "pong" }));
        }
      } catch (e) {
      }
    });
    const gameState = await this.loadState();
    if (gameState) {
      const filteredState = filterGameStateForPlayer(gameState, playerId);
      server.send(JSON.stringify({ type: "state", data: filteredState }));
    }
    return new Response(null, { status: 101, webSocket: client });
  }
  // 创建游戏
  async handleCreate(request) {
    const { gameId, p1 } = await request.json();
    const gameState = {
      game_id: gameId,
      status: "waiting",
      turn: 0,
      current_player: "p1",
      banned_generals: [],
      p1_picks: [],
      p2_picks: [],
      pick_phase: 0,
      p1_generals: [],
      p2_generals: [],
      city_holder: null,
      city_hold_turns: 0,
      map: MAP_DATA,
      winner: null,
      win_reason: null,
      p1_agent_id: p1,
      p2_agent_id: null,
      attacked_enemies: {},
      first_damage_taken: {}
    };
    this.gameState = gameState;
    await this.saveState();
    return Response.json({ success: true, game_id: gameId, player: "p1", status: "waiting" });
  }
  // 加入游戏
  async handleJoin(request) {
    const { agent_id } = await request.json();
    let gameState = await this.loadState();
    if (!gameState) {
      return Response.json({ success: false, error: ErrorCodes.GAME_NOT_FOUND });
    }
    if (gameState.status !== "waiting") {
      return Response.json({ success: false, error: ErrorCodes.GAME_FULL });
    }
    gameState.p2_agent_id = agent_id;
    gameState.status = "selecting";
    gameState.pick_phase = 1;
    this.gameState = gameState;
    await this.saveState();
    this.broadcast({ type: "game_started", data: { status: "selecting" } });
    return Response.json({ success: true, game_id: gameState.game_id, player: "p2", status: "selecting" });
  }
  // Ban武将
  async handleBan(request) {
    const { player, general_id } = await request.json();
    let gameState = await this.loadState();
    if (!gameState || gameState.status !== "selecting") {
      return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }
    const currentPhase = PICK_ORDER[gameState.pick_phase - 1];
    if (!currentPhase || currentPhase.action !== "ban" || currentPhase.player !== player) {
      return Response.json({ success: false, error: ErrorCodes.NOT_YOUR_TURN });
    }
    if (!GENERALS.find((g) => g.id === general_id)) {
      return Response.json({ success: false, error: ErrorCodes.INVALID_GENERAL });
    }
    if (gameState.banned_generals.includes(general_id) || gameState.p1_picks.includes(general_id) || gameState.p2_picks.includes(general_id)) {
      return Response.json({ success: false, error: ErrorCodes.GENERAL_BANNED });
    }
    gameState.banned_generals.push(general_id);
    gameState.pick_phase++;
    this.gameState = gameState;
    await this.saveState();
    this.broadcast({
      type: "ban",
      data: { player, general_id, banned: gameState.banned_generals, next_phase: gameState.pick_phase }
    });
    return Response.json({ success: true, banned: gameState.banned_generals, next_phase: gameState.pick_phase });
  }
  // Pick武将
  async handlePick(request) {
    const { player, general_id } = await request.json();
    let gameState = await this.loadState();
    if (!gameState || gameState.status !== "selecting") {
      return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }
    const currentPhase = PICK_ORDER[gameState.pick_phase - 1];
    if (!currentPhase || currentPhase.action !== "pick" || currentPhase.player !== player) {
      return Response.json({ success: false, error: ErrorCodes.NOT_YOUR_TURN });
    }
    if (!GENERALS.find((g) => g.id === general_id)) {
      return Response.json({ success: false, error: ErrorCodes.INVALID_GENERAL });
    }
    if (gameState.banned_generals.includes(general_id) || gameState.p1_picks.includes(general_id) || gameState.p2_picks.includes(general_id)) {
      return Response.json({ success: false, error: ErrorCodes.GENERAL_PICKED });
    }
    if (player === "p1") {
      gameState.p1_picks.push(general_id);
    } else {
      gameState.p2_picks.push(general_id);
    }
    gameState.pick_phase++;
    if (gameState.pick_phase > PICK_ORDER.length) {
      gameState.status = "deploying";
    }
    this.gameState = gameState;
    await this.saveState();
    this.broadcast({
      type: "pick",
      data: {
        player,
        general_id,
        p1_picks: gameState.p1_picks,
        p2_picks: gameState.p2_picks,
        next_phase: gameState.pick_phase,
        status: gameState.status
      }
    });
    return Response.json({
      success: true,
      picked: player === "p1" ? gameState.p1_picks : gameState.p2_picks,
      next_phase: gameState.pick_phase,
      status: gameState.status
    });
  }
  // 部署武将
  async handleDeploy(request) {
    const { player, deployments } = await request.json();
    let gameState = await this.loadState();
    if (!gameState || gameState.status !== "deploying") {
      return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }
    const picks = player === "p1" ? gameState.p1_picks : gameState.p2_picks;
    const spawnArea = getSpawnArea(player);
    if (deployments.length !== picks.length) {
      return Response.json({ success: false, error: { code: 1013, message: "\u6B66\u5C06\u6570\u91CF\u4E0D\u5339\u914D" } });
    }
    const deployedIds = /* @__PURE__ */ new Set();
    const deployedPositions = /* @__PURE__ */ new Set();
    for (const dep of deployments) {
      if (!picks.includes(dep.general_id)) {
        return Response.json({ success: false, error: ErrorCodes.INVALID_GENERAL });
      }
      if (deployedIds.has(dep.general_id)) {
        return Response.json({ success: false, error: { code: 1013, message: "\u6B66\u5C06\u91CD\u590D\u90E8\u7F72" } });
      }
      if (!isInArea(dep.x, dep.y, spawnArea)) {
        return Response.json({ success: false, error: ErrorCodes.INVALID_DEPLOY_POSITION });
      }
      const posKey2 = `${dep.x},${dep.y}`;
      if (deployedPositions.has(posKey2)) {
        return Response.json({ success: false, error: { code: 1013, message: "\u4F4D\u7F6E\u91CD\u590D" } });
      }
      deployedIds.add(dep.general_id);
      deployedPositions.add(posKey2);
    }
    const generals = deployments.map((dep, index) => {
      const data = getGeneralById(dep.general_id);
      return {
        instance_id: `${player}_${index + 1}`,
        general_id: dep.general_id,
        owner: player,
        current_hp: data.base_hp,
        position: { x: dep.x, y: dep.y },
        facing: player === "p1" ? "right" : "left",
        atk_modifier: 0,
        def_modifier: 0,
        mov_modifier: 0,
        has_acted: false,
        is_alive: true,
        buffs: [],
        skill_state: {},
        moved_distance: 0
      };
    });
    if (player === "p1") {
      gameState.p1_generals = generals;
    } else {
      gameState.p2_generals = generals;
    }
    if (gameState.p1_generals.length > 0 && gameState.p2_generals.length > 0) {
      gameState.status = "playing";
      gameState.turn = 1;
      gameState.current_player = "p1";
    }
    this.gameState = gameState;
    await this.saveState();
    this.broadcast({
      type: "deploy",
      data: { player, status: gameState.status, turn: gameState.turn }
    });
    return Response.json({ success: true, status: gameState.status });
  }
  // 处理游戏操作
  async handleAction(request) {
    const action = await request.json();
    let gameState = await this.loadState();
    if (!gameState || gameState.status !== "playing") {
      return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }
    if (action.player !== gameState.current_player) {
      return Response.json({ success: false, error: ErrorCodes.NOT_YOUR_TURN });
    }
    let result;
    switch (action.action) {
      case "MOVE":
        result = await this.handleMoveAction(action, gameState);
        break;
      case "ATTACK":
        result = await this.handleAttackAction(action, gameState);
        break;
      case "SKILL":
        result = await this.handleSkillAction(action, gameState);
        break;
      case "WAIT":
        result = await this.handleWaitAction(action, gameState);
        break;
      case "RETREAT":
        result = await this.handleRetreatAction(action, gameState);
        break;
      case "END_TURN":
        result = await this.handleEndTurnAction(action, gameState);
        break;
      default:
        return Response.json({ success: false, error: ErrorCodes.INVALID_ACTION });
    }
    if (!result.success) {
      return Response.json(result);
    }
    this.checkVictory(gameState);
    this.gameState = gameState;
    await this.saveState();
    this.broadcast({
      type: "action_result",
      data: {
        action: action.action,
        result: result.data,
        turn: gameState.turn,
        current_player: gameState.current_player,
        winner: gameState.winner
      }
    });
    return Response.json(result);
  }
  // 移动操作
  async handleMoveAction(action, gameState) {
    const general = this.findGeneral(action.instance_id, gameState);
    if (!general) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }
    if (general.owner !== action.player) {
      return { success: false, error: ErrorCodes.NOT_YOUR_TURN };
    }
    const target = { x: action.target_x, y: action.target_y };
    const result = executeMove(general, target, gameState);
    if (!result.success) {
      return { success: false, error: { code: 1005, message: result.error } };
    }
    return { success: true, data: { from: result.path[0], to: target, path: result.path } };
  }
  // 攻击操作
  async handleAttackAction(action, gameState) {
    const attacker = this.findGeneral(action.instance_id, gameState);
    const defender = this.findGeneral(action.target_instance_id, gameState);
    if (!attacker || !defender) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }
    if (attacker.owner !== action.player) {
      return { success: false, error: ErrorCodes.NOT_YOUR_TURN };
    }
    if (attacker.has_acted) {
      return { success: false, error: ErrorCodes.ALREADY_ACTED };
    }
    if (!attacker.is_alive) {
      return { success: false, error: ErrorCodes.GENERAL_DEAD };
    }
    const combatResult = calculateCombat(attacker, defender, gameState);
    applyCombatResult(attacker, defender, combatResult, gameState);
    return {
      success: true,
      data: {
        damage_dealt: combatResult.damage,
        counter_damage: combatResult.counter_damage,
        target_remaining_hp: defender.current_hp,
        attacker_remaining_hp: attacker.current_hp,
        target_killed: combatResult.target_killed,
        attacker_killed: combatResult.attacker_killed,
        triggered_skills: combatResult.triggered_skills
      }
    };
  }
  // 技能操作（诸葛亮神算、郭嘉鬼才等主动技能）
  async handleSkillAction(action, gameState) {
    const general = this.findGeneral(action.instance_id, gameState);
    if (!general) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }
    const data = getGeneralById(general.general_id);
    if (!data || data.skill_type !== "active") {
      return { success: false, error: { code: 1008, message: "\u8BE5\u6B66\u5C06\u6CA1\u6709\u4E3B\u52A8\u6280\u80FD" } };
    }
    if (data.skill_name === "\u795E\u7B97" && action.skill_target) {
      const target = this.findGeneral(action.skill_target, gameState);
      if (!target || target.owner !== general.owner) {
        return { success: false, error: { code: 1008, message: "\u65E0\u6548\u7684\u6280\u80FD\u76EE\u6807" } };
      }
      if (manhattanDistance(general.position, target.position) > 2) {
        return { success: false, error: { code: 1008, message: "\u76EE\u6807\u4E0D\u5728\u6280\u80FD\u8303\u56F4\u5185" } };
      }
      general.has_acted = true;
      target.has_acted = false;
      return { success: true, data: { skill: "\u795E\u7B97", target: action.skill_target } };
    }
    if (data.skill_name === "\u9B3C\u624D") {
      const enemies = general.owner === "p1" ? gameState.p2_generals : gameState.p1_generals;
      const nearbyEnemies = enemies.filter(
        (e) => e.is_alive && manhattanDistance(general.position, e.position) <= 5
      );
      general.has_acted = true;
      return {
        success: true,
        data: {
          skill: "\u9B3C\u624D",
          visible_enemies: nearbyEnemies.map((e) => ({
            instance_id: e.instance_id,
            general_id: e.general_id,
            position: e.position,
            current_hp: e.current_hp,
            buffs: e.buffs
          }))
        }
      };
    }
    return { success: false, error: { code: 1008, message: "\u6280\u80FD\u6267\u884C\u5931\u8D25" } };
  }
  // 待命操作
  async handleWaitAction(action, gameState) {
    const general = this.findGeneral(action.instance_id, gameState);
    if (!general) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }
    general.has_acted = true;
    return { success: true, data: { action: "WAIT" } };
  }
  // 撤退操作
  async handleRetreatAction(action, gameState) {
    const general = this.findGeneral(action.instance_id, gameState);
    if (!general) {
      return { success: false, error: ErrorCodes.INVALID_GENERAL };
    }
    if (!canRetreat(general, gameState)) {
      return { success: false, error: ErrorCodes.CANNOT_RETREAT };
    }
    const spawnArea = getSpawnArea(general.owner);
    general.position = {
      x: Math.floor((spawnArea.x1 + spawnArea.x2) / 2),
      y: Math.floor((spawnArea.y1 + spawnArea.y2) / 2)
    };
    general.has_acted = true;
    return { success: true, data: { action: "RETREAT", new_position: general.position } };
  }
  // 结束回合
  async handleEndTurnAction(action, gameState) {
    const currentGenerals = action.player === "p1" ? gameState.p1_generals : gameState.p2_generals;
    for (const general of currentGenerals) {
      if (!general.is_alive)
        continue;
      updateInactiveRounds(general, general.has_acted);
      general.has_acted = false;
      general.moved_distance = 0;
    }
    gameState.current_player = gameState.current_player === "p1" ? "p2" : "p1";
    if (gameState.current_player === "p1") {
      gameState.turn++;
      const burnResults = processBurnDamage(gameState);
      this.updateCityControl(gameState);
    }
    return { success: true, data: { turn: gameState.turn, current_player: gameState.current_player } };
  }
  // 更新城池控制
  updateCityControl(gameState) {
    const p1InCity = gameState.p1_generals.filter((g) => g.is_alive && isInCity(g.position.x, g.position.y));
    const p2InCity = gameState.p2_generals.filter((g) => g.is_alive && isInCity(g.position.x, g.position.y));
    if (p1InCity.length > 0 && p2InCity.length === 0) {
      if (gameState.city_holder === "p1") {
        gameState.city_hold_turns++;
      } else {
        gameState.city_holder = "p1";
        gameState.city_hold_turns = 1;
      }
    } else if (p2InCity.length > 0 && p1InCity.length === 0) {
      if (gameState.city_holder === "p2") {
        gameState.city_hold_turns++;
      } else {
        gameState.city_holder = "p2";
        gameState.city_hold_turns = 1;
      }
    } else {
      gameState.city_hold_turns = 0;
    }
  }
  // 检查胜负
  checkVictory(gameState) {
    if (gameState.city_hold_turns >= 10) {
      gameState.winner = gameState.city_holder;
      gameState.win_reason = "\u5360\u9886\u57CE\u6C6010\u56DE\u5408";
      gameState.status = "finished";
      return;
    }
    const p1Alive = gameState.p1_generals.some((g) => g.is_alive);
    const p2Alive = gameState.p2_generals.some((g) => g.is_alive);
    if (!p1Alive && !p2Alive) {
      gameState.winner = null;
      gameState.win_reason = "\u53CC\u65B9\u5168\u706D\uFF0C\u5E73\u5C40";
      gameState.status = "finished";
    } else if (!p1Alive) {
      gameState.winner = "p2";
      gameState.win_reason = "\u6D88\u706D\u6240\u6709\u654C\u519B";
      gameState.status = "finished";
    } else if (!p2Alive) {
      gameState.winner = "p1";
      gameState.win_reason = "\u6D88\u706D\u6240\u6709\u654C\u519B";
      gameState.status = "finished";
    }
    if (gameState.turn >= 200 && gameState.status === "playing") {
      const p1TotalHp = gameState.p1_generals.reduce((sum, g) => sum + (g.is_alive ? g.current_hp : 0), 0);
      const p2TotalHp = gameState.p2_generals.reduce((sum, g) => sum + (g.is_alive ? g.current_hp : 0), 0);
      if (p1TotalHp > p2TotalHp) {
        gameState.winner = "p1";
        gameState.win_reason = "\u56DE\u5408\u4E0A\u9650\uFF0C\u8840\u91CF\u4F18\u52BF";
      } else if (p2TotalHp > p1TotalHp) {
        gameState.winner = "p2";
        gameState.win_reason = "\u56DE\u5408\u4E0A\u9650\uFF0C\u8840\u91CF\u4F18\u52BF";
      } else {
        gameState.winner = null;
        gameState.win_reason = "\u56DE\u5408\u4E0A\u9650\uFF0C\u5E73\u5C40";
      }
      gameState.status = "finished";
    }
  }
  // 获取游戏状态
  async handleGetState(request) {
    const player = new URL(request.url).searchParams.get("player");
    const gameState = await this.loadState();
    if (!gameState) {
      return Response.json({ success: false, error: ErrorCodes.GAME_NOT_FOUND });
    }
    const filteredState = filterGameStateForPlayer(gameState, player);
    return Response.json({ success: true, data: filteredState });
  }
  // 检查冷却时间
  async handleCheckCooldown(request) {
    const { playerId } = await request.json();
    const key = `cooldown:${playerId}`;
    const cooldownUntil = await this.state.storage.get(key);
    const now = Date.now();
    if (cooldownUntil && now < cooldownUntil) {
      return Response.json({
        allowed: false,
        retryAfter: Math.ceil((cooldownUntil - now) / 1e3)
      });
    }
    await this.state.storage.put(key, now + 5e3);
    return Response.json({ allowed: true });
  }
  // 查找武将
  findGeneral(instanceId, gameState) {
    return [...gameState.p1_generals, ...gameState.p2_generals].find((g) => g.instance_id === instanceId);
  }
  // 广播消息
  broadcast(event) {
    const message = JSON.stringify(event);
    for (const [playerId, ws] of this.connections) {
      try {
        if (this.gameState) {
          const playerEvent = {
            ...event,
            data: {
              ...event.data,
              state: filterGameStateForPlayer(this.gameState, playerId)
            }
          };
          ws.send(JSON.stringify(playerEvent));
        } else {
          ws.send(message);
        }
      } catch (e) {
        this.connections.delete(playerId);
      }
    }
  }
  // 保存状态
  async saveState() {
    if (this.gameState) {
      await this.state.storage.put("gameState", this.gameState);
    }
  }
  // 加载状态
  async loadState() {
    if (this.gameState) {
      return this.gameState;
    }
    this.gameState = await this.state.storage.get("gameState") || null;
    return this.gameState;
  }
};
__name(GameRoom, "GameRoom");

// src/middleware/auth.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/db/tidb.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@tidbcloud/serverless/dist/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function format(query, values) {
  return Array.isArray(values) ? replacePosition(query, values) : replaceNamed(query, values);
}
__name(format, "format");
function replacePosition(query, values) {
  let index = 0;
  return query.replace(/\?/g, (match) => {
    return index < values.length ? sanitize(values[index++]) : match;
  });
}
__name(replacePosition, "replacePosition");
function replaceNamed(query, values) {
  return query.replace(/:(\w+)/g, (match, name) => {
    return hasOwn(values, name) ? sanitize(values[name]) : match;
  });
}
__name(replaceNamed, "replaceNamed");
function hasOwn(obj, name) {
  return Object.prototype.hasOwnProperty.call(obj, name);
}
__name(hasOwn, "hasOwn");
function sanitize(value) {
  if (value == null) {
    return "null";
  }
  if (["number", "bigint"].includes(typeof value)) {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value instanceof Uint8Array) {
    return uint8ArrayToHex(value);
  }
  if (typeof value === "string") {
    return quote(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitize).join(", ");
  }
  if (value instanceof Date) {
    return quote(value.toISOString().replace("Z", ""));
  }
  return quote(value.toString());
}
__name(sanitize, "sanitize");
function quote(text) {
  return `'${escape(text)}'`;
}
__name(quote, "quote");
var re = /[\0\b\n\r\t\x1a\\"']/g;
function escape(text) {
  return text.replace(re, replacement);
}
__name(escape, "escape");
function replacement(text) {
  switch (text) {
    case '"':
      return '\\"';
    case "'":
      return "\\'";
    case "\n":
      return "\\n";
    case "\r":
      return "\\r";
    case "	":
      return "\\t";
    case "\\":
      return "\\\\";
    case "\0":
      return "\\0";
    case "\b":
      return "\\b";
    case "":
      return "\\Z";
    default:
      return "";
  }
}
__name(replacement, "replacement");
function uint8ArrayToHex(uint8) {
  const digits = Array.from(uint8).map((i) => i.toString(16).padStart(2, "0"));
  return `0x${digits.join("")}`;
}
__name(uint8ArrayToHex, "uint8ArrayToHex");
function cast(field, value, decoder) {
  if (value === null) {
    return null;
  }
  if (decoder[field.type]) {
    return decoder[field.type](value);
  }
  switch (field.type) {
    case "TINYINT":
    case "UNSIGNED TINYINT":
    case "SMALLINT":
    case "UNSIGNED SMALLINT":
    case "MEDIUMINT":
    case "UNSIGNED MEDIUMINT":
    case "INT":
    case "UNSIGNED INT":
    case "YEAR":
      return parseInt(value, 10);
    case "FLOAT":
    case "DOUBLE":
      return parseFloat(value);
    case "BIGINT":
    case "UNSIGNED BIGINT":
    case "DECIMAL":
    case "SET":
    case "ENUM":
    case "CHAR":
    case "VARCHAR":
    case "TEXT":
    case "MEDIUMTEXT":
    case "LONGTEXT":
    case "TINYTEXT":
    case "DATE":
    case "TIME":
    case "DATETIME":
    case "TIMESTAMP":
      return value;
    case "BLOB":
    case "TINYBLOB":
    case "MEDIUMBLOB":
    case "LONGBLOB":
    case "BINARY":
    case "VARBINARY":
    case "BIT":
      return hexToUint8Array(value);
    case "JSON":
      return JSON.parse(value);
    default:
      return value;
  }
}
__name(cast, "cast");
function hexToUint8Array(hexString) {
  const uint8Array = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    uint8Array[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return uint8Array;
}
__name(hexToUint8Array, "hexToUint8Array");
var DatabaseError = /* @__PURE__ */ __name(class extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}, "DatabaseError");
var Version = "0.2.0";
async function postQuery(config, body, session = "", isolationLevel = null, debug) {
  let fetchCacheOption = { cache: "no-store" };
  try {
    new Request("x:", fetchCacheOption);
  } catch (err) {
    fetchCacheOption = {};
  }
  const requestId = generateUniqueId();
  if (debug) {
    console.log(`[serverless-js debug] request id: ${requestId}`);
  }
  const url = new URL("/v1beta/sql", `https://http-${config.host}`);
  const auth = btoa(`${config.username}:${config.password}`);
  const { fetch: fetch2 } = config;
  const database = config.database ?? "";
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": `serverless-js/${Version}`,
    Authorization: `Basic ${auth}`,
    "TiDB-Database": database,
    "TiDB-Session": session,
    "X-Debug-Trace-Id": requestId,
    "Accept-Encoding": "gzip"
  };
  if (isolationLevel) {
    headers["TiDB-Isolation-Level"] = isolationLevel;
  }
  const response = await fetch2(url.toString(), {
    method: "POST",
    body,
    headers,
    ...fetchCacheOption
  });
  if (debug) {
    const traceId = response?.headers?.get("X-Debug-Trace-Id");
    console.log(`[serverless-js debug] response id: ${traceId}`);
    const contentEncoding = response?.headers?.get("Content-Encoding");
    console.log(`[serverless-js debug] Content-Encoding: ${contentEncoding}`);
  }
  if (response.ok) {
    const resp = await response.json();
    const session2 = response.headers.get("TiDB-Session");
    resp.session = session2 ?? "";
    return resp;
  } else {
    let error;
    try {
      const e = await response.json();
      error = new DatabaseError(e.message, response.status, e);
    } catch {
      error = new DatabaseError(response.statusText, response.status, null);
    }
    throw error;
  }
}
__name(postQuery, "postQuery");
function generateUniqueId() {
  const datetime = (/* @__PURE__ */ new Date()).toISOString().replace(/[^\d]/g, "").slice(0, 14);
  return `${datetime}${randomString(20)}`;
}
__name(generateUniqueId, "generateUniqueId");
function randomString(n) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const l = characters.length;
  for (let i = 0; i < n; i++) {
    result += characters[Math.floor(Math.random() * l)];
  }
  return result;
}
__name(randomString, "randomString");
var defaultExecuteOptions = {};
var Tx = /* @__PURE__ */ __name(class {
  constructor(conn) {
    this.conn = conn;
  }
  async execute(query, args = null, options = defaultExecuteOptions, txOptions = {}) {
    return this.conn.execute(query, args, options, txOptions);
  }
  async commit() {
    return this.conn.execute("COMMIT");
  }
  async rollback() {
    return this.conn.execute("ROLLBACK");
  }
}, "Tx");
var Connection = /* @__PURE__ */ __name(class _Connection {
  constructor(config) {
    var _a;
    this.session = null;
    this.config = { ...config };
    if (typeof fetch !== "undefined") {
      (_a = this.config).fetch || (_a.fetch = fetch);
    }
    if (config.url) {
      const url = new URL(config.url);
      if (!this.config.username) {
        this.config.username = decodeURIComponent(url.username);
      }
      if (!this.config.password) {
        this.config.password = decodeURIComponent(url.password);
      }
      if (!this.config.host) {
        this.config.host = url.hostname;
      }
      if (!this.config.database) {
        this.config.database = decodeURIComponent(url.pathname.slice(1));
      }
    }
  }
  getConfig() {
    return this.config;
  }
  async begin(txOptions = {}) {
    const conn = new _Connection(this.config);
    const tx = new Tx(conn);
    await tx.execute("BEGIN", void 0, void 0, txOptions);
    return tx;
  }
  async execute(query, args = null, options = defaultExecuteOptions, txOptions = {}) {
    const sql = args ? format(query, args) : query;
    const body = JSON.stringify({ query: sql });
    const debug = options.debug ?? this.config.debug ?? false;
    if (debug) {
      console.log(`[serverless-js debug] sql: ${sql}`);
    }
    const resp = await postQuery(
      this.config,
      body,
      this.session ?? "",
      sql == "BEGIN" ? txOptions.isolation : null,
      debug
    );
    this.session = resp?.session ?? null;
    if (this.session === null || this.session === "") {
      throw new DatabaseError("empty session, please try again", 500, null);
    }
    const arrayMode = options.arrayMode ?? this.config.arrayMode ?? false;
    const fullResult = options.fullResult ?? this.config.fullResult ?? false;
    const decoders = { ...this.config.decoders, ...options.decoders };
    const fields = resp?.types ?? [];
    const rows = resp ? parse(fields, resp?.rows ?? [], cast, arrayMode, decoders) : [];
    if (fullResult) {
      const rowsAffected = resp?.rowsAffected ?? null;
      const lastInsertId = resp?.sLastInsertID ?? null;
      const typeByName = /* @__PURE__ */ __name((acc, { name, type }) => ({ ...acc, [name]: type }), "typeByName");
      const types = fields.reduce(typeByName, {});
      return {
        statement: sql,
        types,
        rows,
        rowsAffected,
        lastInsertId,
        rowCount: rows.length
      };
    }
    return rows;
  }
}, "_Connection");
function connect(config) {
  return new Connection(config);
}
__name(connect, "connect");
function parseArrayRow(fields, rawRow, cast2, decoders) {
  return fields.map((field, ix) => {
    return cast2(field, rawRow[ix], decoders);
  });
}
__name(parseArrayRow, "parseArrayRow");
function parseObjectRow(fields, rawRow, cast2, decoders) {
  return fields.reduce((acc, field, ix) => {
    acc[field.name] = cast2(field, rawRow[ix], decoders);
    return acc;
  }, {});
}
__name(parseObjectRow, "parseObjectRow");
function parse(fields, rows, cast2, arrayMode, decode) {
  return rows.map((row) => arrayMode === true ? parseArrayRow(fields, row, cast2, decode) : parseObjectRow(fields, row, cast2, decode));
}
__name(parse, "parse");

// src/db/tidb.ts
function createTiDBClient(env) {
  return connect({
    host: env.TIDB_HOST,
    username: env.TIDB_USER,
    password: env.TIDB_PASSWORD,
    database: env.TIDB_DATABASE
  });
}
__name(createTiDBClient, "createTiDBClient");
async function executeQuery(env, sql, params) {
  const client = createTiDBClient(env);
  const result = await client.execute(sql, params);
  if (Array.isArray(result)) {
    return result;
  }
  return result.rows || [];
}
__name(executeQuery, "executeQuery");
async function executeUpdate(env, sql, params) {
  const client = createTiDBClient(env);
  const result = await client.execute(sql, params);
  if (Array.isArray(result)) {
    return { affectedRows: 0 };
  }
  return { affectedRows: result.rowsAffected || 0 };
}
__name(executeUpdate, "executeUpdate");
var queries = {
  // ===== Agent相关 =====
  // 创建Agent
  createAgent: `
    INSERT INTO agents (id, name, api_key_hash, elo_rating, games_played, games_won, created_at, updated_at)
    VALUES (?, ?, ?, 1200, 0, 0, NOW(), NOW())
  `,
  // 根据API Key Hash获取Agent
  getAgentByApiKeyHash: `
    SELECT id, name, elo_rating, games_played, games_won, created_at
    FROM agents
    WHERE api_key_hash = ?
  `,
  // 根据ID获取Agent
  getAgentById: `
    SELECT id, name, elo_rating, games_played, games_won, created_at
    FROM agents
    WHERE id = ?
  `,
  // 更新ELO评分
  updateElo: `
    UPDATE agents 
    SET elo_rating = elo_rating + ?,
        games_played = games_played + 1,
        games_won = games_won + ?,
        updated_at = NOW()
    WHERE id = ?
  `,
  // ===== 游戏相关 =====
  // 创建游戏
  createGame: `
    INSERT INTO games (id, p1_agent_id, status, created_at)
    VALUES (?, ?, 'waiting', NOW())
  `,
  // 加入游戏
  joinGame: `
    UPDATE games 
    SET p2_agent_id = ?, status = 'selecting', started_at = NOW()
    WHERE id = ? AND status = 'waiting' AND p2_agent_id IS NULL
  `,
  // 更新游戏状态
  updateGameStatus: `
    UPDATE games
    SET status = ?
    WHERE id = ?
  `,
  // 完成游戏
  finishGame: `
    UPDATE games 
    SET status = 'finished', 
        winner = ?, 
        win_reason = ?,
        total_turns = ?,
        final_state = ?,
        finished_at = NOW()
    WHERE id = ?
  `,
  // 获取游戏信息
  getGame: `
    SELECT g.*, 
           a1.name as p1_name, a1.elo_rating as p1_elo,
           a2.name as p2_name, a2.elo_rating as p2_elo
    FROM games g
    LEFT JOIN agents a1 ON g.p1_agent_id = a1.id
    LEFT JOIN agents a2 ON g.p2_agent_id = a2.id
    WHERE g.id = ?
  `,
  // 获取等待中的游戏列表
  getWaitingGames: `
    SELECT g.id, g.p1_agent_id, g.created_at,
           a.name as p1_name, a.elo_rating as p1_elo
    FROM games g
    LEFT JOIN agents a ON g.p1_agent_id = a.id
    WHERE g.status = 'waiting'
    ORDER BY g.created_at ASC
    LIMIT ?
  `,
  // 保存武将选择
  saveGeneralPicks: `
    UPDATE games
    SET p1_generals = ?, p2_generals = ?, banned_generals = ?
    WHERE id = ?
  `,
  // ===== 操作日志 =====
  // 记录操作日志
  logAction: `
    INSERT INTO action_logs (game_id, turn, player, action_type, action_data, result, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `,
  // 获取游戏操作日志（用于回放）
  getActionLogs: `
    SELECT turn, player, action_type, action_data, result, created_at
    FROM action_logs
    WHERE game_id = ?
    ORDER BY id ASC
  `,
  // ===== 排行榜 =====
  // 获取排行榜
  getLeaderboard: `
    SELECT id, name, elo_rating, games_played, games_won,
           ROUND(games_won * 100.0 / NULLIF(games_played, 0), 1) as win_rate
    FROM agents
    WHERE games_played > 0
    ORDER BY elo_rating DESC
    LIMIT ?
  `,
  // 获取对局历史
  getGameHistory: `
    SELECT g.id, g.status, g.winner, g.win_reason, g.total_turns, 
           g.started_at, g.finished_at,
           a1.name as p1_name, a2.name as p2_name
    FROM games g
    LEFT JOIN agents a1 ON g.p1_agent_id = a1.id
    LEFT JOIN agents a2 ON g.p2_agent_id = a2.id
    WHERE g.p1_agent_id = ? OR g.p2_agent_id = ?
    ORDER BY g.created_at DESC
    LIMIT ?
  `,
  // 保存每日排行榜快照
  saveDailyLeaderboard: `
    INSERT INTO leaderboard_daily (date, agent_id, elo_rating, rank_position, games_today, wins_today)
    VALUES (CURDATE(), ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      elo_rating = VALUES(elo_rating),
      rank_position = VALUES(rank_position),
      games_today = VALUES(games_today),
      wins_today = VALUES(wins_today)
  `,
  // ===== 武将统计 =====
  // 更新武将统计
  updateGeneralStats: `
    INSERT INTO general_stats (general_id, total_picks, total_wins, total_bans)
    VALUES (?, 1, ?, 0)
    ON DUPLICATE KEY UPDATE
      total_picks = total_picks + 1,
      total_wins = total_wins + VALUES(total_wins),
      updated_at = NOW()
  `,
  // 更新武将Ban统计
  updateGeneralBanStats: `
    INSERT INTO general_stats (general_id, total_picks, total_wins, total_bans)
    VALUES (?, 0, 0, 1)
    ON DUPLICATE KEY UPDATE
      total_bans = total_bans + 1,
      updated_at = NOW()
  `,
  // 获取武将统计
  getGeneralStats: `
    SELECT general_id, total_picks, total_wins, total_bans,
           ROUND(total_wins * 100.0 / NULLIF(total_picks, 0), 1) as win_rate
    FROM general_stats
    ORDER BY total_picks DESC
  `
};

// src/middleware/auth.ts
async function hashApiKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashApiKey, "hashApiKey");
async function createAgent(env, name, apiKey) {
  try {
    const agentId = crypto.randomUUID();
    const apiKeyHash = await hashApiKey(apiKey);
    await executeQuery(env, queries.createAgent, [agentId, name, apiKeyHash]);
    return { success: true, agentId };
  } catch (error) {
    console.error("Create agent error:", error);
    return { success: false, error: String(error) };
  }
}
__name(createAgent, "createAgent");

// src/handlers/game.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function createGame(request, env) {
  try {
    const { agent_id } = await request.json();
    if (!agent_id) {
      return Response.json({ success: false, error: { code: 1e3, message: "\u7F3A\u5C11agent_id" } }, { status: 400 });
    }
    const gameId = crypto.randomUUID();
    await executeUpdate(env, queries.createGame, [gameId, agent_id]);
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    const response = await room.fetch(new Request("http://internal/create", {
      method: "POST",
      body: JSON.stringify({ gameId, p1: agent_id })
    }));
    if (!response.ok) {
      throw new Error("Failed to create game room");
    }
    return Response.json({
      success: true,
      data: {
        game_id: gameId,
        player: "p1",
        status: "waiting",
        ws_url: `wss://${new URL(request.url).host}/api/games/${gameId}/ws?player=p1`
      }
    });
  } catch (error) {
    console.error("Create game error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(createGame, "createGame");
async function joinGame(request, env, gameId) {
  try {
    const { agent_id } = await request.json();
    if (!agent_id) {
      return Response.json({ success: false, error: { code: 1e3, message: "\u7F3A\u5C11agent_id" } }, { status: 400 });
    }
    const result = await executeUpdate(env, queries.joinGame, [agent_id, gameId]);
    if (result.affectedRows === 0) {
      return Response.json({ success: false, error: { code: 1001, message: "\u6E38\u620F\u4E0D\u5B58\u5728\u6216\u5DF2\u6EE1" } }, { status: 404 });
    }
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    const response = await room.fetch(new Request("http://internal/join", {
      method: "POST",
      body: JSON.stringify({ agent_id })
    }));
    const data = await response.json();
    if (!data.success) {
      return Response.json(data, { status: 400 });
    }
    return Response.json({
      success: true,
      data: {
        game_id: gameId,
        player: "p2",
        status: "selecting",
        ws_url: `wss://${new URL(request.url).host}/api/games/${gameId}/ws?player=p2`
      }
    });
  } catch (error) {
    console.error("Join game error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(joinGame, "joinGame");
async function getGameHistory(request, env) {
  try {
    const url = new URL(request.url);
    const agentId = url.searchParams.get("agent_id");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    if (!agentId) {
      return Response.json({ success: false, error: { code: 1e3, message: "\u7F3A\u5C11agent_id" } }, { status: 400 });
    }
    const games = await executeQuery(env, queries.getGameHistory, [agentId, agentId, Math.min(limit, 100)]);
    return Response.json({
      success: true,
      data: { games }
    });
  } catch (error) {
    console.error("Get game history error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(getGameHistory, "getGameHistory");
async function getLeaderboard(request, env) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const leaderboard = await executeQuery(env, queries.getLeaderboard, [Math.min(limit, 100)]);
    return Response.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(getLeaderboard, "getLeaderboard");
async function handleWebSocket(request, env, gameId) {
  const url = new URL(request.url);
  const player = url.searchParams.get("player");
  if (!player || player !== "p1" && player !== "p2") {
    return new Response("Invalid player parameter", { status: 400 });
  }
  const roomId = env.GAME_ROOM.idFromName(gameId);
  const room = env.GAME_ROOM.get(roomId);
  return room.fetch(new Request(`http://internal/ws?player=${player}`, {
    headers: request.headers
  }));
}
__name(handleWebSocket, "handleWebSocket");

// src/handlers/action.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function banGeneral(request, env, gameId, player) {
  try {
    const { general_id } = await request.json();
    if (typeof general_id !== "number" || general_id < 1 || general_id > 30) {
      return Response.json({ success: false, error: { code: 1010, message: "\u65E0\u6548\u6B66\u5C06ID" } }, { status: 400 });
    }
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    const response = await room.fetch(new Request("http://internal/ban", {
      method: "POST",
      body: JSON.stringify({ player, general_id })
    }));
    const data = await response.json();
    if (data.success) {
      try {
        await executeUpdate(env, queries.updateGeneralBanStats, [general_id]);
      } catch (e) {
        console.error("Failed to update ban stats:", e);
      }
    }
    return Response.json(data, { status: data.success ? 200 : 400 });
  } catch (error) {
    console.error("Ban general error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(banGeneral, "banGeneral");
async function pickGeneral(request, env, gameId, player) {
  try {
    const { general_id } = await request.json();
    if (typeof general_id !== "number" || general_id < 1 || general_id > 30) {
      return Response.json({ success: false, error: { code: 1010, message: "\u65E0\u6548\u6B66\u5C06ID" } }, { status: 400 });
    }
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    const response = await room.fetch(new Request("http://internal/pick", {
      method: "POST",
      body: JSON.stringify({ player, general_id })
    }));
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error("Pick general error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(pickGeneral, "pickGeneral");
async function deployGenerals(request, env, gameId, player) {
  try {
    const { deployments } = await request.json();
    if (!Array.isArray(deployments) || deployments.length === 0) {
      return Response.json({ success: false, error: { code: 1e3, message: "\u7F3A\u5C11\u90E8\u7F72\u4FE1\u606F" } }, { status: 400 });
    }
    for (const dep of deployments) {
      if (typeof dep.general_id !== "number" || typeof dep.x !== "number" || typeof dep.y !== "number") {
        return Response.json({ success: false, error: { code: 1e3, message: "\u90E8\u7F72\u6570\u636E\u683C\u5F0F\u9519\u8BEF" } }, { status: 400 });
      }
      if (dep.x < 0 || dep.x >= 100 || dep.y < 0 || dep.y >= 100) {
        return Response.json({ success: false, error: { code: 1013, message: "\u5750\u6807\u8D85\u51FA\u5730\u56FE\u8303\u56F4" } }, { status: 400 });
      }
    }
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    const response = await room.fetch(new Request("http://internal/deploy", {
      method: "POST",
      body: JSON.stringify({ player, deployments })
    }));
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    console.error("Deploy generals error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(deployGenerals, "deployGenerals");
async function executeAction(request, env, gameId, player) {
  try {
    const body = await request.json();
    const { action, instance_id, target_x, target_y, target_instance_id, skill_target } = body;
    const validActions = ["MOVE", "ATTACK", "SKILL", "WAIT", "RETREAT", "END_TURN"];
    if (!validActions.includes(action)) {
      return Response.json({ success: false, error: { code: 1008, message: "\u65E0\u6548\u64CD\u4F5C\u7C7B\u578B" } }, { status: 400 });
    }
    if (action === "MOVE") {
      if (!instance_id || typeof target_x !== "number" || typeof target_y !== "number") {
        return Response.json({ success: false, error: { code: 1e3, message: "\u79FB\u52A8\u64CD\u4F5C\u9700\u8981instance_id\u548C\u76EE\u6807\u5750\u6807" } }, { status: 400 });
      }
    }
    if (action === "ATTACK") {
      if (!instance_id || !target_instance_id) {
        return Response.json({ success: false, error: { code: 1e3, message: "\u653B\u51FB\u64CD\u4F5C\u9700\u8981instance_id\u548Ctarget_instance_id" } }, { status: 400 });
      }
    }
    if (action === "SKILL" || action === "WAIT" || action === "RETREAT") {
      if (!instance_id) {
        return Response.json({ success: false, error: { code: 1e3, message: "\u9700\u8981\u6307\u5B9A\u6B66\u5C06instance_id" } }, { status: 400 });
      }
    }
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    const response = await room.fetch(new Request("http://internal/action", {
      method: "POST",
      body: JSON.stringify({
        player,
        action,
        instance_id,
        target_x,
        target_y,
        target_instance_id,
        skill_target
      })
    }));
    const data = await response.json();
    if (data.success) {
      try {
        const turn = data.data?.turn || 0;
        await executeUpdate(env, queries.logAction, [
          gameId,
          turn,
          player,
          action,
          JSON.stringify(body),
          JSON.stringify(data.data)
        ]);
      } catch (e) {
        console.error("Failed to log action:", e);
      }
    }
    return Response.json(data, { status: data.success ? 200 : 400 });
  } catch (error) {
    console.error("Execute action error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(executeAction, "executeAction");

// src/handlers/query.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_generals();
async function getGameState(request, env, gameId, player) {
  try {
    const roomId = env.GAME_ROOM.idFromName(gameId);
    const room = env.GAME_ROOM.get(roomId);
    const response = await room.fetch(new Request(`http://internal/state?player=${player}`));
    const data = await response.json();
    if (!data.success || !data.data) {
      return Response.json(data, { status: 400 });
    }
    const gameState = data.data;
    const myGenerals = player === "p1" ? gameState.p1_generals : gameState.p2_generals;
    const enemyGenerals = player === "p1" ? gameState.p2_generals : gameState.p1_generals;
    const formattedResponse = {
      game_id: gameState.game_id,
      status: gameState.status,
      turn: gameState.turn,
      current_player: gameState.current_player,
      my_player: player,
      my_generals: myGenerals.map((g) => {
        const data2 = getGeneralById(g.general_id);
        return {
          instance_id: g.instance_id,
          general_id: g.general_id,
          name: data2?.name || "Unknown",
          current_hp: g.current_hp,
          max_hp: data2?.base_hp || 0,
          atk: (data2?.base_atk || 0) + g.atk_modifier,
          def: (data2?.base_def || 0) + g.def_modifier,
          mov: (data2?.base_mov || 0) + g.mov_modifier,
          position: g.position,
          has_acted: g.has_acted,
          buffs: g.buffs.map((b) => b.type)
        };
      }),
      visible_enemies: enemyGenerals.filter((e) => e.is_alive).map((e) => {
        const data2 = getGeneralById(e.general_id);
        return {
          instance_id: e.instance_id,
          general_id: e.general_id,
          name: data2?.name || "Unknown",
          current_hp: e.current_hp,
          max_hp: data2?.base_hp || 0,
          position: e.position
        };
      }),
      city: {
        holder: gameState.city_holder,
        hold_turns: gameState.city_hold_turns
      },
      action_cooldown: {
        can_act: true,
        // 冷却检查在action handler中处理
        next_action_time: 0
      },
      pick_phase: gameState.pick_phase,
      banned_generals: gameState.banned_generals,
      my_picks: player === "p1" ? gameState.p1_picks : gameState.p2_picks,
      enemy_picks: player === "p1" ? gameState.p2_picks : gameState.p1_picks,
      winner: gameState.winner,
      win_reason: gameState.win_reason
    };
    return Response.json({ success: true, data: formattedResponse });
  } catch (error) {
    console.error("Get game state error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(getGameState, "getGameState");
async function getGeneralsList(request, env) {
  try {
    const { GENERALS: GENERALS2 } = await Promise.resolve().then(() => (init_generals(), generals_exports));
    return Response.json({
      success: true,
      data: {
        generals: GENERALS2.map((g) => ({
          id: g.id,
          name: g.name,
          faction: g.faction,
          type: g.type,
          base_hp: g.base_hp,
          base_atk: g.base_atk,
          base_def: g.base_def,
          base_mov: g.base_mov,
          skill_name: g.skill_name,
          skill_desc: g.skill_desc,
          skill_type: g.skill_type
        }))
      }
    });
  } catch (error) {
    console.error("Get generals list error:", error);
    return Response.json({ success: false, error: { code: -1, message: String(error) } }, { status: 500 });
  }
}
__name(getGeneralsList, "getGeneralsList");

// src/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
__name(addCorsHeaders, "addCorsHeaders");
function matchRoute(pathname, pattern) {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");
  if (patternParts.length !== pathParts.length)
    return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}
__name(matchRoute, "matchRoute");
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  let response;
  try {
    if (pathname === "/health") {
      return addCorsHeaders(Response.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
    }
    if (method === "POST" && pathname === "/api/register") {
      const { name } = await request.json();
      const result = await createAgent(name, env);
      response = Response.json({ success: true, data: result });
    } else if (method === "GET" && pathname === "/api/generals") {
      response = await getGeneralsList(request, env);
    } else if (method === "GET" && pathname === "/api/leaderboard") {
      response = await getLeaderboard(request, env);
    } else if (method === "GET" && pathname === "/api/games/history") {
      response = await getGameHistory(request, env);
    } else if (method === "POST" && pathname === "/api/games") {
      response = await createGame(request, env);
    } else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/join")) {
      const params = matchRoute(pathname, "/api/games/:gameId/join");
      response = await joinGame(request, env, params.gameId);
    } else if (method === "GET" && matchRoute(pathname, "/api/games/:gameId/state")) {
      const params = matchRoute(pathname, "/api/games/:gameId/state");
      const player = url.searchParams.get("player") || "p1";
      response = await getGameState(request, env, params.gameId, player);
    } else if (matchRoute(pathname, "/api/games/:gameId/ws") && request.headers.get("Upgrade") === "websocket") {
      const params = matchRoute(pathname, "/api/games/:gameId/ws");
      return handleWebSocket(request, env, params.gameId);
    } else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/ban")) {
      const params = matchRoute(pathname, "/api/games/:gameId/ban");
      const player = url.searchParams.get("player") || "p1";
      response = await banGeneral(request, env, params.gameId, player);
    } else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/pick")) {
      const params = matchRoute(pathname, "/api/games/:gameId/pick");
      const player = url.searchParams.get("player") || "p1";
      response = await pickGeneral(request, env, params.gameId, player);
    } else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/deploy")) {
      const params = matchRoute(pathname, "/api/games/:gameId/deploy");
      const player = url.searchParams.get("player") || "p1";
      response = await deployGenerals(request, env, params.gameId, player);
    } else if (method === "POST" && matchRoute(pathname, "/api/games/:gameId/action")) {
      const params = matchRoute(pathname, "/api/games/:gameId/action");
      const player = url.searchParams.get("player") || "p1";
      response = await executeAction(request, env, params.gameId, player);
    } else {
      response = Response.json(
        { success: false, error: { code: 404, message: "Not found" } },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Request error:", error);
    response = Response.json(
      { success: false, error: { code: 500, message: String(error) } },
      { status: 500 }
    );
  }
  return addCorsHeaders(response);
}
__name(handleRequest, "handleRequest");
var src_default = {
  fetch: handleRequest
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-JRcDkR/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-JRcDkR/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  GameRoom,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
