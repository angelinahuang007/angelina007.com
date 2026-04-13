---
title: Curves and Surfaces in Graphics
category: graphics-fundamentals
tags: [curves, surfaces, bezier, splines, nurbs, subdivision, continuity]
description: Bezier curves, B-splines, NURBS, Bezier surfaces, Catmull-Clark and Loop subdivision, continuity classes, and applications in modeling and rendering.
related: [blender/modeling-workflow, algorithms/computational-geometry, graphics-fundamentals/mesh-operations]
order: 7
---

# Curves and Surfaces in Graphics

While meshes are ubiquitous in modern graphics, curves and smooth surfaces remain essential for modeling, animation, font rendering, and CAM applications. These mathematical representations allow arbitrary precision and smooth deformation without explicit vertex data.

## Bezier Curves

A Bezier curve is defined by a sequence of control points. The curve passes through the first and last points but not necessarily the intermediate ones.

### Quadratic Bezier (Degree 2)

Three control points P₀, P₁, P₂ define a quadratic curve:

```
B(t) = (1-t)²P₀ + 2(1-t)t P₁ + t²P₂, t ∈ [0,1]
```

Expanding Bernstein basis:
```
B₂,₀(t) = (1-t)² = 1 - 2t + t²
B₂,₁(t) = 2(1-t)t = 2t - 2t²
B₂,₂(t) = t²

B(t) = B₂,₀(t)P₀ + B₂,₁(t)P₁ + B₂,₂(t)P₂
```

### Cubic Bezier (Degree 3, Most Common)

Four control points P₀, P₁, P₂, P₃:

```
B(t) = (1-t)³P₀ + 3(1-t)²t P₁ + 3(1-t)t²P₂ + t³P₃

Basis:
B₃,₀(t) = (1-t)³
B₃,₁(t) = 3(1-t)²t
B₃,₂(t) = 3(1-t)t²
B₃,₃(t) = t³
```

**Derivative** (useful for animation speed, tangents):
```
B'(t) = 3[(1-t)²(P₁-P₀) + 2(1-t)t(P₂-P₁) + t²(P₃-P₂)]
```

At endpoints:
```
B'(0) = 3(P₁ - P₀)
B'(1) = 3(P₃ - P₂)
```

The tangent direction is controlled by adjacent control points.

### De Casteljau Algorithm (Evaluation)

A numerically stable, geometrically intuitive method to evaluate Bezier curves at parameter t:

```
function deCasteljau(P[], t):
    Q = P  // Copy control points
    
    for r = 1 to degree+1:
        for i = 0 to degree+1-r:
            Q[i] = (1-t) * Q[i] + t * Q[i+1]
    
    return Q[0]  // Final point
```

**Geometric interpretation**: Recursively linear-interpolate along edges. After n iterations (for n+1 control points), the final point is on the curve.

**Example for cubic Bezier**:
```
Initial:      P₀  P₁  P₂  P₃
Iteration 1:  Q₀  Q₁  Q₂     (Q_i = (1-t)P_i + t*P_{i+1})
Iteration 2:  R₀  R₁         (R_i = (1-t)Q_i + t*Q_{i+1})
Iteration 3:  S₀             (S = (1-t)R_0 + t*R_1) = B(t)
```

**Side benefit**: De Casteljau splits the curve at parameter t:
- Left curve: P₀, Q₀, R₀, S₀
- Right curve: S₀, R₁, Q₂, P₃

Extremely useful for adaptive tessellation and collision detection.

## B-Splines

Unlike Bezier curves, B-splines provide **local control**: modifying a control point affects only nearby curve segments.

### Cubic B-Spline (Degree 3)

For n+1 control points, n-2 cubic segments. Each curve segment i is influenced by four consecutive control points:

```
Basis functions (uniform parameterization):
N₃,₀(t) = (1-t)³ / 6
N₃,₁(t) = (3t³ - 6t² + 4) / 6
N₃,₂(t) = (-3t³ + 3t² + 3t + 1) / 6
N₃,₃(t) = t³ / 6

Segment i from t ∈ [0,1]:
C_i(t) = N₃,₀(t)P_i + N₃,₁(t)P_{i+1} + N₃,₂(t)P_{i+2} + N₃,₃(t)P_{i+3}
```

### Knot Vectors

