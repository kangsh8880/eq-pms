// Google Apps Script - 5개국어 자동학습 메일 발송 스크립트
// GAS 프로젝트 ID: 1wMWWz20BAK0GsZmhytD-kA9KpWPQyPJiwZ6AEKGBsWMHwPl03HjhZcxO
// 직접 접속: https://script.google.com/home/projects/1wMWWz20BAK0GsZmhytD-kA9KpWPQyPJiwZ6AEKGBsWMHwPl03HjhZcxO/edit
//
// [기능]
// - Gmail 하루 4회 자동 발송: 08:00 / 11:00 / 14:00 / 16:00 (베트남 시간 UTC+7)
// - Google Calendar 하루 3회 자동 등록: 09:00 / 13:00 / 18:00
// - 5개국어: 한국어, 베트남어(성조), 영어, 중국어(한자), 일본어(원문자)
// - 수신자: kangsh8880@gmail.com, hjkang@lanthax.com, kangsh883@naver.com
// - 베트남 관광지 10곳 + 상세 역사 내용 (랜덤 1곳/일)
//
// [설치 방법]
// 1. script.google.com 에서 새 프로젝트 생성
// 2. 전체 코드 붙여넣기 후 저장
// 3. setupTriggers() 실행 (최초 1회, 권한 승인 필요)
// 4. testNow() 실행으로 즉시 테스트
//
// [수정 이력]
// 2026-04-08: 베트남어 성조 복원, 중국어/일본어 원문자 복원
// 2026-04-08: 베트남 관광지 상세 역사 내용 추가 (한 페이지 분량)
// 2026-04-08: 수신자 3명 추가 (kangsh8880, hjkang, kangsh883)
// 2026-04-06: 이모지 제거 (메일 헤더 깨짐 방지)
// 2026-04-06: 최초 구축
