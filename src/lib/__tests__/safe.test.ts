// V17.1.2-p3d — guards compile and behave
import { safeArr, safeNum, safeStr, fmtCurrency } from '../safe';

test('safeArr', () => {
  expect(safeArr(null)).toEqual([]);
  expect(safeArr([1, 2])).toEqual([1, 2]);
});

test('safeNum', () => {
  expect(safeNum('3.5', 0)).toBe(3.5);
  expect(safeNum(undefined, 7)).toBe(7);
});

test('safeStr', () => {
  expect(safeStr(undefined, 'x')).toBe('x');
});

test('fmtCurrency', () => {
  expect(fmtCurrency(1)).toMatch(/^\$/);
});