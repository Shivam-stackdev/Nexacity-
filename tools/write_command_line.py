#!/usr/bin/env python3
"""Write Godot Android's binary assets/_cl_ command-line format."""
from __future__ import annotations

import struct
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) < 3:
        raise SystemExit("usage: write_command_line.py OUTPUT ARG [ARG ...]")
    output = Path(sys.argv[1])
    args = sys.argv[2:]
    payload = bytearray(struct.pack("<I", len(args)))
    for arg in args:
        encoded = arg.encode("utf-8")
        payload.extend(struct.pack("<I", len(encoded)))
        payload.extend(encoded)
    output.write_bytes(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
