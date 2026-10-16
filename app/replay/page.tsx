'use client';
import {useState} from 'react';
import {resetEvaluationState,runFixture} from '../../lib/weather-core.mjs';
import fixtureData from '../../lib/fixtures.json';
import hashReport from '../../public/assets/studio-task-assets/t04-real-information-board/hash-verification.json';
const fixtures=fixtureData as Record<string,any>;
const failureOptions=[['T04-TIMEOUT','느린 응답','timeout'],['T04-AUTH-401','외부 원천 401 거절','auth'],['T04-RATE-429','호출 제한 429','rate_limit'],['T04-OFFLINE','오프라인','offline'],['T04-SCHEMA-BREAK','응답 형식 변경','schema_error']];
const explanations:Record<string,{title:string;description:string;next:string}>={
 timeout:{title:'외부 응답 시간초과',description:'합성 응답 지연 5,000ms가 제한시간 1,500ms를 넘었습니다. 마지막 정상값을 유지합니다.',next:'잠시 기다린 뒤 다시 시도하세요.'},
 auth:{title:'외부 원천의 접근 거절 (401)',description:'외부 데이터 원천이 요청을 거절했습니다. 이 앱에 로그인하라는 뜻이 아닙니다.',next:'원천의 공개 접근 정책과 호출 경로를 확인한 뒤 다시 시도하세요.'},
 rate_limit:{title:'외부 원천 호출 제한 (429)',description:'호출 한도에 도달했습니다. 마지막 정상값을 유지합니다.',next:'아래 Retry-After 대기시간 후 다시 시도하세요.'},
 offline:{title:'네트워크 연결 없음',description:'합성 오프라인 상태입니다. 마지막 정상값을 유지합니다.',next:'네트워크 연결을 확인한 뒤 다시 시도하세요.'},
 schema_error:{title:'원천 응답 형식 변경',description:'정규화 검증을 통과하지 못한 응답은 저장하지 않았습니다.',next:'필드·단위·형식을 확인하고 처리 코드를 수정한 뒤 다시 시도하세요.'},
};
type Log={id:string;status:string;value:number|null;rows:number;ok:boolean};
function snapshot(s:any,f:any):Log {
 const e=f.expected;return {id:f.fixture_id,status:s.status.freshness+' / '+s.status.error_code,value:s.current_reading?.normalized_value??null,rows:s.daily_readings.length,ok:s.status.freshness===e.freshness&&s.status.error_code===e.error_code&&s.daily_readings.length===e.row_count&&s.current_reading?.normalized_value===e.stored_value&&s.last_delta===e.delta};
}
function baseline(){let s:any=resetEvaluationState();const logs:Log[]=[];for(const id of ['T04-NORMAL-D1-A','T04-NORMAL-D1-B']){s=runFixture(s,fixtures[id]);logs.push(snapshot(s,fixtures[id]));}return {s,logs};}
export default function Replay(){
 const [state,setState]=useState<any>(()=>resetEvaluationState());const [logs,setLogs]=useState<Log[]>([]);
 const [testSummary,setTestSummary]=useState('');
 const [dayStep,setDayStep]=useState(0);
 function init(){setDayStep(0);const b=baseline();setState(b.s);setLogs(b.logs);setTestSummary('정상 D1-A(100) → D1-B(105): 같은 날짜 기록 1건을 준비했습니다.');}
 function fail(id:string){setDayStep(0);const b=baseline();const s=runFixture(b.s,fixtures[id]);setState(s);setLogs([...b.logs,snapshot(s,fixtures[id])]);setTestSummary('합성 상태 초기화 → D1-A → D1-B → 선택한 실패를 재생했습니다.');}
 function recover(){setDayStep(0);const f=fixtures['T04-RECOVER-D2'];const s=runFixture(state,f);setState(s);setLogs([...logs,snapshot(s,f)]);setTestSummary('T04-RECOVER-D2: 합성 다음 날짜 기록 1건 추가 · fresh / none 복구');}
 function reset(){setDayStep(0);setState(resetEvaluationState());setLogs([]);setTestSummary('합성 상태만 초기화했습니다. 실제 날씨 기록은 유지됩니다.');}
 function all(){setDayStep(0);const out:Log[]=[];for(const [id] of failureOptions){const b=baseline();out.push(...b.logs);const failed=runFixture(b.s,fixtures[id]);out.push(snapshot(failed,fixtures[id]));const recovered=runFixture(failed,fixtures['T04-RECOVER-D2']);out.push(snapshot(recovered,fixtures['T04-RECOVER-D2']));}const b=baseline();let s=runFixture(b.s,fixtures['T04-TIMEOUT']);s=runFixture(s,fixtures['T04-RECOVER-D2']);setState(s);setLogs(out);setTestSummary('5종 실패 → 각각 복구, 총 '+out.length+'개 상태 검증: '+out.filter(x=>x.ok).length+'개 일치');}
 function daily(step:number){
  const id=step===1?'T04-NORMAL-D1-A':step===4?'T04-NORMAL-D2':'T04-NORMAL-D1-B';
  const before=step===1?resetEvaluationState():state;
  const s=runFixture(before,fixtures[id]);
  setState(s);setLogs([...(step===1?[]:logs),snapshot(s,fixtures[id])]);setDayStep(step);
  setTestSummary(step<4?`카드 4: 같은 합성 날짜 ${step}회 성공 · 기록 ${s.daily_readings.length}건 · 같은 고유 기록 ID 유지`:'카드 4: 다음 합성 날짜 1회 성공 · 기록 1 → 2건 · 신규 날짜 행 정확히 1건');
 }
 const status=state.status;const err=status?.error_code;const info=explanations[err];const reading=state.current_reading;
 return <main><header><a className="brand" href="/">S / WEATHER JOURNAL</a><nav><a href="/">실제 세종 날씨로 돌아가기 ↗</a></nav></header>
 <section className="intro"><div><p className="eyebrow">T04 / CARD 03 · SYNTHETIC REPLAY</p><h1>데이터가 오지 않을 때.</h1><p>마지막 정상값을 남기고, 실패 이유를 구분합니다.</p></div></section>
 <div className="public"><strong>합성 시험 전용</strong> · 값 100 / 105 / 120 pt와 2026-08-24~25는 제공된 fixture의 가상 값·날짜입니다. 실제 세종 기온이나 실제 이틀 증거가 아닙니다. 실제 저장소에는 쓰지 않으며, 새로고침하면 합성 상태만 초기화됩니다.</div>
 <section className="replayControls"><div className="sectionTitle"><h2>1. 정상값 준비 · 2. 실패 선택 · 3. 다시 시도</h2><button className="textButton" onClick={reset}>합성 초기화</button></div>
 <div className="replayActions"><button onClick={init}>정상 D1-A → D1-B 준비</button><button className="secondary" onClick={all}>다섯 실패·복구 전체 검증</button></div>
 <p className="muted">각 실패 버튼은 합성 상태를 초기화하고 정상 100 → 105를 준비한 다음 해당 실패를 재생합니다. 실제 네트워크를 끊거나 원천에 오류 요청을 보내지 않습니다.</p>
 <div className="failureGrid">{failureOptions.map(([id,label,code])=><button className="failureButton" key={id} onClick={()=>fail(id)}><span>{label}</span><code>{code}</code></button>)}</div></section>
 <section className="dayCheck"><p className="eyebrow">T04 / CARD 04 · 하루 한 줄</p><h2>같은 날 세 번, 다음 날 한 번</h2><p className="muted">일별 고유키: signal_id + KST 조회 날짜. 같은 키는 값·마지막 조회 시각을 갱신하고 기록 ID는 유지합니다. 다음 날짜는 새 행을 추가합니다. 실제 세종 날씨 DB는 한 종류의 값만 저장하므로 KST 날짜를 기본키로 사용합니다.</p><div className="dayButtons"><button onClick={()=>daily(1)}>① 첫 조회 · D1-A</button><button disabled={dayStep!==1} onClick={()=>daily(2)}>② 같은 날 · D1-B</button><button disabled={dayStep!==2} onClick={()=>daily(3)}>③ 같은 날 재실행 · D1-B</button><button disabled={dayStep!==3} onClick={()=>daily(4)}>④ 다음 날 · D2</button></div><p className="muted">①은 합성 상태를 비우고 시작합니다. ③은 공개 D1-B fixture를 한 번 더 재생합니다. 예상 행 수: 1 → 1 → 1 → 2. 아래 상태·일별 기록·재생 대조 표에서 확인하세요.</p></section>
 <section className="weather replayState" aria-live="polite"><div><p className="eyebrow">합성 마지막 정상값 · 실제 기온 아님</p><div className="temperature">{reading?.normalized_value??'—'}<span>pt</span></div><span className={'status '+(info?'warn':'')}>{!status?'데이터 없음':info?'오래된 값 · stale':'정상값 · fresh'}</span><p className="muted">출처 시각: {reading?(reading.source_time??'원천 시각 미제공'):'—'}</p><p className="muted">합성 조회 시각: {reading?.fetched_at??'—'}</p></div>
 <div className="meta"><h2>{info?.title??(status?'정상 상태입니다':'시험을 시작해 주세요')}</h2><p>{info?.description??'정상값을 준비하거나 실패 버튼을 선택해 주세요.'}</p><dl><dt>freshness</dt><dd>{status?.freshness??'—'}</dd><dt>error_code</dt><dd>{err??'—'}</dd><dt>일별 기록</dt><dd>{state.daily_readings.length}건</dd><dt>합성 변화값</dt><dd>{state.last_delta==null?'비교할 이전 날짜 없음':`+${state.last_delta} pt`}</dd></dl>
 {info&&<><p className="nextAction">다음 행동: {info.next}</p>{state.last_run?.retry_after_seconds!=null&&<p>Retry-After: {state.last_run.retry_after_seconds}초 (합성 메타데이터, 실제 대기 없음)</p>}<button onClick={recover}>다시 시도 · T04-RECOVER-D2 재생 ↗</button></>}
 {!info&&status&&<p className="muted">복구 후 error_code는 none이며, 합성 다음 날짜의 값은 120 pt입니다.</p>}</div></section>
 <p className="message" role="status">{testSummary}</p>
 <section className="history"><div className="sectionTitle"><h2>합성 일별 기록</h2><span>{state.daily_readings.length}건 · Asia/Seoul</span></div><div className="tableWrap"><table><thead><tr><th>합성 날짜</th><th>값</th><th>고유 기록 ID</th></tr></thead><tbody>{state.daily_readings.map((r:any)=><tr key={r.record_id}><td>{r.record_date}</td><td>{r.normalized_value} {r.unit}</td><td>{r.record_id}</td></tr>)}</tbody></table></div></section>
 <section className="history"><div className="sectionTitle"><h2>재생 순서와 예상값 대조</h2><span>{logs.filter(x=>x.ok).length} / {logs.length} 일치</span></div><div className="tableWrap"><table><thead><tr><th>fixture ID</th><th>상태 / 오류</th><th>정상값</th><th>행 수</th><th>예상 대조</th></tr></thead><tbody>{logs.map((r,i)=><tr key={i}><td>{r.id}</td><td>{r.status}</td><td>{r.value} pt</td><td>{r.rows}</td><td>{r.ok?'일치':'불일치'}</td></tr>)}</tbody></table></div><details><summary>현재 합성 상태 JSON 펼치기</summary><pre>{JSON.stringify(state,null,2)}</pre></details></section>
 <section className="history"><h2>공개 시험 자료 · SHA-256 대조</h2><p className="muted">Package ID: {hashReport.package_id}</p><p>명세에 나열된 {hashReport.checked_files}개 파일: SHA-256·크기 모두 일치</p><p className="muted">매니페스트는 자기 자신을 해시 목록에서 제외합니다. 이 대조는 받은 꾸러미 내부 일치 확인이며 별도의 원본 서명 검증은 아닙니다.</p><details><summary>파일별 예상·계산 해시 보기</summary><div className="hashList">{hashReport.files.map(f=><article key={f.path}><strong>{f.path} · {f.pass?'일치':'불일치'}</strong><div>예상 <code>{f.sha256}</code></div><div>계산 <code>{f.actual_sha256}</code></div></article>)}</div></details><p className="assetLinks"><a href="/assets/studio-task-assets/t04-real-information-board/README.md">README</a><a href="/assets/studio-task-assets/t04-real-information-board/public-contract.json">공개 계약</a><a href="/assets/studio-task-assets/t04-real-information-board/asset-manifest.json">매니페스트</a><a href="/assets/studio-task-assets/t04-real-information-board/hash-verification.json">해시 대조 JSON</a></p></section>
 <footer><span>합성 초기화·시험은 실제 날씨 DB와 분리됩니다.</span><a href="/">실제 기록 확인 ↗</a></footer></main>
}
