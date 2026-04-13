---
title: Anti-Aliasing and Sampling Theory
category: graphics-fundamentals
tags: [anti-aliasing, sampling, aliasing, msaa, taa, dlss, fxaa]
description: Sampling theory, Nyquist theorem, aliasing causes, SSAA/MSAA/FXAA/SMAA/TAA/DLSS, temporal stability, and comparison of quality vs performance.
related: [graphics-fundamentals/rasterization-pipeline, game-engines/unity/performance-optimization, game-engines/unreal/nanite-lumen]
order: 10
---

# Anti-Aliasing and Sampling Theory

Aliasing—the jagged edges on diagonal lines, shimmering on distant details—is a fundamental consequence of sampling continuous signals (images) at discrete points (pixels). Understanding the mathematics and practical solutions is essential for modern graphics.

## Sampling Theory and the Nyquist Theorem

**Nyquist-Shannon theorem**: To accurately represent a signal with maximum frequency fₘₐₓ, you must sample at least 2 * fₘₐₓ times.

```
Theorem: If a signal contains no frequencies higher than fₘₐₓ,
         sampling at frequency fₛ ≥ 2 * fₘₐₓ preserves all information.
         
Example: To represent a 1 kHz audio signal:
         Minimum sample rate = 2 kHz
         Standard CD quality = 44.1 kHz (safe margin)
```

### Application to Graphics

In screen-space:
- **Maximum frequency**: Controlled by triangle edges, texture detail, etc.
- **Sample rate**: 1 sample per pixel ≈ 1 sample per unit distance

**Problem**: A diagonal edge is high-frequency. A single sample per pixel cannot represent it adequately.

```
High-frequency content (diagonal edge):
[Black] [Black] [Black] [White] [White] [White]

Sampled at pixel centers (single sample):
[Black] [Black] [Black] [White] [White] [White]
   ^                           ^
 Perfectly aliased!       Incorrect transition

With subpixel samples (e.g., 4x4 grid in pixel):
[Black Black Black White]
[Black Black White White]
[Black White White White]
[White White White White]
   → Average: antialiased gray
```

## Causes of Aliasing

### 1. Undersampling Geometric Features

**Jagged edges** on diagonal or curved polygons. Triangles smaller than a pixel are missed entirely (popping).

### 2. High-Frequency Texture Detail

**Texture aliasing**: Distant texture with fine detail sampled once per pixel = severe aliasing.

Solution: **Mipmapping** (progressively lower-resolution textures for distant geometry).

### 3. Temporal Aliasing

**Shimmering** and **crawling**: In animation, high-frequency temporal changes produce visual artifacts.

Example: A thin vertical line moving 0.5 pixels per frame appears to shimmer between screen locations.

## Anti-Aliasing Approaches

### Super-Sampling (SSAA)

Render at higher resolution, downsample:

```
1. Render scene at 4K (e.g., 3840×2160)
2. Box filter to 1080p (average 2×2 blocks)
3. Display at 1080p
```

**Quality**: Excellent (addresses all aliasing types)
**Cost**: 4-16x performance hit (4x resolution = 4x pixels to rasterize + fragment shade)

### Multi-Sample Anti-Aliasing (MSAA)

Rasterize geometry at high sample count, but shade at pixel rate.

```
Layout for 4x MSAA:
+---+---+
|●  ●  |
|  ●   |  ● = sample location (slightly offset from pixel center)
|   ●  |
+---+---+
```

**Process**:
1. **Rasterization**: Determine coverage at each sample location
2. **Fragment shading**: Run fragment shader once per pixel
3. **Resolve**: Average samples that hit the pixel

**Pseudocode**:
```cpp
struct Sample { vec4 color; float depth; };
Sample framebuffer[width][height][4];  // 4 samples per pixel

// Rasterization: determine which samples are covered
for each triangle:
    for each pixel:
        for each sample in pixel:
            if sample inside triangle:
                framebuffer[x][y][sample].depth = triangle.depth;

// Fragment shading (once per pixel)
for each pixel:
    if any sample covered:
        color = fragmentShader(pixel.attributes);
        for each covered sample:
            framebuffer[x][y][sample].color = color;

// Resolve
for each pixel:
    coveredSamples = 0;
    finalColor = vec4(0);
    for each sample:
        if framebuffer[x][y][sample].depth valid:
            finalColor += framebuffer[x][y][sample].color;
            coveredSamples++;
    finalColor /= coveredSamples;
    output[x][y] = finalColor;
```

