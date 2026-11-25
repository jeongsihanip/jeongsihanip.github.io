# 한입 스탯 — 정시한입 · 수시한입 통합 통계 대시보드

정시한입(`jeongsihanip.github.io` · `@jeongsihanip`)과 수시한입(`susihanip.github.io` · `@susihanip`)의
**웹사이트 방문자·페이지뷰·유입 경로·인기 페이지(GA4)**와
**유튜브 구독자·조회수·영상별 좋아요**를 한 화면에서 나란히 보는 정적 대시보드입니다.

- 라이브: `https://jeongsihanip.github.io/stats/`
- 로컬: 이 폴더(`work/hanip-stats-web/`) → 배포본은 `work/jeongsihanip-repo/stats/`

## 파일 구조

```
hanip-stats-web/
├─ index.html        화면 뼈대 (헤더·히어로·KPI·섹션·푸터)
├─ style.css         다크 네이비 + 민트/블루(정시) · 골드/옐로우(수시) 테마, 반응형
├─ app.js            data/stats.json 을 읽어 카드·차트(SVG)·랭킹 렌더링
├─ data/stats.json   모든 수치의 단일 소스
└─ README.md
```

외부 라이브러리·CDN 의존은 폰트(Pretendard)뿐이며, 차트는 JS로 그리는 인라인 SVG입니다.
`data/stats.json`만 바꾸면 화면 전체가 갱신됩니다.

## 데이터 구분 원칙

| 구분 | 상태 | 화면 표기 |
|---|---|---|
| 유튜브 조회수·좋아요·구독자 | **실측** (공개 채널/영상 페이지 직접 확인) | 초록 `실측` 배지 |
| 웹사이트 방문자·페이지뷰·유입·인기 페이지 | **실측** (GA4 속성 직접 확인) | 초록 `GA4 실측` 배지 |
| 대학 카드 클릭(select_content) | **미수집** (사이트에 이벤트 미구현) | 회색 `집계 준비` + 안내문 |
| `sample` 블록 | 레이아웃 확인용 예시 | `site.daily`가 비어 있을 때만 사용, `샘플` 배지 |

- 실제 집계가 없을 때는 값을 `null`로 두고 숫자 대신 `집계 대기`를 표시합니다.
  **추정·가짜 숫자를 실제처럼 넣지 않습니다.**
- `site.daily`에 값이 있으면 화면은 자동으로 `sample` 대신 `site` 값을 쓰고 배지가 `GA4 실측`으로 바뀝니다.

## 현재 들어 있는 실측값 (2026-11-25 19:25 KST 갱신)

### 웹사이트 — GA4 (보고 시간대 GMT+9, 기간 2026-11-21 ~ 11-25)

| 사이트 | 속성 ID | 활성 사용자 | 조회수 | 일별(사용자/조회) | 주요 유입 |
|---|---|---|---|---|---|
| 정시한입 | `G-MZ5B4J0HXY` (속성 565275345) | 19 | 52 | 11-21 9/22 · 11-22 11/24 · 11-23 2/4 · 11-24 1/2 | Direct 17(90%) · Organic Video 1 · Organic Social 1 |
| 수시한입 | `G-S9MYLSQM1V` (속성 565301378) | 26 | 37 | 11-21 15/17 · 11-22 10/17 · 11-23 2/2 · 11-24 1/1 | Direct 24(92%) · Organic Social 1 · Organic Video 1 |

- 두 사이트 모두 방문 페이지는 `/` 한 곳뿐이고 `/stats/` 자체 방문은 기록되지 않았습니다.
- 11-25(당일)는 GA4 표준 보고서 집계 지연(24~48시간)으로 아직 0건 → `daily`에서 제외하고 `pendingNote`로 안내합니다. 11-24 값은 11-24 14:35 갱신 때는 미반영이었다가 이번에 반영됐습니다.
- 일별 사용자 합(정시 23·수시 28)은 기간 전체 활성 사용자(19·26)보다 큽니다. 여러 날 방문한 사용자는 기간 합계에서 한 번만 세기 때문입니다.
- KPI의 "총 웹사이트 방문자"는 **두 사이트 단순 합**(45)이라 같은 사람이 양쪽을 방문하면 두 번 집계됩니다.

### 유튜브 — 공개 페이지 실측 (2026-11-25 19:15~19:25 KST)

| 채널 | 구독자 | 영상 | 조회수 합 | 좋아요 합 |
|---|---|---|---|---|
| 정시한입 `UCUfpBD3chWMgcEVjq2rKpww` | 3명 | 11편 | 12,615 | 24 |
| 수시한입 `UCDD9Zzgw2vDG22iQMIWk3_w` | 4명 | 11편 | 9,601 | 10 |

