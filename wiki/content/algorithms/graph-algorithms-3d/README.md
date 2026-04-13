---
title: Graph Algorithms for 3D Applications
category: algorithms
tags: [algorithms, graph, pathfinding, A-star, nav-mesh, topology]
description: "Graph algorithms essential for 3D: pathfinding (A*), navigation meshes, scene graph traversal, and topology optimization."
related: [algorithms/spatial-data-structures, game-engines/unity/performance-optimization]
order: 3
---

# Graph Algorithms for 3D Applications

3D applications fundamentally rely on graph structures: scene hierarchies, navigation meshes, connectivity analysis. Efficient algorithms on these graphs determine responsiveness and capability.

## Pathfinding: A* Algorithm

A* finds shortest path from start to goal using heuristic guidance. Dramatically faster than exhaustive search like Dijkstra when good heuristic available.

### Core Algorithm

```python
import heapq
from collections import defaultdict

class AStarPathfinder:
  def __init__(self, graph):
    self.graph = graph  # Adjacency list: node -> list of (neighbor, cost)
  
  def heuristic(self, node, goal):
    # Estimate cost from node to goal (must underestimate for optimality)
    # For 3D: Euclidean distance * average move cost
    return (node - goal).length() * 1.0
  
  def find_path(self, start, goal):
    open_set = [(0, start)]  # Priority queue: (f_cost, node)
    came_from = {}  # Track path
    g_cost = defaultdict(lambda: float('inf'))
    g_cost[start] = 0
    
    visited = set()
    
    while open_set:
      _, current = heapq.heappop(open_set)
      
      if current == goal:
        # Reconstruct path
        path = []
        while current in came_from:
          path.append(current)
          current = came_from[current]
        path.append(start)
        return path[::-1]
      
      if current in visited:
        continue
      visited.add(current)
      
      # Explore neighbors
      for neighbor, move_cost in self.graph[current]:
        tentative_g = g_cost[current] + move_cost
        
        if tentative_g < g_cost[neighbor]:
          # Found better path to neighbor
          came_from[neighbor] = current
          g_cost[neighbor] = tentative_g
          
          h_cost = self.heuristic(neighbor, goal)
          f_cost = tentative_g + h_cost
          
          heapq.heappush(open_set, (f_cost, neighbor))
    
    return None  # No path found
```

**Key components:**
- **g_cost:** Actual cost from start to current node
- **h_cost:** Heuristic estimate from current to goal
- **f_cost = g + h:** Total estimated cost through this node
- **Priority queue:** Always expand node with lowest f_cost next

**Optimality requirement:** Heuristic must be admissible (never overestimate) for optimal path.

```python
# Admissible heuristics for 3D
def euclidean_heuristic(node, goal):
  return (node - goal).length()  # Never overestimates straight-line distance

def manhattan_heuristic(node, goal):
  # For grid-based movement (4 directions)
  delta = abs(node - goal)
  return delta.x + delta.y + delta.z

def octile_heuristic(node, goal):
  # For 8-directional movement (diagonal allowed)
  delta = abs(node - goal)
  return max(delta.x, delta.y) + math.sqrt(2) - 1) * min(delta.x, delta.y)
```

### Practical Tuning

**Cost function design:**
```python
# Simple: all moves cost 1
def cost(from_node, to_node):
  return 1

# Realistic: distance + terrain difficulty
def cost(from_node, to_node):
  distance = (from_node - to_node).length()
  terrain_factor = get_terrain_difficulty(to_node)  # 0.5 (easy) to 2.0 (difficult)
  return distance * terrain_factor
```

**Bidirectional search:** Start from both goal and start, meet in middle (50% search space reduction).

**Jump point search:** For uniform-cost grids, skip obviously non-optimal nodes without exploring them.

## Navigation Meshes (NavMesh)

NavMesh is coarse graph representing walkable space, enabling fast pathfinding on complex terrain.

### NavMesh Construction

Manually create NavMesh in level editor, or auto-generate from level geometry:

```python
class NavMeshGenerator:
  def __init__(self, max_slope=45):
    self.max_slope = max_slope
  
  def generate_from_mesh(self, mesh):
    # 1. Find walkable faces (slope < max_slope)
    walkable_faces = []
    for face in mesh.faces:
      normal = face.normal
      slope_angle = math.acos(abs(normal.y))  # Angle from vertical
      
      if math.degrees(slope_angle) < self.max_slope:
        walkable_faces.append(face)
    
    # 2. Group connected faces into regions
    regions = self.flood_fill_regions(walkable_faces)
    
    # 3. Create adjacency graph
    graph = self.build_region_graph(regions)
    
    return regions, graph
  
  def flood_fill_regions(self, faces):
    visited = set()
    regions = []
    
    for face in faces:
      if face in visited:
        continue
      
      # BFS to find connected region
      region = []
      queue = [face]
      
      while queue:
        current = queue.pop(0)
        if current in visited:
          continue
        
        visited.add(current)
        region.append(current)
        
        # Find neighboring faces
        for neighbor in self.find_adjacent_faces(current, faces):
          if neighbor not in visited:
            queue.append(neighbor)
      
      if region:
        regions.append(region)
    
    return regions
  
  def find_adjacent_faces(self, face, faces):
    adjacent = []
    for edge in face.edges:
      # Find faces sharing this edge
      for other in faces:
        if other == face:
          continue
        
        if self.edges_match(edge, other.edges):
          adjacent.append(other)
    
    return adjacent
  
  def build_region_graph(self, regions):
    graph = defaultdict(list)
    
    for i, region_a in enumerate(regions):
      for j, region_b in enumerate(regions):
        if i >= j:
          continue
        
        # Check if regions share edge
        shared_edge = self.find_shared_edge(region_a, region_b)
        if shared_edge:
          # Cost = edge length (narrow passages = high cost)
          cost = shared_edge.length()
          graph[i].append((j, cost))
          graph[j].append((i, cost))
    
    return graph
```

