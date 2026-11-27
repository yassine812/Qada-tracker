import test from 'node:test';
import assert from 'node:assert/strict';
import { ADHKAR_ITEMS, getAdhkarItems, getAdhkarItemById, searchAdhkar } from '../src/data/adhkar';
import { migrateAdhkarFavorites, migrateMorningProgress, migrateEveningProgress } from '../src/services/adhkarProgress';
import type { AdhkarDailyState } from '../src/types';

const morning = getAdhkarItems('morning');
const plain = (s: string) => s.replace(/[\u064B-\u065F\u0670]/g, '');
test('morning matches all 22 screenshot entries in order with exact repetition counts', () => {
  assert.deepEqual(morning.map(x => x.id), [
    'morning-1','morning-three-quls','morning-5','morning-6','morning-7',
    'morning-witness','morning-blessings','morning-11','morning-10','morning-protection',
    'morning-unseen','morning-9','morning-8','morning-living','morning-day-goodness',
    'morning-fitrah','morning-12','morning-tahlil','morning-creation-praise','morning-knowledge',
    'morning-repentance','morning-salawat',
  ]);
  assert.deepEqual(morning.map(x => x.repetitions), [1,3,1,1,1,4,1,3,7,1,1,3,3,1,1,1,100,100,3,1,100,10]);
  assert.equal(new Set(ADHKAR_ITEMS.map(x => x.id)).size, ADHKAR_ITEMS.length);
  for (const item of morning) {
    assert.ok(item.arabicText.length > 15);
    assert.ok(item.source && item.sourceReference && item.sourceUrl?.startsWith('https://sunnah.com/hisn:'));
    assert.equal(getAdhkarItemById(item.id), item);
  }
});
test('cropped screenshots are completed, and all three surahs are grouped with basmalah', () => {
  assert.ok(plain(morning[0].arabicText).endsWith('وهو العلي العظيم'));
  assert.ok(plain(morning[1].arabicText).endsWith('من الجنة والناس'));
  assert.equal(morning[1].arabicText.split('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ').length - 1, 3);
  assert.ok(plain(morning[2].arabicText).endsWith('وعذاب في القبر'));
  assert.ok(searchAdhkar('فطرة').some(x => x.id === 'morning-fitrah'));
});
test('evening matches all 21 screenshot entries and sleep matches all 13 pages', () => {
  const evening = getAdhkarItems('evening');
  assert.deepEqual(evening.map(x => x.id), [
    'evening-1','evening-three-quls','evening-5','evening-6','evening-7','evening-witness','evening-blessings',
    'evening-12','evening-11','evening-protection','evening-unseen','evening-9','evening-8','evening-living',
    'evening-night-goodness','evening-fitrah','evening-13','evening-14','evening-repentance','evening-10','evening-salawat',
  ]);
  assert.deepEqual(evening.map(x=>x.repetitions), [1,3,1,1,1,4,1,3,7,1,1,3,3,1,1,1,100,100,100,3,10]);
  for (const item of evening) assert.ok(item.sourceUrl?.startsWith('https://sunnah.com/hisn:'));
  const sleep = getAdhkarItems('sleep');
  assert.deepEqual(sleep.map(x => x.id), ['sleep-three-quls','sleep-1','sleep-5','sleep-6','sleep-10','sleep-8','sleep-9','sleep-tasbih-33','sleep-rabb-samawat','sleep-11','sleep-unseen','sleep-sajdah-mulk','sleep-7']);
  assert.deepEqual(sleep.map(x => x.repetitions), [3,1,1,1,1,3,1,33,1,1,1,1,1]);
  assert.ok(sleep[0].arabicText.split('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ').length - 1 === 3);
  for (const item of sleep) assert.ok(item.sourceUrl?.startsWith('https://sunnah.com/hisn:'));
});
function oldState(counts: number[]): AdhkarDailyState {
  return {date:'2026-10-16',byCategory:{morning:{items:Object.fromEntries(counts.map((count,i)=>[`morning-${i+2}`,{count,completed:count===3}]))},evening:{items:{'evening-1':{count:1,completed:true}}}}};
}
test('migration preserves only shared reading rounds and is immutable and idempotent', () => {
  for (const counts of [[3,3,3],[3,2,1],[3],[0,0,0]]) {
    const before=oldState(counts);
    const original=structuredClone(before);
    const after=migrateMorningProgress(before);
    const expected=counts.length===3 ? Math.min(...counts) : 0;
    assert.deepEqual(after.byCategory.morning!.items['morning-three-quls'],{count:expected,completed:expected===3});
    assert.deepEqual(before,original);
    assert.equal(after.byCategory.evening,before.byCategory.evening);
    assert.equal(migrateMorningProgress(after),after);
    for (const [id,value] of Object.entries(before.byCategory.morning!.items)) assert.deepEqual(after.byCategory.morning!.items[id],value);
  }
});
test('favorites collapse the old three surahs without dropping unrelated favorites', () => {
  assert.deepEqual(migrateAdhkarFavorites(['morning-2','morning-4','morning-5','evening-2','evening-4']),['morning-three-quls','morning-5','evening-three-quls']);
});

test('evening three-surah migration is immutable and idempotent', () => {
  const before = oldState([3, 3, 3]);
  const evening = { ...before, byCategory: { ...before.byCategory, evening: { items: {
    'evening-2': { count: 3, completed: true }, 'evening-3': { count: 2, completed: false }, 'evening-4': { count: 1, completed: false },
  } } } };
  const migrated = migrateEveningProgress(evening);
  assert.deepEqual(migrated.byCategory.evening!.items['evening-three-quls'], { count: 1, completed: false });
  assert.equal(migrateEveningProgress(migrated), migrated);
});
