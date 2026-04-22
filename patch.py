import sys

def patch_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # Step 1: Replace scanResult ? with scanResult && (
        content = content.replace('{scanResult ? (', '{scanResult && (')
        print("Patched start.")

        # Step 2: Remove the empty state entirely.
        start_str = "              </div>\n            </div>\n          ) : isScanning ? ("
        end_str = '            </div>\n          )}'
        
        # We need to find the specific ending for our empty state, there's multiple blocks
        idx1 = content.find(start_str)
        if idx1 != -1:
            # find next closing of the block
            idx2 = content.find(end_str, idx1)
            if idx2 != -1:
                replacement_text = "              </div>\n            </div>\n          )}"
                content = content[:idx1] + replacement_text + content[idx2 + len(end_str):]
                print("Patched end.")

        with open(filepath, 'w') as f:
            f.write(content)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    patch_file('/home/sameer/Desktop/hacky/frontend/src/app/page.tsx')
