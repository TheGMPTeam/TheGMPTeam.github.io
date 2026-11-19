#!/usr/bin/env python3
"""Render _pages/* + _partials/* -> _build/dist/*.html using _build/config.json.
Phase 1: no side-panel injection (faithful reproduction only)."""
import json, os, sys

OUT = "." if (len(sys.argv)>1 and sys.argv[1]=="--root") else "_build/dist"

PAGES=["index.html","products.html","games.html","videos.html","status.html","outtakes.html"]
LINKS=[("/","HOME"),("/products.html","PRODUCTS"),("/games.html","GAMES"),
       ("/status.html","STATUS"),("/videos.html","VIDEOS"),("/outtakes.html","OUTTAKES")]
CSSV="103"; JSV="98"

cfg=json.load(open("_build/config.json"))
head=open("_partials/head.html").read()
nav =open("_partials/nav.html").read()
foot=open("_partials/footer.html").read()
side=open("_partials/sidepanel.html").read().rstrip()

def navlinks(active):
    return "".join(f'<a{" class=\"on\"" if h==active else ""} href="{h}">{l}</a>' for h,l in LINKS)
def r_head(p):
    c=cfg[p]; s=head.replace("{{TITLE}}",c["title"]).replace("{{DESC}}",c["desc"])
    s=s.replace("{{SCRIPT}}", f'<script src="/assets/site.js?v={JSV}" defer></script>')
    s=s.replace("{{EXTRA_HEAD}}", ("\n"+c["extra_head"]) if c["extra_head"] else "")
    s=s.replace("{{CSSV}}",CSSV)
    return s
def r_nav(p):
    c=cfg[p]; return nav.replace("{{LOGOMARK}}",c["logomark"]).replace("{{NAVLINKS}}",navlinks(c["active"]))
def r_foot(p):
    c=cfg[p]
    credit='\n  <span style="font-size:11px;opacity:.55">Chain imagery: Vecteezy asset 45838195.</span>' if c["credit"] else ""
    return foot.replace("{{CREDITLINE}}",credit)

os.makedirs(OUT,exist_ok=True)
for p in PAGES:
    t=open("_pages/"+p).read()
    t=t.replace("{{HEAD}}",r_head(p)).replace("{{NAV}}",r_nav(p)).replace("{{FOOTER}}",r_foot(p))
    t=t.replace("</body>", side+"\n</body>", 1)
    assert "{{" not in t, f"unsubstituted token in {p}"
    open(OUT+"/"+p,"w").write(t)
print("rendered", len(PAGES), "pages ->", OUT)
