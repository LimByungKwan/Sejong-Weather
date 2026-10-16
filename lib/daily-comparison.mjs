// Compare stored readings only; never manufacture a missing day.
export function dailyComparison(rows) {
 const ordered=[...rows].sort((a,b)=>a.record_date.localeCompare(b.record_date));
 if(ordered.length<2)return null;
 const current=ordered.at(-1),previous=ordered.at(-2);
 if(current.unit!==previous.unit)return {current,previous,error:'서로 다른 단위라 비교할 수 없습니다.'};
 const adjacent=Date.parse(current.record_date+'T00:00:00+09:00')-Date.parse(previous.record_date+'T00:00:00+09:00')===86400000;
 const delta=Math.round((current.normalized_value-previous.normalized_value)*1e6)/1e6;
 return {current,previous,adjacent,delta:Object.is(delta,-0)?0:delta};
}
