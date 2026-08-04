/**
 * SPDX-License-Identifier: Apache-2.0
 */

export function isDeepEqual(x: any, y: any, ignoreKeys: string[] = []): boolean {
  if (x === y) return true;
  
  if (typeof x === 'object' && x !== null && typeof y === 'object' && y !== null) {
    if (Array.isArray(x) !== Array.isArray(y)) return false;
    
    if (Array.isArray(x)) {
      if (x.length !== y.length) return false;
      for (let i = 0; i < x.length; i++) {
        if (!isDeepEqual(x[i], y[i], ignoreKeys)) return false;
      }
      return true;
    }
    
    const filterKeys = (obj: any) => {
      return Object.keys(obj).filter(k => {
        if (ignoreKeys.includes(k)) return false;
        return obj[k] !== undefined && obj[k] !== null;
      });
    };
    
    const keysX = filterKeys(x);
    const keysY = filterKeys(y);
    
    if (keysX.length !== keysY.length) return false;
    
    for (const key of keysX) {
      if (!keysY.includes(key)) return false;
      if (!isDeepEqual(x[key], y[key], ignoreKeys)) return false;
    }
    return true;
  }
  
  return false;
}
