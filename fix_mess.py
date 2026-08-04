import re
with open('src/components/PlanTab.tsx', 'r') as f:
    content = f.read()

pattern = r"                      \)\}   </div>.*?                          </div>\n                        </div>\n                      \)\}"

new_content = re.sub(pattern, "                      )}", content, flags=re.DOTALL)

with open('src/components/PlanTab.tsx', 'w') as f:
    f.write(new_content)
print("Done")
