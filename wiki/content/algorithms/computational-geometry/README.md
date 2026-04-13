---
title: Computational Geometry Algorithms
category: algorithms
tags: [algorithms, geometry, convex-hull, voronoi, delaunay, SDF]
description: Fundamental computational geometry algorithms including convex hull, Delaunay triangulation, point-in-polygon tests, and signed distance fields.
related: [graphics-fundamentals/mesh-operations, graphics-fundamentals/curves-and-surfaces, algorithms/spatial-data-structures]
order: 2
---

# Computational Geometry Algorithms

Computational geometry algorithms solve spatial problems: "Is point P inside polygon?", "What's the convex hull of this point set?", "What's the closest point on a surface to location P?"

## Convex Hull Algorithms

A convex hull is the minimal convex polygon containing all points (imagine stretching an elastic band around the outermost points).

### Graham Scan: O(n log n) Algorithm

Graham Scan sorts points by polar angle around a start point, then processes in order, maintaining convex boundary.

```python
def graham_scan(points):
  # Find lowest point (tie-break by leftmost)
  start = min(points, key=lambda p: (p.y, p.x))
  
  # Sort by polar angle relative to start point
  def polar_angle_key(p):
    if p == start:
      return -float('inf'), float('inf')
    
    angle = atan2(p.y - start.y, p.x - start.x)
    distance = (p.x - start.x)**2 + (p.y - start.y)**2
    return angle, distance
  
  sorted_points = sorted(points, key=polar_angle_key)
  
  def cross_product(o, a, b):
    # Cross product of vectors OA and OB
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  
  hull = []
  for p in sorted_points:
    # Remove points that make clockwise turn
    while len(hull) > 1 and cross_product(hull[-2], hull[-1], p) <= 0:
      hull.pop()
    hull.append(p)
  
  return hull
```

**Key insight:** Sorting by polar angle ensures processing in consistent order around boundary. Cross product test (>0 for left turn, <0 for right turn) maintains convexity.

**Complexity:** O(n log n) for sorting; O(n) for hull construction.

### QuickHull: Average O(n log n)

Divide-and-conquer approach: find extreme points, recursively partition remaining points.

```python
def quickhull(points):
  def cross_product(o, a, b):
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  
  def find_hull_recursive(cloud, p1, p2, hull_points):
    if len(cloud) == 0:
      return
    
    # Find point farthest from line p1-p2
    max_distance = 0
    farthest = None
    for p in cloud:
      distance = abs(cross_product(p1, p2, p))
      if distance > max_distance:
        max_distance = distance
        farthest = p
    
    if farthest is None:
      return  # No point above line; p1-p2 is on hull
    
    hull_points.append(farthest)
    
    # Partition cloud: points on left side of p1-farthest and farthest-p2
    left_cloud_1 = [p for p in cloud 
                    if cross_product(p1, farthest, p) > 0]
    left_cloud_2 = [p for p in cloud 
                    if cross_product(farthest, p2, p) > 0]
    
    find_hull_recursive(left_cloud_1, p1, farthest, hull_points)
    find_hull_recursive(left_cloud_2, farthest, p2, hull_points)
  
  if len(points) < 3:
    return sorted(points, key=lambda p: (p.x, p.y))
  
  # Find leftmost and rightmost points
  left = min(points, key=lambda p: (p.x, p.y))
  right = max(points, key=lambda p: (p.x, p.y))
  
  hull = [left, right]
  
  # Partition by which side of left-right line
  upper = [p for p in points if cross_product(left, right, p) > 0]
  lower = [p for p in points if cross_product(left, right, p) < 0]
  
  find_hull_recursive(upper, left, right, hull)
  find_hull_recursive(lower, right, left, hull)
  
  return hull
```

**Advantages:** Average case better than Graham when points clustered (ignores interior points).
**Disadvantages:** Worst case O(n²) (but rare in practice).

## Delaunay Triangulation and Voronoi Diagrams

Delaunay triangulation is the dual of Voronoi diagram: fundamental structure with applications in interpolation, mesh generation, and analysis.

### Delaunay Properties

**Circumcircle criterion:** Triangle ABC is Delaunay if no other points lie inside its circumcircle.