### NavMesh Pathfinding

```python
class NavMeshPathfinder:
  def __init__(self, regions, region_graph):
    self.regions = regions
    self.region_graph = region_graph
  
  def find_path(self, start_pos, goal_pos):
    # 1. Find start and goal regions
    start_region = self.find_region_containing(start_pos)
    goal_region = self.find_region_containing(goal_pos)
    
    if start_region is None or goal_region is None:
      return None
    
    # 2. Find region path using A*
    region_path = self.find_region_path(start_region, goal_region)
    if not region_path:
      return None
    
    # 3. Smooth path through portals between regions
    smooth_path = self.smooth_path_through_portals(
      start_pos, 
      region_path, 
      goal_pos
    )
    
    return smooth_path
  
  def find_region_containing(self, pos):
    for i, region in enumerate(self.regions):
      for face in region:
        if face.contains_point(pos):
          return i
    return None
  
  def find_region_path(self, start_region, goal_region):
    # Standard A* on region graph
    pathfinder = AStarPathfinder(self.region_graph)
    return pathfinder.find_path(start_region, goal_region)
  
  def smooth_path_through_portals(self, start_pos, region_path, goal_pos):
    # Funnel algorithm: string-pull path through bottlenecks
    path = [start_pos]
    
    for i in range(len(region_path) - 1):
      # Find portal between region_path[i] and region_path[i+1]
      portal = self.find_portal(region_path[i], region_path[i+1])
      
      # String-pull: find tightest corner through portal
      if portal:
        corner = self.find_corner_through_portal(
          path[-1], 
          portal, 
          goal_pos
        )
        path.append(corner)
    
    path.append(goal_pos)
    return path
```

**Advantages:**
- Paths guaranteed walkable (avoid tiny crevices)
- Fast computation (coarse graph instead of per-point)
- Natural-looking (paths follow terrain contours)

**Disadvantages:**
- Requires manual creation or careful auto-generation
- Doesn't handle dynamic obstacles (moving characters)

## Scene Graph Traversal

Scene graph is hierarchical representation of objects in 3D world.

```
Root
├─ Building A
│  ├─ Floor 1
│  │  ├─ Room 101
│  │  │  ├─ Door
│  │  │  └─ Furniture
│  │  └─ Room 102
│  └─ Floor 2
│     ├─ Room 201
│     └─ Room 202
└─ Building B
   └─ ...
```

### Graph Traversal Patterns

**Depth-First Search (DFS):** Visit deepest nodes first, useful for hierarchical processing.

```python
def dfs_traverse(node):
  process(node)
  for child in node.children:
    dfs_traverse(child)

# Example: collect all meshes in hierarchy
def collect_all_meshes(node):
  meshes = []
  if node.mesh:
    meshes.append(node.mesh)
  
  for child in node.children:
    meshes.extend(collect_all_meshes(child))
  
  return meshes
```

**Breadth-First Search (BFS):** Visit nodes level-by-level, useful for LOD (level-of-detail).

```python
def bfs_traverse(root):
  from collections import deque
  queue = deque([root])
  
  while queue:
    node = queue.popleft()
    process(node)
    
    for child in node.children:
      queue.append(child)

# Example: render nodes front-to-back (painter's algorithm)
def render_front_to_back(root, camera):
  # BFS ensures closer nodes rendered first
  nodes_by_distance = []
  
  queue = deque([(root, distance_to_camera)])
  while queue:
    node, dist = queue.popleft()
    nodes_by_distance.append((dist, node))
    
    for child in node.children:
      child_dist = distance_camera_to_node(child)
      queue.append((child, child_dist))
  
  # Render in order
  for dist, node in sorted(nodes_by_distance):
    render(node)
```

### Culling in Scene Graph

**Frustum culling:** Don't render nodes outside camera view.

```python
def frustum_cull(node, frustum):
  # Quick AABB test against camera frustum
  if not frustum.intersects(node.bounding_box):
    return  # Entire subtree outside view
  
  render(node)
  
  for child in node.children:
    frustum_cull(child, frustum)
```

**Occlusion culling:** Don't render nodes blocked by closer objects.

```python
def occlusion_cull(node, occlusion_map):
  # Check if node's bounding box is fully occluded
  if occlusion_map.is_occluded(node.bounding_box):
    return  # Skip rendering
  
  render(node)
  occlusion_map.update(node)  # Update for children
  
  for child in node.children:
    occlusion_cull(child, occlusion_map)
```

