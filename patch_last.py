import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_str = """          {/* AttackMap */}
          {scanResult && (
            <div className={
              isMapExpanded 
                ? "fixed inset-0 z-[100] bg-[#03060f]/95 backdrop-blur-xl p-8 lg:p-12 overflow-y-auto flex flex-col gap-6 animate-fade-in-up"
                : "col-span-1 lg:col-span-2 flex flex-col gap-6 animate-fade-in-up"
            }>
              <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-semibold tracking-wider text-slate-300">Attack Surface</h2>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 shadow-sm">
                    <button 
                      onClick={() => setAttackMapMode("interactive")} 
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${attackMapMode === 'interactive' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      Interactive Flow
                    </button>
                    <button 
                      onClick={() => setAttackMapMode("topology")} 
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${attackMapMode === 'topology' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      Topology Grid
                    </button>
                  </div>
                  <button
                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-slate-700 transition shadow-lg"
                  >
                    {isMapExpanded ? "Collapse View" : "Expand Full Screen"}
                  </button>
                </div>
              </div>
              
              <div className={`-mt-6 flex flex-col flex-1 ${isMapExpanded ? "min-h-[85vh] [&>div]:flex-1" : ""}`}>
                {attackMapMode === "interactive" ? (
                  <ReactAttackMap graphData={scanResult.graph_data} />
                ) : (
                  <div className="mt-8"> {/* Give it the same spacing as ReactAttackMap */}
                    <AttackMap chart={scanResult.mermaid_syntax} />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {isScanning && !scanResult && ("""

    old_str = """          {/* AttackMap */}
          {scanResult ? (
            <div className="col-span-1 lg:col-span-2 flex flex-col gap-6 animate-fade-in-up">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-semibold tracking-wider text-slate-300">Attack Surface</h2>
                <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 shadow-sm">
                  <button 
                    onClick={() => setAttackMapMode("interactive")} 
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${attackMapMode === 'interactive' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    Interactive Flow
                  </button>
                  <button 
                    onClick={() => setAttackMapMode("topology")} 
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${attackMapMode === 'topology' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    Topology Grid
                  </button>
                </div>
              </div>
              
              <div className="-mt-6">
                {attackMapMode === "interactive" ? (
                  <ReactAttackMap graphData={scanResult.graph_data} />
                ) : (
                  <div className="mt-8"> {/* Give it the same spacing as ReactAttackMap */}
                    <AttackMap chart={scanResult.mermaid_syntax} />
                  </div>
                )}
              </div>
            </div>
          ) : isScanning ? ("""

    content = content.replace(old_str, new_str)
    
    empty_state_str = """              </div>
            </div>
          ) : ("""
          
    content = content.replace(empty_state_str, """              </div>
            </div>
          )}
          
          {!isScanning && !scanResult && (""")

    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    patch_file('/home/sameer/Desktop/hacky/frontend/src/app/page.tsx')