```python
def circumcircle(a, b, c):
  # Calculate circumcenter and radius
  ax, ay = a
  bx, by = b
  cx, cy = c
  
  d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
  if abs(d) < 1e-10:
    return None  # Collinear points
  
  ux = ((ax**2 + ay**2) * (by - cy) + (bx**2 + by**2) * (cy - ay) + (cx**2 + cy**2) * (ay - by)) / d
  uy = ((ax**2 + ay**2) * (cx - bx) + (bx**2 + by**2) * (ax - cx) + (cx**2 + cy**2) * (bx - ax)) / d
  
  center = (ux, uy)
  radius = math.sqrt((ux - ax)**2 + (uy - ay)**2)
  
  return center, radius
```

### Incremental Delaunay Construction

```python
def delaunay_triangulation(points):
  # Start with large super-triangle containing all points
  min_x = min(p[0] for p in points)
  max_x = max(p[0] for p in points)
  min_y = min(p[1] for p in points)
  max_y = max(p[1] for p in points)
  
  margin = max(max_x - min_x, max_y - min_y) * 0.1
  super_triangle = [
    (min_x - margin, min_y - margin),
    (max_x + margin, min_y - margin),
    (min_x - margin, max_y + margin)
  ]
  
  triangles = [super_triangle]
  
  # Insert points one by one
  for p in points:
    # Find triangles whose circumcircle contains p
    bad_triangles = []
    for triangle in triangles:
      center, radius = circumcircle(*triangle)
      if center is not None:
        dist_sq = (p[0] - center[0])**2 + (p[1] - center[1])**2
        if dist_sq < radius**2:
          bad_triangles.append(triangle)
    
    # Find boundary edges of bad triangles
    polygon_hole = []
    for triangle in bad_triangles:
      for i in range(3):
        edge = (triangle[i], triangle[(i+1) % 3])
        # Count how many bad triangles share this edge
        shared_count = sum(1 for t in bad_triangles 
                          if (edge in get_edges(t) or 
                              reverse_edge(edge) in get_edges(t)))
        
        if shared_count == 1:
          polygon_hole.append(edge)
    
    # Remove bad triangles
    for triangle in bad_triangles:
      triangles.remove(triangle)
    
    # Create new triangles from p to polygon hole boundary
    for edge in polygon_hole:
      new_triangle = (edge[0], edge[1], p)
      triangles.append(new_triangle)
  
  # Remove triangles using super-triangle vertices
  result = [t for t in triangles 
           if not any(v in super_triangle for v in t)]
  
  return result

def get_edges(triangle):
  return [(triangle[i], triangle[(i+1) % 3]) for i in range(3)]

def reverse_edge(edge):
  return (edge[1], edge[0])
```

**Complexity:** O(n²) average case; O(n log n) with randomized insertion order.

**Properties:**
- Maximizes minimum angle (avoids "sliver" triangles)
- Unique for non-degenerate point sets
- Dual is Voronoi diagram

### Voronoi Diagram

Voronoi diagram partitions space: each region contains all points closer to associated site than any other site.

Constructed by connecting Delaunay triangle circumcenters:

```python
def voronoi_from_delaunay(triangles, points):
  voronoi_vertices = []
  
  for triangle in triangles:
    center, radius = circumcircle(*triangle)
    if center is not None:
      voronoi_vertices.append(center)
  
  # Connect vertices based on Delaunay edges
  # (two Delaunay triangles sharing edge → Voronoi vertices connected)
  
  return voronoi_vertices
```

**Applications:**
- Nearest-neighbor interpolation
- Facility location (where to build stores to minimize average distance)
- Mesh generation (Voronoi cells as mesh elements)
- Pattern analysis in point distributions

## Point-in-Polygon Test

Determine if point P lies inside polygon. Multiple approaches with different trade-offs.

### Ray Casting Algorithm: O(n)

Cast ray from point in arbitrary direction; count polygon edge crossings. Odd count = inside, even = outside.

```python
def point_in_polygon_raycasting(point, polygon):
  x, y = point
  n = len(polygon)
  inside = False
  
  # Cast horizontal ray to the right
  p1x, p1y = polygon[0]
  for i in range(1, n + 1):
    p2x, p2y = polygon[i % n]
    
    # Check if ray crosses edge
    if y > min(p1y, p2y):
      if y <= max(p1y, p2y):
        if x <= max(p1x, p2x):
          if p1y != p2y:
            # Calculate x-coordinate of intersection
            x_intersection = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
            
            if p1x == p2x or x <= x_intersection:
              inside = not inside
    
    p1x, p1y = p2x, p2y
  
  return inside
```

