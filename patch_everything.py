import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. State is already added, but I can add it if missing just in case
    # 2. Re-implement the scanResult && ( pattern PLUS the isMapExpanded pattern
    
    start_str = "          {scanResult ? (\n            <div className=\"col-span-1 lg:col-span-2 flex flex-col gap-6 animate-fade-in-up\">\n              <div className=\"flex justify-between items-center px-2\">\n                <h2 className=\"text-sm font-semibold tracking-wider text-slate-300\">Attack Surface</h2>\n                <div className=\"flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 shadow-sm\">"

    new_start_str = """          {scanResult && (
            <div className={
              isMapExpanded 
                ? "fixed inset-0 z-[100] bg-[#03060f]/95 backdrop-blur-xl p-8 lg:p-12 overflow-y-auto flex flex-col gap-6 animate-fade-in-up"
                : "col-span-1 lg:col-span-2 flex flex-col gap-6 animate-fade-in-up"
            }>
              <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-semibold tracking-wider text-slate-300">Attack Surface</h2>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 shadow-sm">"""
                  
    content = content.replace(start_str, new_start_str)

    mid_str = """                  <button 
                    onClick={() => setAttackMapMode("topology")} 
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${attackMapMode === 'topology' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    Topology Grid
                  </button>
                </div>
              </div>
              
              <div className="-mt-6">"""

    new_mid_str = """                  <button 
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
              
              <div className={`-mt-6 flex flex-col flex-1 ${isMapExpanded ? "min-h-[85vh] [&>div]:flex-1" : ""}`}>"""

    content = content.replace(mid_str, new_mid_str)

    # 3. Strip out the massive empty states at the bottom to restore the scanResult && fix
    empty_state_str = """              </div>
            </div>
          ) : isScanning ? ("""
          
    end_of_empty_state = """                Run a scan to generate an interactive threat topology graph.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Lower section"""
        
    idx1 = content.find(empty_state_str)
    idx2 = content.find(end_of_empty_state)
    
    if idx1 != -1 and idx2 != -1:
        content = content[:idx1] + """              </div>
            </div>
          )}
        </div>

        {/* ── Lower section""" + content[idx2 + len(end_of_empty_state):]

    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    patch_file('/home/sameer/Desktop/hacky/frontend/src/app/page.tsx')
