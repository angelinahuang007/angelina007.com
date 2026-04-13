---
title: Real-Time Global Illumination
category: frontier
order: 4
tags: [GI, real-time, DDGI, SVOGI, ReSTIR, ray-tracing]
description: Technical overview of real-time global illumination techniques including probe-based methods, screen-space approaches, voxel techniques, and industry implementations like Lumen.
related: [graphics-fundamentals/global-illumination, game-engines/unreal/nanite-lumen, graphics-fundamentals/realtime-rendering-pipeline]
---

# Real-Time Global Illumination

## Introduction

Global illumination (GI) simulates light bouncing between surfaces, creating photorealistic lighting where indirect light contributes significantly to final appearance. For decades, this remained computationally expensive and was primarily a pre-rendering technique. Recent advances enable real-time GI at interactive frame rates, transforming game engines and real-time rendering.

This guide explores modern real-time GI techniques: screen-space methods, probe-based systems, voxel approaches, hardware ray tracing, and production implementations.

## Classical Global Illumination Problem

The rendering equation (Kajiya, 1986):

$$L_o(\mathbf{x}, \omega_o) = L_e(\mathbf{x}, \omega_o) + \int_\Omega f_r(\mathbf{x}, \omega_i, \omega_o) L_i(\mathbf{x}, \omega_i) (\omega_i \cdot \mathbf{n}) d\omega_i$$

where:
- $L_o$ is outgoing radiance (what we see)
- $L_e$ is emitted radiance (from light sources)
- $f_r$ is the BRDF
- $L_i$ is incoming radiance from direction $\omega_i$

The key insight: $L_i(\mathbf{x}, \omega_i)$ depends on what's visible in that direction, which depends on other surfaces' radiance, which depends on their GI, creating a recursive problem.

Real-time GI approximates this integral efficiently rather than solving it exactly.

## Screen-Space Methods

### Screen-Space Ambient Occlusion (SSAO)

SSAO approximates ambient occlusion—how much ambient light reaches a point—using only screen-space depth:

```glsl
float ssao(vec2 uv, vec3 normal, float depth, sampler2D depthTexture) {
    float occlusion = 0.0;
    const int SAMPLES = 16;
    const float RADIUS = 0.5; // in screen space
    
    for (int i = 0; i < SAMPLES; i++) {
        // Sample random direction on hemisphere (importance sampled)
        vec3 dir = normalize(randomDir(i, uv));
        if (dot(dir, normal) < 0.0) dir = -dir;
        
        // Sample depth at offset position
        vec2 offsetUV = uv + normalize(dir.xy) * RADIUS;
        float sampledDepth = texture(depthTexture, offsetUV).r;
        
        // Check occlusion
        float depthDiff = depth - sampledDepth;
        if (depthDiff > 0.01 && depthDiff < 0.5) {
            occlusion += 1.0;
        }
    }
    
    return 1.0 - (occlusion / float(SAMPLES));
}
```

**Limitations**: Only approximate shadows from occluding geometry, doesn't model actual light transport.

### Screen-Space Global Illumination (SSGI)

Extends SSAO by tracing rays in screen space to find light sources:

$$L_i(\mathbf{x}) \approx \frac{1}{N} \sum_{n=1}^{N} L(\mathbf{x} + t_n \mathbf{d})$$

where rays are marched through the screen-space depth buffer.

**Algorithm**:
1. For each pixel, compute surface normal and view direction
2. Generate ray directions over hemisphere
3. Ray march through depth buffer (checking 32-64 steps)
4. At each step, check if ray occludes (goes behind depth)
5. If ray exits screen, sample screen edge for distant illumination
6. Accumulate light contributions

