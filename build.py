#!/usr/bin/env python3
"""Assemble src/ into dist/index.html (single self-contained file). Usage: python3 build.py [--test]"""
import re, sys, pathlib
r = pathlib.Path(__file__).parent
rd = lambda p: (r / p).read_text()
html = (rd('src/template.html')
  .replace('//@@HUBS@@', rd('src/segments/seg_hubs.js'))
  .replace('//@@TIME@@', rd('src/segments/seg_time.js'))
  .replace('//@@GEO@@', rd('src/segments/seg_geo.js'))
  .replace('//@@LAYERS@@', rd('src/segments/seg_layers.js'))
  .replace('//@@APP@@', rd('src/app.js')))
(r / 'dist').mkdir(exist_ok=True)
(r / 'dist/index.html').write_text(html)
if '--test' in sys.argv:  # dark, no transitions, tip popup after 1.2 s (for screenshots)
    t = html.replace("select('lon',true);", "window.__g1=g1;window.__GL=GL;select('lon',true);", 1).replace('<html lang="en">', '<html lang="en" data-theme="dark">').replace('const TIP_DELAY=60000;', 'const TIP_DELAY=1200;').replace('</style>', '*{transition:none!important}.rv{opacity:1!important;transform:none!important;filter:none!important}</style>')
    (r / 'dist/index.test.html').write_text(t)
print('built', len(html), 'bytes')
