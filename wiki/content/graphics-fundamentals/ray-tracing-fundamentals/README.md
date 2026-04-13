---
title: Ray Tracing Fundamentals
category: graphics-fundamentals
tags: [ray-tracing, intersection, geometry, rendering, optics, recursive]
description: Ray tracing from first principles including ray generation, triangle/sphere intersection tests, recursive ray tracing, Whitted-style ray tracing, and Fresnel equations.
related: [graphics-fundamentals/acceleration-structures, graphics-fundamentals/global-illumination, frontier/realtime-gi]
order: 5
---

# Ray Tracing Fundamentals

Ray tracing is a direct simulation of light physics. Instead of rasterizing geometry, we trace light rays through the scene and compute their interactions with surfaces. This approach naturally handles reflections, refractions, and shadows with a unified framework.

## The Ray Tracing Equation

At its core, ray tracing solves the rendering equation:

```
Lₒ(ωₒ) = ∫ fᵣ(ωᵢ, ωₒ) Lᵢ(ωᵢ) cos(θᵢ) dωᵢ
         Ω
```

For each pixel, we:
1. Generate a ray from the camera through the pixel
2. Find the nearest surface intersection
3. Recursively trace rays at that surface (reflection, refraction, shadow rays)
4. Accumulate contributions from all rays

## Ray Definition and Generation

A ray is defined parametrically:

```
R(t) = O + t*D, where t ≥ 0

O = ray origin (camera position)
D = ray direction (normalized)
t = parameter along ray (distance from origin)
```

**Ray generation for perspective camera**:

```glsl
vec3 rayOrigin = cameraPosition;
vec3 rayDirection = normalize(pixelWorldPos - cameraPosition);
```

More precisely, for a given pixel (px, py) in screen space:

```
pixelNDC = vec2((px + 0.5) / screenWidth, (py + 0.5) / screenHeight) * 2.0 - 1.0;
pixelViewSpace = inverse(projectionMatrix) * vec4(pixelNDC, 1.0);
pixelWorldSpace = cameraMatrix * pixelViewSpace;
rayDirection = normalize(pixelWorldSpace - cameraPosition);
```

In pseudocode:
```
function generateRay(pixel_x, pixel_y, screen_width, screen_height, camera):
    uv = vec2(pixel_x / screen_width, pixel_y / screen_height)
    ray_direction = camera.computeRayDirection(uv)
    return Ray(camera.position, normalize(ray_direction))
```

## Ray-Sphere Intersection

Spheres are simple to intersect, useful for testing and some procedural geometry.

**Sphere definition**: ||P - C|| = r, where C is center, r is radius

**Substituting ray equation**:
```
||O + t*D - C||² = r²
||(O - C) + t*D||² = r²

Let A = O - C:
||A + t*D||² = r²
(A + t*D)·(A + t*D) = r²
A·A + 2t(A·D) + t²(D·D) = r²
t² + 2t(A·D/D·D) + (A·A - r²)/D·D = 0

For normalized D (D·D = 1):
t² + 2t(A·D) + (A·A - r²) = 0
```

Using the quadratic formula:
```
a = 1
b = 2(A·D)
c = A·A - r²
Δ = b² - 4ac

If Δ < 0: No intersection
If Δ ≥ 0: t₁,₂ = (-b ± √Δ) / 2a
```

**GLSL implementation**:
```glsl
bool raySphereIntersection(vec3 origin, vec3 direction, vec3 center, 
                           float radius, out float t) {
    vec3 A = origin - center;
    
    float a = dot(direction, direction);  // Always 1 for normalized dir
    float b = 2.0 * dot(A, direction);
    float c = dot(A, A) - radius * radius;
    
    float discriminant = b * b - 4.0 * a * c;
    
    if(discriminant < 0.0) return false;
    
    float sqrtDisc = sqrt(discriminant);
    float t1 = (-b - sqrtDisc) / (2.0 * a);
    float t2 = (-b + sqrtDisc) / (2.0 * a);
    
    // Take closest positive intersection
    if(t1 > 1e-4) { t = t1; return true; }
    if(t2 > 1e-4) { t = t2; return true; }
    
    return false;
}
```

## Ray-Triangle Intersection (Möller-Trumbore)

The most important intersection test in graphics. The Möller-Trumbore algorithm is fast and numerically stable.

**Triangle defined by vertices A, B, C**:

```
P(u, v) = A + u(B - A) + v(C - A)

where u, v ≥ 0 and u + v ≤ 1 (barycentric coordinates)
```

