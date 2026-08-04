import re
with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

target = """                          {favoriteUsers.map((userObj) => {"""
replacement = """                          {favoriteUsers.filter(Boolean).map((userObj) => {"""
content = content.replace(target, replacement)

target2 = """{userObj.displayName || userObj.name || 'Unknown'}"""
replacement2 = """{userObj?.displayName || userObj?.name || 'Unknown'}"""
content = content.replace(target2, replacement2)

target3 = """{(userObj.displayName || userObj.name || '').slice(0, 1)}"""
replacement3 = """{(userObj?.displayName || userObj?.name || '').slice(0, 1)}"""
content = content.replace(target3, replacement3)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
