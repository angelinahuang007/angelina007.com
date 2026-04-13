---
title: Global Illumination and Advanced Rendering
category: graphics-fundamentals
tags: [global-illumination, path-tracing, photon-mapping, radiosity, monte-carlo, rendering-equation]
description: Path tracing, Monte Carlo integration, importance sampling, photon mapping, radiosity, and the complete rendering equation with convergence analysis.
related: [graphics-fundamentals/ray-tracing-fundamentals, graphics-fundamentals/shading-models, frontier/realtime-gi]
order: 9
---

# Global Illumination and Advanced Rendering

Global illumination (GI) simulates light bouncing between surfaces multiple times. Unlike direct lighting (light from sources to surface), GI accounts for indirect light from other surfaces. This is essential for realistic rendering but computationally expensive.

## The Rendering Equation (Complete Form)

The fundamental equation for light transport:

```
Lₒ(x, ωₒ) = Lₑ(x, ωₒ) + ∫ fᵣ(x, ωᵢ, ωₒ) Lᵢ(x, ωᵢ) |cos(θᵢ)| dωᵢ
             Ω

Where:
  Lₒ = outgoing radiance from point x in direction ωₒ
  Lₑ = emitted radiance (if x is a light source)
  fᵣ = BRDF (fraction of incident light reflected)
  Lᵢ = incoming radiance from direction ωᵢ
  θᵢ = angle between surface normal and incident direction
  Ω = hemisphere of possible incident directions
```

**Self-similar structure**: Lᵢ(x, ωᵢ) is itself determined by the same equation at some other point. This recursive nature is the key to GI but also the source of computational cost.

## Path Tracing

Stochastic algorithm that solves the rendering equation via **Monte Carlo integration**. For each pixel:

1. Generate a ray through the pixel
2. Find nearest surface intersection
3. Randomly sample a reflection/transmission direction (importance weighted)
4. Recursively trace the reflected/refracted ray (Russian roulette termination)
5. Accumulate samples (average over many samples per pixel reduces noise)

### Monte Carlo Integration

To compute integral:

```
I = ∫ f(x) dx
    [a,b]

Monte Carlo estimator (uniform sampling):
I ≈ (1/N) * Σ f(x_i) / p(x_i)

where x_i are uniformly sampled, p(x_i) = 1/(b-a) for uniform distribution
     N = number of samples
```

For the rendering equation:

```
Lₒ = ∫ fᵣ(ωᵢ, ωₒ) Lᵢ(ωᵢ) cos(θᵢ) dωᵢ
    Ω

Monte Carlo (uniform hemisphere sampling):
Lₒ ≈ (1/N) * Σ [fᵣ(ωᵢ, ωₒ) * Lᵢ(ωᵢ) * cos(θᵢ) / (1/(2π))]
    = (2π/N) * Σ fᵣ(ωᵢ, ωₒ) * Lᵢ(ωᵢ) * cos(θᵢ)
```

**Problem**: Uniform sampling is inefficient—many samples contribute little to final result.

### Importance Sampling

Bias samples toward directions likely to contribute significantly:

```
Standard Monte Carlo: sample proportional to (fᵣ * Lᵢ * cos(θ))
Important directions: specular directions, bright light directions

With importance sampling:
Lₒ ≈ (1/N) * Σ [fᵣ(ωᵢ, ωₒ) * Lᵢ(ωᵢ) * cos(θᵢ) / p(ωᵢ)]

where p(ωᵢ) is the probability distribution of samples
If p(ωᵢ) ∝ fᵣ * Lᵢ * cos(θ), variance → 0 (optimal)
If p(ωᵢ) ∝ cos(θ), variance is low for diffuse (cosine importance sampling)
```

**Cosine Importance Sampling** (for diffuse surfaces):

```
Sample direction ωᵢ with probability p(ωᵢ) = cos(θᵢ) / π

Result: Lₒ ≈ (1/N) * Σ fᵣ * Lᵢ
The cosine factor and probability cancel!
```

