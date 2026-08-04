import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                <button
                  onClick={() => {
                    setInvitePlanContext(null);
                    // Optionally strip sharedPlanId from URL
                    const url = new URL(window.location.href);
                    url.searchParams.delete('sharedPlanId');
                    window.history.pushState({}, '', url.toString());
                  }}"""

replacement = """                <button
                  onClick={() => {
                    setInvitePlanContext(null);
                    setSharedPlanId(null);
                    setPlan(null); // Clear the invited plan
                    setActiveTab('explore'); // Go back to home
                    // Optionally strip sharedPlanId from URL
                    const url = new URL(window.location.href);
                    url.searchParams.delete('sharedPlanId');
                    window.history.pushState({}, '', url.toString());
                  }}"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Decline button fixed")
else:
    print("Decline target not found")
