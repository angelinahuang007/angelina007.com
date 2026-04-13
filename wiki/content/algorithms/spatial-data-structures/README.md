---
title: Spatial Data Structures
category: algorithms
tags: [algorithms, spatial, octree, BSP, R-tree, hash-grid]
description: Construction and querying of spatial data structures including octrees, BSP trees, R-trees, and hash grids for broadphase collision detection and spatial queries.
related: [graphics-fundamentals/acceleration-structures, algorithms/computational-geometry, algorithms/gpu-parallel-computing]
order: 1
---

# Spatial Data Structures

Spatial data structures organize objects by position, enabling rapid queries: "What objects are near point P?" "What objects intersect region R?" "What object does ray R intersect first?" These queries are foundational to graphics, physics, and game AI.

## Octree: Recursive Space Partitioning

Octrees recursively subdivide 3D space into eight equal-sized cubic regions (octants). Perfectly balanced structure guarantees logarithmic lookup depth.

### Construction

```python
class OctreeNode:
  def __init__(self, bounds, max_depth, depth=0):
    self.bounds = bounds  # 3D axis-aligned bounding box
    self.max_depth = max_depth
    self.depth = depth
    self.objects = []
    self.children = None  # Eight child nodes (initially None)
  
  def insert(self, obj, max_objects_per_node=4):
    if len(self.objects) < max_objects_per_node or self.depth >= self.max_depth:
      # Leaf node: store object
      self.objects.append(obj)
    else:
      # Split node
      if self.children is None:
        self.subdivide()
      
      # Insert into appropriate child
      for child in self.children:
        if child.bounds.contains(obj.position):
          child.insert(obj, max_objects_per_node)
          return
      
      # Object spans multiple children; store in parent
      self.objects.append(obj)
  
  def subdivide(self):
    # Create eight child octants
    center = self.bounds.center
    half_size = self.bounds.size / 2
    
    self.children = []
    for i in range(8):
      # Each child represents one octant
      child_min = center + offset_for_octant(i) * half_size
      child_max = child_min + half_size
      child_bounds = AABBox(child_min, child_max)
      child = OctreeNode(child_bounds, self.max_depth, self.depth + 1)
      self.children.append(child)

def offset_for_octant(i):
  # Octants arranged as 2x2x2 cube
  offsets = [
    (-1, -1, -1), (1, -1, -1),
    (-1, 1, -1), (1, 1, -1),
    (-1, -1, 1), (1, -1, 1),
    (-1, 1, 1), (1, 1, 1)
  ]
  return offsets[i]
```

**Time complexity:**
- Insertion: O(log n) average case (recursively subdivide until leaf)
- Range query: O(log n) to identify intersecting octants, then O(k) to examine k objects in those octants

**Space complexity:** O(n) where n is object count

### Octree Queries

**Point query: Find objects containing point P**

```python
def point_query(self, point):
  if not self.bounds.contains(point):
    return []
  
  results = []
  
  # Check objects at this node
  results.extend(self.objects)
  
  # Recursively check children
  if self.children:
    for child in self.children:
      if child.bounds.contains(point):
        results.extend(child.point_query(point))
  
  return results
```

**Range query: Find all objects intersecting axis-aligned box**

```python
def range_query(self, query_box):
  if not self.bounds.intersects(query_box):
    return []
  
  results = []
  
  # Check objects at this node
  for obj in self.objects:
    if query_box.contains(obj.position):
      results.append(obj)
  
  # Recursively check intersecting children
  if self.children:
    for child in self.children:
      if child.bounds.intersects(query_box):
        results.extend(child.range_query(query_box))
  
  return results
```

**Nearest neighbor query: Find k closest objects to point P**

