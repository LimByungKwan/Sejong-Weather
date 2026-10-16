'use client';
import {useState} from 'react';
type Point={record_date:string;normalized_value:number;unit:string;source_observed_at:string;fetched_at:string};
export default function TemperatureChart({records}:{records:Point[]}){
 const rows=[...records].sort((a,b)=>a.record_date.localeCompare(b.record_date));
 const [selected,setSelected]=useState<string|null>(null);
 if(!rows.length)return <section className="evidence"><h2>날짜별 기온 그래프</h2><p className="muted">실제 기록을 저장하면 그래프가 표시됩니다.</p></section>;
 const active=rows.find(r=>r.record_date===selected)??rows.at(-1)!;
 const low=Math.floor(Math.min(0,...rows.map(r=>r.normalized_value))/5)*5;
 const high=Math.max(low+5,Math.ceil(Math.max(0,...rows.map(r=>r.normalized_value))/5)*5);
 const start=Date.parse(rows[0].record_date),end=Date.parse(rows.at(-1)!.record_date);
 const x=(r:Point)=>end===start?430:110+(Date.parse(r.record_date)-start)/(end-start)*640;
 const y=(r:Point)=>240-(r.normalized_value-low)/(high-low)*180;
 const ticks=Array.from({length:6},(_,i)=>low+(high-low)*i/5);
 const fmt=(s:string)=>new Date(s).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})+' KST';
 return <section className="evidence chartCard"><div className="sectionTitle"><h2>날짜별 기온 그래프</h2><span className="status">실제 기록 {rows.length}건</span></div><p className="muted">날짜별 마지막 저장 기온 · °C · Asia/Seoul · 일평균 기온이 아닙니다.</p>
 <div className="chartScroll"><svg className="temperatureChart" viewBox="0 0 860 310" role="img" aria-labelledby="temp-chart-title temp-chart-desc"><title id="temp-chart-title">세종 날짜별 저장 기온</title><desc id="temp-chart-desc">{rows.map(r=>r.record_date+' '+r.normalized_value+'도').join(', ')}. 날짜 간격에 맞춰 표시하며 점선은 기록이 없는 날짜 사이를 연결합니다. 아래 날짜 버튼으로 상세 기록을 확인할 수 있습니다.</desc>
 <text x="18" y="28" className="axisLabel">기온 (°C)</text>
 {ticks.map(t=>{const py=240-(t-low)/(high-low)*180;return <g key={t}><line x1="80" x2="790" y1={py} y2={py} stroke={t===0?'#93b6d4':'#deebf6'}/><text x="62" y={py+5} textAnchor="end" className="axisLabel">{Number(t.toFixed(1))}</text></g>})}
 {rows.slice(1).map((r,i)=>{const prev=rows[i];return <line key={r.record_date} x1={x(prev)} y1={y(prev)} x2={x(r)} y2={y(r)} stroke="#1c7cc0" strokeWidth="4" strokeLinecap="round" strokeDasharray={Date.parse(r.record_date)-Date.parse(prev.record_date)>86400000?'8 7':undefined}/>})}
 {rows.map((r,i)=><g key={r.record_date}><circle cx={x(r)} cy={y(r)} r={active.record_date===r.record_date?9:6} fill={active.record_date===r.record_date?'#1768ad':'white'} stroke="#1768ad" strokeWidth="3" onClick={()=>setSelected(r.record_date)} style={{cursor:'pointer'}}><title>{r.record_date} · {r.normalized_value} °C</title></circle>{(rows.length<=7||active.record_date===r.record_date)&&<text x={x(r)} y={y(r)-19} textAnchor="middle" className="pointLabel">{r.normalized_value}°C</text>}{(rows.length<=7||i===0||i===rows.length-1)&&<text x={x(r)} y="278" textAnchor="middle" className="axisLabel">{r.record_date.slice(5).replace('-','/')}</text>}</g>)}
 <text x="790" y="303" textAnchor="end" className="axisLabel">조회 날짜 (KST)</text></svg></div>
 <div className="chartDates" aria-label="상세 기온 기록 선택">{rows.map(r=><button key={r.record_date} aria-pressed={active.record_date===r.record_date} onClick={()=>setSelected(r.record_date)}>{r.record_date} · {r.normalized_value}°C</button>)}</div>
 <div className="chartDetail" aria-live="polite"><strong>{active.record_date} · {active.normalized_value} °C</strong><span>출처 기준 시각: {fmt(active.source_observed_at)}</span><span>조회 시각: {fmt(active.fetched_at)}</span></div>
 <p className="muted chartNote">점은 실제 저장값입니다. 기록이 없는 날짜는 점선으로 연결하며 값을 채우지 않습니다.{rows.length===1?' 현재는 기록이 한 건이라 점 하나만 표시합니다.':''}</p></section>;
}
