# getaplus.cloud 리다이렉트 제거 (Firebase 콘솔)

`primer-e7f2b.web.app` 접속 시 CSS/JS가 getaplus.cloud로 리다이렉트되어 CORS 에러가 나는 경우,  
리다이렉트는 **Firebase 콘솔**에서 설정된 것이므로 아래에서 제거해야 합니다.

---

## 1. Firebase 콘솔 접속

1. https://console.firebase.google.com 접속
2. 프로젝트 **primer-e7f2b** 선택
3. 왼쪽 메뉴에서 **Hosting** 클릭

---

## 2. 커스텀 도메인에서 getaplus.cloud 제거

1. Hosting 페이지에서 **"커스텀 도메인"** 또는 **"Custom domains"** 탭/섹션으로 이동
2. **getaplus.cloud** 가 연결되어 있으면:
   - 해당 도메인 옆 **⋮(메뉴)** 또는 **관리** 클릭
   - **"도메인 제거"** / **"Remove domain"** 선택
   - 확인 후 제거

이렇게 하면 `primer-e7f2b.web.app` 으로 접속해도 getaplus.cloud 로 넘어가지 않습니다.

---

## 3. (있을 경우) 리다이렉트 규칙 확인

- Hosting 설정에 **"리다이렉트"** / **"Redirects"** 항목이 있으면
- getaplus.cloud 로 보내는 규칙이 있는지 확인하고, 있으면 **삭제** 또는 **비활성화**

(일부 Firebase 버전에서는 리다이렉트가 `firebase.json` 에만 있고, 콘솔에는 없을 수 있음)

---

## 4. 적용 후 확인

- 브라우저에서 **시크릿/프라이빗 창**으로 열거나 **캐시 비우기** 후
- https://primer-e7f2b.web.app 다시 접속
- CSS/JS가 같은 도메인(`primer-e7f2b.web.app`)에서 로드되는지 확인

---

## 나중에 getaplus.cloud 다시 쓰려면

SSL 인증서 준비된 뒤, Firebase Hosting → 커스텀 도메인에서 getaplus.cloud 를 다시 연결하면 됩니다.
