// 轉送醫管局開放數據（醫管局網址冇 CORS，瀏覽器唔可以直接讀）。
// 唔使 npm 依賴：用 Node 18+ 內置 fetch。
//
// 用法：/.netlify/functions/aed?src=<來源>（唔寫 src 就係急症室等候時間）
//   aed      急症室等候時間（醫管局每 15 分鐘更新）
//   surge    服務需求高峰期主要數據（高峰期每日更新；只回傳最近一日，原檔好大）
//   gopc     家庭醫學（普通科）診所過去 4 星期平均籌額（每星期一更新）
//   sopc     專科門診新症輪候時間（每季更新）
//   cataract 白內障手術輪候（每季更新）
//   joint    全關節置換手術輪候（每季更新）
const HA = "https://www.ha.org.hk";
const SOURCES = {
  aed:      { urls: ["/opendata/aed/aedwtdata2-tc.json", "/opendata/aed/aedwtdata2-en.json"], maxAge: 300 },
  surge:    { urls: ["/opendata/pas_report/Daily_Services_Statistics/Daily_Services_Statistics_TC.json"], maxAge: 3600, trim: latestDay },
  gopc:     { urls: ["/pas_gopc/pas_gopc_avg_quota_pdf/g0_9uo7a_p-tc.json"], maxAge: 21600 },
  sopc:     { urls: ["/opendata/sop/sop-waiting-time-tc.json"], maxAge: 21600 },
  cataract: { urls: ["/opendata/electivesurgery/elective-cataract-surgery-tc.json"], maxAge: 21600 },
  joint:    { urls: ["/opendata/electivesurgery/elective-total-joint-replacement-surgery-tc.json"], maxAge: 21600 },
};

// 高峰期數據由 2019 年開始全部放喺一個檔，只留最近一日
function latestDay(arr) {
  if (!Array.isArray(arr) || !arr.length) return [];
  let last = "";
  for (const x of arr) if (x && x.date > last) last = x.date;
  return arr.filter((x) => x && x.date === last);
}

exports.handler = async (event) => {
  const key = ((event && event.queryStringParameters) || {}).src || "aed";
  const src = SOURCES[key];
  if (!src) return { statusCode: 400, body: JSON.stringify({ error: "未知來源" }) };
  for (const path of src.urls) {
    try {
      const r = await fetch(HA + path, { headers: { "user-agent": "hk-hospitals (Netlify)" } });
      if (!r.ok) continue;
      let data = JSON.parse((await r.text()).replace(/^﻿/, ""));
      if (src.trim) data = src.trim(data);
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=" + src.maxAge,
          "access-control-allow-origin": "*",
        },
        body: JSON.stringify(data),
      };
    } catch (e) { /* 試下一個來源 */ }
  }
  return { statusCode: 502, body: JSON.stringify({ error: "未能讀取醫管局數據" }) };
};
