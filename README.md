# 학습 도우미 (Study Helper)

대학교 수업 자료(PDF, PPT, Word)를 기반으로 자동으로 문제와 단어 사전을 생성하는 학습 플랫폼입니다.

## 주요 기능

### 📚 파일 업로드 및 처리
- PDF, PowerPoint, Word 파일 지원
- 자동 텍스트 추출 및 언어 감지
- Firebase Storage를 통한 안전한 파일 저장

### 📝 AI 기반 문제 생성
- **객관식**: 4개의 선택지 중 정답 선택
- **단답식**: 짧은 답변 직접 작성
- **서술형**: 깊이 있는 답변 작성 + AI 자동 채점
- 각 문제마다 출처 페이지 정보 표시

### ✅ 인터랙티브 문제 풀이
- 사이드바에서 문제 번호로 바로 이동
- 답변 여부 실시간 표시
- 진행률 바로 학습 진도 확인

### 🎯 상세한 결과 분석
- 문제별 정답/오답 표시
- 해설 및 모범 답안 제공
- 서술형 문제는 AI 피드백 제공

### 📖 영어 단어 사전
- 영어 문서에서 중요 단어 자동 추출
- 한국어 뜻과 문맥 함께 제공
- 검색 기능으로 빠른 단어 찾기

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빠른 개발 환경
- **TailwindCSS** - 모던한 UI 디자인
- **React Router** - 페이지 라우팅
- **Lucide React** - 아이콘

### Backend & Database
- **Firebase Authentication** - 이메일/비밀번호 및 Google 로그인
- **Firestore** - NoSQL 데이터베이스
- **Firebase Storage** - 파일 저장소

### AI & 파일 처리
- **OpenAI GPT-4o-mini** - 문제 생성 및 채점
- **PDF.js** - PDF 텍스트 추출
- **Mammoth.js** - Word 파일 처리

## 설치 및 실행

### 1. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# OpenAI API
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호, Google)
3. Firestore Database 생성
4. Storage 활성화
5. 프로젝트 설정에서 앱 추가 후 구성 정보를 `.env`에 입력

### 4. OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/)에서 API 키 발급
2. `.env` 파일에 API 키 입력

### 5. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 `http://localhost:5173` 접속

### 6. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Layout.tsx      # 메인 레이아웃
│   └── ProtectedRoute.tsx  # 인증 보호 라우트
├── contexts/           # React Context
│   └── AuthContext.tsx # 인증 상태 관리
├── lib/               # 외부 라이브러리 설정
│   ├── firebase.ts    # Firebase 초기화
│   └── openai.ts      # OpenAI 클라이언트
├── services/          # Firestore 조회/쓰기 공통 로직
│   └── firestore.ts   # 문서/폴더/퀴즈/단어장 핸들러
├── pages/             # 페이지 컴포넌트
│   ├── Login.tsx      # 로그인 페이지
│   ├── SignUp.tsx     # 회원가입 페이지
│   ├── Dashboard.tsx  # 대시보드
│   ├── UploadDocument.tsx  # 파일 업로드
│   ├── QuizSettings.tsx    # 퀴즈 설정
│   ├── QuizTaking.tsx      # 퀴즈 풀이
│   ├── QuizResult.tsx      # 결과 확인
│   └── Vocabulary.tsx      # 단어 사전
├── types/             # TypeScript 타입 정의
│   └── index.ts
├── utils/             # 유틸리티 함수
│   ├── fileProcessor.ts        # 파일 처리
│   ├── questionGenerator.ts    # 문제 생성
│   └── vocabularyGenerator.ts  # 단어 사전 생성
├── App.tsx            # 앱 라우팅
└── main.tsx          # 앱 진입점
```

## 앱 워크플로우

1. 인증
   - `AuthContext`에서 Firebase Auth 세션을 구독해 로그인/로그아웃 상태를 관리합니다.
2. 파일 업로드
   - `UploadDocument`에서 파일을 업로드하면 Firebase Storage에 저장하고, 메타데이터를 Firestore `documents` 컬렉션에 기록합니다.
3. 텍스트 추출
   - 업로드된 파일은 `utils/fileProcessor.ts`에서 PDF.js와 Mammoth로 텍스트를 추출하고 언어를 간단히 감지합니다.
4. 문제/단어장 생성
   - `utils/questionGenerator.ts`, `utils/vocabularyGenerator.ts`가 OpenAI API로 문제와 단어장을 생성합니다(키가 없거나 쿼터 초과 시 샘플 데이터로 대체).
5. 데이터 조회 및 캐싱
   - `services/firestore.ts`에서 문서, 폴더, 퀴즈 세트, 단어장 세트를 공통 형태로 가져오고 날짜를 Date로 정규화합니다.
6. 대시보드/학습
   - `Dashboard`와 각 페이지에서 공통 서비스로 데이터를 불러와 목록/뷰어/퀴즈 풀기 UI를 렌더링합니다.
7. 결과/휴지통
   - 퀴즈 결과는 `quizzes`, 삭제 문서는 `documents`의 `isDeleted` 플래그로 관리하며, `Trash` 페이지에서 복원/완전 삭제합니다.

## 사용 방법

### 1. 회원가입/로그인
- 이메일 및 비밀번호로 가입하거나 Google 계정으로 로그인

### 2. 파일 업로드
- 대시보드에서 "파일 업로드" 클릭
- PDF, PPT, Word 파일 선택 또는 드래그 앤 드롭
- 자동으로 파일 분석 및 처리

### 3. 문제 생성
- 대시보드에서 업로드한 문서의 "문제 만들기" 클릭
- 원하는 문제 유형과 개수 설정
- "퀴즈 생성 및 시작" 클릭

### 4. 문제 풀이
- 사이드바에서 문제 번호로 이동 가능
- 답변 작성 후 다음 문제로 이동
- 모든 문제 완료 후 "제출하기"

### 5. 결과 확인
- 총점 및 문제별 정답/오답 확인
- 해설 및 AI 피드백 읽기
- 다시 풀기 또는 홈으로 이동

### 6. 단어 사전 (영어 문서만)
- 대시보드에서 영어 문서의 "단어 학습" 클릭
- "단어 사전 생성" 클릭
- 검색으로 원하는 단어 찾기

## 주의 사항

### OpenAI API 사용
현재 구현은 브라우저에서 직접 OpenAI API를 호출합니다 (`dangerouslyAllowBrowser: true`).
**프로덕션 환경에서는 보안을 위해 백엔드 서버를 통해 API를 호출하는 것을 강력히 권장합니다.**

### API 비용
OpenAI API는 사용량에 따라 과금됩니다. 많은 문제를 생성하거나 서술형 채점을 자주 사용하면 비용이 발생할 수 있습니다.

### 파일 크기
대용량 파일(50MB 이상)은 처리 시간이 오래 걸리거나 실패할 수 있습니다.

## 📚 추가 문서

자세한 문서는 `docs/` 폴더를 참고하세요:

- **[배포 가이드](docs/README_DEPLOY.md)** - Firebase Hosting 배포 방법
- **[커스텀 도메인](docs/CUSTOM_DOMAIN.md)** - 자신만의 도메인 연결 방법
- **[보안 가이드](docs/SECURITY_URGENT.md)** - OpenAI API 키 보안 이슈 및 해결 방법

## 라이센스

MIT License

## 기여

기여는 언제나 환영합니다! Issue나 Pull Request를 자유롭게 등록해주세요.
