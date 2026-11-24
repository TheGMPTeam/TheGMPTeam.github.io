#!/usr/bin/env python3
"""Normalized diff of _build/dist/<p> vs root <p>. Reports intended-vs-bug deltas."""
import re, difflib
# v172: page list comes from build.py itself - verify can never lag behind the site.
_src=open("_build/build.py").read()
PAGES=eval(re.search(r"PAGES=(\[.*?\])",_src).group(1))
def nl(s):
    s=s.replace("&middot;","·")
    lines=[re.sub(r"\s+"," ",l).strip() for l in s.splitlines()]
    return [l for l in lines if l]
allok=True
for p in PAGES:
    a=nl(open(p).read()); b=nl(open("_build/dist/"+p).read())
    if a==b: print(f"PASS {p}"); continue
    allok=False
    print(f"DIFF {p}:")
    for l in difflib.unified_diff(a,b,lineterm="",n=1):
        if l.startswith(("+","-")) and not l.startswith(("+++","---")):
            print("   ",l[:160])
print("ALL PASS" if allok else "deltas above (check intended vs bug)")
