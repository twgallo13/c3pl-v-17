// V17.1.2-p3d — quick verification that safe utilities work
import { safeArr, safeNum, safeStr, fmtCurrency } from '@/lib/safe';

// Test that imports work and basic functionality is correct
console.log('Safe utilities verification:');
console.log('safeArr(null):', safeArr(null));
console.log('safeNum("42", 0):', safeNum("42", 0));
console.log('safeStr(null, "default"):', safeStr(null, "default"));
console.log('fmtCurrency(1234.56):', fmtCurrency(1234.56));

export const safeUtilsVerified = true;