**Advantages:** Works for concave polygons, handles edge cases (point on boundary).
**Disadvantages:** O(n) linear in polygon vertices.

### Winding Number Algorithm

Count how many times polygon winds around point. Nonzero = inside.

```python
def point_in_polygon_winding(point, polygon):
  winding_number = 0
  n = len(polygon)
  
  for i in range(n):
    p1 = polygon[i]
    p2 = polygon[(i + 1) % n]
    
    if p1.y <= point.y:
      if p2.y > point.y:  # Upward crossing
        if is_left(p1, p2, point) > 0:  # Point left of edge
          winding_number += 1
    else:
      if p2.y <= point.y:  # Downward crossing
        if is_left(p1, p2, point) < 0:  # Point right of edge
          winding_number -= 1
  
  return winding_number != 0

def is_left(p0, p1, p2):
  # Cross product: 0 = on line, >0 = left, <0 = right
  return (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y)
```

**Advantages:** Handles complex cases (self-intersecting polygons).
**Disadvantages:** Slower than ray casting for convex polygons.

## Polygon Triangulation

Convert polygon into non-overlapping triangles (essential for rendering and analysis).

### Ear Clipping: O(n²) Simple

Repeatedly find "ears" (convex vertices where triangle interior contains no other vertices) and clip them.

```python
def polygon_triangulation_ear_clipping(polygon):
  vertices = list(polygon)
  triangles = []
  
  while len(vertices) > 3:
    # Find an ear
    ear_found = False
    for i in range(len(vertices)):
      prev = vertices[(i - 1) % len(vertices)]
      curr = vertices[i]
      next = vertices[(i + 1) % len(vertices)]
      
      # Check if curr is convex and no other vertices inside triangle
      if is_convex(prev, curr, next):
        # Check if any other vertex inside triangle
        inside = False
        for j in range(len(vertices)):
          if j == (i-1) % len(vertices) or j == i or j == (i+1) % len(vertices):
            continue
          
          if point_in_triangle(vertices[j], prev, curr, next):
            inside = True
            break
        
        if not inside:
          # Found an ear!
          triangles.append((prev, curr, next))
          vertices.pop(i)
          ear_found = True
          break
    
    if not ear_found:
      break  # Degenerate case
  
  # Final triangle
  if len(vertices) == 3:
    triangles.append(tuple(vertices))
  
  return triangles

def is_convex(p1, p2, p3):
  # Check if p2 is convex (left turn)
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x) > 0
```

**Complexity:** O(n²) worst case; O(n) best case.

## Signed Distance Fields (SDF)

SDF assigns to each point a signed distance to nearest surface (negative inside, positive outside).

### 2D SDF Construction

```python
def compute_2d_sdf(polygon, resolution=100):
  # Discretize into grid
  bounds = AABBox.from_polygon(polygon)
  cell_size = bounds.diagonal() / resolution
  
  sdf = {}
  
  for grid_x in range(resolution):
    for grid_y in range(resolution):
      world_pos = bounds.min + (grid_x + 0.5, grid_y + 0.5) * cell_size
      
      # Find closest point on polygon
      min_distance = float('inf')
      closest_point = None
      
      for edge in polygon.edges():
        point_on_edge = closest_point_on_segment(world_pos, edge)
        distance = (world_pos - point_on_edge).length()
        
        if distance < min_distance:
          min_distance = distance
          closest_point = point_on_edge
      
      # Sign based on inside/outside
      inside = point_in_polygon(world_pos, polygon)
      signed_distance = min_distance if not inside else -min_distance
      
      sdf[(grid_x, grid_y)] = signed_distance
  
  return sdf, bounds, cell_size
```

**Applications:**
- Collision detection (SDF < 0 = collision)
- Rendering (SDF isosurfaces = shape boundary)
- Shape analysis (gradient of SDF = shape normal)
- Smoothed shape interpolation

## Practical Selection

- **Find convex hull:** Graham scan (O(n log n), simple implementation)
- **Mesh generation:** Delaunay triangulation
- **Nearest-neighbor analysis:** Voronoi diagram
- **Point membership test:** Ray casting (fast, general)
- **Polygon rendering:** Ear clipping triangulation
- **Distance queries:** Signed distance field (fast lookup, lower memory than explicit geometry)

Computational geometry problems often combine multiple algorithms: triangulate polygon, then compute Delaunay triangulation of vertices for mesh analysis.
