import re

with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# 1. Update the empty friend list text
empty_target = """                        <div className="p-4 bg-white dark:bg-[#15141f] border border-gray-100 dark:border-subtle-border rounded-2xl text-center space-y-2 shadow-sm">
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {language === 'ko' 
                              ? '아직 친구 목록이 비어있습니다. 위의 초대 링크를 복사하여 친구를 일정에 초대하면 친구가 자동으로 추가됩니다! 👥✨' 
                              : 'Your friend list is empty. Copy the invitation link above to invite friends, and they will be automatically added to your list! 👥✨'}
                          </p>
                        </div>"""
empty_replacement = """                        <div className="p-4 bg-white dark:bg-[#15141f] border border-gray-100 dark:border-subtle-border rounded-2xl text-center shadow-sm">
                          <p className="text-xs text-gray-400">
                            {language === 'ko' 
                              ? '아직 등록된 친구가 없습니다.' 
                              : 'Your friend list is empty.'}
                          </p>
                        </div>"""
if empty_target in content:
    content = content.replace(empty_target, empty_replacement)
else:
    print("empty_target not found")

# 2. Allow adding local companions to friends list
# The target has !comp.isLocal &&
btn_target = """                                <div className="flex items-center gap-1.5">
                                  {!favoriteUsers.some(f => f.uid === comp.id || f.id === comp.id) && comp.id !== currentUserUid && !comp.isLocal && (
                                    <button
                                      onClick={() => {"""
btn_replacement = """                                <div className="flex items-center gap-1.5">
                                  {!favoriteUsers.some(f => f.uid === comp.id || f.id === comp.id) && comp.id !== currentUserUid && (
                                    <button
                                      onClick={() => {"""
if btn_target in content:
    content = content.replace(btn_target, btn_replacement)
else:
    print("btn_target not found")

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
print("Done")