**Quality**: Good (edges smooth, but texture aliasing remains)
**Cost**: Moderate (2x memory for samples, resolve overhead)

**Sample patterns**:
- **2x MSAA**: Horizontal/vertical pair
- **4x MSAA**: Corners or rotated grid
- **8x MSAA**: Higher density

### FXAA (Fast Approximate Anti-Aliasing)

Post-process filtering. Detect edges in rendered image, blur along edges.

```glsl
// Simplified FXAA
vec3 fxaa(sampler2D tex, vec2 uv) {
    vec3 center = texture(tex, uv).rgb;
    
    // Compute edge luminance (Sobel operator)
    float n = luminance(texture(tex, uv + vec2(0, -1)*pixelSize).rgb);
    float s = luminance(texture(tex, uv + vec2(0,  1)*pixelSize).rgb);
    float e = luminance(texture(tex, uv + vec2( 1,  0)*pixelSize).rgb);
    float w = luminance(texture(tex, uv + vec2(-1,  0)*pixelSize).rgb);
    float nw = luminance(texture(tex, uv + vec2(-1, -1)*pixelSize).rgb);
    float ne = luminance(texture(tex, uv + vec2( 1, -1)*pixelSize).rgb);
    float sw = luminance(texture(tex, uv + vec2(-1,  1)*pixelSize).rgb);
    float se = luminance(texture(tex, uv + vec2( 1,  1)*pixelSize).rgb);
    
    // Compute edge direction
    float edgeH = abs(n + s - 2.0*center) + 
                  abs(nw + sw - 2.0*w) + abs(ne + se - 2.0*e);
    float edgeV = abs(e + w - 2.0*center) + 
                  abs(ne + nw - 2.0*n) + abs(se + sw - 2.0*s);
    
    bool isHorizontal = (edgeH >= edgeV);
    
    // Blend along edge direction
    vec2 blendDir = isHorizontal ? vec2(0, 1) : vec2(1, 0);
    float blendAmount = 0.5;  // Simplified; FXAA uses more complex calculation
    
    return mix(center, 
               texture(tex, uv + blendDir * blendAmount * pixelSize).rgb, 
               0.5);
}
```

**Advantages**:
- Very fast (single screen-size pass)
- No rasterization overhead
- Works on already-rendered image

**Disadvantages**:
- Blurry artifacts (smooths non-edges)
- Reduced sharpness
- Cannot recover lost geometry detail (misses small triangles)

### SMAA (Subpixel Morphological Anti-Aliasing)

More sophisticated edge-directed filter. Uses predefined patterns to blend subpixel colors.

**Pass 1**: Detect edges (Sobel)
**Pass 2**: Lookup blend weights from patterns
**Pass 3**: Apply blending

Better quality than FXAA with similar performance.

### Temporal Anti-Aliasing (TAA)

Leverage temporal coherence across frames. Jitter camera between frames, accumulate over time.

```
Frame 0: Sample at offset (-0.5, -0.5) within pixel
Frame 1: Sample at offset (+0.5, -0.5) within pixel
Frame 2: Sample at offset (-0.5, +0.5) within pixel
Frame 3: Sample at offset (+0.5, +0.5) within pixel

Accumulate over 4 frames → effectively 4x sampling
```

**Algorithm**:
```glsl
// Vertex shader: apply jitter to projection matrix
vec4 jitteredPos = projectionMatrix[frame % 4] * viewMatrix * modelMatrix * position;

// Fragment shader: reproject from previous frame
vec3 currentColor = /* rendered color at current frame */;

// Find previous frame position (motion vectors)
vec2 velocity = computeMotionVector(worldPos, prevFrameWorldPos);
vec2 prevUV = uv - velocity;

vec4 prevColor = texture(prevFrameBuffer, prevUV);

// Temporal accumulation with weighting
vec3 finalColor = mix(currentColor, prevColor.rgb, 0.8);  // 80% prev, 20% curr
```

