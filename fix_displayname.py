import re
with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

content = content.replace("{userObj.displayName.slice(0, 1)}", "{(userObj.displayName || userObj.name || '').slice(0, 1)}")
content = content.replace("{userObj.displayName}", "{userObj.displayName || userObj.name || 'Unknown'}")

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
