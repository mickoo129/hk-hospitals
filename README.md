# 香港醫院指南 / Hong Kong Hospitals

靜態網站，可直接部署到 Netlify。

Repo: https://github.com/mickoo129/hk-hospitals

## 本機預覽

```bash
npx serve .
```

不要用 `file://` 直接打開，否則無法讀取 `data/*.json`。

## 部署 Netlify

1. Netlify：Add new site → Import an existing project
2. 選此 repo `mickoo129/hk-hospitals`
3. Publish directory 用專案根（已有 `netlify.toml`）

## 資料

- `data/places.json`：公立設施（醫管局開放數據）+ 13 間私家醫院
- `data/sop-wait.json`：專科門診新症輪候（醫管局，每季）

急症室即時等候並非本版功能。危急請致電 999。
