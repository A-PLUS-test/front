# Firebase Storage CORS 설정 완벽 가이드

Firebase Storage에서 PDF 파일을 브라우저에서 직접 로드할 때 CORS 오류가 발생하는 경우 다음 방법으로 해결할 수 있습니다.

## 방법 1: Google Cloud SDK를 사용한 CORS 설정 (권장)

### 1단계: Google Cloud SDK 설치

#### macOS:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### Windows:
[Google Cloud SDK 설치 프로그램 다운로드](https://cloud.google.com/sdk/docs/install)

### 2단계: gcloud 초기화
```bash
gcloud init
# Firebase 프로젝트 선택: primer-e7f2b
```

### 3단계: CORS 설정 파일 확인
프로젝트의 `cors.json` 파일이 다음과 같은지 확인:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

### 4단계: CORS 설정 적용
```bash
# 프로젝트 루트에서 실행
cd front

# Storage 버킷에 CORS 설정 적용
gsutil cors set cors.json gs://primer-e7f2b.firebasestorage.app

# CORS 설정 확인
gsutil cors get gs://primer-e7f2b.firebasestorage.app
```

### 5단계: 확인
브라우저를 새로고침하고 PDF 뷰어가 정상 작동하는지 확인

---

## 방법 2: 임시 해결책 - SimplePdfViewer 사용

CORS 설정이 어려운 경우, iframe을 사용하는 간단한 뷰어로 대체할 수 있습니다.

### Dashboard.tsx 수정:
```typescript
import SimplePdfViewer from '../components/SimplePdfViewer';

// PdfViewer 대신 SimplePdfViewer 사용
{selectedPdf && (
  <SimplePdfViewer
    fileUrl={selectedPdf.url}
    fileName={selectedPdf.name}
    onClose={() => setSelectedPdf(null)}
  />
)}
```

### Documents.tsx도 동일하게 수정

**장점**: CORS 문제 없이 즉시 작동
**단점**: PDF.js의 고급 기능(줌, 페이지 네비게이션) 사용 불가

---

## 방법 3: Firebase Storage 규칙으로 공개 읽기 허용 (이미 적용됨)

`storage.rules` 파일:
```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{fileName} {
      allow read: if true;  // 모든 사용자에게 읽기 허용
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

배포:
```bash
firebase deploy --only storage
```

---

## 방법 4: 로컬 개발 시 Vite 프록시 설정

`vite.config.ts`에 프록시 추가:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/storage': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/storage/, '')
      }
    }
  }
})
```

---

## 권장 순서

1. **방법 1** (Google Cloud SDK) 시도 - 가장 완벽한 해결책
2. 실패 시 **방법 2** (SimplePdfViewer) 사용 - 즉시 작동
3. 프로덕션 환경에서는 방법 1을 반드시 적용

---

## 트러블슈팅

### gsutil 명령어를 찾을 수 없는 경우:
```bash
# gcloud components 업데이트
gcloud components update

# gsutil 설치 확인
which gsutil
```

### 권한 오류가 발생하는 경우:
```bash
# Firebase 프로젝트에 대한 권한 확인
gcloud projects get-iam-policy primer-e7f2b

# 필요시 재인증
gcloud auth login
```

### 여전히 CORS 오류가 발생하는 경우:
- 브라우저 캐시 완전히 삭제
- 시크릿/프라이빗 모드에서 테스트
- 개발자 도구의 Network 탭에서 응답 헤더 확인
