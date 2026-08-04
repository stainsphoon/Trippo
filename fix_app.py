import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """  // Automatically add logged-in user to the shared plan's companions list if they are visiting via an invitation link
  useEffect(() => {
    if (!sharedPlanId || !plan || !user) return;

    const comps = plan.companions || [];
    const isAlreadyCompanion = comps.some(
      (c) => c.id === user.uid || (c.email && c.email === user.email)
    );

    if (!isAlreadyCompanion) {
      const newCompanion = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
        email: user.email || '',
        isLocal: false
      };
      
      const updatedPlan = {
        ...plan,
        companions: [...comps, newCompanion]
      };
      
      handleUpdatePlan(updatedPlan);
    }
  }, [sharedPlanId, plan?.companions, user]);"""

replacement = """  // Handle shared plan invitations
  useEffect(() => {
    if (!sharedPlanId || !plan || !user) return;

    const comps = plan.companions || [];
    const isAlreadyCompanion = comps.some(
      (c) => c.id === user.uid || (c.email && c.email === user.email)
    );

    if (!isAlreadyCompanion) {
      setInvitePlanContext(plan);
    } else {
      setInvitePlanContext(null);
    }
  }, [sharedPlanId, plan, user]);"""

content = content.replace(target, replacement)

# Now find where to insert the Modal UI.
# Search for `          )}` before `        </main>`
modal_target = """          )}
        </main>
        {/* Persistent Bottom Control Area */}"""

modal_replacement = """          )}
        </main>

        {/* Invite Modal */}
        {invitePlanContext && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white dark:bg-surface-primary w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-fade-in border border-gray-100 dark:border-subtle-border">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="font-sans font-extrabold text-lg text-gray-800 dark:text-text-primary mb-2">
                {language === 'ko' ? '초대받은 일정' : 'Invited Plan'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-text-secondary mb-6 leading-relaxed">
                {language === 'ko' ? (
                  <>
                    <strong className="text-blue-600 dark:text-blue-400">'{invitePlanContext.title}'</strong> 일정에 참여하시겠습니까?
                  </>
                ) : (
                  <>
                    Are you going to participate in <strong className="text-blue-600 dark:text-blue-400">'{invitePlanContext.title}'</strong>?
                  </>
                )}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setInvitePlanContext(null);
                    // Optionally strip sharedPlanId from URL
                    const url = new URL(window.location.href);
                    url.searchParams.delete('sharedPlanId');
                    window.history.pushState({}, '', url.toString());
                  }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-stone-800 hover:bg-gray-200 dark:hover:bg-stone-700 text-gray-700 dark:text-stone-300 font-sans font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  {language === 'ko' ? '거절' : 'Decline'}
                </button>
                <button
                  onClick={() => {
                    if (!user || !invitePlanContext) return;
                    const comps = invitePlanContext.companions || [];
                    const newCompanion = {
                      id: user.uid,
                      name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
                      email: user.email || '',
                      isLocal: false
                    };
                    const updatedPlan = {
                      ...invitePlanContext,
                      companions: [...comps, newCompanion]
                    };
                    handleUpdatePlan(updatedPlan);
                    setInvitePlanContext(null);
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '수락' : 'Accept'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Bottom Control Area */}"""
content = content.replace(modal_target, modal_replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
