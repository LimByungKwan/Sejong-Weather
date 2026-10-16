# T04 카드 3 검증

공개 시험 화면: https://sejong-weather-daily.quannie70.chatgpt.site/replay

Package ID: `aleph-t04-real-information-board-public-contract-v2`

첨부 ZIP SHA-256: `ca123fc72b1b15e83d4fe3c9aab5189496eda489c2a06efe55049c0aa57ac899`

매니페스트에 나열된 17개 파일의 SHA-256 및 bytes가 모두 일치한다. 별도 첨부된 README, public-contract, asset-manifest는 ZIP 내부와 바이트 단위로 일치한다. 매니페스트 자체와 ZIP은 순환 참조를 피하려고 목록에서 제외된다. 대조는 전달받은 자료의 내부 일치 검증이며 독립된 서명 검증이 아니다.

## 실행 및 결과

`node --test tests/replay.test.mjs`: 10개 테스트 통과, 실패 0.

| 시험 | 오류 코드 | 실패 후 정상값 | 행 수 | 복구 후 |
| --- | --- | --- | --- | --- |
| T04-TIMEOUT | timeout | 105 pt | 1 | fresh / none, 120 pt, 2행 |
| T04-AUTH-401 | auth | 105 pt | 1 | fresh / none, 120 pt, 2행 |
| T04-RATE-429 | rate_limit | 105 pt | 1 | fresh / none, 120 pt, 2행 |
| T04-OFFLINE | offline | 105 pt | 1 | fresh / none, 120 pt, 2행 |
| T04-SCHEMA-BREAK | schema_error | 105 pt | 1 | fresh / none, 120 pt, 2행 |

공개 adapter의 정규화 검증·일별 갱신·오류 보존 함수를 ESM으로 옮겨 사용한다. 실제 날씨 경로에서도 같은 applySuccessfulReading을 호출하여 정규화된 기록을 만들고 D1에 저장한다. 합성 경로는 브라우저 메모리에만 쓰며 실시간 API나 D1을 호출하지 않는다. 합성 초기화와 새로고침은 실제 기록에 영향을 주지 않는다.

다섯 실패마다 별도 설명과 다음 행동이 있고 stale/오래된 값 표시 및 복구 버튼을 제공한다. 전체 검증 버튼은 각 실패를 독립된 D1-A → D1-B 기준 상태에서 시작한다. 기준 상태 2개 + 실패 1개 + 복구 1개를 5번 검사해 20개 대조 행을 보여 준다. 실제 지연·오프라인·거절 요청은 만들지 않고 fixture.transport를 해석해 결정론적으로 재생한다.

기록 ID 유지, 같은 날 세 번 성공 시 1행 유지, 다음 날짜 1행 추가, 복구 재실행 시 중복 방지, KST 자정 경계를 검사했다. 이는 카드 4의 계산 보조 증거이며 실제 이틀 기록을 대체하지 않는다.

## 확인 방법

1. `/replay`에서 느린 응답을 선택한다(정상 100 → 105 준비는 자동).
2. 마지막 정상값 105 pt, 오래된 값, stale / timeout, 합성 기록 1건을 확인한다.
3. 다시 시도를 누르고 120 pt, fresh / none, 2026-08-25 신규 행 1건과 총 2건, 변화 +15 pt를 확인한다.

다른 네 실패도 같은 방식으로 반복한다. 브라우저의 실제 렌더링·클릭 검증은 사용자 캡처로 확인 예정이다. 자동 테스트 통과만으로 화면 확인까지 완료했다고 주장하지 않는다.
