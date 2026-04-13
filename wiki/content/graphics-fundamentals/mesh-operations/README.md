---
title: Mesh Operations and Data Structures
category: graphics-fundamentals
tags: [mesh, simplification, data-structures, lod, remeshing, topology]
description: Mesh data structures (half-edge), simplification algorithms (edge collapse, QEM), subdivision, remeshing, smoothing, and LOD generation for efficient rendering.
related: [graphics-fundamentals/curves-and-surfaces, blender/modeling-workflow, algorithms/spatial-data-structures]
order: 8
---

# Mesh Operations and Data Structures

Meshes are the primary representation for 3D geometry in graphics. Efficient mesh processing requires understanding both data structures (how to store connectivity) and algorithms (how to modify and optimize meshes).

## Mesh Representation and Data Structures

### Vertex-Triangle Soup (Naive)

Store vertices and triangles separately:

```cpp
struct Mesh {
    vector<vec3> vertices;
    vector<ivec3> triangles;  // Each triangle stores 3 vertex indices
};
```

**Problems**:
- No connectivity information (expensive to find neighbors)
- Attribute duplication (each vertex appearance duplicated)
- Difficult to perform local operations

### Adjacency Lists

Store per-vertex neighbor information:

```cpp
struct Mesh {
    vector<vec3> vertices;
    vector<vec3> normals;
    vector<ivec3> triangles;
    vector<vector<int>> adjacency;  // adjacency[i] = neighbors of vertex i
};

// Build adjacency
for(int tri = 0; tri < triangles.size(); tri++) {
    ivec3 t = triangles[tri];
    for(int i = 0; i < 3; i++) {
        adjacency[t[i]].push_back(t[(i+1)%3]);
        adjacency[t[i]].push_back(t[(i+2)%3]);
    }
}
```

**Advantages**: Fast neighbor lookup
**Disadvantages**: Doesn't distinguish faces sharing an edge; no edge information

### Half-Edge Data Structure (Winged-Edge)

Professional-grade mesh representation. Each edge is split into two directed **half-edges**. A half-edge points to:
- Its destination vertex
- Its opposite (reverse direction)
- Its face
- The next half-edge in the face
- The previous half-edge in the face

```cpp
struct HalfEdge {
    int vertex;              // Destination vertex
    int opposite;            // Index of opposite half-edge
    int face;                // Face this edge bounds
    int next;                // Next half-edge in face (CCW)
    int previous;            // Previous half-edge in face (CCW)
};

struct Face {
    int halfEdge;            // Any half-edge in this face
};

struct Vertex {
    vec3 position;
    int halfEdge;            // Any half-edge pointing FROM this vertex
};

struct Mesh {
    vector<Vertex> vertices;
    vector<Face> faces;
    vector<HalfEdge> halfEdges;
};
```

**Operations**:
```cpp
// Iterate vertices of a face
void iterateFaceVertices(Face& face) {
    HalfEdge* he = &halfEdges[face.halfEdge];
    do {
        int v = he->vertex;  // Current vertex
        he = &halfEdges[he->next];
    } while(he->face == face.id);
}

// Iterate faces around a vertex
void iterateVertexFaces(Vertex& v) {
    HalfEdge* he = &halfEdges[v.halfEdge];
    do {
        int f = he->face;
        he = &halfEdges[halfEdges[he->opposite].next];
    } while(halfEdges[v.halfEdge] != he);
}

// Find edge between two vertices
HalfEdge* findEdge(int v1, int v2) {
    HalfEdge* he = &halfEdges[vertices[v1].halfEdge];
    do {
        if(he->vertex == v2) return he;
        he = &halfEdges[halfEdges[he->opposite].next];
    } while(halfEdges[vertices[v1].halfEdge] != he);
    return nullptr;
}
```

**Advantages**:
- O(1) access to all incident edges/faces for any element
- Natural representation for local modifications
- Foundation for mesh editing algorithms

**Disadvantages**:
- Complex to implement and maintain
- Higher memory overhead (many pointers)
- Cache-unfriendly for GPU

## Mesh Simplification

Reduce polygon count while preserving visual quality.

### Edge Collapse

Iteratively merge two vertices connected by an edge:

```
Before:        After:
V1--E--V2  →   V_merged
  \ | /           |
   \|/            |
    F
```

**Algorithm**:
1. For each edge, compute a **cost** (quality metric)
2. Collapse edge with minimum cost
3. Update affected edges and costs
4. Repeat until target polygon count reached

**Cost heuristic**: Distance to remove (keep collapse below threshold):

```
cost(edge) = ||V1 - V2||
```

### Quadric Error Metrics (QEM)

More sophisticated: track squared distance to original planes. For each vertex, maintain a 4×4 **error quadric**:

