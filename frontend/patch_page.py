import re

with open("frontend/src/app/page.tsx", "r") as f:
    code = f.read()

# Replace the specific "isScanning ? (... skeleton ...) : (... empty map ...)" block at the end of the AttackMap section.
# We'll use regex to delete everything from ") : isScanning ? (" up to the matching closing bracket for the main grid.
# The `ScanResult && (` will correctly only render the map if the scanResult exists.

# Search for the start of the AttackMap shimmer block
pattern = r"\) \: isScanning \? \([\s\S]*?Visual Attack Map[\s\S]*?interactive threat topology graph\.[\s\S]*?\<\/p\>[\s\S]*?\<\/div\>[\s\S]*?\<\/div\>[\s\S]*?\)\}"

# We replace it with nothing! Because scanResult && ( automatically handles the false state by rendering nothing.
new_code = re.sub(pattern, "", code)

with open("frontend/src/app/page.tsx", "w") as f:
    f.write(new_code)
