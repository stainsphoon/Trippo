import re
with open('src/lib/firebaseService.ts', 'r') as f:
    content = f.read()

helper = """
const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = sanitizeForFirestore(obj[key]);
    }
  }
  return newObj;
};
"""

# Insert helper after imports
content = content.replace("const COLLECTION_NAME = 'shared_plans';", "const COLLECTION_NAME = 'shared_plans';\n" + helper)

# Update createSharedPlan
create_target = """    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...plan,
      updatedAt: new Date().toISOString()
    });"""
create_repl = """    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizeForFirestore({
      ...plan,
      updatedAt: new Date().toISOString()
    }));"""
content = content.replace(create_target, create_repl)

# Update updateSharedPlan
update_target = """    await setDoc(docRef, {
      ...plan,
      id: planId, // Keep document ID inside the plan object for reference
      updatedAt: new Date().toISOString()
    });"""
update_repl = """    await setDoc(docRef, sanitizeForFirestore({
      ...plan,
      id: planId, // Keep document ID inside the plan object for reference
      updatedAt: new Date().toISOString()
    }));"""
content = content.replace(update_target, update_repl)

with open('src/lib/firebaseService.ts', 'w') as f:
    f.write(content)