```python
def nearest_neighbor_query(self, point, k=1):
  # Use priority queue (max-heap) to track k closest
  import heapq
  
  closest = []  # heap of (-distance, object)
  
  def recurse(node):
    if not node.bounds.intersects_sphere(point, max_search_radius):
      return  # Prune branches outside search radius
    
    # Check objects at this node
    for obj in node.objects:
      dist_sq = (obj.position - point).length_squared()
      
      if len(closest) < k:
        heapq.heappush(closest, (-dist_sq, obj))
      elif dist_sq < -closest[0][0]:  # Closer than farthest in heap
        heapq.heapreplace(closest, (-dist_sq, obj))
    
    # Recursively check children
    if node.children:
      for child in sorted(node.children, 
                          key=lambda c: (c.bounds.center - point).length_squared()):
        recurse(child)
  
  recurse(self)
  return [(obj, math.sqrt(-dist_sq)) for dist_sq, obj in closest]
```

## Binary Space Partitioning (BSP) Tree

BSP trees recursively split space with arbitrary planes (not limited to axis-aligned like octrees).

### Construction

```python
class BSPNode:
  def __init__(self, plane=None):
    self.plane = plane  # Dividing plane (normal + distance)
    self.front = None   # Positive side of plane
    self.back = None    # Negative side of plane
    self.objects = []
  
  def insert(self, obj, max_objects=4):
    if self.plane is None:
      # Leaf node: store object
      self.objects.append(obj)
      
      # Split if too crowded
      if len(self.objects) > max_objects:
        self.split()
    else:
      # Existing plane: classify object
      classification = self.plane.classify_point(obj.position)
      
      if classification > 0:  # In front of plane
        if self.front is None:
          self.front = BSPNode()
        self.front.insert(obj, max_objects)
      elif classification < 0:  # Behind plane
        if self.back is None:
          self.back = BSPNode()
        self.back.insert(obj, max_objects)
      else:  # On plane
        self.objects.append(obj)
  
  def split(self):
    # Choose splitting plane (using median of object positions)
    objects = self.objects
    axis = self.choose_split_axis(objects)
    median = self.median_value(objects, axis)
    
    self.plane = Plane(normal_for_axis(axis), median)
    
    self.front = BSPNode()
    self.back = BSPNode()
    
    # Redistribute objects
    for obj in objects:
      self.insert(obj, max_objects=float('inf'))  # Insert without further splitting
    
    self.objects = []  # Clear objects from internal node

def choose_split_axis(objects):
  # Choose axis with largest extent (most spread)
  bounds = AABBox.from_objects(objects)
  extents = bounds.max - bounds.min
  return extents.argmax()  # 0, 1, or 2 for x, y, z
```

**Advantages over Octree:**
- Arbitrary plane orientation adapts to object distribution
- Fewer unnecessary splits (better for irregular/clustered distributions)
- Natural for polygon-based worlds (BSP planes aligned with wall planes)

