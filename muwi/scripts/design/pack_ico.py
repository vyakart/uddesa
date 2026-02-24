#!/usr/bin/env python3
from __future__ import annotations

import struct
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) < 4:
        print("Usage: pack_ico.py <output.ico> <png16> <png32> [...]", file=sys.stderr)
        return 1

    out_path = Path(sys.argv[1])
    png_paths = [Path(p) for p in sys.argv[2:]]

    blobs: list[tuple[int, bytes]] = []
    for path in png_paths:
      data = path.read_bytes()
      try:
          size = int(path.stem.split("x")[0])
      except Exception as exc:
          raise SystemExit(f"Could not infer size from filename: {path}") from exc
      blobs.append((size, data))

    blobs.sort(key=lambda x: x[0])

    count = len(blobs)
    header = struct.pack("<HHH", 0, 1, count)
    entries = bytearray()
    offset = 6 + (16 * count)
    images = bytearray()

    for size, data in blobs:
        dim = 0 if size >= 256 else size
        entries.extend(
            struct.pack(
                "<BBBBHHII",
                dim,
                dim,
                0,   # palette colors
                0,   # reserved
                1,   # planes
                32,  # bit depth
                len(data),
                offset,
            )
        )
        images.extend(data)
        offset += len(data)

    out_path.write_bytes(header + entries + images)
    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
