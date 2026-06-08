# CMS Auth — Testing Notes

CMS uses **stateless JWT** with **2 fixed admin users from env** (no signup, no users DB).

Env (`backend/.env`): `CMS_JWT_SECRET`, `CMS_USER_1`/`CMS_PASS_1`, `CMS_USER_2`/`CMS_PASS_2`,
`STORAGE_BACKEND=local`, `CMS_UPLOAD_DIR`.

## API
- `POST /api/cms/login` `{username,password}` → `{token, user}`
- `GET  /api/cms/me` (Bearer) → `{user}`
- `GET  /api/cms/content` (public) → `{key: published_value}`
- `GET  /api/cms/content/draft` (Bearer) → `{content:{key:value}, has_draft}`
- `PUT  /api/cms/content` (Bearer) `{key,type,value}` → upsert draft
- `POST /api/cms/publish` (Bearer) → promote draft → published
- `POST /api/cms/discard` (Bearer) → reset draft to published
- `POST /api/cms/media` (Bearer, multipart `file`) → `{url}`
- `GET  /api/cms/media/{name}` (public) → serves the file

## curl smoke
```
API=<REACT_APP_BACKEND_URL>
TOKEN=$(curl -s -X POST "$API/api/cms/login" -H "Content-Type: application/json" \
  -d '{"username":"admin@mygenie.online","password":"<pass>"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s "$API/api/cms/me" -H "Authorization: Bearer $TOKEN"
curl -s -X PUT "$API/api/cms/content" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"key":"home.hero.headline_accent","type":"text","value":"from your pocket."}'
curl -s -X POST "$API/api/cms/publish" -H "Authorization: Bearer $TOKEN"
curl -s "$API/api/cms/content"   # should show the published value
```
