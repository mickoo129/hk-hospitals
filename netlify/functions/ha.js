exports.handler = async (event) => {
  const src = (event.queryStringParameters || {}).src;
  const map = {
    hosp: "https://www.ha.org.hk/opendata/facility-hosp.json",
    sop: "https://www.ha.org.hk/opendata/facility-sop.json",
    waittc: "https://www.ha.org.hk/opendata/sop/sop-waiting-time-tc.json",
    waiten: "https://www.ha.org.hk/opendata/sop/sop-waiting-time-en.json",
  };
  const url = map[src];
  if (!url) return { statusCode: 400, body: "unknown src" };
  try {
    const r = await fetch(url);
    const body = await r.text();
    return {
      statusCode: r.ok ? 200 : r.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
      body,
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: String(err) }) };
  }
};
