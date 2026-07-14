# tools

개발용 검증 페이지 모음. React 앱과 무관하게 단독으로 열리는 정적 HTML 페이지를
둔다 (예: BLE 연결/수신 값을 눈으로 확인하는 테스트 페이지).

Vite dev 서버에서 `http://localhost:5173/tools/파일명.html` 형태로 바로 접속 가능하다.
React 라우팅을 거치지 않고 순수 HTML+script로 동작하므로, core/ble·core/audio 모듈을
UI 없이 빠르게 검증할 때 사용한다.

다음 작업에서 BLE 테스트 페이지가 이 폴더에 추가될 예정.
