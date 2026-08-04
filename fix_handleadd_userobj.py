import re
with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

target = """  const handleAddCompanion = (userObj: { uid: string; displayName: string; email?: string; photoURL?: string }) => {
    const currentCompanions = plan.companions || [];
    if (currentCompanions.some((c) => c.id === userObj.uid)) {
      alert(language === 'ko' ? '이미 추가된 일행입니다.' : 'This companion is already added.');
      return;
    }
    const newCompanion = {
      id: userObj.uid,
      name: userObj.displayName,"""

repl = """  const handleAddCompanion = (userObj: any) => {
    const currentCompanions = plan.companions || [];
    const uid = userObj.uid || userObj.id;
    if (currentCompanions.some((c) => c.id === uid)) {
      alert(language === 'ko' ? '이미 추가된 일행입니다.' : 'This companion is already added.');
      return;
    }
    const newCompanion = {
      id: uid,
      name: userObj.displayName || userObj.name || 'Unknown',
      photoURL: userObj.photoURL || undefined,"""
content = content.replace(target, repl)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
