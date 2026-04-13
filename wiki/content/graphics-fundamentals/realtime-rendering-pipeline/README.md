---
title: Real-Time Rendering Pipeline Architecture
category: graphics-fundamentals
tags: [rendering-pipeline, deferred-rendering, forward-rendering, tiled-rendering, post-processing, render-graph]
description: Modern GPU rendering architectures including deferred vs forward rendering, tiled/clustered approaches, G-buffer, screen-space effects, HDR, tonemapping, bloom, and render graph patterns.
related: [graphics-fundamentals/rasterization-pipeline, game-engines/unreal/nanite-lumen, frontier/realtime-gi]
order: 12
---

# Real-Time Rendering Pipeline Architecture

Modern game engines don't simply rasterize geometry directly to framebuffer. Instead, they employ sophisticated multi-pass architectures that balance rendering quality, lighting complexity, and performance. Understanding these patterns is essential for optimizing large-scale interactive applications.

## Forward Rendering (Traditional)

The simplest approach: render each object with all lights applied in a single pass.

```
For each object:
    For each light:
        Render object with contribution from light
    Result: object lit by all lights
Output: Final framebuffer
```

**Pseudocode**:
```glsl
// Forward rendering fragment shader
vec3 color = vec3(0);
for(int i = 0; i < numLights; i++) {
    color += computeLight(lights[i]);
}
FragColor = vec4(color, 1.0);
```

**Characteristics**:
- Simple to understand and implement
- Naturally handles transparency (blend as you render)
- Excellent temporal coherence (good for TAA)
- **Scalability problem**: Cost = O(lights × objects × triangles)

**Performance**: With 100 lights and 1000 objects:
```
100,000 draw calls needed (1 per object-light pair)
Overdraw from redundant geometry rasterization
CPU bottleneck: Draw call overhead
```

## Deferred Rendering

Multi-pass approach that decouples geometry from lighting.

**Pass 1 (G-Buffer Generation)**:
Rasterize all geometry once, store surface properties to **G-Buffer** (render targets).

```
G-Buffer layout:
- RT0 (Albedo+AO):    RGB=color, A=ambient occlusion
- RT1 (Normal+Depth): RGB=normal (view space or octahedral), A=depth or unused
- RT2 (Material):     RG=roughness+metallic, B=specular intensity, A=flags
- RT3 (Emission):     RGB=emitted light, A=unused

Optional:
- Motion Vectors:     RG=screen-space velocity (for TAA)
- Velocity Depth:     High-precision depth for variable shading rates
```

**Pass 2 (Lighting Pass)**:
For each light (or group of lights), read G-Buffer and apply lighting.

```
vec3 lighting = vec3(0);
for each light:
    vec3 normal = texture(gbuffer1, uv).rgb;
    vec3 color = texture(gbuffer0, uv).rgb;
    float depth = texture(gbuffer1, uv).a;
    
    vec3 worldPos = reconstructWorldPosition(depth, uv);
    vec3 contribution = computeLight(normal, worldPos, color, ...);
    lighting += contribution;

output = lighting;
```

**Advantages**:
- Geometry rasterized once regardless of light count
- Cost = O(geometry + lights) instead of O(geometry × lights)
- Ideal for 100+ lights

