"""Refresh public ASAP page/post navigation index. No applicant data."""
import json,re,html,urllib.request,datetime
from pathlib import Path
entries=[]
for kind in ['pages','posts']:
 page=1
 while True:
  url=f'https://asapworksforme.com/wp-json/wp/v2/{kind}?per_page=100&page={page}'
  with urllib.request.urlopen(url,timeout=45) as r:
   items=json.load(r);total=int(r.headers.get('X-WP-TotalPages','1'))
  for x in items:
   if x.get('slug') in ['home-old','thank-you']:continue
   title=html.unescape(re.sub('<[^>]+>',' ',x['title']['rendered'])).strip()
   entries.append({'title':title,'url':x['link'],'kind':kind,'modified':x.get('modified_gmt')})
  if page>=total:break
  page+=1
out={'checked':datetime.date.today().isoformat(),'coverage':'Public WordPress pages and posts, titles and destinations. Excludes old home and confirmation page. Job requirements remain in the separate job snapshot.','pages':entries}
Path(__file__).resolve().parents[1].joinpath('site-index.js').write_text('window.ASAP_SITE_INDEX='+json.dumps(out,ensure_ascii=False)+';\n',encoding='utf-8')
print(len(entries),'public pages and posts indexed')