Generalized B-splines use **knot vectors** to parameterize segments non-uniformly. A knot vector [t₀, t₁, ..., t_m] defines where basis functions are non-zero.

**Clamped knot vectors** (endpoints interpolated):
```
For cubic spline with n+1 control points (n-2 segments):
Knot vector = [0, 0, 0, 0, 1, 2, ..., n-3, n-2, n-2, n-2, n-2]
              └─────────┬─────────┘        └─────────┬─────────┘
              4 repeated zeros            4 repeated at end
              (ensures C₀ continuity)
```

**Unclamped (periodic)** for closed curves:
```
Knot vector = [0, 1, 2, ..., n-2, n-1, n, ...]
```

### Cox-de Boor Recursion

Evaluate N_{k,p}(t):

```
Base case (p=0):
N_{i,0}(t) = 1 if t_i ≤ t < t_{i+1} else 0

Recursive case (p>0):
N_{i,p}(t) = ((t - t_i) / (t_{i+p} - t_i)) * N_{i,p-1}(t) +
             ((t_{i+p+1} - t) / (t_{i+p+1} - t_{i+1})) * N_{i+1,p-1}(t)
```

Each term is weighted by the normalized distance between t and knot values.

## NURBS (Non-Uniform Rational B-Splines)

NURBS extend B-splines with **rational weights**—each control point has a weight w_i:

```
C(t) = (Σ w_i * N_{i,p}(t) * P_i) / (Σ w_i * N_{i,p}(t))

Weight = 1: Standard B-spline influence
Weight > 1: Pulls curve toward control point
Weight < 1: Pushes curve away
Weight → ∞: Curve approaches point
Weight = 0: Point has no influence
```

**Advantages**:
- Exact representation of conic sections (circles, ellipses, parabolas)
- Industry standard (CAD, animation software)
- Generalizes both Bezier and B-spline

**Implementation complexity**: NURBS evaluation requires rational function computation, but hardware and libraries abstract this away.

## Bezier Surfaces

Extend Bezier curves to 2D using **bi-variate parametrization**.

### Bicubic Bezier Surface (Most Common)

4×4 grid of control points P_{i,j} with parameters (u,v) ∈ [0,1]²:

```
S(u,v) = Σ Σ B_{i,3}(u) * B_{j,3}(v) * P_{i,j}
         i=0 j=0
         
where B_{k,3} are cubic Bernstein basis functions
```

Four edges of the surface:
```
S(u,0) = Bezier curve defined by P_{i,0}
S(u,1) = Bezier curve defined by P_{i,3}
S(0,v) = Bezier curve defined by P_{0,j}
S(1,v) = Bezier curve defined by P_{3,j}
```

**Advantages**:
- Corner control points interpolated (easier to constrain)
- Smooth surface from control grid
- De Casteljau extends naturally (first along u, then v)

**De Casteljau for surfaces**:
```
function evaluateBezierSurface(P[4][4], u, v):
    // First, evaluate curves along u for each v-row
    curves = []
    for j = 0 to 3:
        curves[j] = deCasteljau(P[:,j], u)
    
    // Then evaluate curve along v
    return deCasteljau(curves[:], v)
```

## Catmull-Clark Subdivision

Generates smooth surfaces from coarse polygon meshes through iterative refinement. Primarily used in film (Pixar, etc.).

### Subdivision Rules

1. **New vertices from edges**: Midpoint, adjusted by neighboring faces
2. **New vertices from faces**: Center (for quads)
3. **Update original vertices**: Weighted average of surrounding edges/faces

```
For triangulated surface or mixed:

New face vertex F = average of original face vertices
New edge vertex E = (original_edge_midpoint + avg(adjacent_face_vertices)) / 2
Updated original vertex V = ((n-3)/n)*V + (1/(n²))*sum(adjacent_face_verts) + (1/n)*sum(edge_midpoints)

where n = valence (number of edges meeting at vertex)
```

### Iterative Refinement

Each iteration:
1. Compute new vertices using rules above
2. Create new mesh topology (each original face becomes multiple faces)
3. New mesh is denser and smoother

After 3-4 iterations, surface appears smooth. Most renderers (Pixar RenderMan, Blender) support this.

### Limit Surface Properties

The subdivision surface converges to a **limit surface** as iterations → ∞. The limit surface satisfies:

