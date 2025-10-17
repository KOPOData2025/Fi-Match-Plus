# Fi-Match⁺ FE - 프로젝트 구조

```
stockone19-fe/
├─ app/                      # Next.js App Router 페이지들
│  ├─ login/                 # 로그인 페이지
│  ├─ products/              # 모델 포트폴리오 목록/상세
│  ├─ portfolios/            # 포트폴리오 관련 페이지들
│  │  ├─ analysis/           # 포트폴리오 분석 상세
│  │  ├─ [portfolioId]/      # 포트폴리오 개별 편집/백테스트 등
│  │  └─ create/             # 포트폴리오 생성
│  ├─ stocks/                # 종목 차트 페이지
│  ├─ layout.tsx             # 전역 레이아웃 (Providers 포함)
│  └─ page.tsx               # 랜딩 페이지
│
├─ components/               # 재사용 UI/도메인 컴포넌트
│  ├─ ui/                    # 버튼/인풋/카드 등 공통 UI
│  ├─ stocks/                # 차트/종목 정보 등 주식 관련 컴포넌트
│  └─ portfolios/            # 포트폴리오 탭/차트/분석 등
│
├─ contexts/                 # React Context Providers/Hooks
│  ├─ AuthContext.tsx        # 인증 상태/로그인/로그아웃 관리
│  ├─ StockContext.tsx       # 종목 선택/차트 상태 관리
│  ├─ StockCacheContext.tsx  # 가격 캐시
│  ├─ BacktestContext.tsx    # 백테스트 상태
│  ├─ TickerMappingContext.tsx
│  └─ AnalysisCacheContext.tsx
│
├─ hooks/                    # 커스텀 훅
│  ├─ use-toast.ts           # 토스트 유틸
│  ├─ useLocalStorage.ts     # 로컬 스토리지 상태 동기화
│  ├─ useStockCache.ts       # 시세 캐시 접근 훅
│  ├─ useStockData.ts        # 차트 데이터 로딩/스케일링
│  └─ useStockSearch.ts      # 종목 검색
│
├─ lib/                      # API 클라이언트/유틸
│  ├─ api.ts                 # 공통 API 설정 및 일부 API
│  ├─ api/                   # 모듈별 API
│  │  ├─ auth.ts             # 로그인/로그아웃
│  │  ├─ interceptor.ts      # Authorization/401 처리
│  │  ├─ portfolios.ts       # 포트폴리오 API
│  │  ├─ products.ts         # 제품(모델 포트폴리오) API
│  │  ├─ stockNow.ts         # 현재가/시장상태 API
│  │  ├─ stockBatch.ts       # 멀티 시세 조회 API
│  │  └─ stockSearch.ts      # 종목 검색 API
│
├─ types/                    # 타입 정의
│  ├─ auth.ts                # 인증 관련 타입
│  ├─ portfolio.ts           # 포트폴리오/백테스트 타입
│  ├─ product.ts             # 제품(모델 포트폴리오) 타입
│  └─ stock.ts               # 종목/차트 타입
│
├─ utils/                    # 유틸리티 함수
│  └─ formatters.ts          # 숫자/통화/퍼센트/색상 포맷터
│
├─ public/                   # 폰트/이미지 등 정적 리소스
│  └─ fonts/                 # 한글 폰트 파일들
│
├─ components.json / tsconfig.json / package.json 등
└─ README.md
```
