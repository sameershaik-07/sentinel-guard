import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the exact string around 216-221
    old = '                  <button \n                    onClick={() => setAttackMapMode("topology")} \n                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${attackMapMode === \'topology\' ? \'bg-cyan-500/20 text-cyan-300\' : \'text-slate-400 hover:text-slate-300\'}`}\n                  >\n                    Topology Grid\n                  </button>\n                </div>\n              </div>\n              \n              <div className="-mt-6">'

    new = '''                  <button 
                    onClick={() => setAttackMapMode("topology")} 
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${attackMapMode === 'topology' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    Topology Grid
                  </button>
                  </div>
                  <button
                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-slate-700 transition"
                  >
                    {isMapExpanded ? "Collapse View" : "Expand Full Screen"}
                  </button>
                </div>
              </div>
              
              <div className={`-mt-6 flex flex-col flex-1 ${isMapExpanded ? "min-h-[85vh] [&>div]:flex-1" : ""}`}>'''
              
    content = content.replace(old, new)
    
    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    patch_file('/home/sameer/Desktop/hacky/frontend/src/app/page.tsx')