```
For each adjacent face with normal N and distance from origin d:
Plane equation: N·x + d = 0

Error quadric Q = N·N^T
                = [n_x²      n_x·n_y    n_x·n_z    n_x·d]
                  [n_x·n_y   n_y²       n_y·n_z    n_y·d]
                  [n_x·n_z   n_y·n_z    n_z²       n_z·d]
                  [n_x·d     n_y·d      n_z·d      d²]
```

When collapsing edge (V1, V2), the new vertex position V_new minimizes:

```
error(V_new) = V_new^T * (Q1 + Q2) * V_new
```

Solve by taking gradient = 0:

```
(Q1 + Q2) * V_new = 0  (if invertible)
V_new = inverse(Q1 + Q2) * zero_vector
```

If Q is singular, V_new = optimal position along edge.

**QEM benefits**:
- Preserves sharp features naturally (high error at creases)
- Collapses nearly-coplanar triangles aggressively
- Good visual quality at high reduction ratios

### Implementation Outline

```cpp
struct QEM {
    glm::mat4 Q;
    float cost;
};

vector<QEM> vertexQuadrics(numVertices);

// Initialize: compute quadric for each vertex from adjacent faces
for(auto& face : faces) {
    vec3 n = normal(face);
    float d = dot(n, face.v0);
    
    mat4 plane_quadric = outer(n, n);
    plane_quadric[3] = vec4(n * d, d*d);
    
    for(int i = 0; i < 3; i++) {
        vertexQuadrics[face.v[i]].Q += plane_quadric;
    }
}

// Priority queue of edges sorted by collapse cost
priority_queue<Edge> edgeHeap;

for(auto& edge : edges) {
    float cost = computeCollapseCost(edge.v1, edge.v2);
    edgeHeap.push({cost, edge});
}

// Collapse edges
while(targetTriangleCount < current && !edgeHeap.empty()) {
    Edge e = edgeHeap.pop();
    if(isValid(e)) {
        vec3 newPos = optimalCollapsePosition(e.v1, e.v2);
        collapseEdge(e, newPos);
        updateAffectedEdgeCosts();
    }
}
```

## Mesh Smoothing

Reduce noise and high-frequency detail.

### Laplacian Smoothing

Iteratively move each vertex toward the average of its neighbors:

```
V_new = (1 - λ) * V_old + λ * average(neighbors)

where λ ∈ (0, 1) controls blend strength
```

**Issues**:
- Shrinks mesh with repeated iterations
- Removes volume
- Can create local inversions (flipped normals)

### Taubin Smoothing

Mitigates shrinkage by alternating positive and negative weights:

```
For each iteration:
  V ← (1 - λ) * V + λ * average(neighbors)        // Positive pass (smooth)
  V ← (1 + μ) * V - μ * average(neighbors)        // Negative pass (restore volume)

where μ is typically selected negative to shrink scale: μ = -0.5*λ/(1-λ)
```

This biharmonic smoothing better preserves original shape while removing noise.

**Implementation**:
```cpp
void taubinSmooth(Mesh& mesh, float lambda, int iterations) {
    vector<vec3> newPositions;
    
    for(int iter = 0; iter < iterations; iter++) {
        newPositions = mesh.positions;
        
        // Positive smoothing pass
        for(int v = 0; v < mesh.vertices.size(); v++) {
            vec3 avg = averageNeighbors(v);
            newPositions[v] = (1.0f - lambda) * mesh.positions[v] + lambda * avg;
        }
        mesh.positions = newPositions;
        
        // Negative smoothing pass (shrinkage correction)
        float mu = -0.5f * lambda / (1.0f - lambda);
        for(int v = 0; v < mesh.vertices.size(); v++) {
            vec3 avg = averageNeighbors(v);
            newPositions[v] = (1.0f + mu) * mesh.positions[v] - mu * avg;
        }
        mesh.positions = newPositions;
    }
}
```

## Mesh Remeshing

Restructure mesh connectivity/resolution for specific properties.

### Isotropic Remeshing

Generate triangulation with uniform triangle size and aspect ratio.

**Approach**:
1. Iteratively split long edges and collapse short edges
2. Optimize vertex positions (move toward local optimal)
3. Flip edges to improve triangulation quality

Target: All edges approximately same length; triangles close to equilateral.

### Feature-Preserving Remeshing

Maintain sharp edges (creases) while remeshing smooth areas.

**Detect features**: Edges with dihedral angle > threshold (e.g., 30°) are creased.

**Modified algorithm**:
- Don't collapse feature edges
- Smooth only non-feature vertices
- Use feature edges as constraints

## Level of Detail (LOD) Generation

Create multiple mesh resolutions for distance-based rendering.