- 영상별 값은 영상 페이지의 `조회수 N회`(정확값)·`좋아요 N개`를 그대로 옮겼습니다. 좋아요가 없으면 `0`.
  - 같은 영상의 Shorts 페이지 좋아요 버튼에는 `좋아요 N+1개`가 표시되는 경우가 있어, 기준을 영상 페이지의 좋아요 수치로 통일했습니다.
- 게시 시각은 채널 RSS(`/feeds/videos.xml?channel_id=...`)의 UTC 시각을 KST로 환산했습니다.
- 영상 길이는 Shorts 페이지의 `itemprop="duration"`(예: `PT0M47S`) 실측값입니다. 11-25 갱신 때 전 영상을 같은 기준으로 다시 재어 1초 차이가 있던 3편(서강대 정시 47초·연세대 정시 44초·건국대 정시 45초)을 바로잡았습니다.
- 구독자는 두 채널 모두 공개 표시됩니다(`subscribersStatus: "public"`).

## 갱신 방법 (매번 같은 절차)

1. **유튜브**: 공개 영상 페이지에서 조회수·좋아요, 채널 페이지에서 구독자 수를 확인합니다.
   채널 RSS로 게시 시각을 받고, 새 영상은 `youtube.videos[]` 맨 위에 추가한 뒤
   `totalViews`·`likes`·`videoCount`와 `summary` 합계를 다시 계산합니다.
2. **GA4**: `analytics.google.com` → 계정 `한입 시리즈`(417087473) → 속성 `정시한입`/`수시한입`.
   `탐색 → 자유 형식`에서 **행=날짜, 값=활성 사용자·조회수**로 일별 표를, **행=세션 기본 채널 그룹**으로 유입,
   **행=페이지 경로 및 화면 클래스**로 인기 페이지를 읽습니다. 기간은 사이트 오픈일(2026-11-21)부터 오늘까지.
3. `data/stats.json`의 `site.daily`·`site.trafficSources`·`site.topPages`·`site.visitors`·`site.pageviews`와
   `summary.websiteVisitors`·`pageviews`, `updatedAt`/`updatedAtLabel`·`checkedAt`을 갱신합니다.
4. `work/hanip-stats-web/`에서 로컬 확인 후 `work/jeongsihanip-repo/stats/`로 복사(README의 robots meta는 repo 쪽이 더 엄격함) → `stats/`만 커밋 → `git pull --rebase jeongsihanip main` → `git push jeongsihanip main`.

### 아직 안 된 것

- 대학 카드 클릭(GA4 `select_content`, `item_id=대학명`) 이벤트가 두 요강 사이트에 심어지지 않았습니다.
  심으면 `site.topUniversities`를 채우고 화면의 "인기 페이지" 패널을 "인기 대학 클릭 TOP 5"로 되돌립니다.
- GA4 Data API 자동 수집 스크립트는 없습니다(브라우저로 직접 확인). 자동화하려면 서비스 계정 + `analyticsdata` 호출이 필요합니다.

## 로컬에서 보기

```bash
cd hanip-stats-web
python3 -m http.server 8917
# 브라우저에서 http://127.0.0.1:8917/ 열기
```

`index.html`을 파일로 바로 열면 `fetch('data/stats.json')`이 막히므로 반드시 HTTP 서버로 열어야 합니다.

## 검증 기록

- 2026-11-25: 배포 후 라이브(`https://jeongsihanip.github.io/stats/`)에서 KPI 45 / 89 / 22,216회 / 7명, 두 사이트 카드의 `GA4 실측` 배지·일별 표(11-21~11-24)·유입 경로·인기 페이지, 유튜브 카드 각 11편 표시와 콘솔 오류 0건을 확인.
- 2026-11-24: Playwright(Chromium)로 로컬 렌더링 — 콘솔 오류 0건, 데스크톱 1280px·모바일 390px 모두 가로 스크롤 없음.
  KPI 43 / 86 / 18,662회 / 5명, 두 사이트 카드 모두 `GA4 실측` 배지와 실수치 표시 확인.
- 2026-11-21: 최초 렌더링 검증(샘플 데이터), 외부 링크 4개 HTTP 200 확인.

## 배포

`work/jeongsihanip-repo/stats/`가 그대로 GitHub Pages(`/stats/`)로 배포됩니다.
검색 노출 차단을 위해 `robots.txt`의 `Disallow: /stats/`와 `noindex, nofollow, noarchive` 메타를 유지합니다.
