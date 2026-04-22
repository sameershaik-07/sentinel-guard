import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Add state
    if 'const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);' not in content:
        content = content.replace(
            'const [attackMapMode, setAttackMapMode] = useState<"interactive" | "topology">("interactive");',
            'const [attackMapMode, setAttackMapMode] = useState<"interactive" | "topology">("interactive");\n  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);'
        )

    # Wrap the parent with conditional exact string
    # We replace from {scanResult && ( \n <div className="col-span-...
    
    old_top = '          {scanResult && (\n            <div className="col-span-1 lg:col-span-2 flex flex-col gap-6 animate-fade-in-up">\n              <div className="flex justify-between items-center px-2">\n                <h2 className="text-sm font-semibold tracking-wider text-slate-300">Attack Surface</h2>\n                <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 shadow-sm">'
    
    new_top = '''          {scanResult && (
            <div className={
              isMapExpanded 
                ? "fixed inset-0 z-[100] bg-[#03060f]/95 backdrop-blur-xl p-8 lg:p-12 overflow-y-auto flex flex-col gap-6 animate-fade-in-up"
                : "col-span-1 lg:col-span-2 flex flex-col gap-6 animate-fade-in-up"
            }>
              <div className="flex justify-between items-center px-2">
                <h2 className="text-sm font-semibold tracking-wider text-slate-300">Attack Surface</h2>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 shadow-sm">'''
                  
    content = content.replace(old_top, new_top)

    old_mid = '''                  </button>
                </div>
              </div>
              
              <div className="-mt-6">'''
              
    new_mid = '''                  </button>
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
              
    content = content.replace(old_mid, new_mid)
    
    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    patch_file('/home/sameer/Desktop/hacky/frontend/src/app/page.tsx')