```glsl
vec3 ssgi(vec3 fragPos, vec3 normal, sampler2D gBuffer, sampler2D depth) {
    vec3 light = vec3(0.0);
    const int RAY_SAMPLES = 64;
    const float RAY_LENGTH = 100.0;
    const int MARCH_STEPS = 32;
    
    // Generate rays over hemisphere (importance sampled toward normal)
    for (int ray = 0; ray < RAY_SAMPLES; ray++) {
        vec3 rayDir = importanceSampleHemisphere(ray, normal);
        
        vec3 rayPos = fragPos;
        vec3 rayScreenPos = projectToScreen(rayPos);
        
        float hitDist = 0.0;
        bool hit = false;
        
        // March ray through depth buffer
        for (int step = 0; step < MARCH_STEPS; step++) {
            rayPos += rayDir * (RAY_LENGTH / float(MARCH_STEPS));
            rayScreenPos = projectToScreen(rayPos);
            
            if (rayScreenPos.z < 0.0 || rayScreenPos.z > 1.0) {
                // Ray left screen
                vec3 envLight = sampleEnvironmentMap(rayDir);
                light += envLight;
                break;
            }
            
            float sampledDepth = texture(depth, rayScreenPos.xy).r;
            if (rayPos.z > sampledDepth) {
                // Ray hit geometry
                vec3 hitColor = texture(gBuffer, rayScreenPos.xy).rgb;
                light += hitColor * max(0.0, dot(rayDir, normal));
                hit = true;
                break;
            }
        }
    }
    
    return light / float(RAY_SAMPLES);
}
```

**Advantages**: 
- No additional data structures
- Runs entirely on frame data

**Disadvantages**:
- Biased (misses out-of-screen light)
- Temporal instability (flickering when objects move)
- Limited ray length (most rays hit screen edges)

## Probe-Based Methods

### Dynamic Diffuse Global Illumination (DDGI)

DDGI (Majercik et al., 2019) places probes in a regular grid and stores irradiance information:

**Probe representation**:
- Position: $\mathbf{p}_i \in \mathbb{R}^3$ (grid point)
- Irradiance: $16 \times 16$ pixel SH coefficients per probe (order-2 SH = 9 coefficients per RGB = 27 floats)
- Depth: $16 \times 16$ depth values for ray tracing validation

**Irradiance computation**:

$$E(\mathbf{n}) = \int_\Omega L(\omega) (\omega \cdot \mathbf{n}) d\omega \approx \sum_{l=0}^{2} \sum_{m=-l}^{l} c_l^m Y_l^m(\mathbf{n})$$

where $c_l^m$ are learned SH coefficients.

### Ray Casting from Probes

Each probe shoots rays to gather incoming light:

```cpp
struct DDGIProbe {
    glm::vec3 position;
    glm::mat3 irradianceSH[3]; // RGB, each has 9 coefficients (order-2)
    glm::vec2 irradianceTexels[6]; // 6 cube faces
    
    glm::vec2 depthTexels[6];
    int probeIndex;
};

void updateProbeIrradiance(DDGIProbe& probe, const Scene& scene, 
                           const RayTracer& tracer) {
    // Cast rays from probe in many directions
    const int RAYS_PER_PROBE = 256;
    
    std::vector<glm::vec3> irradiance(9, glm::vec3(0.0)); // SH coefficients
    
    for (int ray = 0; ray < RAYS_PER_PROBE; ray++) {
        // Generate uniform directions on sphere
        glm::vec3 rayDir = uniformSampleSphere(ray, RAYS_PER_PROBE);
        
        // Trace ray and find nearest hit
        Ray queryRay(probe.position, rayDir);
        RayHit hit = tracer.traceRay(queryRay, scene);
        
        if (hit.found) {
            // Evaluate SH basis
            glm::vec3 color = hit.material.albedo * hit.incomingRadiance;
            
            for (int sh = 0; sh < 9; sh++) {
                float basis = evaluateSHBasis(sh, rayDir);
                irradiance[sh] += color * basis;
            }
        }
    }
    
    // Normalize and store
    for (int sh = 0; sh < 9; sh++) {
        probe.irradianceSH[sh] = irradiance[sh] / float(RAYS_PER_PROBE);
    }
}
```

### Querying DDGI

At runtime, query nearest probes and interpolate:

$$L_i(\mathbf{x}, \mathbf{n}) \approx \sum_i w_i(\mathbf{x}) \sum_l \sum_m c_{i,l}^m Y_l^m(\mathbf{n})$$

where $w_i(\mathbf{x})$ are trilinear interpolation weights based on grid position.

**Advantages**:
- Smooth, temporally stable results
- Handles dynamic scenes
- Moderate memory cost ($\sim$50-200 MB for dense grids)

**Disadvantages**:
- Requires probe placement strategy
- Limited spatial resolution (typically 1-2m grid spacing)
- Ray casting overhead
- Interpolation artifacts at probe boundaries

## Voxel-Based Methods

### Voxel Global Illumination (VXGI)

Store scene in voxel grid, ray march through voxels to gather indirect light:

