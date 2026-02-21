# Firebase Storage CORS 설정

Firebase Storage에서 PDF 파일을 로드할 때 CORS 오류가 발생하는 경우, 다음 명령어를 실행하여 CORS를 설정해야 합니다.

## 1. Google Cloud SDK 설치 (아직 설치하지 않은 경우)

macOS:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

## 2. CORS 설정 적용

```bash
# Firebase 프로젝트 이름 확인
gcloud config list project

# Firebase Storage 버킷에 CORS 설정 적용
gsutil cors set cors.json gs://primer-e7f2b.firebasestorage.app

# CORS 설정 확인
gsutil cors get gs://primer-e7f2b.firebasestorage.app
```

## 3. 대안: Firebase Storage 공개 읽기 권한 설정

또는 Firebase Console에서:
1. Firebase Console (https://console.firebase.google.com/) 접속
2. Storage 섹션 이동
3. Rules 탭에서 다음과 같이 수정:

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

**주의**: 이 방법은 보안에 취약할 수 있으므로 프로덕션 환경에서는 권장하지 않습니다.
