# Google 검색에 사이트 노출하기

코드에 추가한 SEO 설정만으로는 검색 결과에 바로 안 나올 수 있습니다.  
**Google에 사이트를 등록**하고, 인덱싱을 요청해야 합니다.

---

## 1. 이미 적용된 것 (코드)

- **index.html**: 검색 결과에 보일 제목·설명·키워드, 링크 공유 시 미리보기(OG) 메타 태그
- **public/robots.txt**: 검색 봇이 전체 사이트 수집 허용 + sitemap 위치 안내
- **public/sitemap.xml**: 메인 URL 등록 (primer-e7f2b.web.app 기준)

---

## 2. Google에 등록하기 (필수)

### Google Search Console 사용

1. **접속**: https://search.google.com/search-console
2. **속성 추가**:
   - "URL 접두어" 선택
   - 사이트 주소 입력: `https://primer-e7f2b.web.app`
3. **소유권 확인**:
   - HTML 태그 방식: Search Console이 주는 `<meta name="google-site-verification" ...>` 를 `index.html`의 `<head>` 안에 넣고 저장 후 배포
   - 또는 "DNS 레코드" 등 다른 방식 선택 후 안내대로 진행
4. 확인이 끝나면 **왼쪽 메뉴 → Sitemaps** 에서:
   - `https://primer-e7f2b.web.app/sitemap.xml` 제출
5. **URL 검사** (왼쪽 메뉴):
   - `https://primer-e7f2b.web.app` 입력 후 "색인 생성 요청" 클릭 (선택)

이렇게 하면 Google이 사이트를 수집·색인하고, 며칠~몇 주 안에 검색 결과에 나타날 수 있습니다.

---

## 3. 나중에 getaplus.cloud 를 쓰는 경우

- **sitemap.xml** 의 `<loc>` 값을 `https://getaplus.cloud/` 로 바꾸고 다시 배포
- Search Console에 **새 속성**으로 `https://getaplus.cloud` 추가 후 소유권 확인·sitemap 제출

---

## 4. 참고

- 검색에 나오기까지 **몇 일~몇 주** 걸릴 수 있음
- "BPLUS"처럼 짧은 키워드는 경쟁이 많으면 순위가 낮을 수 있음
- 제목·설명은 **검색 결과에 그대로 보이는 문구**이므로, 필요하면 index.html의 `title`, `meta name="description"` 을 수정해서 다시 배포하면 됨
