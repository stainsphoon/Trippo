with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

# We need to find the duplicate Gmail blocks and keep only one, AND ensure the Native Share (More) block is there.

start_marker = "{/* Gmail */}"
end_marker = "</div>\n                        </div>\n                      )}\n                    </div>\n\n                    {/* 2. Added Companions in Active Plan */}"

# Let's just find the part from `Messages` to the end of the Invite Section, and overwrite it cleanly.
target = """                            {/* Messages */}
                            <button
                              onClick={() => {
                                const inviteUrl = `${window.location.origin}${window.location.pathname}?sharedPlanId=${sharedPlanId}`;
                                const shareText = language === 'ko'
                                  ? `[Trippo] ${plan.title} 여행 일정을 함께 만들어요! 🎈\\n${inviteUrl}`
                                  : `[Trippo] Join my travel plan to ${plan.title}! 🎈\\n${inviteUrl}`;
                                window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_self');
                              }}
                              className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-stone-900/40 hover:bg-slate-100 dark:hover:bg-stone-800/50 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800"
                            >
                              <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 flex items-center justify-center">
                                <MessageCircle size={16} />
                              </div>
                              <span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary">
                                {language === 'ko' ? '메세지' : 'Messages'}
                              </span>
                            </button>"""

import re
# Regex to replace everything from `target` up to `2. Added Companions in Active Plan`
pattern = target + r".*?(?=                    \{/\* 2\. Added Companions in Active Plan \*/\})"
replacement = target + """
                            {/* Native Share (More) */}
                            {typeof navigator !== 'undefined' && navigator.share ? (
                              <button
                                onClick={async () => {
                                  const inviteUrl = `${window.location.origin}${window.location.pathname}?sharedPlanId=${sharedPlanId}`;
                                  try {
                                    await navigator.share({
                                      title: language === 'ko' ? `${plan.title} 여행 일정에 여러분을 초대합니다! 🎈` : `Invitation to join travel itinerary for ${plan.title}! 🎈`,
                                      text: language === 'ko' 
                                        ? `안녕하세요!\\n\\n${plan.title} 여행 일정(${plan.startDate} ~ ${plan.endDate})에 초대받으셨습니다.\\n아래 링크로 접속하여 일행으로 함께 참여해 보세요:\\n`
                                        : `Hello!\\n\\nYou have been invited to join the travel itinerary for ${plan.title} (${plan.startDate} ~ ${plan.endDate}).\\nPlease click the link below to join as a companion:\\n`,
                                      url: inviteUrl
                                    });
                                  } catch (e) {
                                    console.warn('Native share failed or cancelled', e);
                                  }
                                }}
                                className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 dark:bg-stone-900/40 hover:bg-slate-100 dark:hover:bg-stone-800/50 rounded-xl transition-all cursor-pointer border border-gray-100 dark:border-stone-800"
                              >
                                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                  <MoreVertical size={16} />
                                </div>
                                <span className="text-[10px] font-sans font-bold text-gray-500 dark:text-text-secondary">
                                  {language === 'ko' ? '더보기' : 'More'}
                                </span>
                              </button>
                            ) : (
                              <div className="hidden"></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
"""

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
if new_content != content:
    print("Fixed target!")
else:
    print("Target not found!")

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(new_content)
