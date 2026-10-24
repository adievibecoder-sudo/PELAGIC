"""Convert the licensed WDAS control; no renderer or Blender scene is invoked."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('target', type=Path)
parser.add_argument('--dll-directory', type=Path)
args = parser.parse_args()
dll = os.add_dll_directory(str(args.dll_directory)) if args.dll_directory else None
import openvdb
import numpy as np

source, target = args.source, args.target
target.mkdir(parents=True, exist_ok=False)
grid = openvdb.read(str(source / 'wdas_cloud_sixteenth.vdb'), 'density')
lower, upper = (np.asarray(x) for x in grid.evalActiveVoxelBoundingBox())
shape = upper - lower + 3
data = np.zeros(tuple(shape), dtype=np.float32)
grid.copyToArray(data, tuple(int(x) for x in lower - 1))
assert np.isfinite(data).all() and data.min() >= 0 and data.max() <= 1

def reduce_axis(array, axis):
    old = array.shape[axis]
    new = max(1, old // 2)
    left = np.arange(new)[:, None] * old / new
    right = (np.arange(new)[:, None] + 1) * old / new
    weights = np.maximum(0, np.minimum(right, np.arange(old) + 1) - np.maximum(left, np.arange(old))) / (old / new)
    return np.moveaxis(np.tensordot(weights, array, axes=(1, axis)), 0, axis)

levels, payload = [], bytearray()
original_mean = float(data.mean())
while True:
    half = data.astype('<f2')
    raw = half.transpose(2, 1, 0).copy().tobytes()
    levels.append(dict(size=list(data.shape), offset=len(payload), bytes=len(raw),
                       mean=float(data.mean()), quantizedMean=float(half.astype(np.float32).mean()),
                       maxQuantizationError=float(np.abs(data-half.astype(np.float32)).max())))
    assert abs(float(data.mean())-original_mean) < 1e-7
    payload.extend(raw)
    if max(data.shape) == 1:
        break
    for axis in range(3):
        data = reduce_axis(data, axis)

binary = target / 'density.r16f'
binary.write_bytes(payload)
shutil.copyfile(source / 'README.txt', target / 'ORIGINAL-README.txt')
metadata = dict(title='Walt Disney Animation Studios Cloud Data Set, sixteenth resolution',
    sourceURL='https://assets.disneyanimation.com/wdas_cloud.zip',
    sourceMember='wdas_cloud/wdas_cloud_sixteenth.vdb',
    sourceSHA256=hashlib.sha256((source/'wdas_cloud_sixteenth.vdb').read_bytes()).hexdigest(),
    copyright='Copyright 2017 Disney Enterprises, Inc.',
    license='CC BY-SA 3.0', licenseURL='https://creativecommons.org/licenses/by-sa/3.0/',
    photographicReference='Kevin Udy, https://coclouds.com/436/cumulus/2012-07-26/',
    modifications='Dense float16 grid, one-voxel zero border, conservative cell-average mipmaps; original shape and aspect ratio retained.',
    scope='Independent authored volume control based on a photograph, not measured atmospheric condensate or a live weather simulation.',
    originalIndexBounds=[lower.tolist(), upper.tolist()], voxelSize=list(grid.transform.voxelSize()),
    format='r16float little endian; x fastest, then y, then z; concatenated mip levels',
    sha256=hashlib.sha256(payload).hexdigest(), levels=levels)
(target/'metadata.json').write_text(json.dumps(metadata, indent=2)+'\n')
print(json.dumps(metadata, indent=2))