- **Smoothness**: C² continuous almost everywhere
- **Exception**: C¹ continuity at vertices with valence ≠ 4
- **Analytically computable**: Eigenanalysis gives exact limit surface

## Loop Subdivision

Alternative for triangular meshes (vs. Catmull-Clark for quads). Produces limit surface with C² continuity.

### Splitting and Weight Rules

1. **Split each triangle** into 4 by adding edge midpoints
2. **Compute new vertex positions**:

```
New edge vertex E = (3*v0 + 3*v1 + orig_left + orig_right) / 8
Updated interior vertex V = (1 - n*β) * V + β * sum(neighbors)

where β = (1/8) * (5/3 - (3/8 + 1/4*cos(2π/n))²)  if n ≥ 3
          ≈ 3 / (8*n)  for large n
```

For boundary vertices, special rules apply (use only 2 neighbors instead of ring).

## Continuity Classes

Different subdivision and surface schemes guarantee different smoothness levels:

- **C⁰**: Positional continuity (curve endpoints match)
- **C¹**: Tangent continuity (first derivative continuous)
- **C²**: Curvature continuity (second derivative continuous)
- **G¹**: Geometric tangent continuity (tangent direction matches, not magnitude)
- **G²**: Geometric curvature continuity

**Example**:
```
Two cubic Bezier curves connected:
Curve1 endpoint = P1_3
Curve2 startpoint = P2_0

C⁰: P1_3 = P2_0
C¹: P1_3 = P2_0 AND P1_2 collinear with P1_3 and P2_1
C²: C¹ conditions plus 2nd derivative match
```

Higher continuity = smoother appearance but more constraints on control points.

## Applications in Font Rendering

TrueType and OpenType use:
- **TrueType**: Quadratic Bezier curves (B-spline segments)
- **PostScript/OpenType**: Cubic Bezier curves

Advantages over polygonal fonts:
- Arbitrarily scalable (vector fonts)
- Tiny file size (curves vs. rasterized glyphs)
- Hinting for pixelated grid alignment at small sizes

Modern rendering uses:
- **Signed distance fields (SDF)**: Tessellate curves to polygons, compute distance field, render in shader
- **Vector graphics libraries**: Rasterize curves on-demand (Cairo, Direct2D)

## Tessellation in GPU Pipelines

Modern GPU tessellation shaders (DirectX Hull/Domain shaders, OpenGL TCS/TES) evaluate parametric surfaces:

```hlsl
// Hull shader: specify how much to subdivide
[partitioning("fractional_even")]
[outputtopology("triangle_cw")]
[outputcontrolpoints(3)]
[patchconstantfunc("PatchConstantFunc")]
HS_CONTROL_POINT_OUTPUT main(InputPatch<HS_INPUT, 3> ip, uint i : SV_OutputControlPointID) {
    HS_CONTROL_POINT_OUTPUT output;
    output.pos = ip[i].pos;
    return output;
}

// Domain shader: evaluate surface at generated points
[domain("tri")]
DS_OUTPUT main(PatchTess patchTess, float3 bary : SV_DomainLocation, 
               const OutputPatch<HS_CONTROL_POINT_OUTPUT, 3> tri) {
    DS_OUTPUT output;
    
    // Evaluate Bezier surface using bary coords
    float3 pos = bary.x*tri[0].pos + bary.y*tri[1].pos + bary.z*tri[2].pos;
    
    output.posWS = mul(float4(pos, 1.0), modelMatrix).xyz;
    output.posH = mul(float4(output.posWS, 1.0), viewProjMatrix);
    
    return output;
}
```

This allows displacement mapping with smooth surfaces: artists author coarse control cages, GPU subdivides adaptively based on screen coverage.

## Practical Considerations

**When to use curves/surfaces**:
- Smooth deformable objects (characters, creatures)
- Precise geometric control (industrial design)
- Animation paths and camera trajectories
- Font rendering and vector graphics

**When to use meshes**:
- Complex topology (buildings, terrain)
- High-frequency detail
- Pre-baked visual content

Modern pipelines often **blend**: use smooth subdivision surfaces for base shapes, apply high-frequency detail with normal/displacement maps from traditional polygonal meshes. This combines the best of both worlds—smooth silhouettes with rich texture detail.
