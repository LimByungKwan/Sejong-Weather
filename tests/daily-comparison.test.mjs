import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyComparison} from '../lib/daily-comparison.mjs';
const row=(date,value,unit='°C')=>({record_date:date,normalized_value:value,unit});
test('empty and single-day histories do not invent a comparison',()=>{assert.equal(dailyComparison([]),null);assert.equal(dailyComparison([row('2026-08-24',20.4)]),null)});
test('date order and decimal subtraction produce a signed exact difference',()=>{const r=dailyComparison([row('2026-08-25',19.1),row('2026-08-24',20.4)]);assert.equal(r.delta,-1.3);assert.equal(r.adjacent,true);assert.equal(r.current.record_date,'2026-08-25')});
test('gap is not labelled yesterday and different units are rejected',()=>{assert.equal(dailyComparison([row('2026-08-24',20),row('2026-08-26',20)]).adjacent,false);assert.ok(dailyComparison([row('2026-08-24',20),row('2026-08-25',70,'°F')]).error)});