**Disadvantages:**
- Complex implementation
- Less GPU-friendly (non-uniform branching factor)
- Slower query performance (can't prune as effectively)

## R-Tree: Multi-dimensional Range Indexing

R-trees are optimized for spatial database queries. Each node contains multiple bounding boxes and pointers to children. Unlike octrees (power-of-k branching), R-tree branching factor is tunable (typically 4-16).

### Structure

```python
class RTreeNode:
  def __init__(self, is_leaf=False, max_children=4):
    self.is_leaf = is_leaf
    self.max_children = max_children
    self.bounding_box = None
    self.children = []  # Either objects (leaf) or RTreeNodes (internal)
  
  def insert(self, obj):
    if self.is_leaf:
      # Add to leaf
      self.children.append(obj)
      self.bounding_box = self.compute_bbox()
      
      # Split if overflow
      if len(self.children) > self.max_children:
        return self.split()
    else:
      # Find best child (minimize bbox expansion)
      best_child = None
      min_expansion = float('inf')
      
      for child in self.children:
        expansion = child.bounding_box.union(obj.bbox).area - child.bounding_box.area
        if expansion < min_expansion:
          min_expansion = expansion
          best_child = child
      
      # If tie, choose child with smallest area
      if min_expansion == float('inf'):
        best_child = min(self.children, key=lambda c: c.bounding_box.area)
      
      # Recursively insert
      new_sibling = best_child.insert(obj)
      
      if new_sibling is not None:
        # Child split; add sibling
        self.children.append(new_sibling)
        self.bounding_box = self.compute_bbox()
        
        if len(self.children) > self.max_children:
          return self.split()
    
    return None  # No split occurred
  
  def split(self):
    # Quadratic split: find most separated pair of objects
    max_separation = 0
    seed1, seed2 = 0, 1
    
    for i in range(len(self.children)):
      for j in range(i + 1, len(self.children)):
        separation = self.children[i].bbox.union(self.children[j].bbox).area
        if separation > max_separation:
          max_separation = separation
          seed1, seed2 = i, j
    
    # Assign objects to two groups
    group1 = [self.children[seed1]]
    group2 = [self.children[seed2]]
    
    for i, child in enumerate(self.children):
      if i == seed1 or i == seed2:
        continue
      
      # Add to group with smaller expansion
      expansion1 = group1_bbox.union(child.bbox).area - group1_bbox.area
      expansion2 = group2_bbox.union(child.bbox).area - group2_bbox.area
      
      if expansion1 < expansion2:
        group1.append(child)
      else:
        group2.append(child)
    
    # Create two nodes
    left = RTreeNode(self.is_leaf, self.max_children)
    left.children = group1
    left.bounding_box = self.compute_bbox_for_objects(group1)
    
    right = RTreeNode(self.is_leaf, self.max_children)
    right.children = group2
    right.bounding_box = self.compute_bbox_for_objects(group2)
    
    return right  # Return sibling; parent handles integration
```

**Strengths:**
- Excellent for range queries (bounding box intersections)
- Variable branching factor adapts to data
- Widely used in spatial databases (PostGIS, MongoDB)

**Weaknesses:**
- Complex implementation
- Insertion performance degrades with tree imbalance
- Multiple objects can spawn overlapping bounding boxes (inefficient queries)

## Hash Grid: O(1) Spatial Queries

Hash grids discretize space into uniform grid cells, hashing object coordinates to cell indices. O(1) average lookup (vs O(log n) for trees).

### Implementation

```python
class HashGrid:
  def __init__(self, cell_size):
    self.cell_size = cell_size
    self.cells = {}  # Maps (cell_x, cell_y, cell_z) to list of objects
  
  def insert(self, obj):
    cells_occupied = self.get_cells_for_object(obj)
    for cell_key in cells_occupied:
      if cell_key not in self.cells:
        self.cells[cell_key] = []
      self.cells[cell_key].append(obj)
  
  def remove(self, obj):
    cells_occupied = self.get_cells_for_object(obj)
    for cell_key in cells_occupied:
      if cell_key in self.cells and obj in self.cells[cell_key]:
        self.cells[cell_key].remove(obj)
  
  def get_cells_for_object(self, obj):
    # Find all cells occupied by object's bounding box
    min_cell = self.world_to_cell(obj.bbox.min)
    max_cell = self.world_to_cell(obj.bbox.max)
    
    cells = []
    for x in range(min_cell[0], max_cell[0] + 1):
      for y in range(min_cell[1], max_cell[1] + 1):
        for z in range(min_cell[2], max_cell[2] + 1):
          cells.append((x, y, z))
    
    return cells
  
  def world_to_cell(self, position):
    return (int(position[0] // self.cell_size),
            int(position[1] // self.cell_size),
            int(position[2] // self.cell_size))
  
  def query_neighbors(self, obj, search_distance=1):
    # Find objects in neighboring cells
    cell = self.world_to_cell(obj.position)
    results = []
    
    for dx in range(-search_distance, search_distance + 1):
      for dy in range(-search_distance, search_distance + 1):
        for dz in range(-search_distance, search_distance + 1):
          neighbor_key = (cell[0] + dx, cell[1] + dy, cell[2] + dz)
          if neighbor_key in self.cells:
            results.extend(self.cells[neighbor_key])
    
    return results
```

**Cell size tuning:**
- Too small: objects occupy many cells; redundant checks
- Too large: cells contain too many objects; brute-force checks dominate
- Optimal: cell_size ≈ average object size

**Strengths:**
- O(1) insertion/removal (constant work per cell)
- Cache-friendly (spatial locality: neighboring objects in same/adjacent cells)
- Ideal for broadphase collision detection (physics engines)
- GPU-friendly (regular structure)

**Weaknesses:**
- Static grid doesn't adapt to non-uniform distributions
- Queries require checking many empty cells (sparse scenarios)
- Large coordinate ranges require huge hash tables

## Loose Octree: Expanded Octants

Loose octrees address octree inefficiency when objects span multiple children. Each octant is expanded by factor k (typically 2x), allowing objects to fit in single parent rather than spanning children.

```python
class LooseOctreeNode:
  def __init__(self, bounds, expansion_factor=2.0, max_depth=8, depth=0):
    self.bounds = bounds
    self.expanded_bounds = bounds.expand(expansion_factor)
    self.max_depth = max_depth
    self.depth = depth
    self.objects = []
    self.children = None
  
  def insert(self, obj):
    if obj.bbox in self.expanded_bounds:
      # Object fits in this node's expanded bounds
      if len(self.objects) < 4 or self.depth >= self.max_depth:
        self.objects.append(obj)
      else:
        # Subdivide and distribute
        if self.children is None:
          self.subdivide()
        
        # Distribute to children (loose bounds ensure fit)
        inserted = False
        for child in self.children:
          if obj.bbox in child.expanded_bounds:
            child.insert(obj)
            inserted = True
            break
        
        # If not in any child's expanded bounds, keep in parent
        if not inserted:
          self.objects.append(obj)
    # If doesn't fit even in expanded bounds, return and parent tries next sibling
    else:
      return False
  
  def query_neighbors(self, point, radius):
    results = []
    
    # Check objects at this node
    for obj in self.objects:
      if (obj.position - point).length() <= radius:
        results.append(obj)
    
    # Recursively check children (if they overlap query radius)
    if self.children:
      for child in self.children:
        if child.bounds.distance_to_point(point) <= radius:
          results.extend(child.query_neighbors(point, radius))
    
    return results
```

**Advantages over tight octree:**
- Fewer objects spanning multiple nodes
- Faster queries (less node traversal)
- Better balance in dynamic scenarios

**Typical expansion factor:** 2.0 (child octant slightly larger; room for object movement without subdivision)

## Performance Comparison

| Structure | Insert | Query (range) | Query (nearest) | Space | Parallelizable |
|-----------|--------|---------------|-----------------|-------|----------------|
| Octree | O(log n) | O(log n + k) | O(log n) | O(n) | Moderate |
| BSP | O(log n) | O(log n + k) | O(log n) | O(n) | Poor |
| R-Tree | O(log n) | O(log n + k) | O(n) | O(n) | Moderate |
| Hash Grid | O(1)* | O(1)* | O(1)* | O(n+grid size) | Excellent |

*Hash grid average case; worst case O(n) if cells heavily populated

## Practical Selection Guidelines

- **Physics broadphase collision detection:** Hash grid (O(1) queries essential)
- **Spatial database (PostGIS, MongoDB):** R-tree (proven, optimized)
- **Game engine spatial partitioning:** Loose octree (balance of speed/simplicity)
- **Ray-tracing acceleration structure:** Octree/BVH (logarithmic ray traversal)
- **Large-scale point cloud queries:** K-d tree variant (optimized for high dimensions)

Selection depends on: object distribution uniformity, query patterns, update frequency, and available memory.
