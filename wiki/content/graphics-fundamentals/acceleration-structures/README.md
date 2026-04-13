---
title: Acceleration Structures for Ray Tracing
category: graphics-fundamentals
tags: [bvh, kdtree, acceleration, spatial-partitioning, gpu, performance]
description: BVH construction (SAH, median split, binned), KD-trees, octrees, traversal algorithms, and GPU-friendly data structures for ray tracing performance.
related: [graphics-fundamentals/ray-tracing-fundamentals, algorithms/spatial-data-structures, algorithms/computational-geometry]
order: 6
---

# Acceleration Structures for Ray Tracing

Naive ray tracing tests intersection with every triangle in the scene. For 1 million triangles and 1 billion rays per frame, this is 10^15 intersection tests—infeasible. **Acceleration structures** partition space or geometry hierarchically, allowing ray traversal to skip large regions containing no geometry.

## Naive Approach Complexity

```
Without acceleration:
Cost = rays × triangles × intersection_test_cost
     = 10⁹ rays × 10⁶ triangles × O(1) ≈ 10^15 ops/frame

With BVH:
Cost = rays × O(log n) ray-bvh traversals × O(1) per triangle
     ≈ 10⁹ rays × log(10⁶) × 1000 triangles avg = 10^13 ops/frame

100x speedup from structure alone, before considering GPU parallelism.
```

## Bounding Volume Hierarchies (BVH)

BVH is the standard for real-time ray tracing. A binary tree where:
- **Leaves**: Contain actual triangles
- **Internal nodes**: Contain axis-aligned bounding boxes (AABBs)
- **Property**: All triangles in a subtree are entirely within the node's AABB

```
        [Root AABB]
        /          \
    [AABB1]      [AABB2]
    /    \       /      \
  [T1]  [T2]  [T3,T4]  [T5]
```

### BVH Construction: Surface Area Heuristic (SAH)

The goal is to minimize expected ray traversal cost. The **Surface Area Heuristic** assumes rays are uniformly distributed (not physically correct, but good in practice):

```
Cost(node) = C_traverse + P_left * Cost(left) + P_right * Cost(right)

where P_left = SurfaceArea(left_AABB) / SurfaceArea(parent_AABB)

C_traverse is typically normalized to 1 and leaf cost to number of triangles.
```

For optimal split, compute cost for all possible partitions:

```
function buildBVH_SAH(triangles):
    if len(triangles) ≤ maxLeafSize:
        return Leaf(triangles)
    
    bestCost = infinity
    bestAxis = 0
    bestSplit = 0
    
    for axis in [X, Y, Z]:
        sort(triangles, by centroid on axis)
        
        for split in range(1, len(triangles)):
            left = triangles[0:split]
            right = triangles[split:end]
            
            cost = SAH(left, right)
            if cost < bestCost:
                bestCost = cost
                bestAxis = axis
                bestSplit = split
    
    left = buildBVH_SAH(triangles[0:bestSplit])
    right = buildBVH_SAH(triangles[bestSplit:end])
    
    return Node(AABB(left, right), left, right)

function SAH(left_tris, right_tris):
    leftAABB = computeAABB(left_tris)
    rightAABB = computeAABB(right_tris)
    
    leftArea = surfaceArea(leftAABB)
    rightArea = surfaceArea(rightAABB)
    totalArea = surfaceArea(AABB(leftAABB, rightAABB))
    
    leftCost = len(left_tris)
    rightCost = len(right_tris)
    
    return (leftArea/totalArea * leftCost + 
            rightArea/totalArea * rightCost)
```

**Complexity**: O(n² log n) for full SAH (tests all splits). Prohibitive for millions of triangles.

### Binned SAH (Fast Approximation)

Instead of testing all splits, divide each axis into k bins and test k-1 splits:

```
function buildBVH_BinnedSAH(triangles, numBins=32):
    if len(triangles) ≤ maxLeafSize:
        return Leaf(triangles)
    
    bestCost = infinity
    bestAxis = 0
    bestBin = 0
    
    for axis in [X, Y, Z]:
        // Compute bounds on this axis
        minBound = min(tri.centroid[axis] for tri in triangles)
        maxBound = max(tri.centroid[axis] for tri in triangles)
        binSize = (maxBound - minBound) / numBins
        
        // Assign triangles to bins
        bins = [empty] * numBins
        for tri in triangles:
            bin_index = (tri.centroid[axis] - minBound) / binSize
            bins[bin_index].append(tri)
        
        // Compute cumulative bounds
        leftBounds = [AABB()]
        for bin in bins[0:-1]:
            leftBounds.append(AABB(leftBounds[-1], bin))
        
        rightBounds = [AABB()]
        for bin in reversed(bins[1:]):
            rightBounds.insert(0, AABB(rightBounds[0], bin))
        
        // Test each bin split
        for split in range(1, numBins):
            cost = SAH(leftBounds[split], rightBounds[split])
            if cost < bestCost:
                bestCost = cost
                bestAxis = axis
                bestBin = split
    
    // Partition triangles at best split
    split_index = partitionAtBin(triangles, bestAxis, bestBin)
    left = buildBVH_BinnedSAH(triangles[0:split_index])
    right = buildBVH_BinnedSAH(triangles[split_index:end])
    return Node(AABB(left, right), left, right)
```

**Complexity**: O(n log² n) for binned SAH (practical for interactive applications).

### Median Split (Simple Alternative)

For faster construction (O(n log n)), split at the median centroid:

```
function buildBVH_Median(triangles):
    if len(triangles) ≤ maxLeafSize:
        return Leaf(triangles)
    
    // Find axis with largest AABB extent
    centroidBounds = AABB of all triangle centroids
    axis = argmax(centroidBounds.max - centroidBounds.min)
    
    // Sort by centroid and split at median
    sort(triangles, by centroid on axis)
    mid = len(triangles) / 2
    
    left = buildBVH_Median(triangles[0:mid])
    right = buildBVH_Median(triangles[mid:end])
    
    return Node(AABB(left, right), left, right)
```

Trade-off: Faster to build but less optimal for traversal (10-30% more ray-box tests on average).

## KD-Trees

Axis-aligned space partitioning. Each node splits space along one axis.

**Advantages over BVH**:
- Perfect space partitioning (no overlap)
- Slightly fewer ray-box tests in some cases
- Simpler memory layout

**Disadvantages**:
- Triangles can be duplicated across multiple nodes
- Traversal less cache-friendly than BVH
- SAH more complex to implement

```
function buildKDTree(triangles, bounds, depth):
    if len(triangles) ≤ maxLeafSize:
        return Leaf(triangles)
    
    // Alternate between axes
    axis = depth % 3
    
    // SAH-based split plane selection
    bestCost = infinity
    bestPlane = 0
    
    for plane in candidatePlanes(triangles, axis):
        left = [tri for tri in triangles if tri overlaps left side]
        right = [tri for tri in triangles if tri overlaps right side]
        
        cost = SAH(left, right, plane)
        if cost < bestCost:
            bestCost = cost
            bestPlane = plane
    
    left = buildKDTree(leftTris, leftBounds, depth+1)
    right = buildKDTree(rightTris, rightBounds, depth+1)
    
    return Node(bestPlane, axis, left, right)
```

## Octrees

Space partitioning into 8 equal cubes recursively.

**Characteristics**:
- Regular structure (easier implementation)
- Simple spatial hashing
- Deeper trees for non-uniform geometry (unbalanced)
- Poor for SAH optimization

Used more in voxel-based rendering than ray tracing.

## GPU-Friendly BVH (Linear/LBVH)

GPU traversal requires different considerations than CPU:

1. **Memory layout**: Linear array instead of pointer-based tree
2. **Node packing**: Fit more data in cache lines
3. **Compact representation**: Store child pointers as array indices

### Linear Node Layout

```glsl
struct BVHNode {
    vec3 aabbMin;
    uint leftChildOrTriangleIndex;  // LSB indicates leaf or internal
    vec3 aabbMax;
    uint triangleCount;  // Non-zero = leaf, zero = internal
};

BVHNode nodes[];
```

### Traversal Stack Optimization

Stack-based traversal can overflow GPU stack. **Iterative stackless traversal** uses a parent pointer:

