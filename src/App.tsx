  // Archivo: src/App.tsx
  import React, { useRef, useEffect, useState } from 'react'
  import * as d3 from 'd3'
  
  interface Person {
    name: string
    gender: 'M' | 'F'
  }
  
  interface FamilyTree {
    parents: [Person, Person]
    child: Person
  }
  
  const trees: FamilyTree[] = [
    { parents: [{ name: 'Carlos', gender: 'M' }, { name: 'Ana', gender: 'F' }], child: { name: 'Lucía', gender: 'F' } },
    { parents: [{ name: 'Tomás', gender: 'M' }, { name: 'Laura', gender: 'F' }], child: { name: 'Nico', gender: 'M' } },
    { parents: [{ name: 'Jorge', gender: 'M' }, { name: 'Rosa', gender: 'F' }], child: { name: 'Emilia', gender: 'F' } },
    { parents: [{ name: 'Mateo', gender: 'M' }, { name: 'Clara', gender: 'F' }], child: { name: 'Sofía', gender: 'F' } },
    { parents: [{ name: 'Pedro', gender: 'M' }, { name: 'Marta', gender: 'F' }], child: { name: 'Juan', gender: 'M' } },
    { parents: [{ name: 'Diego', gender: 'M' }, { name: 'Paula', gender: 'F' }], child: { name: 'Isabela', gender: 'F' } },
    { parents: [{ name: 'Raúl', gender: 'M' }, { name: 'Camila', gender: 'F' }], child: { name: 'Elena', gender: 'F' } },
    { parents: [{ name: 'Lucas', gender: 'M' }, { name: 'Sara', gender: 'F' }], child: { name: 'Leo', gender: 'M' } }
  ]
  
  export default function App() {
    const ref = useRef<SVGSVGElement | null>(null)
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
    useEffect(() => {
      const svg = d3.select(ref.current)
      svg.selectAll('*').remove()
    
      const width = window.innerWidth
      const height = window.innerHeight
      
      const svgGroup = svg.append('g')
    
      // 🔹 Variables para suavizado
      let currentTransform = d3.zoomIdentity
      let targetTransform = d3.zoomIdentity
      let isDragging = false
    
      const updateTransform = () => {
        svgGroup.attr('transform', currentTransform)
      }
    
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3])
        .on('start', () => {
          isDragging = true
        })
        .on('zoom', (event) => {
          // Durante el arrastre, aplicar directamente para respuesta inmediata
          if (isDragging) {
            currentTransform = event.transform
            targetTransform = event.transform
            updateTransform()
          } else {
            // Cuando no se arrastra (por ejemplo, zoom programático), solo actualizar target
            targetTransform = event.transform
          }
        })
        .on('end', () => {
          isDragging = false
          // Sincronizar currentTransform con targetTransform al soltar
          currentTransform = targetTransform
        })
        .filter((event) => {
          return !event.button || event.type === 'wheel'
        })
    
      svg.call(zoom as any)
    
      // Hacer que el zoom se centre en el mouse
      svg.on('wheel', (event) => {
        event.preventDefault()
        const point = d3.pointer(event)
        const direction = event.deltaY > 0 ? 1 : -1
        const zoomFactor = 1 + direction * 0.2
        const transform = d3.zoomTransform(svg.node() as any)
        const newTransform = transform.translate(point[0], point[1]).scale(zoomFactor).translate(-point[0], -point[1])
        targetTransform = newTransform
        svg.call(zoom.transform as any, newTransform)
      })
    
      // 🔹 Animación suave con interpolación
      const animate = () => {
        if (!isDragging) {
          // Interpolación suave de la transformación
          const dx = targetTransform.x - currentTransform.x
          const dy = targetTransform.y - currentTransform.y
          const dk = targetTransform.k - currentTransform.k
          
          // Factor de suavizado (0.1 = muy suave, 0.3 = más rápido)
          const smoothFactor = 0.15
          
          currentTransform = d3.zoomIdentity
            .translate(
              currentTransform.x + dx * smoothFactor,
              currentTransform.y + dy * smoothFactor
            )
            .scale(currentTransform.k + dk * smoothFactor)
          
          // Detener animación cuando esté muy cerca del objetivo
          if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dk) < 0.001) {
            currentTransform = targetTransform
          }
          
          updateTransform()
        }
        
        requestAnimationFrame(animate)
      }
      
      animate()
    
      // 🔹 Renderizado de árboles
      trees.forEach((tree) => {
        const x = (Math.random() * width * 2) - width / 2
        const y = (Math.random() * height * 2) - height / 2
    
        const group = svgGroup.append('g').attr('transform', `translate(${x},${y})`)
    
        group.append('circle').attr('r', 20).attr('fill', '#4a90e2')
        group.append('text').attr('y', 40).attr('text-anchor', 'middle').text(tree.child.name).attr('fill', 'var(--fg)')
    
        group.append('line')
          .attr('x1', -30).attr('y1', -30)
          .attr('x2', 0).attr('y2', -10)
          .attr('stroke', '#888')
    
        group.append('line')
          .attr('x1', 30).attr('y1', -30)
          .attr('x2', 0).attr('y2', -10)
          .attr('stroke', '#888')
    
        group.append('circle').attr('cx', -30).attr('cy', -40).attr('r', 10).attr('fill', '#e94e77')
        group.append('text').attr('x', -30).attr('y', -55).attr('text-anchor', 'middle').text(tree.parents[0].name).attr('fill', 'var(--fg)')
    
        group.append('circle').attr('cx', 30).attr('cy', -40).attr('r', 10).attr('fill', '#e94e77')
        group.append('text').attr('x', 30).attr('y', -55).attr('text-anchor', 'middle').text(tree.parents[1].name).attr('fill', 'var(--fg)')
      })
    
      // Mostrar cursor de movimiento al arrastrar (solo con click izquierdo)
      const handleMouseDown = (event: MouseEvent) => {
        // Solo activar con el botón izquierdo (button === 0)
        if (event.button === 0) {
          document.body.classList.add('dragging')
        }
      }
      
      const handleMouseUp = (event: MouseEvent) => {
        // Solo quitar con el botón izquierdo (button === 0)
        if (event.button === 0) {
          document.body.classList.remove('dragging')
        }
      }
      
      svg.on('mousedown', handleMouseDown as any)
      document.addEventListener('mouseup', handleMouseUp)
      
      // Limpiar el event listener cuando el componente se desmonte
      return () => {
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [])
    
  
    const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light'
      setTheme(newTheme)
      document.body.classList.toggle('dark', newTheme === 'dark')
    }
  
    return (
      <>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '☾' : '☀'}
        </button>
        <svg ref={ref}></svg>
        <footer>© Potato, 2025. CC BY-NC 4.0</footer>
      </>
    )
  }
  