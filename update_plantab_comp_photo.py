import re

with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

target = """                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                    comp.isLocal ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {comp.isLocal ? '👤' : '👥'}
                                  </div>"""
replacement = """                                <div className="flex items-center gap-2.5">
                                  {comp.photoURL ? (
                                    <img src={comp.photoURL} alt={comp.name} className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                      comp.isLocal ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {comp.isLocal ? '👤' : '👥'}
                                    </div>
                                  )}"""
content = content.replace(target, replacement)

# When a user creates a companion and it is added, they can also add it to Friend List
friend_list_target = """                                        setFavoriteUsers(prev => {
                                          const next = [...prev, {
                                            uid: comp.id,
                                            displayName: comp.name,
                                            email: comp.email || '',
                                            photoURL: ''
                                          }];"""
friend_list_replacement = """                                        setFavoriteUsers(prev => {
                                          const next = [...prev, {
                                            uid: comp.id,
                                            displayName: comp.name,
                                            email: comp.email || '',
                                            photoURL: comp.photoURL || ''
                                          }];"""
content = content.replace(friend_list_target, friend_list_replacement)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)
