# Online deploy útmutató

Ez a dokumentum a ProdCty publikus, nem lokális futtatásához szükséges beállításokat foglalja össze.

## Javasolt szolgáltatások

| Réteg | Javasolt szolgáltatás | Indoklás |
|---|---|---|
| Frontend | Vercel | React + Vite alkalmazás gyors, automatikus deployjal |
| Backend | Render Web Service | Node.js + Express API egyszerű GitHub alapú deployjal |
| Adatbázis | MongoDB Atlas | Felhős MongoDB, `mongodb+srv://` connection stringgel |
| Médiafájlok | Cloudinary | Felhős média storage/CDN audio- és avatarfájlokhoz |

## Backend deploy Renderen

Render beállítás:

- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Node version: 20 vagy újabb

Környezeti változók:

```text
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<erős-egyedi-titok>
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=<erős-admin-jelszó>
CORS_ORIGIN=https://<vercel-frontend-domain>
MEDIA_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_AUDIO_FOLDER=prodcty/audio
CLOUDINARY_AVATAR_FOLDER=prodcty/avatars
AI_SAMPLE_SCREENING_ENABLED=auto
OPENAI_API_KEY=<openai-api-key>
OPENAI_SAMPLE_RISK_MODEL=gpt-4.1-mini
```

Ellenőrzés deploy után:

```text
https://<render-backend-domain>/health
```

Elvárt válasz:

```json
{"ok":true}
```

## Frontend deploy Vercelen

Vercel beállítás:

- Root directory: `frontend-react`
- Build command: `npm run build`
- Output directory: `dist`

Környezeti változó:

```text
VITE_API_URL=https://<render-backend-domain>
```

Fontos: a `VITE_API_URL` értékében ne legyen záró perjel.

## Médiafájlok működése

Lokális fejlesztésnél a feltöltések továbbra is a backend lokális `uploads/` mappájába kerülnek.

Production környezetben, ha a `MEDIA_STORAGE_PROVIDER=cloudinary` és a Cloudinary kulcsok be vannak állítva:

1. A backend memóriába veszi át a feltöltött audio/avatar fájlt.
2. A fájlt Cloudinaryba tölti fel.
3. A MongoDB csak a publikus média URL-t, public id-t, fájlméretet, MIME type-ot és metaadatokat tárolja.
4. Lejátszáskor és letöltéskor a frontend közvetlenül a Cloudinary/CDN URL-t használja.
5. Track vagy felhasználó törlésekor a backend a Cloudinary asset törlését is megkísérli.

## AI sample risk screening

Sample feltöltéskor a backend a feltöltési metaadatok alapján kockázati előszűrést végez. Ha `OPENAI_API_KEY` be van állítva, OpenAI API-val kér strukturált választ. Ha nincs API-kulcs vagy az AI kérés hibázik, a rendszer szabályalapú fallbacket használ, így a feltöltés nem válik törékennyé.

Az AI nem jogi döntést hoz, hanem adminisztrátori review-t támogat. Gyanús jelzések például: YouTube forrás említése, rip/official/stem kifejezések, kereskedelmi előadók vagy harmadik féltől származó sample packok említése. A sample ettől még feltöltődik, de az admin külön `AI review` tabon látja a gyanús sample-öket, mini lejátszóval meghallgathatja őket, majd clear-elheti a flaget, vagy Review action popupból törölheti a sample-t a feltöltő opcionális figyelmeztetésével vagy tiltásával.

## Publikus bemutatási checklist

- Backend `/health` elérhető.
- Frontend betölt Vercelen.
- Regisztráció és login működik.
- Sample feltöltés után a fájl lejátszható.
- Sample feltöltés után a jogtisztasági nyilatkozat és az AI risk státusz admin oldalon ellenőrizhető.
- Demo feltöltés után az Aura waveform megjelenik.
- Avatar feltöltés után a profilkép publikus profilban is látszik.
- Feedback, reply, report és collab request működik.
- Admin felület elérhető admin felhasználóval.
