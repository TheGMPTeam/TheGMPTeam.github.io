#!/usr/bin/env python3
"""Phase 1: derive _partials/ + _pages/ + config.json from the current pages.
Normalizes known per-page variation into config tokens so shared partials cover
the common core; snowflake blocks (status's custom footer, etc.) stay verbatim.
Run from repo root. Does NOT touch the live pages."""
import re, json, os

PAGES = ["index.html","products.html","games.html","videos.html","status.html","outtakes.html"]
LINKS = [("/","HOME"),("/products.html","PRODUCTS"),("/games.html","GAMES"),
         ("/status.html","STATUS"),("/videos.html","VIDEOS"),("/outtakes.html","OUTTAKES")]
LOGOMARK = '<img class="logo-mark" src="/assets/brand/logo-128.jpg" alt="">'

SCRIPT_RE = re.compile(r'\n?[ \t]*<script src="/assets/site\.js\?v=\d+" defer></script>')
STYLE_RE  = re.compile(r'\n?[ \t]*<style>.*?</style>', re.S)
CREDIT_RE = re.compile(r'\s*<span style="font-size:11px;opacity:\.55">Chain imagery:[^<]*</span>')

def find(t, tag):
    m = re.search(r'<'+tag+r'\b[^>]*>', t)
    if not m: return None
    e = '</'+tag+'>'; j = t.index(e, m.start()); return t[m.start():j+len(e)]
def norm(s): return re.sub(r"\s+"," ", s).strip()
def sep_norm(s): return s.replace("&middot;","·")

raw  = {p: open(p).read() for p in PAGES}
t2   = {p: SCRIPT_RE.sub("", raw[p]) for p in PAGES}   # script placement normalized

# canonical core from index (script already stripped)
idx = t2["index.html"]
head0, nav0, foot0 = find(idx,"head"), find(idx,"nav"), find(idx,"footer")

def head_core(h):
    h = STYLE_RE.sub("", h)
    h = re.sub(r"<title>.*?</title>","<title>X</title>",h,flags=re.S)
    h = re.sub(r'<meta name="description" content=".*?">','<meta name="description" content="X">',h,flags=re.S)
    return norm(h)
def nav_core(n):
    n = n.replace(LOGOMARK,"")
    n = re.sub(r'class="on"\s*','',n).replace('<a  ','<a ')
    return norm(n)
def foot_core(f):
    return norm(sep_norm(CREDIT_RE.sub("",f)))

HC0, NC0, FC0 = head_core(head0), nav_core(nav0), foot_core(foot0)

# canonical partials (parametrized)
head_t = head0
head_t = re.sub(r"<title>.*?</title>","<title>{{TITLE}}</title>",head_t,flags=re.S)
head_t = re.sub(r'(<meta name="description" content=").*?(">)', r"\1{{DESC}}\2", head_t, flags=re.S)
head_t = STYLE_RE.sub("", head_t)
head_t = head_t.replace("</head>", "{{SCRIPT}}{{EXTRA_HEAD}}\n</head>")
nav_t = nav0.replace(LOGOMARK, "{{LOGOMARK}}")
nav_t = re.sub(r'(<span class="links">\s*).*?(\s*</span>)', r"\1{{NAVLINKS}}\2", nav_t, flags=re.S)
foot_t = CREDIT_RE.sub("{{CREDITLINE}}", foot0, count=1)

os.makedirs("_partials",exist_ok=True); os.makedirs("_pages",exist_ok=True); os.makedirs("_build",exist_ok=True)
open("_partials/head.html","w").write(head_t)
open("_partials/nav.html","w").write(nav_t)
open("_partials/footer.html","w").write(foot_t)

config={}
for p in PAGES:
    t=t2[p]; head,nav,foot=find(t,"head"),find(t,"nav"),find(t,"footer")
    title=re.search(r"<title>(.*?)</title>",head,flags=re.S).group(1)
    desc =re.search(r'<meta name="description" content="(.*?)">',head,flags=re.S).group(1)
    style=re.search(STYLE_RE,head); extra=style.group(0).strip() if style else ""
    m=re.search(r'class="on" href="([^"]+)"',nav); active=m.group(1) if m else "/"
    logo=LOGOMARK if LOGOMARK in nav else ""
    credit=bool(CREDIT_RE.search(foot)) if foot else False
    tmpl=t; sh={}
    if head_core(head)==HC0: tmpl=tmpl.replace(head,"{{HEAD}}"); sh["head"]=True
    if nav_core(nav)==NC0:   tmpl=tmpl.replace(nav,"{{NAV}}");   sh["nav"]=True
    if foot and foot_core(foot)==FC0: tmpl=tmpl.replace(foot,"{{FOOTER}}"); sh["footer"]=True
    open("_pages/"+p,"w").write(tmpl)
    config[p]=dict(title=title,desc=desc,active=active,credit=credit,extra_head=extra,logomark=logo,**sh)

json.dump(config,open("_build/config.json","w"),indent=2)
print("shared map:")
for p in PAGES:
    c=config[p]
    print(f"  {p:14s} head={c.get('head',False)!s:5s} nav={c.get('nav',False)!s:5s} footer={c.get('footer',False)!s:5s} active={c['active']:16s} credit={c['credit']!s:5s} logo={'y' if c['logomark'] else 'n'} extra={'y' if c['extra_head'] else 'n'}")
