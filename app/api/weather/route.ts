import { applySuccessfulReading, resetEvaluationState, kstDate } from '../../../lib/weather-core.mjs';
import { getDb } from '../../../db';
import { readings } from '../../../db/schema';
import { asc } from 'drizzle-orm';
const source_url='https://api.open-meteo.com/v1/forecast?latitude=36.4800&longitude=127.2890&current=temperature_2m&timezone=Asia%2FSeoul';
export async function GET(){
 try { return Response.json({records:await getDb().select().from(readings).orderBy(asc(readings.record_date))}, {headers:{'Cache-Control':'no-store'}}); }
 catch {return Response.json({error:'저장된 기록을 읽지 못했습니다. 다시 시도해 주세요.'},{status:500});}
}
export async function POST(request:Request){
 try {
 const supplied=request.headers.get('content-type')?.includes('application/json')?await request.json() as any:null;
 const res=supplied?null:await fetch(source_url,{signal:AbortSignal.timeout(12000),cache:'no-store'});
 if(res&&!res.ok) return Response.json({error:`외부 원천 응답 오류 (${res.status}). 마지막 정상 기록은 유지됩니다.`},{status:502});
 const raw=supplied?.raw??await res!.json() as any;
 const value=raw.current?.temperature_2m;
 const time=raw.current?.time;
 if(typeof raw.latitude!=='number'||typeof raw.longitude!=='number'||Math.abs(raw.latitude-36.48)>.1||Math.abs(raw.longitude-127.289)>.1) throw new Error('schema');
 if(typeof value!=='number'||!Number.isFinite(value)||typeof time!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time)||raw.utc_offset_seconds!==32400||raw.current_units?.temperature_2m!=='°C') throw new Error('schema');
 const now=new Date();
 if(Math.abs(now.getTime()-Date.parse(time+':00+09:00'))>3600000) throw new Error('schema');
 const date=kstDate(now.toISOString());
 const normalized={signal_id:'sejong-temperature',normalized_value:value,unit:'°C',source_name:'Open-Meteo',source_url,source_time:time+':00+09:00',fetched_at:now.toISOString(),record_timezone:'Asia/Seoul',record_date:date};
 // Shared normalized validation and daily-row constructor also run in synthetic replay.
 const accepted=applySuccessfulReading(resetEvaluationState(),normalized).daily_readings[0].reading;
 const record={record_date:accepted.record_date,source_url:accepted.source_url,source_observed_at:accepted.source_time!,fetched_at:accepted.fetched_at,normalized_value:accepted.normalized_value,unit:accepted.unit,raw_json:JSON.stringify(raw)};
 const db=getDb();
 await db.insert(readings).values(record).onConflictDoUpdate({target:readings.record_date,set:record});
 const stored=await db.select().from(readings).orderBy(asc(readings.record_date));
 return Response.json({records:stored},{headers:{'Cache-Control':'no-store'}});
 } catch(e){return Response.json({error:e instanceof Error&&e.message==='schema'?'원천 응답 형식이 달라 저장하지 않았습니다. 마지막 정상 기록을 유지합니다.':'조회 또는 저장에 실패했습니다. 마지막 정상 기록을 유지합니다. 잠시 뒤 다시 시도해 주세요.'},{status:502});}
}
