<script setup lang="ts">
import type { Character } from '~/core/types'

interface Relation {
  id: string
  from_character_id: string
  to_character_id: string
  relation_type: string
  description?: string
}

const props = defineProps<{
  characters: Character[]
  relations: Relation[]
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const width = ref(600)
const height = ref(400)

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#14b8a6',
]

function getColor(index: number) {
  return COLORS[index % COLORS.length]
}

interface GraphNode {
  id: string
  name: string
  color: string
  x: number
  y: number
  vx: number
  vy: number
}

interface GraphEdge {
  source: string
  target: string
  label: string
  description: string
}

const nodes = computed<GraphNode[]>(() =>
  props.characters.map((c, i) => ({
    id: c.id,
    name: c.name,
    color: getColor(i),
    x: width.value / 2 + Math.cos((i * 2 * Math.PI) / props.characters.length) * 150,
    y: height.value / 2 + Math.sin((i * 2 * Math.PI) / props.characters.length) * 120,
    vx: 0,
    vy: 0,
  })),
)

const edges = computed<GraphEdge[]>(() =>
  props.relations.map(r => ({
    source: r.from_character_id,
    target: r.to_character_id,
    label: r.relation_type,
    description: r.description || '',
  })),
)

const simNodes = ref<GraphNode[]>([])
const simEdges = ref<GraphEdge[]>([])
const dragging = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

watch([nodes, edges], () => {
  simNodes.value = nodes.value.map(n => ({ ...n }))
  simEdges.value = edges.value.map(e => ({ ...e }))
  runSimulation()
}, { immediate: true })

function runSimulation() {
  const nodeMap = new Map(simNodes.value.map(n => [n.id, n]))
  const iterations = 100
  const repulsion = 8000
  const attraction = 0.005
  const idealLength = 160
  const damping = 0.9

  for (let iter = 0; iter < iterations; iter++) {
    for (const n of simNodes.value) { n.vx = 0; n.vy = 0 }

    for (let i = 0; i < simNodes.value.length; i++) {
      for (let j = i + 1; j < simNodes.value.length; j++) {
        const a = simNodes.value[i]
        const b = simNodes.value[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const force = repulsion / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx -= fx; a.vy -= fy
        b.vx += fx; b.vy += fy
      }
    }

    for (const edge of simEdges.value) {
      const s = nodeMap.get(edge.source)
      const t = nodeMap.get(edge.target)
      if (!s || !t) continue
      const dx = t.x - s.x
      const dy = t.y - s.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const force = (dist - idealLength) * attraction
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      s.vx += fx; s.vy += fy
      t.vx -= fx; t.vy -= fy
    }

    for (const n of simNodes.value) {
      const cx = n.x - width.value / 2
      const cy = n.y - height.value / 2
      n.vx -= cx * 0.001
      n.vy -= cy * 0.001
    }

    for (const n of simNodes.value) {
      n.vx *= damping
      n.vy *= damping
      n.x += n.vx
      n.y += n.vy
      n.x = Math.max(30, Math.min(width.value - 30, n.x))
      n.y = Math.max(30, Math.min(height.value - 30, n.y))
    }
  }
}

function getNodeById(id: string) {
  return simNodes.value.find(n => n.id === id)
}

function edgePath(edge: GraphEdge) {
  const s = getNodeById(edge.source)
  const t = getNodeById(edge.target)
  if (!s || !t) return ''
  return `M ${s.x} ${s.y} L ${t.x} ${t.y}`
}

function edgeLabelPos(edge: GraphEdge) {
  const s = getNodeById(edge.source)
  const t = getNodeById(edge.target)
  if (!s || !t) return { x: 0, y: 0 }
  return { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 }
}

function onMouseDown(e: MouseEvent, nodeId: string) {
  dragging.value = nodeId
  const node = getNodeById(nodeId)
  if (!node || !svgRef.value) return
  const rect = svgRef.value.getBoundingClientRect()
  dragOffset.value = { x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y }
}

function onMouseMove(e: MouseEvent) {
  if (!dragging.value || !svgRef.value) return
  const node = getNodeById(dragging.value)
  if (!node) return
  const rect = svgRef.value.getBoundingClientRect()
  node.x = Math.max(30, Math.min(width.value - 30, e.clientX - rect.left - dragOffset.value.x))
  node.y = Math.max(30, Math.min(height.value - 30, e.clientY - rect.top - dragOffset.value.y))
}

function onMouseUp() {
  dragging.value = null
}

onMounted(() => {
  if (svgRef.value) {
    const parent = svgRef.value.parentElement
    if (parent) {
      width.value = parent.clientWidth
      height.value = Math.max(300, Math.min(500, parent.clientWidth * 0.6))
    }
  }
})
</script>

<template>
  <div class="w-full overflow-hidden rounded-xl border border-zinc-200/60 bg-white">
    <svg
      ref="svgRef"
      :width="width"
      :height="height"
      class="w-full"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 7"
          refX="25"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>

      <!-- Edges -->
      <g v-for="(edge, i) in simEdges" :key="`edge-${i}`">
        <path
          :d="edgePath(edge)"
          fill="none"
          stroke="#cbd5e1"
          stroke-width="1.5"
          marker-end="url(#arrowhead)"
        />
        <text
          :x="edgeLabelPos(edge).x"
          :y="edgeLabelPos(edge).y - 6"
          text-anchor="middle"
          class="text-[10px] fill-zinc-500 pointer-events-none select-none"
        >
          {{ edge.label }}
        </text>
      </g>

      <!-- Nodes -->
      <g
        v-for="node in simNodes"
        :key="node.id"
        class="cursor-grab active:cursor-grabbing"
        @mousedown.prevent="onMouseDown($event, node.id)"
      >
        <circle
          :cx="node.x"
          :cy="node.y"
          r="20"
          :fill="node.color"
          opacity="0.15"
        />
        <circle
          :cx="node.x"
          :cy="node.y"
          r="14"
          :fill="node.color"
          class="transition-all"
        />
        <text
          :x="node.x"
          :y="node.y + 1"
          text-anchor="middle"
          dominant-baseline="central"
          class="text-[9px] fill-white font-bold pointer-events-none select-none"
        >
          {{ node.name.slice(0, 2) }}
        </text>
        <text
          :x="node.x"
          :y="node.y + 30"
          text-anchor="middle"
          class="text-[11px] fill-zinc-700 font-medium pointer-events-none select-none"
        >
          {{ node.name }}
        </text>
      </g>
    </svg>
  </div>
</template>