### LOD Strategy

```
Distance from camera  |  Polygon count  |  Typical use
0 - 10m               |  Full (100%)    |  Close-up, visible detail
10 - 30m              |  50%            |  Medium distance
30 - 100m             |  10%            |  Far distance
100m+                 |  1%             |  Very far (billboard, etc)
```

### Cascading Simplification

Simplify full mesh progressively to create LOD chain:

```
LOD0 (100 triangles) ← Simplify ← LOD1 (500 triangles) ← ... ← Original (100K triangles)
```

Each LOD created from previous by edge collapse (maintains morphing quality).

### GPU-Driven LOD Selection

Modern engines use GPU-computed metrics per-object:

```glsl
// In compute shader / CPU code
float screenCoverage = objectBoundingBox.screenSize / screenResolution.xy;
float distance = length(cameraPos - objectCenter);

// Select LOD based on metrics
if(screenCoverage > 0.1) lodLevel = 0;
else if(screenCoverage > 0.05) lodLevel = 1;
else if(screenCoverage > 0.02) lodLevel = 2;
else lodLevel = 3;
```

## Boolean Operations

Combine meshes using set operations: union, intersection, difference.

### CSG (Constructive Solid Geometry)

Represent shapes as trees of basic primitives combined with boolean ops.

```
        Union
        /    \
    Sphere   Cube
```

**Approaches**:
1. **Implicit surface**: Convert to signed distance field, perform operation, convert back
2. **Explicit mesh**: Find intersection edges, split faces, discard/keep regions
3. **Spatial partition**: Use octrees/BSP trees to accelerate

Most graphics engines use **CSG libraries** (e.g., Carve, Cork) rather than rolling custom boolean implementation. Modern approach: use **signed distance fields** in GPU shaders for real-time CSG.

## Mesh Compression

Store meshes efficiently without loss of quality.

### Vertex Quantization

Reduce precision of vertex coordinates:

```
Original: vec3 (3 × 32-bit float = 12 bytes/vertex)
Quantized: vec3 packed in 16-bit components = 6 bytes/vertex
           (sufficient for most applications)

Quantization formula:
quantized = floor(scaled * 65535.0) / 65535.0
where scaled = (position - bounds.min) / (bounds.max - bounds.min)
```

### Index Compression

Store triangle indices more efficiently:

```
Original: ivec3 (3 × 32-bit int = 12 bytes/triangle)

If < 65K vertices: Use 16-bit indices = 6 bytes/triangle (50% savings)
Compression: Store index deltas or use vertex caches (GPU naturally caches recent vertices)
```

### Mesh Codecs

Specialized codecs for polygon meshes:
- **DRACO** (Google): Achieves 10:1 compression via geometric quantization + entropy coding
- **OpenCTM**: Format optimized for model distribution
- **3MF**: Microsoft 3D Manufacturing format

## Topology Repair

Fix degenerate meshes (missing faces, flipped normals, non-manifold edges).

### Common Issues

```
Non-manifold edge:
  More than 2 faces sharing one edge → Can't determine inside/outside

Boundary edge:
  Only 1 face adjacent → Indicates incomplete mesh

Flipped normals:
  Inconsistent winding order → Lighting problems
```

### Repair Strategy

```cpp
void repairMesh(Mesh& mesh) {
    // 1. Detect non-manifold edges
    map<pair<int,int>, int> edgeCount;
    for(auto& tri : mesh.triangles) {
        edgeCount[{tri[0], tri[1]}]++;
        edgeCount[{tri[1], tri[2]}]++;
        edgeCount[{tri[2], tri[0]}]++;
    }
    
    // 2. Mark bad edges
    for(auto& [edge, count] : edgeCount) {
        if(count != 2) {  // Not shared by exactly 2 faces
            markNonManifold(edge);
        }
    }
    
    // 3. Remove faces containing bad edges
    vector<ivec3> validTriangles;
    for(auto& tri : mesh.triangles) {
        if(!containsNonManifoldEdge(tri)) {
            validTriangles.push_back(tri);
        }
    }
    mesh.triangles = validTriangles;
    
    // 4. Recompute normals with consistent orientation
    recomputeNormals(mesh);
}
```

## Mesh Animation and Skinning

For skeletal animation, each vertex is influenced by nearby bones:

```
Skinned vertex position:
V_skinned = Σ weight[i] * bone[i].matrix * V_rest

where weights sum to 1.0
```

Modern engines use **GPU skinning** in vertex shaders, with up to 4 bone influences per vertex (for performance).

Understanding mesh operations is essential for game development, 3D modeling tools, and mesh processing pipelines. The half-edge structure enables sophisticated algorithms, while simplification and LOD generation are critical for real-time performance.
