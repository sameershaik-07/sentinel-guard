import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if 'Topology Grid</button>' in line.replace(' ', '').replace('\\n', ''):
            out.append(line)
            i += 1
            out.append(lines[i]) # </div>
            i += 1
            
            # The next should be closing div for flex items-center
            out.append('                <button\n                  onClick={() => setIsMapExpanded(!isMapExpanded)}\n                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-slate-700 transition"\n                >\n                  {isMapExpanded ? "Collapse View" : "Expand Full Screen"}\n                </button>\n')
            
            out.append(lines[i]) # </div>
            i += 1
            
            if lines[i].strip() == '': # empty line
                out.append(lines[i])
                i += 1
            
            if 'className="-mt-6"' in lines[i]:
                out.append('              <div className={`-mt-6 flex flex-col flex-1 ${isMapExpanded ? "min-h-[85vh] [&>div]:flex-1" : ""}`}>\n')
                i += 1
                continue
                
        out.append(line)
        i += 1

    with open(filepath, 'w') as f:
        f.writelines(out)

if __name__ == "__main__":
    patch_file('/home/sameer/Desktop/hacky/frontend/src/app/page.tsx')
