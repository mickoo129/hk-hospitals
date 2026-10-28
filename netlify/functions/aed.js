// 轉送醫管局急症室等候時間開放數據（醫管局網址冇 CORS，瀏覽器唔可以直接讀）。
// 唔使 npm 依賴：用 Node 18+ 內置 fetch。
const SOURCES = [
  "https://www.ha.org.hk/opendata/aed/aedwtdata2-tc.json",
  "https://www.ha.org.hk/opendata/aed/aedwtdata2-en.json",
];

exports.handler = async () => {
  for (const url of SOURCES) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "hk-hospitals (Netlify)" } });
      if (!r.ok) continue;
      const body = await r.text();
      JSON.parse(body); // 確認係 JSON
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=300",
          "access-control-allow-origin": "*",
        },
        body,
      };
    } catch (e) { /* 試下一個來源 */ }
  }
  return { statusCode: 502, body: JSON.stringify({ error: "未能讀取醫管局數據" }) };
};
