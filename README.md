# 香港醫院指南

香港所有公立（醫管局）、私家及中醫醫院一覽：按港島、九龍、新界、離島同 18 區篩選，查專科、24 小時急症、專科門診，附地址、電話、Google 地圖，同醫管局急症室即時等候時間。

MKPA 工具之一，設計標準見 `mickoo129/mkpa-tools`。

## 檔案

- `index.html`、`css/style.css`、`js/app.js`：網頁（純前端，唔使 build）
- `data/hospitals.js`：醫院資料（改完記得更新 `DATA_CHECKED`）
- `netlify/functions/aed.js`：轉送醫管局急症室等候時間
- `favicon.*`、`icon-*.png`、`apple-touch-icon.png`、`site.webmanifest`：用 `mkpa-tools/_standard/make-icons.py pin-plus` 產生

## 本機預覽

```bash
python3 -m http.server 8000
```

本機冇 Netlify Function，所以唔會顯示急症室等候時間；用 `netlify dev` 就會有。

## 部署

Netlify → Add new site → Import an existing project → 揀 `mickoo129/hk-hospitals`。Build command 留空，Publish directory `.`（`netlify.toml` 已設定），Functions directory `netlify/functions`。