## Mesh Connectivity Analysis

Understanding mesh topology: which edges/faces neighbor each other.

```python
class MeshConnectivityAnalyzer:
  def __init__(self, mesh):
    self.mesh = mesh
    self.build_connectivity()
  
  def build_connectivity(self):
    # Build edge-to-face map
    self.edge_faces = defaultdict(list)
    
    for face_idx, face in enumerate(self.mesh.faces):
      edges = face.edges()
      
      for edge in edges:
        # Normalize edge (smaller index first)
        normalized = tuple(sorted(edge))
        self.edge_faces[normalized].append(face_idx)
    
    # Build vertex-to-edge and vertex-to-face maps
    self.vertex_edges = defaultdict(set)
    self.vertex_faces = defaultdict(set)
    
    for edge, faces in self.edge_faces.items():
      for vertex in edge:
        self.vertex_edges[vertex].add(edge)
      
      for face_idx in faces:
        for vertex in edge:
          self.vertex_faces[vertex].add(face_idx)
  
  def get_neighbors(self, face_idx):
    # Find faces sharing edge with face
    neighbors = set()
    face = self.mesh.faces[face_idx]
    
    for edge in face.edges():
      normalized = tuple(sorted(edge))
      for neighbor_face_idx in self.edge_faces[normalized]:
        if neighbor_face_idx != face_idx:
          neighbors.add(neighbor_face_idx)
    
    return neighbors
  
  def find_connected_component(self, start_face_idx):
    # All faces connected to start via shared edges (BFS)
    visited = set()
    queue = [start_face_idx]
    component = []
    
    while queue:
      face_idx = queue.pop(0)
      if face_idx in visited:
        continue
      
      visited.add(face_idx)
      component.append(face_idx)
      
      for neighbor in self.get_neighbors(face_idx):
        if neighbor not in visited:
          queue.append(neighbor)
    
    return component
  
  def find_boundary_edges(self):
    # Edges with only one adjacent face (boundary)
    boundary = []
    for edge, faces in self.edge_faces.items():
      if len(faces) == 1:
        boundary.append(edge)
    
    return boundary
```

## Topology Optimization

Optimize 3D geometry preserving functionality while minimizing volume.

**Iterative approach:** Remove elements with lowest stress, verify structure still supports loads.

```python
def topology_optimize(mesh, load_cases, max_iterations=50):
  current_mesh = mesh
  
  for iteration in range(max_iterations):
    # 1. FEA analysis: compute stress at each element
    stress = finite_element_analysis(current_mesh, load_cases)
    
    # 2. Identify low-stress elements (removable)
    threshold = compute_stress_threshold(stress)
    removable = [i for i, s in enumerate(stress) if s < threshold]
    
    # 3. Remove elements
    current_mesh = remove_elements(current_mesh, removable)
    
    # 4. Check if structure still valid
    if not verify_structure(current_mesh, load_cases):
      # Revert
      current_mesh = add_back_elements(current_mesh, removable)
      break
  
  return current_mesh
```

## UV Island Packing

Arrange 2D UV coordinates in texture space, avoiding overlaps.

**Problem:** 3D mesh has texture coordinates (UVs); must fit islands into 2D texture atlas without overlapping.

```python
class UVIslandPacker:
  def pack_islands(self, islands, texture_size=1024):
    # Sort by area (pack largest first)
    sorted_islands = sorted(islands, key=lambda i: i.area(), reverse=True)
    
    packed = []
    placement_map = {}  # Records where each island placed
    
    for island in sorted_islands:
      # Find best placement
      best_position = None
      min_wasted_space = float('inf')
      
      for x in range(0, texture_size, 16):  # Grid search
        for y in range(0, texture_size, 16):
          if can_place(island, x, y, texture_size, packed):
            # Calculate wasted space if placed here
            waste = calculate_wasted_space(island, x, y, packed)
            if waste < min_wasted_space:
              min_wasted_space = waste
              best_position = (x, y)
      
      if best_position:
        placement_map[island] = best_position
        packed.append((island, best_position))
      else:
        # Doesn't fit (texture too small)
        return None
    
    return placement_map

def can_place(island, x, y, texture_size, packed_islands):
  # Check if island fits without overlapping
  island_bounds = island.get_bounds()
  
  # Check texture boundary
  if x + island_bounds.width > texture_size:
    return False
  if y + island_bounds.height > texture_size:
    return False
  
  # Check collision with packed islands
  for packed, (px, py) in packed_islands:
    packed_bounds = packed.get_bounds()
    
    if (x < px + packed_bounds.width and
        x + island_bounds.width > px and
        y < py + packed_bounds.height and
        y + island_bounds.height > py):
      return False  # Overlapping
  
  return True
```

**Optimization:** Guillotine algorithm or maximal rectangle approach for faster packing.

Graph algorithms form the computational backbone of 3D applications, from high-level pathfinding to low-level mesh topology analysis. Performance often determined by algorithm selection rather than raw computation speed.
