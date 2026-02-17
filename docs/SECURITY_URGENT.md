# ⚠️ 보안 긴급 조치 가이드

## 🚨 즉시 실행해야 할 사항

### 1단계: OpenAI 사용 한도 설정 (5분 소요)

**지금 바로 실행하세요!**

1. OpenAI Platform 접속: https://platform.openai.com/settings/organization/limits
2. 로그인
3. **"Usage limits"** 클릭
4. **"Set a monthly budget"** 또는 **"Hard limit"** 설정
   - 추천: **$10/월** (테스트용)
   - 또는: **$5/월** (안전한 최소값)
5. **"Soft limit"** 설정 (선택사항)
   - 80% 도달 시 이메일 알림
6. **저장** 클릭

### 2단계: 현재 사용량 확인

1. https://platform.openai.com/usage
2. 현재까지 사용량 확인
3. 이상한 사용량이 있는지 체크

### 3단계: API Key 재생성 (권장)

**이미 배포된 사이트에 키가 노출되었으므로:**

1. https://platform.openai.com/api-keys
2. 기존 키 **삭제** (Revoke)
3. **새 키 생성**
4. `.env` 파일에 새 키 업데이트
5. **재배포하지 말 것!** (다시 노출됨)

---

## 🔒 장기 해결책

### 옵션 1: Firebase Functions (추천)

**장점:**
- ✅ OpenAI API Key 완전히 숨김
- ✅ 호출 횟수 제한 가능
- ✅ 사용자별 쿼터 관리

**단점:**
- ❌ Firebase Blaze 플랜 필요 (종량제)
- ❌ 코드 수정 필요

### 옵션 2: 접근 제한

**임시 해결책:**
1. Firebase Hosting에서 접근 제한 설정
2. 비밀번호 페이지 추가
3. 친구들에게만 비밀번호 공유

### 옵션 3: OpenAI API 사용 중단

**대안:**
- 더미 데이터로만 테스트
- 퀴즈 생성 기능 비활성화
- Firebase Functions 구현 후 재활성화

---

## 🎯 현재 위험도 평가

### 🔴 높음 (현재 상태)
- OpenAI API Key가 **완전히 노출**됨
- 누구나 5초 만에 탈취 가능
- 무제한 사용 가능 (한도 미설정 시)

### 🟡 보통 (한도 설정 후)
- API Key는 노출되지만
- 월 $10 한도로 피해 제한됨
- 자동 차단으로 추가 피해 방지

### 🟢 낮음 (Firebase Functions 구현 후)
- API Key 완전히 숨김
- 서버에서만 호출
- 완전한 통제 가능

---

## 📋 체크리스트

완료 여부를 체크하세요:

- [ ] OpenAI 사용 한도 $10/월 설정
- [ ] 이메일 알림 설정 (80%, 100%)
- [ ] 현재 사용량 확인
- [ ] API Key 재생성 (선택사항)
- [ ] `.env` 파일 업데이트 (재생성 시)
- [ ] Firebase Functions 구현 계획 수립

---

## 🆘 긴급 상황 대응

### 만약 이상한 사용량이 발견되면:

1. **즉시 API Key 삭제** (Revoke)
   - https://platform.openai.com/api-keys
2. OpenAI Support에 연락
   - https://help.openai.com/
3. 크레딧 카드 사용 내역 확인
4. 필요 시 결제 분쟁 신청

---

## 💡 왜 이런 일이 발생했나?

### Vite의 환경변수 처리 방식

```javascript
// .env 파일
VITE_OPENAI_API_KEY=sk-proj-...

// 빌드 시 (자동 치환)
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
↓
const apiKey = "sk-proj-...";  // 그대로 노출!

// 최종 번들 파일
// dist/assets/index-xxx.js 안에 평문으로 포함됨
```

**`VITE_` 접두사:**
- 클라이언트에 노출해도 안전한 변수용
- Firebase API Key는 OK (Security Rules로 보호)
- OpenAI API Key는 NG (권한 직접 부여)

### 올바른 방법

```
클라이언트 (브라우저)
    ↓ 요청
Firebase Functions (서버) ← OpenAI API Key 저장
    ↓ 호출
OpenAI API
```

---

## 🚀 다음 단계

1. **지금**: 사용 한도 설정 ($10/월)
2. **오늘**: API Key 재생성
3. **이번 주**: Firebase Functions 구현 검토
4. **다음 주**: Firebase Functions 구현 시작

---

**지금 당장 OpenAI 사용 한도를 설정하세요!** ⏰

5분이면 충분합니다. 수천 달러의 피해를 막을 수 있습니다!
