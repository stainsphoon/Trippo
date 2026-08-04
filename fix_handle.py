import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """  const handleStartSharedMode = async (silent?: boolean) => {
    if (!plan) return;
    try {
      const planWithCreator = {
        ...plan,
        creatorId: user?.uid || undefined
      };
      const docId = await createSharedPlan(planWithCreator);"""

replacement = """  const handleStartSharedMode = async (silent?: boolean) => {
    if (!plan) return;
    try {
      const creatorCompanion = user ? {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
        email: user.email || '',
        isLocal: false
      } : null;

      const currentComps = plan.companions || [];
      const isCreatorAlreadyIn = user && currentComps.some(c => c.id === user.uid);
      const newComps = isCreatorAlreadyIn || !creatorCompanion ? currentComps : [...currentComps, creatorCompanion];

      const planWithCreator = {
        ...plan,
        creatorId: user?.uid || undefined,
        companions: newComps
      };
      const docId = await createSharedPlan(planWithCreator);"""

if target in content:
    content = content.replace(target, replacement)
else:
    print("handleStartSharedMode Target not found!")

modal_effect_target = """  // Handle shared plan invitations
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

modal_effect_replacement = """  // Handle shared plan invitations
  useEffect(() => {
    if (!sharedPlanId || !plan || !user) return;

    // The creator shouldn't see the invite modal.
    if (plan.creatorId === user.uid) {
      setInvitePlanContext(null);
      return;
    }

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

if modal_effect_target in content:
    content = content.replace(modal_effect_target, modal_effect_replacement)
else:
    print("modal effect target not found!")
    
with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
