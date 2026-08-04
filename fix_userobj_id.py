import re
with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

target1 = """const isAdded = (plan.companions || []).some((c) => c.id === userObj.uid);"""
repl1 = """const isAdded = (plan.companions || []).some((c) => c.id === (userObj.uid || userObj.id));"""

target2 = """key={userObj.uid}"""
repl2 = """key={userObj.uid || userObj.id}"""

target3 = """removeFriend(userObj.uid)"""
repl3 = """removeFriend(userObj.uid || userObj.id)"""

content = content.replace(target1, repl1).replace(target2, repl2).replace(target3, repl3)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