**Ray-triangle intersection**:
```
O + t*D = A + u(B - A) + v(C - A)

Rearrange:
O + t*D = A + u*E₁ + v*E₂

where E₁ = B - A, E₂ = C - A
```

**Möller-Trumbore derivation** (using Cramer's rule):

```
t*D - u*E₁ - v*E₂ = A - O

Define:
P = cross(D, E₂)
Q = cross(A - O, E₁)

The solution requires:
denominator = dot(P, E₁)
If |denominator| < epsilon: parallel (no intersection)

t = dot(Q, E₂) / denominator
u = dot(P, A - O) / denominator
v = dot(Q, D) / denominator

If t > epsilon and u ≥ 0 and v ≥ 0 and (u + v) ≤ 1: valid intersection
```

**Efficient GLSL implementation**:
```glsl
const float EPSILON = 1e-5;

bool rayTriangleIntersection(vec3 rayOrigin, vec3 rayDir,
                             vec3 v0, vec3 v1, vec3 v2,
                             out float t, out vec3 baryCoords) {
    vec3 E1 = v1 - v0;
    vec3 E2 = v2 - v0;
    
    vec3 P = cross(rayDir, E2);
    float denom = dot(P, E1);
    
    if(abs(denom) < EPSILON) return false;  // Parallel
    
    vec3 T = rayOrigin - v0;
    float u = dot(P, T) / denom;
    if(u < 0.0 || u > 1.0) return false;
    
    vec3 Q = cross(T, E1);
    float v = dot(Q, rayDir) / denom;
    if(v < 0.0 || u + v > 1.0) return false;
    
    t = dot(Q, E2) / denom;
    if(t < EPSILON) return false;  // Intersection behind ray origin
    
    baryCoords = vec3(1.0 - u - v, u, v);  // (λ₀, λ₁, λ₂)
    return true;
}
```

## Ray-AABB Intersection

Axis-Aligned Bounding Boxes are used for acceleration structures. Quick rejection of rays.

**AABB definition**: min = (xmin, ymin, zmin), max = (xmax, ymax, zmax)

**Slab method**: Compute intersection with three pairs of planes (x, y, z).

```
For x-slab:
  t_x_min = (xmin - O.x) / D.x
  t_x_max = (xmax - O.x) / D.x
  
  Swap if D.x < 0: t_x_min, t_x_max = t_x_max, t_x_min
  
  [t_enter_x, t_exit_x] = [t_x_min, t_x_max]

Repeat for y, z.

Ray intersects AABB if:
  max(t_enter_x, t_enter_y, t_enter_z) ≤ min(t_exit_x, t_exit_y, t_exit_z)
```

**GLSL implementation**:
```glsl
bool rayAABBIntersection(vec3 rayOrigin, vec3 rayDir, vec3 boxMin, vec3 boxMax) {
    vec3 invDir = 1.0 / rayDir;
    vec3 t0 = (boxMin - rayOrigin) * invDir;
    vec3 t1 = (boxMax - rayOrigin) * invDir;
    
    // Handle negative direction
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);
    
    float t_enter = max(tmin.x, max(tmin.y, tmin.z));
    float t_exit = min(tmax.x, min(tmax.y, tmax.z));
    
    return t_enter < t_exit && t_exit > 0.0;
}
```

## Whitted-Style Ray Tracing

Classic recursive ray tracing introduced by Turner Whitted. At each surface:

1. **Primary ray**: From camera through pixel
2. **Shadow ray**: From hit point toward light (blocked = shadow)
3. **Reflection ray**: Mirror-like bounce (for reflective surfaces)
4. **Refraction ray**: Through transparent materials

```
function traceRay(ray, depth):
    if depth > maxDepth:
        return backgroundColor
    
    if ray doesn't intersect scene:
        return backgroundColor
    
    hitPoint = ray.origin + ray.t * ray.direction
    surface = getHitSurface(hitPoint)
    
    // Direct lighting (shadow rays to all lights)
    directLight = 0
    for each light:
        shadowRay = Ray(hitPoint, lightDirection)
        if not rayIntersectsScene(shadowRay, lightDistance):
            directLight += evaluateLighting(surface, light)
    
    indirectLight = 0
    
    // Reflection
    if surface.isReflective:
        reflRay = Ray(hitPoint, reflect(ray.direction, surface.normal))
        indirectLight += 0.8 * traceRay(reflRay, depth + 1)
    
    // Refraction
    if surface.isTransparent:
        refrRay = Ray(hitPoint, refract(ray.direction, surface.normal, refIdx))
        indirectLight += 0.2 * traceRay(refrRay, depth + 1)
    
    return directLight + indirectLight
```

**Typical parameters**:
- Max recursion depth: 4-10 (beyond this, contribution negligible)
- Rays per pixel: 1-64 for anti-aliasing
- Total rays: width × height × samples × branching_factor

For 1920×1080 at 16 samples with max depth 8, worst case: 1920 × 1080 × 16 × 16 = ~500M rays per frame.

## Reflection and Refraction

### Perfect Reflection

Mirror-like reflection. Reflected ray direction is:

```
R = D - 2(D·N)N

where D = incident direction, N = surface normal
```

The reflection follows the law of reflection: angle of incidence = angle of reflection.

### Refraction (Snell's Law)

Describes light bending when passing between media of different refractive indices.

```
n₁ sin(θ₁) = n₂ sin(θ₂)

where n₁, n₂ = refractive indices
      θ₁, θ₂ = angles from surface normal
```

Solving for refracted direction:

```
η = n₁ / n₂  (relative refractive index)
cos(θ₁) = -D · N  (angle from normal)
cos(θ₂) = √(1 - η² * (1 - cos²(θ₁)))

If cos(θ₂) is imaginary: Total Internal Reflection (no refraction)

T = η * D + (η * cos(θ₁) - cos(θ₂)) * N
```

**GLSL implementation**:
```glsl
vec3 refract(vec3 incident, vec3 normal, float eta) {
    float cosI = -dot(normal, incident);
    
    if(cosI < 0.0) {
        normal = -normal;
        cosI = -cosI;
        eta = 1.0 / eta;
    }
    
    float cosT2 = 1.0 - eta * eta * (1.0 - cosI * cosI);
    
    if(cosT2 < 0.0) {
        return reflect(incident, normal);  // Total internal reflection
    }
    
    return eta * incident + (eta * cosI - sqrt(cosT2)) * normal;
}
```

### Fresnel Effect

The Fresnel equations describe how much light is reflected vs transmitted at an interface:

```
For dielectrics (non-conductors, Schlick approximation):
F(θ) = F₀ + (1 - F₀)(1 - cos(θ))⁵

F₀ depends on refractive indices:
F₀ = ((n₁ - n₂) / (n₁ + n₂))²

Examples:
  Air (n=1.0) to glass (n=1.5): F₀ ≈ 0.04
  Air to water (n=1.33): F₀ ≈ 0.02
  
At grazing angle (cos(θ) → 0): F → 1.0 (nearly perfect reflection)
At normal incidence (cos(θ) → 1): F → F₀
```

**In ray tracing**:
```glsl
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

// Probabilistically choose reflection vs refraction based on Fresnel
float reflectProb = fresnelSchlick(cosI, F0).r;  // Use one channel or average
if(random() < reflectProb) {
    return traceRay(reflectionRay);
} else {
    return traceRay(refractionRay);
}
```

## Importance of t-Testing

When tracing multiple rays per pixel (supersampling or Monte Carlo), variance accumulates. The **recursive depth** causes rays to diverge exponentially.

**Sampling distribution affects variance**:
- Uniform random: High variance
- Stratified sampling: Lower variance (divide pixel into regions, sample one per region)
- Importance sampling: Sample heavily in directions that contribute most light

## Adaptive Depth Control

To avoid wasting computation on low-contribution rays:

```
function traceRayAdaptive(ray, depth, maxDepth, minContribution):
    ...
    
    reflectionContribution = fresnelValue * reflectivity
    refractionContribution = (1 - fresnelValue) * transmittance
    
    if depth < maxDepth and reflectionContribution > minContribution:
        indirectLight += traceRay(reflRay, depth + 1)
    
    if depth < maxDepth and refractionContribution > minContribution:
        indirectLight += traceRay(refrRay, depth + 1)
    
    return directLight + indirectLight
```

## Comparison with Rasterization

| Aspect | Ray Tracing | Rasterization |
|--------|------------|---------------|
| Shadows | Automatic (shadow rays) | Requires shadow maps |
| Reflections | Recursive (full support) | Planar reflections or screen-space |
| Refraction | Recursive (full support) | Limited (post-process) |
| Occlusion | Handled implicitly | Z-buffer |
| Performance | O(rays) | O(triangles * pixels) |
| Real-time | Difficult (requires acceleration structures) | Standard |

Ray tracing naturally handles complex light interactions but is computationally expensive. Modern GPUs now support hardware ray tracing with specialized cores, enabling real-time ray tracing for interactive applications. Understanding ray tracing fundamentals is essential for modern graphics programming.