**Multiple Importance Sampling**: Combine different sampling strategies (e.g., BRDF importance + light importance):

```
Lₒ ≈ (1/N₁) * Σ [fᵣ * Lᵢ * cos(θ) / p_brdf(ω)] * w_brdf +
     (1/N₂) * Σ [fᵣ * Lᵣ * cos(θ) / p_light(ω)] * w_light

where w_brdf + w_light = 1 (weighted combination)
```

### Path Tracing Algorithm

```cpp
vec3 pathTrace(Ray ray, int depth, RandomGenerator& rng) {
    if(depth > maxDepth) return vec3(0);  // Ray terminated
    
    // Find nearest intersection
    Hit hit = raycast(ray);
    if(!hit.valid) return backgroundColor();
    
    // Emitted light (if light source)
    vec3 emission = hit.material.emission;
    
    // Terminatation via Russian roulette (avoid deep recursion)
    float maxComponent = max(hit.material.reflectance);
    if(rng.uniform() > maxComponent) return emission;
    
    // Sample reflected direction (importance sampled)
    vec3 sampledDir = hit.material.sampleDirection(hit.normal, rng);
    float pdf = hit.material.pdf(sampledDir);
    
    // Evaluate BRDF
    vec3 brdf = hit.material.evaluate(sampledDir);
    
    // Recursive path tracing
    Ray reflectedRay = Ray(hit.point + epsilon * hit.normal, sampledDir);
    vec3 indirect = pathTrace(reflectedRay, depth + 1, rng) * brdf / pdf;
    
    // Weight by Russian roulette probability
    return emission + indirect / maxComponent;
}

// Main rendering
vec3 renderPixel(vec2 pixelCoord) {
    vec3 result = vec3(0);
    int samplesPerPixel = 256;
    
    for(int sample = 0; sample < samplesPerPixel; sample++) {
        vec2 jitteredCoord = pixelCoord + randomOffset();
        Ray ray = camera.generateRay(jitteredCoord);
        result += pathTrace(ray, 0, rng);
    }
    
    return result / samplesPerPixel;  // Average all samples
}
```

## Noise and Convergence

Path tracing produces **noise** because each pixel's estimate is from a finite number of samples. **Variance**:

```
Var(L) = E[L²] - E[L]²

For unbiased estimators:
Error ≈ O(1/√N)  where N = number of samples

To reduce noise by 2x: Need 4x more samples (quadratic relationship)
```

**Convergence rate is slow** for difficult scenes (many bounces, specular surfaces).

### Denoising Strategies

**Spatiotemporal denoising**: Modern real-time rendering combines:
1. Few samples per frame (16-64)
2. Reproject previous frames
3. Use nearby pixels for denoising context
4. Apply neural network denoiser

## Photon Mapping

Two-pass algorithm suitable for complex lighting.

### Pass 1: Photon Emission

1. Generate photons from light sources
2. Trace each photon through scene
3. Store photon when it hits a surface

```
Each photon stores:
  - Position
  - Incoming direction
  - Power
  - Bounces
```

### Pass 2: Gathering

At each surface, estimate indirect lighting by finding nearby photons:

```
Lᵢ(x, ωₒ) ≈ Σ photons_near(x) [power / area]

where area = πr² (search radius)
      r chosen to balance bias/variance
```

**Advantages**:
- Caustics naturally handled (photons follow light)
- Efficient for complex indirect lighting
- Decoupled from view direction (can reuse for many views)

**Disadvantages**:
- Biased (becomes unbiased as r→0, photons→∞)
- Memory intensive (storing photons)
- Photon tracing overhead

### Progressive Photon Mapping

Iteratively refine estimate by shrinking search radius:

```
Iteration 1: 100K photons, search radius = 1.0
Iteration 2: 100K more photons, search radius = 0.9
Iteration 3: 100K more photons, search radius = 0.8
...
```

As radius shrinks and photon count grows, estimate converges to ground truth.

## Radiosity

