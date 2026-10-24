"""Retrieve selected members of the official WDAS archive using HTTP ranges."""
import argparse
import binascii
import json
from pathlib import Path
import struct
import urllib.request
import zlib

URL = 'https://assets.disneyanimation.com/wdas_cloud.zip'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('target', type=Path)
args = parser.parse_args()
out = args.target
out.mkdir(parents=True, exist_ok=False)

def get_range(start, end):
    request = urllib.request.Request(URL, headers={'Range': f'bytes={start}-{end}'})
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 206:
            raise RuntimeError('Server did not honor bounded range; refusing full download')
        data = response.read(end - start + 2)
        assert len(data) == end - start + 1
        return data

with urllib.request.urlopen(urllib.request.Request(URL, method='HEAD'), timeout=30) as response:
    size = int(response.headers['Content-Length'])
tail = get_range(size - 65536, size - 1)
end = tail.rfind(b'PK\x05\x06')
_, _, _, _, count, cd_size, cd_offset, _ = struct.unpack_from('<4s4H2LH', tail, end)
directory = get_range(cd_offset, cd_offset + cd_size - 1)
entries = []
offset = 0
for _ in range(count):
    header = struct.unpack_from('<4s6H3L5H2L', directory, offset)
    assert header[0] == b'PK\x01\x02'
    name_size, extra_size, comment_size = header[10:13]
    name = directory[offset + 46:offset + 46 + name_size].decode('utf-8')
    entries.append(dict(name=name, method=header[4], crc32=header[7],
                        compressed=header[8], bytes=header[9], offset=header[16]))
    offset += 46 + name_size + extra_size + comment_size
print(json.dumps(entries, indent=2))

selected = {'README.txt', 'wdas_cloud_sixteenth.vdb', 'wdas_cloud_mitsuba_scene.xml'}
for entry in entries:
    name = Path(entry['name']).name
    if name not in selected:
        continue
    target = out / name
    if target.exists():
        raise FileExistsError(target)
    local = get_range(entry['offset'], entry['offset'] + 29)
    assert local[:4] == b'PK\x03\x04'
    name_size, extra_size = struct.unpack_from('<HH', local, 26)
    start = entry['offset'] + 30 + name_size + extra_size
    packed = get_range(start, start + entry['compressed'] - 1)
    assert entry['method'] in (0, 8)
    data = zlib.decompress(packed, -15) if entry['method'] == 8 else packed
    assert len(data) == entry['bytes']
    assert binascii.crc32(data) & 0xffffffff == entry['crc32']
    target.write_bytes(data)
with (out / 'archive-members.json').open('x') as file:
    json.dump(dict(url=URL, archiveBytes=size, entries=entries), file, indent=2)
