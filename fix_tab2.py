import re

with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# 1. Add KakaoIcon import at the top
if 'KakaoIcon' not in content:
    import_block = "import { TravelPlan, PlanItem, DayPlan, TransportationType, ChecklistItem } from '../types';\nimport KakaoIcon from '../assets/images/kakaotalk_icon_1784287194798.jpg';"
    content = content.replace("import { TravelPlan, PlanItem, DayPlan, TransportationType, ChecklistItem } from '../types';", import_block)

# 2. Fix KakaoTalk Icon
kakao_target = """                              <div className="w-9 h-9 rounded-full bg-[#FEE500] text-[#191919] flex items-center justify-center font-extrabold text-sm shadow-sm">
                                💬
                              </div>"""
kakao_replacement = """                              <img src={KakaoIcon} alt="KakaoTalk" className="w-9 h-9 rounded-full shadow-sm object-cover" />"""
content = content.replace(kakao_target, kakao_replacement)

# 3. Fix the Add to friends button
added_companion_target = """                                {comp.id !== currentUserUid && (
                                  <button
                                    onClick={() => handleRemoveCompanion(comp.id)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                    title={language === 'ko' ? '제거' : 'Remove'}
                                  >
                                    <Minus size={14} />
                                  </button>
                                )}
                              </div>
                            </motion.div>"""
added_companion_replacement = """                                <div className="flex items-center gap-1.5">
                                  {!favoriteUsers.some(f => f.uid === comp.id || f.id === comp.id) && comp.id !== currentUserUid && !comp.isLocal && (
                                    <button
                                      onClick={() => {
                                        setFavoriteUsers(prev => {
                                          const next = [...prev, {
                                            uid: comp.id,
                                            displayName: comp.name,
                                            email: comp.email || '',
                                            photoURL: ''
                                          }];
                                          localStorage.setItem('trippo_friends', JSON.stringify(next));
                                          return next;
                                        });
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                      title={language === 'ko' ? '친구 목록에 추가' : 'Add to Friend List'}
                                    >
                                      <UserPlus size={14} />
                                    </button>
                                  )}
                                  {comp.id !== currentUserUid && (
                                    <button
                                      onClick={() => handleRemoveCompanion(comp.id)}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                      title={language === 'ko' ? '제거' : 'Remove'}
                                    >
                                      <Minus size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>"""
content = content.replace(added_companion_target, added_companion_replacement)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(content)

print("Edits complete.")
