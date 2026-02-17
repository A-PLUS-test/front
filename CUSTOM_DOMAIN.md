# 🌍 커스텀 도메인 연결 가이드

## 📋 목차
1. [도메인 구매](#도메인-구매)
2. [Firebase에 도메인 추가](#firebase에-도메인-추가)
3. [DNS 설정](#dns-설정)
4. [SSL 인증서](#ssl-인증서)
5. [문제 해결](#문제-해결)

---

## 🛒 도메인 구매

### 추천 도메인 구매 사이트

1. **Namecheap** (추천!) 
   - 가격: $8-12/년
   - URL: https://www.namecheap.com
   - 장점: 저렴, 관리 쉬움

2. **Google Domains**
   - 가격: $12/년
   - URL: https://domains.google
   - 장점: Google 통합, 간단한 UI

3. **GoDaddy**
   - 가격: $10-20/년
   - URL: https://www.godaddy.com

4. **Hosting.kr** (한국)
   - 가격: ₩10,000-20,000/년
   - URL: https://www.hosting.kr
   - 장점: 한국어 지원, 한글 도메인

---

## 🔥 Firebase에 도메인 추가

### 1단계: Firebase Console 접속

1. https://console.firebase.google.com 접속
2. 프로젝트 **primer-e7f2b** 선택
3. 왼쪽 메뉴 → **Hosting** 클릭

### 2단계: 도메인 추가

1. 상단의 **"도메인 추가"** 버튼 클릭
2. 구매한 도메인 입력
   - 예: `mystudy.com`
   - 서브도메인: `study.mystudy.com`
3. **"계속"** 클릭

### 3단계: DNS 설정 정보 복사

Firebase가 다음과 같은 정보를 제공합니다:

**A 레코드:**
```
Type: A
Name: @
Value: 151.101.1.195
Value: 151.101.65.195
```

**AAAA 레코드 (IPv6, 선택사항):**
```
Type: AAAA
Name: @
Value: 2a04:4e42::223
Value: 2a04:4e42:200::223
```

---

## 🔧 DNS 설정

### Namecheap에서 설정

1. Namecheap 계정 로그인
2. **Domain List** → 도메인 선택
3. **Advanced DNS** 탭 클릭
4. **Add New Record** 클릭

**추가할 레코드:**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 151.101.1.195 | Automatic |
| A Record | @ | 151.101.65.195 | Automatic |

5. **Save All Changes** 클릭

### Google Domains에서 설정

1. Google Domains 로그인
2. 도메인 선택 → **DNS** 탭
3. **Custom records** 섹션
4. **Manage custom records** 클릭

**추가할 레코드:**

| Name | Type | TTL | Data |
|------|------|-----|------|
| @ | A | 3600 | 151.101.1.195 |
| @ | A | 3600 | 151.101.65.195 |

5. **Save** 클릭

### 서브도메인 사용 시

`study.yourdomain.com` 형태로 사용하려면:

**Host/Name을 `study`로 설정:**
```
Type: A
Host: study
Value: (Firebase가 제공한 IP)
```

---

## 🔒 SSL 인증서

### 자동 발급 (무료!)

Firebase가 자동으로 처리합니다:
1. DNS 설정 후 5분-24시간 대기
2. Firebase가 자동으로 SSL 인증서 발급
3. `https://`로 자동 리다이렉트

### 확인 방법

Firebase Console → Hosting → 도메인 목록에서:
- ✅ **연결됨** - SSL 인증서 발급 완료
- 🔄 **보류 중** - SSL 인증서 발급 중 (최대 24시간)

---

## ⏱️ 적용 시간

| 단계 | 예상 시간 |
|------|-----------|
| DNS 전파 | 5분 - 48시간 (보통 30분) |
| SSL 인증서 발급 | 즉시 - 24시간 (보통 15분) |
| 완전한 적용 | 5분 - 48시간 |

**팁**: `dig yourdomain.com` 명령어로 DNS 전파 확인 가능

---

## 🔍 문제 해결

### 문제 1: "도메인을 확인할 수 없습니다"

**원인**: DNS 설정이 아직 전파되지 않음

**해결**:
1. DNS 설정 다시 확인
2. 24-48시간 대기
3. DNS 캐시 초기화:
   ```bash
   # Mac/Linux
   sudo dscacheutil -flushcache
   
   # Windows
   ipconfig /flushdns
   ```

### 문제 2: SSL 인증서가 발급되지 않음

**원인**: DNS가 올바르게 설정되지 않았거나 전파 중

**해결**:
1. Firebase Console에서 DNS 설정 정보 재확인
2. A 레코드가 정확한지 확인
3. 24시간 대기

### 문제 3: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**원인**: SSL 인증서 발급 진행 중

**해결**:
1. 1-2시간 대기
2. 시크릿 모드로 접속 시도

### 문제 4: 기존 사이트와 충돌

**원인**: 도메인이 다른 서비스에 연결되어 있음

**해결**:
1. 기존 DNS 레코드 모두 삭제
2. Firebase A 레코드만 추가
3. 1시간 대기

---

## ✅ 확인 방법

### 1. DNS가 올바르게 설정되었는지 확인

**Mac/Linux:**
```bash
dig yourdomain.com

# 결과에 Firebase IP가 보여야 함:
# 151.101.1.195
# 151.101.65.195
```

**Windows:**
```bash
nslookup yourdomain.com

# 결과에 Firebase IP가 보여야 함
```

### 2. 웹사이트 접속 확인

1. 브라우저에서 `https://yourdomain.com` 접속
2. 자물쇠 아이콘 확인 (SSL 정상)
3. 앱이 정상 작동하는지 확인

---

## 💡 추가 팁

### www 리다이렉트 설정

`www.yourdomain.com` → `yourdomain.com` 자동 리다이렉트:

Firebase에서 두 도메인 모두 추가:
1. `yourdomain.com` (주 도메인)
2. `www.yourdomain.com` (리다이렉트)

### 다중 도메인

여러 도메인을 같은 앱에 연결 가능:
- `study-helper.com`
- `studyhelper.io`
- `학습도우미.kr`

Firebase에서 각각 추가하면 됩니다!

---

## 📊 도메인 선택 가이드

### 좋은 도메인의 조건

1. ✅ 짧고 기억하기 쉬움
2. ✅ 서비스 내용과 연관됨
3. ✅ 입력하기 쉬움
4. ✅ `.com`, `.io`, `.app`, `.kr` 등 신뢰성 있는 TLD

### 추천 도메인 예시

**한글 도메인:**
- 학습도우미.com
- 퀴즈메이트.kr
- 스터디헬퍼.com

**영문 도메인:**
- studymate.io
- quizhelper.app
- learnbuddy.com

---

## 🎉 완료!

설정이 완료되면:
- ✅ `https://yourdomain.com`으로 접속 가능
- ✅ SSL 자동 적용 (보안 연결)
- ✅ 전 세계 어디서나 빠른 속도

**축하합니다!** 🎊