```glsl
uint traverseStack[64];
int stackSize = 1;
traverseStack[0] = rootNodeIndex;

while(stackSize > 0) {
    uint nodeIdx = traverseStack[--stackSize];
    BVHNode node = nodes[nodeIdx];
    
    if(!rayAABBIntersect(ray, node.aabbMin, node.aabbMax)) {
        continue;
    }
    
    if(node.triangleCount > 0) {
        // Leaf: test triangles
        for(uint i = 0; i < node.triangleCount; i++) {
            testTriangleIntersection(ray, triangles[node.leftChildOrTriangleIndex + i]);
        }
    } else {
        // Internal: push children in front-to-back order
        uint leftIdx = node.leftChildOrTriangleIndex;
        uint rightIdx = leftIdx + 1;
        
        // Order to maintain cache coherence
        if(shouldSwap) {
            // Push farther child first (processed last = traversed first)
            traverseStack[stackSize++] = leftIdx;
            traverseStack[stackSize++] = rightIdx;
        } else {
            traverseStack[stackSize++] = rightIdx;
            traverseStack[stackSize++] = leftIdx;
        }
    }
}
```

### LBVH (Linear BVH) Construction on GPU

**Lauterbach et al. approach**:

1. Compute 30-bit Morton codes for triangle centroids
2. Radix sort triangles by Morton code (groups nearby triangles)
3. Generate leaf nodes from sorted triangles
4. Generate internal nodes bottom-up

```
// Step 1: Compute Morton codes (Z-order curve)
uint computeMortonCode(vec3 pos, vec3 boundsMin, vec3 boundsMax) {
    vec3 normalized = (pos - boundsMin) / (boundsMax - boundsMin);
    uint x = uint(normalized.x * 1023);
    uint y = uint(normalized.y * 1023);
    uint z = uint(normalized.z * 1023);
    
    uint code = 0;
    for(int i = 0; i < 10; i++) {
        code |= ((x >> i) & 1) << (3*i);
        code |= ((y >> i) & 1) << (3*i + 1);
        code |= ((z >> i) & 1) << (3*i + 2);
    }
    return code;
}

// Step 2-3: Parallel reduction to build internal nodes
// (typically implemented with work-efficient parallel prefix operations)
```

LBVH is 10-100x faster to build than SAH-optimized BVH but slightly slower to traverse. Acceptable trade-off for dynamic scenes.

## Traversal Performance Analysis

**Ray-box test cost**: ~10 instructions
**Ray-triangle test cost**: ~100 instructions
**Memory latency**: ~200-300 instructions worth

Key metrics:
- **Ray-box tests per ray**: Lower is better (affects cache pressure)
- **Tree depth**: Affects maximum branching
- **Leaf size**: Larger leaves = fewer nodes but more triangle tests per leaf

Typical BVH statistics for 1M triangle model:
- Depth: 20-30 levels
- Ray-box tests per ray: 30-50
- Ray-triangle tests per ray: 5-20 (depends on leaf size)

## Traversal Cost Estimate

For an optimized BVH with:
- 50 ray-box tests @ 10 cycles = 500 cycles
- 10 ray-triangle tests @ 100 cycles = 1000 cycles
- Memory latencies: ~500 cycles

**Total**: ~2000 cycles per ray on modern GPU (RTX, with RT cores much faster)

With 10⁹ rays per frame and 60 FPS, theoretical throughput needed: ~16 Grays/sec (GT = 10¹² rays/sec). RT cores achieve 10-100 Grays/sec depending on geometry complexity.

## BVH Refitting for Deforming Meshes

For animated characters and deforming geometry:

```
function refitBVH(node):
    if node.isLeaf():
        node.aabb = computeAABBFromTriangles(node.triangles)
    else:
        refitBVH(node.left)
        refitBVH(node.right)
        node.aabb = merge(node.left.aabb, node.right.aabb)
```

Cost: O(n) bottom-up pass (much faster than rebuild). Used in production for skeletal animation and soft-body dynamics.

## Practical Recommendations

| Structure | Build Time | Traversal | Use Case |
|-----------|-----------|-----------|----------|
| Median Split BVH | O(n log n) | Decent | Default, fast iteration |
| SAH BVH | O(n² log n) or binned O(n log² n) | Best | Production offline |
| LBVH | O(n log n) on GPU | Good | Dynamic/real-time |
| KD-Tree | O(n log n) | Good | Some special cases |

For modern real-time ray tracing with deforming geometry, **LBVH** is standard. For static geometry offline rendering, **SAH-optimized BVH** is preferred despite longer build times.
