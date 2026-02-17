# 🚀 Firebase Hosting 배포 가이드

## 📋 배포 전 체크리스트

1. ✅ `.env` 파일에 모든 API 키가 올바르게 설정되어 있는지 확인
2. ✅ Firebase Console에서 Authentication, Firestore, Storage가 활성화되어 있는지 확인
3. ✅ 로컬에서 `npm run build`가 정상적으로 작동하는지 확인

---

## 🔥 배포 단계

### 1단계: Firebase 로그인

터미널에서 실행:
\`\`\`bash
firebase login
\`\`\`

브라우저가 열리면 Google 계정으로 로그인

---

### 2단계: 프로덕션 빌드

\`\`\`bash
npm run build
\`\`\`

`dist` 폴더가 생성됩니다.

---

### 3단계: Firebase에 배포

\`\`\`bash
firebase deploy
\`\`\`

배포 완료 후 다음과 같은 URL이 표시됩니다:
\`\`\`
Hosting URL: https://primer-e7f2b.web.app
\`\`\`

---

## 🔄 업데이트 배포

코드를 수정한 후:

\`\`\`bash
# 1. 빌드
npm run build

# 2. 배포
firebase deploy
\`\`\`

---

## 🌍 배포 URL

- **기본 URL**: https://primer-e7f2b.web.app
- **Firebase URL**: https://primer-e7f2b.firebaseapp.com

---

## ⚙️ 환경 변수 주의사항

**중요**: `.env` 파일의 내용은 빌드 시 코드에 포함됩니다!

- `VITE_*` 로 시작하는 환경 변수만 빌드에 포함됩니다
- API 키가 클라이언트에 노출되므로 Firebase Security Rules로 보호하세요

---

## 🔒 보안 설정

### Firestore Rules (필수!)

프로덕션 배포 전에 규칙을 강화하세요:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 문서는 소유자만 읽기/쓰기 가능
    match /documents/{docId} {
      allow read, write: if request.auth != null 
                        && request.auth.uid == resource.data.userId;
    }
    
    // 퀴즈는 소유자만 접근
    match /quizzes/{quizId} {
      allow read, write: if request.auth != null 
                        && request.auth.uid == resource.data.userId;
    }
    
    // 퀴즈 결과는 소유자만 접근
    match /quizResults/{resultId} {
      allow read, write: if request.auth != null 
                        && request.auth.uid == resource.data.userId;
    }
    
    // 단어장은 소유자만 접근
    match /vocabularySets/{vocabId} {
      allow read, write: if request.auth != null 
                        && request.auth.uid == resource.data.userId;
    }
    
    // 퀴즈 진행 상태는 소유자만 접근
    match /quizProgress/{progressId} {
      allow read, write: if request.auth != null 
                        && progressId.matches('^' + request.auth.uid + '_.*');
    }
  }
}
\`\`\`

### Storage Rules (필수!)

\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{filename} {
      // 소유자만 업로드 및 읽기 가능
      allow read, write: if request.auth != null 
                        && request.auth.uid == userId;
    }
  }
}
\`\`\`

---

## 🐛 문제 해결

### 404 에러 발생

\`firebase.json\`의 rewrites 설정이 올바른지 확인

### 환경 변수가 작동하지 않음

1. `.env` 파일에 `VITE_` 접두사가 있는지 확인
2. 빌드를 다시 실행: `npm run build`
3. 재배포: `firebase deploy`

### OpenAI API 할당량 초과

현재는 더미 데이터로 작동하도록 설정되어 있습니다.
실제 OpenAI API를 사용하려면:
1. OpenAI 계정에 결제 방법 등록
2. 새 API 키 발급
3. `.env`에 새 키 입력
4. 재빌드 및 재배포

---

## 📊 배포 후 모니터링

Firebase Console에서 확인 가능:
- **Hosting**: 배포 기록, 트래픽
- **Authentication**: 사용자 수
- **Firestore**: 데이터베이스 사용량
- **Storage**: 파일 저장소 사용량

---

## 💰 비용

Firebase 무료 플랜 (Spark):
- Hosting: 10GB 저장소, 360MB/일 전송
- Firestore: 1GB 저장소, 50K 읽기/일
- Storage: 5GB 저장소, 1GB/일 다운로드
- Authentication: 무제한

**대부분의 개인 프로젝트는 무료 플랜으로 충분합니다!**

---

## 🎉 완료!

이제 전 세계 어디서나 앱에 접속할 수 있습니다!
