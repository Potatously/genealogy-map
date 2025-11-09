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
  
    // Variables para sistema de zoom suave tipo Google Maps
    let currentTransform = d3.zoomIdentity
    let targetTransform = d3.zoomIdentity
    let velocity = { x: 0, y: 0 }
    let isDragging = false
    let lastDragTime = 0
    let lastDragPos = { x: 0, y: 0 }
  
    const updateTransform = () => {
      svgGroup.attr('transform', currentTransform.toString())
    }
  
    // Función de easing para transiciones suaves
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
  
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('start', (event) => {
        isDragging = true
        velocity = { x: 0, y: 0 }
        lastDragTime = Date.now()
        const point = d3.pointer(event.sourceEvent)
        lastDragPos = { x: point[0], y: point[1] }
      })
      .on('zoom', (event) => {
        if (isDragging) {
          const now = Date.now()
          const dt = now - lastDragTime
          const point = d3.pointer(event.sourceEvent)
          
          if (dt > 0) {
            velocity.x = (event.transform.x - currentTransform.x) / dt
            velocity.y = (event.transform.y - currentTransform.y) / dt
          }
          
          currentTransform = event.transform
          targetTransform = event.transform
          lastDragTime = now
          lastDragPos = { x: point[0], y: point[1] }
          updateTransform()
        } else {
          targetTransform = event.transform
        }
      })
      .on('end', () => {
        isDragging = false
        
        // Aplicar inercia al soltar
        const inertiaFactor = 50
        targetTransform = d3.zoomIdentity
          .translate(
            currentTransform.x + velocity.x * inertiaFactor,
            currentTransform.y + velocity.y * inertiaFactor
          )
          .scale(currentTransform.k)
      })
      .filter((event) => {
        return !event.button || event.type === 'wheel'
      })
  
    svg.call(zoom as any)
  
    // Zoom centrado en el cursor con wheel
    svg.on('wheel', (event) => {
      event.preventDefault()
      const point = d3.pointer(event)
      const direction = event.deltaY > 0 ? 0.9 : 1.1
      const transform = d3.zoomTransform(svg.node() as any)
      
      // Calcular nueva escala
      let newScale = transform.k * direction
      newScale = Math.max(0.3, Math.min(4, newScale))
      
      // Calcular punto focal para zoom centrado
      const x = point[0]
      const y = point[1]
      const newX = x - (x - transform.x) * (newScale / transform.k)
      const newY = y - (y - transform.y) * (newScale / transform.k)
      
      const newTransform = d3.zoomIdentity
        .translate(newX, newY)
        .scale(newScale)
      
      targetTransform = newTransform
      svg.transition()
        .duration(100)
        .ease(d3.easeCubicOut)
        .call(zoom.transform as any, newTransform)
    })
  
    // Animación suave con interpolación avanzada
    const animate = () => {
      if (!isDragging) {
        const dx = targetTransform.x - currentTransform.x
        const dy = targetTransform.y - currentTransform.y
        const dk = targetTransform.k - currentTransform.k
        
        // Factor de suavizado adaptativo
        const distance = Math.sqrt(dx * dx + dy * dy)
        const smoothFactor = distance > 100 ? 0.08 : 0.12
        
        currentTransform = d3.zoomIdentity
          .translate(
            currentTransform.x + dx * smoothFactor,
            currentTransform.y + dy * smoothFactor
          )
          .scale(currentTransform.k + dk * smoothFactor)
        
        // Detener animación cuando esté cerca del objetivo
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(dk) < 0.0001) {
          currentTransform = targetTransform
          velocity = { x: 0, y: 0 }
        }
        
        updateTransform()
      }
      
      requestAnimationFrame(animate)
    }
    
    animate()
  
    // Renderizado de árboles genealógicos con diseño minimalista
    trees.forEach((tree, treeIndex) => {
      const x = (Math.random() * width * 2) - width / 2
      const y = (Math.random() * height * 2) - height / 2
  
      const group = svgGroup.append('g')
        .attr('transform', `translate(${x},${y})`)
        .attr('class', 'tree-group')
  
      // Crear partículas para conexiones
      const particleCount = 8
      const particles: any[] = []
      
      // Líneas de conexión con partículas (izquierda)
      const leftLine = group.append('line')
        .attr('x1', -35)
        .attr('y1', -45)
        .attr('x2', 0)
        .attr('y2', -15)
        .attr('stroke', 'var(--line-color)')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.6)
        .attr('class', 'connection-line')
      
      // Líneas de conexión con partículas (derecha)
      const rightLine = group.append('line')
        .attr('x1', 35)
        .attr('y1', -45)
        .attr('x2', 0)
        .attr('y2', -15)
        .attr('stroke', 'var(--line-color)')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.6)
        .attr('class', 'connection-line')
      
      // Crear partículas animadas en las líneas
      for (let i = 0; i < particleCount; i++) {
        const delay = (i / particleCount) * 3000
        
        // Partículas línea izquierda
        const leftParticle = group.append('circle')
          .attr('r', 2)
          .attr('fill', 'var(--particle-color)')
          .attr('opacity', 0)
          .attr('class', 'particle')
        
        const animateLeftParticle = () => {
          leftParticle
            .attr('cx', -35)
            .attr('cy', -45)
            .attr('opacity', 0)
            .transition()
            .duration(2000)
            .delay(delay)
            .ease(d3.easeLinear)
            .attr('cx', 0)
            .attr('cy', -15)
            .attr('opacity', 0.8)
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .on('end', () => {
              setTimeout(animateLeftParticle, 1000)
            })
        }
        animateLeftParticle()
        
        // Partículas línea derecha
        const rightParticle = group.append('circle')
          .attr('r', 2)
          .attr('fill', 'var(--particle-color)')
          .attr('opacity', 0)
          .attr('class', 'particle')
        
        const animateRightParticle = () => {
          rightParticle
            .attr('cx', 35)
            .attr('cy', -45)
            .attr('opacity', 0)
            .transition()
            .duration(2000)
            .delay(delay)
            .ease(d3.easeLinear)
            .attr('cx', 0)
            .attr('cy', -15)
            .attr('opacity', 0.8)
            .transition()
            .duration(300)
            .attr('opacity', 0)
            .on('end', () => {
              setTimeout(animateRightParticle, 1000)
            })
        }
        animateRightParticle()
      }
      
      // Nodo hijo (más grande)
      const childNode = group.append('g')
        .attr('class', 'node child-node')
      
      childNode.append('circle')
        .attr('r', 24)
        .attr('fill', 'none')
        .attr('stroke', 'var(--node-stroke)')
        .attr('stroke-width', 2)
        .attr('class', 'node-circle')
      
      childNode.append('text')
        .attr('y', 45)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', '500')
        .text(tree.child.name)
        .attr('fill', 'var(--fg)')
        .attr('class', 'node-label')
      
      // Padre izquierdo
      const leftParent = group.append('g')
        .attr('class', 'node parent-node')
        .attr('transform', 'translate(-35, -45)')
      
      leftParent.append('circle')
        .attr('r', 14)
        .attr('fill', 'none')
        .attr('stroke', 'var(--node-stroke)')
        .attr('stroke-width', 1.5)
        .attr('class', 'node-circle')
      
      leftParent.append('text')
        .attr('y', -22)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '400')
        .text(tree.parents[0].name)
        .attr('fill', 'var(--fg-secondary)')
        .attr('class', 'node-label')
      
      // Padre derecho
      const rightParent = group.append('g')
        .attr('class', 'node parent-node')
        .attr('transform', 'translate(35, -45)')
      
      rightParent.append('circle')
        .attr('r', 14)
        .attr('fill', 'none')
        .attr('stroke', 'var(--node-stroke)')
        .attr('stroke-width', 1.5)
        .attr('class', 'node-circle')
      
      rightParent.append('text')
        .attr('y', -22)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '400')
        .text(tree.parents[1].name)
        .attr('fill', 'var(--fg-secondary)')
        .attr('class', 'node-label')
      
      // Hover effect en todo el grupo
      group
        .style('cursor', 'pointer')
        .on('mouseenter', function() {
          d3.select(this).selectAll('.node-circle')
            .transition()
            .duration(200)
            .attr('stroke-width', function() {
              return d3.select(this.parentNode).classed('child-node') ? 3 : 2.5
            })
          
          d3.select(this).selectAll('.connection-line')
            .transition()
            .duration(200)
            .attr('opacity', 1)
            .attr('stroke-width', 2)
        })
        .on('mouseleave', function() {
          d3.select(this).selectAll('.node-circle')
            .transition()
            .duration(200)
            .attr('stroke-width', function() {
              return d3.select(this.parentNode).classed('child-node') ? 2 : 1.5
            })
          
          d3.select(this).selectAll('.connection-line')
            .transition()
            .duration(200)
            .attr('opacity', 0.6)
            .attr('stroke-width', 1.5)
        })
    })
  
    // Control de cursor para arrastre
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        document.body.classList.add('grabbing')
      }
    }
    
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        document.body.classList.remove('grabbing')
      }
    }
    
    svg.on('mousedown', handleMouseDown as any)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])
  

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.body.classList.toggle('dark', newTheme === 'dark')
    document.body.classList.toggle('light', newTheme === 'light')
  }

  return (
    <>
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
        {theme === 'light' ? '☾' : '☀'}
      </button>
      <svg ref={ref}></svg>
      <footer>© Potato, 2025. CC BY-NC 4.0</footer>
    </>
  )
}