**Disadvantages**:
- G-Buffer bandwidth (writes 4+ targets, reads in lighting pass)
- Transparency complex (forward-render transparent geometry separately)
- Poor compression (can't use tile-local-storage on some architectures)
- Floating-point precision needed for G-Buffer (can't use R11G11B10F for some attributes)

### G-Buffer Optimization

**Octahedral normal encoding**: Store 3D normal in 2D coordinates for compression.

```
// Encode normal to 2D octahedral coordinates
vec2 encodeNormal(vec3 n) {
    float p = length(n.xy);
    vec2 e = n.xy / p;
    
    if(n.z < 0.0) {  // Reflect to lower hemisphere
        float temp = e.x;
        e.x = (1.0 - abs(e.y)) * sign(e.x);
        e.y = (1.0 - abs(temp)) * sign(e.y);
    }
    
    return e * 0.5 + 0.5;  // Map to [0,1]
}

// Decode back
vec3 decodeNormal(vec2 e) {
    e = e * 2.0 - 1.0;
    
    float p = length(e);
    vec2 xy = e / p;
    float z = 1.0 - p;
    
    if(z < 0.0) {  // Reflect back
        float temp = xy.x;
        xy.x = (1.0 - abs(xy.y)) * sign(temp);
        xy.y = (1.0 - abs(temp)) * sign(xy.y);
    }
    
    return normalize(vec3(xy, z));
}
```

Saves 2 bytes per normal (RG8 instead of RGB16F).

### G-Buffer Debug Visualization

Invaluable for optimization:

```glsl
// Debug visualizations
uniform int debugMode;

void main() {
    vec3 output = vec3(0);
    
    switch(debugMode) {
        case 0:  // Albedo
            output = texture(gbuffer0, uv).rgb;
            break;
        case 1:  // Normal
            output = texture(gbuffer1, uv).rgb * 0.5 + 0.5;  // Remap [-1,1] to [0,1]
            break;
        case 2:  // Depth (grayscale from near to far)
            float depth = texture(gbuffer1, uv).a;
            output = vec3(depth);  // 0=near, 1=far
            break;
        case 3:  // Normal length (detect NaN)
            vec3 n = texture(gbuffer1, uv).rgb;
            output = vec3(length(n));
            break;
    }
    
    FragColor = vec4(output, 1.0);
}
```

## Tiled and Clustered Deferred Rendering

Optimize light application by spatial grouping.

### Tile-Based Deferred Rendering

1. **Tile screen into 16x16 (or 32x32) tiles**
2. **Cull lights to each tile** (compute shader)
3. **Render lights per-tile** (only lights intersecting tile)

```
Screen:                   Tile assignment:
[████████] 1920x1080      [Tile 0,0] [Tile 1,0] ...
[████████]                [Tile 0,1] [Tile 1,1] ...
[████████]
...

Light list per tile:
Tile[0,0]: Lights [0, 3, 5, 7] (4 lights intersect)
Tile[1,0]: Lights [1, 2, 4, 8] (different 4 lights)
```

**Compute shader light culling**:

```glsl
#define TILE_SIZE 16
#define MAX_LIGHTS_PER_TILE 256

layout(local_size_x = TILE_SIZE, local_size_y = TILE_SIZE) in;
layout(std430, binding = 0) buffer lightListBuffer {
    uint lightList[];  // Flat array of light indices
};
layout(std430, binding = 1) buffer lightIndexCounterBuffer {
    uint lightIndexCounter[];  // Per-tile light count
};

shared uint sharedLightIndices[MAX_LIGHTS_PER_TILE];
shared uint sharedLightCount;

void main() {
    ivec2 tileCoord = ivec2(gl_WorkGroupID);
    ivec2 pixelCoord = ivec2(gl_LocalInvocationID);
    
    // Zero shared memory
    if(gl_LocalInvocationIndex == 0) {
        sharedLightCount = 0;
    }
    barrier();
    
    // Each thread checks nearby lights
    float depth = texture(depthBuffer, (pixelCoord + tileCoord * TILE_SIZE) / vec2(imageSize(depthBuffer))).r;
    vec3 worldPos = reconstructWorldPosition(depth, pixelCoord);
    
    for(uint i = 0; i < numLights; i++) {
        // Frustum cull light to this tile
        float distToLight = distance(worldPos, lights[i].position);
        if(distToLight < lights[i].radius) {
            uint idx = atomicAdd(sharedLightCount, 1);
            sharedLightIndices[idx] = i;
        }
    }
    
    barrier();
    
    // Write to global buffer
    if(gl_LocalInvocationIndex < sharedLightCount) {
        uint tileIndex = tileCoord.y * numTilesX + tileCoord.x;
        uint writeOffset = atomicAdd(lightIndexCounter[tileIndex], 1);
        lightList[tileIndex * MAX_LIGHTS_PER_TILE + writeOffset] = sharedLightIndices[gl_LocalInvocationIndex];
    }
}
```

**Benefits**:
- Reduces redundant light computation
- Better cache locality (tile-local storage on mobile)
- Scales to hundreds of lights

### Clustered Rendering

Extension of tiled: organize lights in 3D (tiles + depth slices).

```
3D grid: 16x16 tiles × 24 depth slices
Each cluster: small 3D region
Result: Extremely fine-grained light culling
```

Most effective for complex 3D scenes (multiple depth layers).

## Screen-Space Effects

Techniques that operate on previously rendered data (depth, normals, etc.).

### Screen-Space Ambient Occlusion (SSAO)

Approximate occlusion using depth buffer:

```glsl
float ssao(vec2 uv) {
    float centerDepth = texture(depthBuffer, uv).r;
    vec3 centerPos = reconstructWorldPosition(centerDepth, uv);
    vec3 centerNormal = texture(gbuffer1, uv).rgb;
    
    float occlusion = 0.0;
    
    for(int i = 0; i < 32; i++) {
        vec2 sampleUV = uv + sampleOffsets[i] * aoRadius;
        float sampleDepth = texture(depthBuffer, sampleUV).r;
        vec3 samplePos = reconstructWorldPosition(sampleDepth, sampleUV);
        
        vec3 diff = samplePos - centerPos;
        float dist = length(diff);
        
        if(dist < aoRadius) {
            // Sample occludes if it's above surface
            float height = dot(diff, centerNormal);
            occlusion += max(0.0, height - bias) / (dist + epsilon);
        }
    }
    
    return 1.0 - (occlusion / 32.0);
}
```

### Screen-Space Reflections (SSR)

Already covered in detail in Global Illumination section.

### Subsurface Scattering (SSS)

Approximate translucency for skin, wax, etc.

```glsl
vec3 sss(vec3 normal, vec3 lightDir, vec3 color, vec3 backLitColor) {
    // Back-lit contribution: light from behind shining through
    float backLit = max(0.0, -dot(lightDir, normal));
    backLit = pow(backLit, 3.0);  // Sharpen falloff
    
    vec3 sssContribution = backLit * backLitColor;
    
    return mix(color, sssContribution, sssIntensity);
}
```

More sophisticated approaches use **Screen-Space Subsurface Scattering (SSSSS)**: blur in screen-space along light direction.

## HDR and Tone Mapping

Modern rendering works in **HDR (High Dynamic Range)**: values can exceed [0, 1].

**Pipeline**:
```
1. Render to floating-point framebuffer (linear color space)
2. Accumulate lighting (may reach 10+)
3. Apply post-processing (bloom, color grading)
4. Tone map to [0,1] for display
5. Gamma correct
6. Display on screen
```

### Tone Mapping Operators

**Reinhard (Local)**: Simple, predictable

```glsl
vec3 toneMapReinhard(vec3 hdr) {
    return hdr / (hdr + vec3(1.0));
}

// Inverse for proper handling
vec3 toneMapReinhardInv(vec3 ldr) {
    return ldr / (vec3(1.0) - ldr);
}
```

**Unreal/ACES**: Industry standard, better perceptual results

```glsl
vec3 toneMapACES(vec3 hdr) {
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    return clamp((hdr * (A * hdr + B)) / (hdr * (C * hdr + D) + E), 0.0, 1.0);
}
```

**Filmic**: Another popular curve

```glsl
vec3 toneMapFilmic(vec3 x) {
    vec3 X = max(vec3(0.0), x - 0.004);
    return (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);
}
```

### Bloom Effect

High luminance values "bloom" onto neighboring pixels.

```
1. Extract bright pixels (luminance > threshold)
2. Downsample (blur downward)
3. Upsample (blur upward)
4. Composite with original
```

```glsl
vec3 bloom(vec3 color, sampler2D bloomTexture, vec2 uv) {
    // Extract bright areas
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    if(luminance > bloomThreshold) {
        color += luminance * bloomIntensity;
    }
    
    // Add bloom from blur passes
    color += texture(bloomTexture, uv).rgb * bloomMix;
    
    return color;
}
```

## Post-Processing Pipeline

Typical post-processing chain:

```
Rendered image (HDR)
    ↓ [Bloom] (extract bright, blur, upsample)
    ↓ [Depth of Field] (blur based on distance)
    ↓ [Color Grading] (adjust saturation, curves)
    ↓ [Grain/Noise] (add film grain)
    ↓ [Tone Mapping] (HDR → LDR)
    ↓ [Gamma Correction]
    ↓
Final display
```

## Render Graph Pattern

Modern engines use **render graphs** to express rendering dependencies as a DAG (directed acyclic graph).

**Concept**: Instead of imperative rendering code:

```cpp
// Old imperative style (fragile, hard to optimize)
renderGBuffer();
cullingPass();
lightingPass();
postProcess();
```

Use declarative graph:

```cpp
// Render graph (dependencies explicit)
RenderGraph graph;

auto gbuffer = graph.addPass("G-Buffer", [](PassContext& ctx) {
    auto albedo = ctx.addRenderTarget("albedo", Format::RGBA8);
    auto normal = ctx.addRenderTarget("normal", Format::RGBA16F);
    
    ctx.rasterize(geometryBuffer, {albedo, normal});
    
    return std::make_pair(albedo, normal);
});

auto depth = graph.addPass("Depth Prepass", [](PassContext& ctx) {
    auto depthTarget = ctx.addRenderTarget("depth", Format::D32F);
    ctx.rasterize(geometryBuffer, depthTarget);
    return depthTarget;
});

auto lighting = graph.addPass("Lighting", [](PassContext& ctx, 
                                            auto gbufferResult, 
                                            auto depthResult) {
    auto litImage = ctx.addRenderTarget("litImage", Format::RGBA16F);
    ctx.compute(lightingShader, {gbufferResult, depthResult, litImage});
    return litImage;
});

auto bloom = graph.addPass("Bloom", [](PassContext& ctx, auto lightingResult) {
    auto bloomImage = ctx.addRenderTarget("bloom", Format::RGBA16F);
    ctx.compute(bloomShader, {lightingResult, bloomImage});
    return bloomImage;
});

auto composite = graph.addPass("Composite", [](PassContext& ctx, 
                                              auto lighting, 
                                              auto bloomResult) {
    auto output = ctx.addRenderTarget("output", Format::RGBA8);
    ctx.compute(compositeShader, {lighting, bloomResult, output});
    return output;
});

graph.compile();  // Optimize, reorder passes, allocate resources
graph.execute();  // Run with minimal overhead
```

**Benefits**:
- Explicit dependencies (compiler understands data flow)
- Automatic resource allocation/reuse
- Pass reordering possible (if safe)
- Texture pooling and aliasing
- Easier to profile (clear pass boundaries)

## Complete Rendering Example (Pseudo-Code)

```cpp
struct RenderingContext {
    Framebuffer gbuffer;  // Albedo, Normal, Material properties
    Framebuffer lightingBuffer;
    Framebuffer postProcessBuffer;
    
    void render(Scene& scene, Camera& camera) {
        // Depth prepass (optimize Z-buffer)
        renderDepthPrepass(scene, camera);
        
        // G-Buffer generation (one rasterization of all geometry)
        renderGBuffer(scene, camera, gbuffer);
        
        // Lighting: tiled deferred
        performLightCulling();
        renderTiledLighting(gbuffer, lightingBuffer);
        
        // Post-processing
        vec3 hdr = lightingBuffer.sample();
        
        // SSAO
        hdr *= computeSSAO(gbuffer);
        
        // Bloom
        vec3 bloom = extractBloom(hdr);
        bloom = blurDownsample(bloom);
        bloom = blurUpsample(bloom);
        hdr += bloom * 0.1;
        
        // Tone map
        vec3 ldr = toneMapACES(hdr);
        ldr = pow(ldr, vec3(1.0 / 2.2));  // Gamma
        
        // Output
        framebuffer = ldr;
    }
};
```

Modern real-time rendering is a carefully orchestrated symphony of rasterization, compute shaders, texture sampling, and framebuffer operations. Understanding these patterns enables developers to build efficient, scalable rendering systems capable of beautiful results at 60+ FPS on current hardware.
