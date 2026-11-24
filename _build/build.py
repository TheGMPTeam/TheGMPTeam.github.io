#!/usr/bin/env python3
"""Render _pages/* + _partials/head -> root HTML using _build/config.json.
Chrome (nav / side-panel / footer) is NOT inlined: assets/chrome.js injects it
at runtime as a single source. Pages ship only <head> + unique body content."""
import json, os, sys

OUT = "." if (len(sys.argv)>1 and sys.argv[1]=="--root") else "_build/dist"

PAGES=["index.html","products.html","pay-for-work.html","games.html","videos.html","status.html","system.html","outtakes.html","schematic.html"]
CSSV="163"; JSV="135"; CHV="130"

cfg=json.load(open("_build/config.json"))
head=open("_partials/head.html").read()

def r_head(p):
    c=cfg[p]; s=head.replace("{{TITLE}}",c["title"]).replace("{{DESC}}",c["desc"])
    s=s.replace("{{SCRIPT}}",
        f'<script src="/assets/chrome.js?v={CHV}" defer></script>\n'
        f'<script src="/assets/site.js?v={JSV}" defer></script>')
    s=s.replace("{{EXTRA_HEAD}}", ("\n"+c["extra_head"]) if c["extra_head"] else "")
    s=s.replace("{{OGURL}}", "/" if p=="index.html" else "/"+p)
    s=s.replace("{{CSSV}}",CSSV)
    return s

os.makedirs(OUT,exist_ok=True)
for p in PAGES:
    t=open("_pages/"+p).read()
    t=t.replace("{{HEAD}}",r_head(p))
    assert "{{" not in t, f"unsubstituted token in {p}"
    open(OUT+"/"+p,"w").write(t)
print("rendered", len(PAGES), "pages ->", OUT)