**Advantages**:
- Excellent quality (4x+ effective samples)
- Addresses temporal aliasing
- No geometry detail loss

**Disadvantages**:
- **Ghosting**: Moving objects leave trails (if reprojection incorrect)
- **Temporal instability**: Flickering with fast motion
- Requires motion vectors and previous frame buffer

**TAA improvements**:
- **Clamp accumulation**: Limit blend to reasonable range
- **Disocclusion detection**: Don't blend when surfaces become visible
- **Clamped history**: Bound previous frame based on current neighborhood

```glsl
vec3 historyColor = texture(prevFrame, prevUV).rgb;

// Clamp to neighborhood of current pixel (reject outliers)
vec3 colorMin = min(currentColor, textureOffset(currentFrame, uv, ivec2(1,0)).rgb);
colorMin = min(colorMin, textureOffset(currentFrame, uv, ivec2(-1,0)).rgb);
// ... clamp to neighborhood AABB

historyColor = clamp(historyColor, colorMin, colorMax);

vec3 finalColor = mix(currentColor, historyColor, 0.8);
```

### DLSS (Deep Learning Super Sampling)

NVIDIA's neural network-based upscaling. Trained to produce high-quality images from lower-resolution inputs.

**Process**:
1. Render at lower resolution (e.g., 1440p)
2. Neural network upsamples to target (e.g., 4K)
3. Uses motion vectors and temporal data for quality

**Performance**: 2-3x faster rendering (lower resolution) + network inference (~1-2ms)

**Quality**: Often matches or exceeds native resolution with proper tuning.

**Trade-offs**:
- Proprietary to NVIDIA hardware
- Requires training dataset specific to each game
- Artifacts in some complex scenes

### FSR (FidelityFX Super Resolution)

AMD's open-source temporal upsampling solution. Similar concept to DLSS but not AI-based.

Uses **edge-directed filtering** and temporal data to upscale. More portable than DLSS but slightly lower quality.

## Subpixel Rendering

On modern high-DPI displays, subpixel rendering uses individual RGB subpixels for higher perceived resolution.

```
Display pixel:
R G B
R G B
R G B
...

Font rendering: Position glyphs at subpixel accuracy (1/3 pixel precision).
ClearType technology improves text sharpness on LCDs.
```

Less relevant with modern 300+ DPI displays (subpixels imperceptible).

## Practical Anti-Aliasing Strategies

### Real-Time Games

**Modern approach** (last 5 years):

```
High-end (RTX, PS5):
  - DLSS/FSR 2.0 (Quality mode) @ target 4K
  - Or: Native 1440p + TAA + DLSS Quality @ 4K

Mid-range:
  - 1440p @ 60Hz: 4x MSAA or TAA
  - 1080p @ 144Hz: 2x MSAA or FXAA

Mobile:
  - FXAA or no AA (performance critical)
```

### Offline Rendering

**Cinematic quality**:
```
Path 1: 4-16x SSAA (render at 4-16K, downsample)
Path 2: 1000+ samples per pixel (path tracing)
Path 3: Adaptive sampling (more samples in difficult areas)
```

## Comparison Table

| Method | Quality | Performance | Memory | Best Use |
|--------|---------|-------------|--------|----------|
| SSAA 4x | Excellent | 4x slower | 4x | Offline |
| MSAA 4x | Good | 2x slower | 2x | Real-time, edges |
| MSAA 8x | Very good | 3x slower | 3x | Console games |
| FXAA | OK | ~5% | Minimal | Mobile, fast |
| TAA | Excellent | ~10% | 1x additional | Modern games |
| DLSS (Quality) | Excellent | 40% faster | Minimal | NVIDIA RTX |
| FSR 2.0 (Quality) | Very good | 30% faster | Minimal | Cross-platform |

## Modern Recommendations

1. **For 60 FPS 4K**: DLSS/FSR in Quality mode + native 1440p rendering
2. **For 144 FPS 1440p**: TAA + 2x MSAA or native
3. **For 30 FPS cinematics**: Path tracing with adaptive sampling
4. **For mobile**: FXAA or native (AA cost prohibitive)

The trend is toward **temporal techniques** (TAA, DLSS, FSR) because they leverage temporal coherence—information from previous frames—for both aliasing reduction and performance gains through intelligent super-sampling.
