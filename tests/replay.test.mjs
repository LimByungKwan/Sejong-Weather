import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {runFixture,resetEvaluationState,applySuccessfulReading,kstDate} from '../lib/weather-core.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../lib/fixtures.json',import.meta.url)));
const root=new URL('../public/assets/studio-task-assets/t04-real-information-board/',import.meta.url);
// Original CommonJS reference is loaded without modifying the distributed artifact.
const Module=createRequire(import.meta.url)('node:module');
const reference=new Module('fixture-reference');
reference._compile(fs.readFileSync(new URL('adapter-reset.example.js',root),'utf8'),'fixture-reference.cjs');
const original=reference.exports;
function apply(state,id){return runFixture(state,data[id]);}
function baseline(){return apply(apply(resetEvaluationState(),'T04-NORMAL-D1-A'),'T04-NORMAL-D1-B');}
const failures=['T04-TIMEOUT','T04-AUTH-401','T04-RATE-429','T04-OFFLINE','T04-SCHEMA-BREAK'];
for(const id of failures){
 test(id+': expected failure, last-good preservation and recovery',()=>{
  const b=baseline();const before=JSON.stringify(b);const s=apply(b,id);const e=data[id].expected;
  assert.equal(s.status.freshness,e.freshness);assert.equal(s.status.error_code,e.error_code);
  assert.equal(s.current_reading.normalized_value,105);assert.deepEqual(s.current_reading,b.current_reading);
  assert.deepEqual(s.daily_readings,b.daily_readings);assert.equal(s.daily_readings.length,1);
  assert.equal(JSON.stringify(b),before,'input is immutable');
  const r=apply(s,'T04-RECOVER-D2');assert.deepEqual(r.status,{freshness:'fresh',error_code:'none'});
  assert.equal(r.daily_readings.length,2);assert.equal(r.daily_readings.filter(x=>x.record_date==='2026-08-25').length,1);
  assert.equal(r.current_reading.normalized_value,120);assert.equal(r.last_delta,15);
  assert.equal(apply(r,'T04-RECOVER-D2').daily_readings.length,2,'retry does not duplicate next-day row');
  assert.deepEqual(r,original.runFixture(original.runFixture(b,data[id]),data['T04-RECOVER-D2']));
 });
}
test('same day upserts keep record ID across three successes; next day adds one',()=>{
 const a=apply(resetEvaluationState(),'T04-NORMAL-D1-A');const b=apply(a,'T04-NORMAL-D1-B');
 const c=apply(b,'T04-NORMAL-D1-B');assert.equal(c.daily_readings.length,1);assert.equal(c.daily_readings[0].record_id,a.daily_readings[0].record_id);
 const d=apply(c,'T04-NORMAL-D2');assert.equal(d.daily_readings.length,2);assert.equal(d.last_delta,15);
});
test('all fixture inputs match the reference transition',()=>{
 for(const f of Object.values(data)){const b=baseline();assert.deepEqual(runFixture(b,f),original.runFixture(b,f));}
});
test('all 17 asset hashes and bundled fixture copies match verified bytes',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('asset-manifest.json',root)));
 for(const f of manifest.files){const bytes=fs.readFileSync(new URL(f.path,root));assert.equal(bytes.length,f.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);}
 for(const f of Object.values(data)){const entry=manifest.files.find(x=>x.path.startsWith('fixtures/')&&JSON.parse(fs.readFileSync(new URL(x.path,root))).fixture_id===f.fixture_id);assert.ok(entry);assert.deepEqual(f,JSON.parse(fs.readFileSync(new URL(entry.path,root))));}
});
test('KST date switches at UTC 15:00 and rejects a wrong record_date',()=>{
 assert.equal(kstDate('2026-10-15T14:59:59Z'),'2026-10-15');assert.equal(kstDate('2026-10-15T15:00:00Z'),'2026-10-16');
 assert.throws(()=>applySuccessfulReading(resetEvaluationState(),{...data['T04-NORMAL-D1-A'].payload,record_date:'2026-08-25'}));
});
test('synthetic reset/replay has no real API or D1 write path',()=>{
 const page=fs.readFileSync(new URL('../app/replay/page.tsx',import.meta.url),'utf8');assert.ok(!page.includes('fetch('));assert.ok(!page.includes('/api/weather'));assert.ok(!page.includes('getDb'));
 const a=baseline();const reset=resetEvaluationState();assert.equal(reset.daily_readings.length,0);assert.equal(a.daily_readings.length,1);
});
