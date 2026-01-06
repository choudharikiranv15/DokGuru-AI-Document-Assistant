import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'sans-serif'
})

export default function MermaidRenderer({ chart }) {
    const ref = useRef(null)

    useEffect(() => {
        const renderChart = async () => {
            if (ref.current && chart) {
                try {
                    // Unique ID for this render
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
                    
                    // Render returns an object with svg property
                    const { svg } = await mermaid.render(id, chart)
                    
                    if (ref.current) {
                        ref.current.innerHTML = svg
                    }
                } catch (e) {
                    console.error("Mermaid render error:", e)
                    if (ref.current) {
                        ref.current.innerHTML = `<div class="text-red-400 p-4 bg-red-500/10 rounded">Failed to render diagram. Please try regenerating.</div>`
                    }
                }
            }
        }

        renderChart()
    }, [chart])

    return (
        <div 
            ref={ref} 
            className="w-full overflow-x-auto flex justify-center p-4 bg-gray-900/50 rounded-xl border border-white/5" 
        />
    )
}