```cpp
class VoxelGI {
    glm::ivec3 gridDim;
    std::vector<glm::vec4> voxelData; // RGBA color + opacity
    glm::mat4 gridTransform;
    
public:
    void voxelize(const Scene& scene, const Camera& lightView) {
        // Render scene from light direction into voxel grid
        // Each voxel stores light information
        
        // Conservative rasterization: 
        // Make sure small triangles still affect voxels
        rasterizeConservative(scene, lightView);
        
        // Propagate color through voxel grid (cone tracing)
        propagateColor();
    }
    
    glm::vec3 queryIndirectLight(glm::vec3 pos, glm::vec3 normal) {
        // Trace multiple cones from position
        glm::vec3 lighting = glm::vec3(0.0);
        const int CONES = 6;
        
        for (int i = 0; i < CONES; i++) {
            // Generate cone direction (distributed over hemisphere)
            glm::vec3 coneDir = cosineSampleHemisphere(i, normal);
            
            // Cone trace through voxel grid
            glm::vec3 coneLight = coneTrace(pos, coneDir);
            lighting += coneLight;
        }
        
        return lighting / float(CONES);
    }
    
private:
    glm::vec3 coneTrace(glm::vec3 pos, glm::vec3 dir) {
        glm::vec3 light = glm::vec3(0.0);
        float alpha = 0.0;
        float dist = 0.0;
        const float MAX_DIST = 100.0;
        const float CONE_ANGLE = 0.577; // ~33 degrees
        
        while (dist < MAX_DIST && alpha < 0.99) {
            // Step along cone
            float coneRadius = dist * CONE_ANGLE;
            glm::vec3 samplePos = pos + dir * dist;
            
            // Sample voxel grid with cone radius
            glm::vec4 voxelSample = sampleVoxelCone(samplePos, coneRadius);
            
            // Composite
            light += (1.0 - alpha) * voxelSample.rgb * voxelSample.a;
            alpha += (1.0 - alpha) * voxelSample.a;
            
            // Step size increases with distance
            dist += coneRadius;
        }
        
        return light;
    }
};
```

**Cone Tracing**: Instead of ray marching, trace cones with increasing aperture, sampling multiple voxels per step:

$$L = \int_0^{r_{max}} L(\mathbf{p} + t\mathbf{d}) A(t) dt$$

where $A(t)$ is the cone aperture function.

**Advantages**:
- Direct light transport modeling
- Smooth filtering via cone tracing
- Fast query time (logarithmic in voxel depth)

**Disadvantages**:
- Voxelization overhead
- Memory requirements (high-res grids can use 500MB+)
- Artifacts from voxel discretization
- Dynamic updates expensive

### Sparse Voxel Global Illumination (SVOGI)

Use sparse octree instead of dense grid:

- Only allocate voxels where scene content exists
- Hierarchical structure: root (full scene) → 8³ children → ...
- Mipmap-like cascades for multi-scale GI

Dramatically reduces memory while maintaining quality.

## Hardware Ray Tracing Integration

### Real-Time Ray Traced GI

Modern GPUs (RTX, RDNA) have ray-tracing cores enabling GI via actual ray tracing:

```glsl
#extension GL_EXT_ray_tracing : require

layout(binding = 0, set = 0) uniform accelerationStructureEXT topLevel;
layout(binding = 1, set = 0) uniform image2D indirectLight;

void traceGIRay(vec3 origin, vec3 direction, uint depth) {
    traceRayEXT(topLevel,
                gl_RayFlagsOpaqueEXT,
                0xFF,  // cullMask
                0,     // sbtRecordOffset
                0,     // sbtRecordStride
                0,     // missIndex
                origin,
                0.01,  // tMin
                direction,
                100.0, // tMax
                0      // payload location
    );
}

void main() {
    vec3 indirectColor = vec3(0.0);
    const int SAMPLES = 32;
    
    for (int i = 0; i < SAMPLES; i++) {
        vec3 sampleDir = cosineWeightedHemisphere(i, normal);
        traceGIRay(fragPos, sampleDir, 1);
        indirectColor += hitColor * max(0.0, dot(sampleDir, normal));
    }
    
    imageStore(indirectLight, imageCoords, vec4(indirectColor / SAMPLES, 1.0));
}
```

**Advantages**:
- Physically accurate light transport
- Handles complex geometry naturally
- No precomputation required

**Disadvantages**:
- Still computationally expensive (requires temporal filtering)
- Ray count limited for real-time budgets
- Noisy output needs denoising