Assumes surfaces are perfectly diffuse (Lambertian). Divides surfaces into **patches**, computes how much light each patch receives from others.

**Form factors** (Fᵢⱼ): Fraction of light leaving patch i that reaches patch j.

```
Lᵢ = Eᵢ + ρᵢ * Σ Fᵢⱼ * Lⱼ

This is a system of linear equations:
[I - ρ₁*F] [L₁]   [E₁]
[I - ρ₂*F] [L₂] = [E₂]
[    ...  ] [...] = [...]
[I - ρₙ*F] [Lₙ]   [Eₙ]

Solve via iterative refinement or Gaussian elimination.
```

**Advantages**:
- View-independent (bake once, view from any angle)
- Handles diffuse color bleeding naturally
- No noise (deterministic solution)

**Disadvantages**:
- Assumes diffuse surfaces (no specular highlights/reflections)
- Expensive form factor computation
- Requires solving large linear system
- Artifacts from patch discretization

## Irradiance Caching

Trade-off between path tracing and radiosity. Cache indirect illumination at sample points, interpolate nearby samples.

```
1. Compute indirect light at sparse locations (expensive path tracing)
2. Store in spatial structure (octree/BVH)
3. For new pixel, find nearby cached values
4. Interpolate or fetch directly (fast)
5. Refine cache iteratively
```

**Used in film rendering** (RenderMan, V-Ray): handles both diffuse and specular lighting.

## Screen-Space Techniques (Real-Time Approximation)

Modern games approximate GI in real-time using screen-space data.

### Screen-Space Ambient Occlusion (SSAO)

Approximate ambient occlusion from depth buffer:

```glsl
float occlusion = 0.0;
int sampleCount = 0;

for(int i = 0; i < samples; i++) {
    vec2 offset = samplePoints[i] * radius;
    vec2 sampleUV = uv + offset;
    
    float sampleDepth = texture(depthBuffer, sampleUV).r;
    float surfaceDepth = texture(depthBuffer, uv).r;
    
    if(sampleDepth > surfaceDepth) {
        occlusion += 1.0;
    }
}

ao = 1.0 - (occlusion / samples);
```

### Screen-Space Reflections (SSR)

Approximate reflections using screen-space ray marching:

```glsl
vec3 reflectionColor = vec3(0);

vec3 reflDir = reflect(viewDir, normal);
vec3 rayPos = screenPos;

for(int step = 0; step < maxSteps; step++) {
    rayPos += reflDir * stride;
    float sampleDepth = texture(depthBuffer, rayPos.xy).r;
    
    if(rayPos.z > sampleDepth) {
        reflectionColor = texture(colorBuffer, rayPos.xy).rgb;
        break;  // Hit something
    }
    
    if(rayPos.z > farPlane) break;  // Missed
}

finalColor = mix(surfaceColor, reflectionColor, reflectance);
```

**Issues**:
- Artifacts at screen edges (off-screen reflections not visible)
- Reflection of only on-screen geometry
- Aliasing from discrete ray marching

## Combining Direct and Indirect

Production rendering uses **split sampling**:

1. **Direct sampling**: Ray to light sources (shadow rays)
2. **Indirect sampling**: Random bounce (path tracing)

```
L_final = L_direct + L_indirect

L_direct computed efficiently via shadow rays to few key lights
L_indirect computed via path tracing from primary surface
```

Each component uses appropriate estimator (direct = few bright rays, indirect = stochastic).

## Practical Convergence Recommendations

| Scene Type | Path Tracing Samples | Primary Use |
|-----------|----------------------|------------|
| Diffuse only | 100-256 | Interior scenes |
| Mixed diffuse/specular | 512-2048 | Realistic objects |
| Specular (glass, mirrors) | 2048-8192 | Challenging caustics |
| Real-time approx | 16-64 + denoising | Games |

Modern trend: **Hybrid rendering**
- Real-time rasterization for primary surface
- Path tracing for secondary bounces
- Neural denoiser for noise reduction
- Temporal stability across frames

This combines speed of rasterization with quality of global illumination.
