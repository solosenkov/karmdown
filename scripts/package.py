#!/usr/bin/env python3
"""Build a Chrome Web Store ZIP from an explicit runtime allowlist."""
import hashlib, json, pathlib, zipfile
root=pathlib.Path(__file__).resolve().parent.parent
version=json.loads((root/'manifest.json').read_text())['version']
files=['manifest.json','background.js','core.js','content.js','viewer.css','viewer.html','viewer-entry.js','popup.html','popup.js','LICENSE','THIRD_PARTY_NOTICES.md','PRIVACY.md']
files += [str(p.relative_to(root)) for folder in ('icons','vendor') for p in (root/folder).rglob('*') if p.is_file() and p.suffix in ('.js','.css','.woff2','.png','.svg','.txt','.json')]
for name in files:
    assert (root/name).is_file(),name
    assert not any(part in ('docs','node_modules','.git','tests','output') for part in pathlib.Path(name).parts),name
out=root/'dist';out.mkdir(exist_ok=True)
archive=out/f'karmdown-{version}-chrome.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as target:
    for name in sorted(files):
        info=zipfile.ZipInfo(name,date_time=(2026,10,12,0,0,0));info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED
        target.writestr(info,(root/name).read_bytes())
with zipfile.ZipFile(archive) as check:
    assert check.testzip() is None
    assert 'manifest.json' in check.namelist()
    for name in check.namelist():
        if pathlib.Path(name).suffix in ('.js','.html','.md','.css','.json','.txt'):
            assert b'/Users/' not in check.read(name),name
sha=hashlib.sha256(archive.read_bytes()).hexdigest()
(out/f'{archive.name}.sha256').write_text(f'{sha}  {archive.name}\n')
print(f'{archive}: {archive.stat().st_size:,} bytes; {len(files)} files; SHA256 {sha}')
