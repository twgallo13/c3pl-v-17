// V17.1.2-p3d — safe utilities test
import { safeArr, safeNum, safeStr, fmtCurrency } from '@/lib/safe';

console.log('safeNum:', safeNum('123
console.log('fmtCurrency:', fmtCurrency(1

console.log('safeNum:', safeNum('123', 0));
console.log('safeStr:', safeStr('test', ''));
console.log('fmtCurrency:', fmtCurrency(123.45));
console.log('All imports successful!');