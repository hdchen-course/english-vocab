#!/usr/bin/env python3
"""Regenerate data/speaking_nav_map.json from SSOT (PRACTICE_ZONE_NAV_SPEC §2.1/§4).
SSOT: authoring/speaking_cats.json (cat->pages) + units_index.json (page->unit_id).
label_en committed below (R14 main display). Deterministic; no network."""
import json,re,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cats=json.load(open(os.path.join(ROOT,'authoring/speaking_cats.json')))
ui=json.load(open(os.path.join(ROOT,'data/units_index.json')))
us=ui if isinstance(ui,list) else ui.get('units',ui)
bypage={}
for u in us: bypage.setdefault(u.get('page'),u)
LABEL_EN={'social':'Greetings & Being Social','people':'Myself & Other People','school':'School Life',
 'numtime':'Numbers, Time & Dates','food':'Food & Ordering','shopping':'Shopping',
 'travel':'Getting Around & Directions','health':'Body & Health','weather':'Weather & Seasons',
 'daily':'Daily Life & Hobbies'}
def zh(name):
    s=re.sub(r'^[^一-鿿]+','',name.strip()); return re.sub(r'\s+[A-Za-z].*$','',s).strip()
out={}
for c in cats['cats']:
    k=c['key']; units=[bypage[(p if isinstance(p,str) else p['page'])]['unit_id'] for p in c['pages']]
    out[k]={'label_en':LABEL_EN[k],'label_zh':zh(c['name']),'em':(c.get('em','').split()[0] if c.get('em') else ''),'units':units}
doc={'_note':'DERIVED from authoring/speaking_cats.json + units_index.json. Regenerate via tools/build_speaking_nav_map.py. Per PRACTICE_ZONE_NAV_SPEC §2.1/§4.',
 '_schema':'{cat_key:{label_en,label_zh,em,units:[unit_id,...]}}','cats':out}
json.dump(doc,open(os.path.join(ROOT,'data/speaking_nav_map.json'),'w'),ensure_ascii=False,indent=1)
print('ok',len(out),'cats',sum(len(v['units']) for v in out.values()),'units')