## Restir and Spatio-Temporal Filtering

### ReSTIR (Resampled Importance Sampling via Temporal Reuse)

Achieve high-quality GI with limited rays through intelligent resampling:

1. **Spatial resampling**: Share samples between nearby pixels
2. **Temporal resampling**: Reuse samples from previous frame with motion compensation
3. **Weighted resampling**: Reject poor samples, boost good ones

```glsl
struct Reservoir {
    vec3 lightSample;
    float weight;
    int sampleCount;
};

Reservoir temporalResampling(Reservoir current, Reservoir previous, 
                             float motionReprojection) {
    // Combine current and previous reservoirs
    float combinedWeight = current.weight + previous.weight;
    
    // Randomly decide to keep current or previous
    float u = random();
    Reservoir resampled = (u < current.weight / combinedWeight) 
        ? current 
        : previous;
    
    // Update weight accounting for both samples
    resampled.weight = combinedWeight;
    resampled.sampleCount = current.sampleCount + previous.sampleCount;
    
    return resampled;
}

Reservoir spatialResampling(Reservoir center, Reservoir[] neighbors) {
    // Neighbor reuse: borrow good samples from nearby pixels
    Reservoir best = center;
    
    for (int i = 0; i < neighbors.length(); i++) {
        float nbrWeight = evaluateTarget(neighbors[i].lightSample);
        float u = random();
        
        if (nbrWeight > best.weight && u < nbrWeight / (nbrWeight + best.weight)) {
            best = neighbors[i];
        }
    }
    
    return best;
}
```

**Results**: With 2 rays per pixel + ReSTIR, achieve quality comparable to 64+ rays via naive sampling.

## Unreal Engine's Lumen

### Architecture Overview

Lumen combines multiple techniques for production real-time GI:

**Radiance Caching**:
- Sparse grid of probes storing radiance
- Updated dynamically as scene changes
- Covers larger distances than DDGI (hundreds of meters)

**Surface Cache**:
- MIP-mapped cache of world-space surface radiance
- Updated incrementally
- Enables detail at varying distances

**Ray Tracing**:
- Hybrid: uses software ray tracing through world representation
- Hardware ray tracing as fallback/acceleration option
- Traces to nearest surfaces, adds multiple bounces

**Multi-Bounce GI**:
- Unlike single-bounce methods, Lumen traces multiple bounces
- First bounce from direct lighting
- Second/third bounces from radiance cache
- Produces rich indirect lighting

### Lumen Pipeline

```
Input: Scene geometry + materials
↓
Build acceleration structures (voxel DAG, surface cache)
↓
Ray trace from camera
  ├─ Direct hit: evaluate direct lighting
  ├─ Count bounces needed
  └─ For each bounce:
      ├─ Trace ray to nearest surface
      ├─ Query radiance cache at hit point
      └─ Accumulate color
↓
Combine with direct lighting
↓
Temporal filtering (optional)
↓
Output: Fully lit image
```

**Performance**: Typical 120fps on RTX 4090 in complex scenes (Nanite + Lumen).

## Comparison Table

| Method | Speed | Quality | Memory | Dynamic | Bounces |
|--------|-------|---------|--------|---------|---------|
| SSAO | Very Fast | Low | Minimal | Yes | 0 |
| SSGI | Fast | Medium | Minimal | Yes | 1 |
| DDGI | Moderate | High | 50-200MB | Yes | 1+ |
| VXGI | Moderate | High | 100-500MB | No | 2+ |
| SVOGI | Moderate | High | 50-200MB | No | 2+ |
| Ray Tracing | Slow | Very High | Minimal | Yes | 2+ |
| ReSTIR | Fast | Very High | Minimal | Yes | 2+ |
| Lumen | Moderate | Very High | 200-500MB | Yes | 2+ |

## Best Practices

- **Hybrid approach**: Combine methods for different scales (distant: DDGI; near: ray tracing)
- **Temporal filtering**: Always denoise/filter results for stability
- **Artist tools**: Allow adjusting GI intensity, probe placement
- **Quality tiers**: Different GI quality for different platforms
- **Cascading**: Multi-scale systems (local detail + global flavor)

## Future Directions

- **Neural GI**: Learning deep priors for fast, high-quality GI
- **Scene understanding**: Semantic guidance for smarter sampling
- **Real-time multi-bounce**: Current methods still limited to 2-3 bounces
- **Material accuracy**: Better handling of specular/translucent materials
