---
title: The Rasterization Pipeline
category: graphics-fundamentals
tags: [rasterization, gpu, pipeline, rendering, fixed-function, programmable]
description: Complete overview of the modern GPU rasterization pipeline from vertex input through framebuffer output, covering programmable and fixed-function stages.
related: [graphics-fundamentals/transformation-matrices, graphics-fundamentals/shading-models, algorithms/gpu-parallel-computing]
order: 1
---

# The Rasterization Pipeline

The rasterization pipeline is the fundamental architecture of real-time graphics on modern GPUs. Unlike ray tracing which simulates light paths, rasterization efficiently converts geometric primitives (vertices, triangles) into pixels through a fixed sequence of stages. This architecture has been refined over decades and remains the foundation of interactive graphics.

## Pipeline Overview

The complete pipeline can be divided into two major phases: **geometry processing** and **rasterization/fragment processing**. Modern GPUs implement this as a highly parallelized system where billions of primitives are processed per second.

```
Vertex Data
    ↓
[Vertex Shader] (Programmable)
    ↓
[Tessellation Control Shader] (Optional, Programmable)
    ↓
[Tessellation Evaluation Shader] (Optional, Programmable)
    ↓
[Geometry Shader] (Optional, Programmable)
    ↓
[Primitive Assembly] (Fixed-Function)
    ↓
[Clipping & Viewport Transform] (Fixed-Function)
    ↓
[Rasterization] (Fixed-Function)
    ↓
[Fragment Shader] (Programmable)
    ↓
[Per-Fragment Operations] (Fixed-Function)
    ↓
Framebuffer
```

## Vertex Processing Stage

The vertex shader executes once per input vertex and is the primary programmable stage for geometry transformation. Each vertex is processed independently in parallel across thousands of GPU cores.

### Typical Vertex Shader Responsibilities:
- Transform vertex positions from model space to clip space (model → world → view → projection)
- Compute per-vertex lighting (Gouraud shading)
- Animate vertices (skeletal animation, vertex morphing, wave deformation)
- Calculate texture coordinates transformations
- Pass data to fragment shader via varying interpolation

Example vertex shader:

```glsl
#version 460 core

// Input vertex attributes
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 texCoord;

// Uniforms (constant across all vertices in a draw call)
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;

// Output to fragment shader (interpolated)
out VS_OUT {
    vec3 fragPos;
    vec3 normal;
    vec2 texCoord;
    vec4 fragPosLightSpace;
} vs_out;

void main()
{
    // Transform position to world space
    vs_out.fragPos = vec3(uModel * vec4(position, 1.0));
    
    // Transform normal to world space (using normal matrix to handle non-uniform scaling)
    vs_out.normal = normalize(uNormalMatrix * normal);
    
    // Pass texture coordinates
    vs_out.texCoord = texCoord;
    
    // Transform to clip space for the rasterizer
    gl_Position = uProjection * uView * vec4(vs_out.fragPos, 1.0);
}
```

**Key Insight**: The vertex shader is the only place where per-vertex computation can occur. Decisions about vertex transformation, lighting setup, and animation must be made here. This contrasts with older fixed-function pipelines where transformation and lighting were hardware-locked behaviors.

## Tessellation Stages (Optional)

These programmable stages allow dynamic mesh subdivision before rasterization. They enable:
- Continuous level-of-detail (LOD) based on distance or screen coverage
- GPU-driven displacement and deformation
- Smooth surfaces from coarse control meshes

The tessellation control shader determines how much to subdivide each patch, while the tessellation evaluation shader computes the actual tessellated vertex positions. This is especially useful for cinematic rendering and organic surfaces.

## Primitive Assembly

This fixed-function stage gathers vertex shader outputs into primitives (usually triangles). For each output primitive, the GPU collects the requisite number of vertices and prepares them for clipping.

**Triangle winding order** matters here: by default, counter-clockwise (CCW) is front-facing in OpenGL, while Direct3D uses clockwise (CW). This affects backface culling.

## Clipping and Viewport Transformation

After primitive assembly, the fixed-function clipping stage eliminates primitives or fragments outside the viewing frustum. This is performed in **clip space** (post-projection, before division by w) where the view frustum is an axis-aligned cube: -w ≤ x,y,z ≤ w.

The **Sutherland-Hodgman algorithm** is typically used:
1. Each edge of the view frustum clips the primitive
2. If a triangle intersects a plane, new vertices are generated at intersection points
3. Completely clipped triangles are discarded

Following clipping, **perspective division** occurs: each coordinate is divided by w, converting from clip space to **normalized device coordinates (NDC)** where coordinates range from -1 to +1.

Finally, **viewport transformation** maps NDC coordinates to screen space using the viewport dimensions:

```
x_screen = (x_ndc + 1) * viewportWidth / 2 + viewportX
y_screen = (1 - y_ndc) * viewportHeight / 2 + viewportY
z_screen = (farDepth - nearDepth) / 2 * z_ndc + (farDepth + nearDepth) / 2
```

Note the y-flip: NDC has +y up, but screen space has +y down (in most APIs).

## Rasterization (Scan Conversion)

This critical fixed-function stage converts vector primitives into pixel coverage information. For each triangle:

1. **Determine which pixels the triangle covers** using edge functions
2. **Compute barycentric coordinates** for interpolation
3. **Generate fragments** at covered pixels with interpolated vertex attributes

### Edge Function Method

For a triangle with vertices A, B, C, determine if point P is inside:

```
edge(A, B, P) = (B - A) × (P - A)
```

If all three cross products have the same sign, P is inside the triangle. This approach:
- Is parallelizable across tiles of pixels
- Efficiently handles multiple fragments per pixel (MSAA)
- Uses integer arithmetic for speed

### Barycentric Interpolation

Once a fragment is determined to be inside a triangle, attributes must be interpolated from the three vertices. Barycentric coordinates (λ₁, λ₂, λ₃) with λ₁ + λ₂ + λ₃ = 1 define the interpolation weights:

```
interpolated_value = λ₁ * A.value + λ₂ * B.value + λ₃ * C.value
```

However, when perspective projection is involved, **perspective-correct interpolation** is required. The GPU automatically handles this by dividing attribute by w at the vertex stage, then multiplying by w at the fragment stage.

## Fragment Shader Execution

The fragment shader is the primary programmable stage for pixel coloring. It executes once per pixel (or per sample in MSAA) and has read-only access to:
- Interpolated vertex attributes
- Textures and samplers
- Uniform buffers
- Varying data from the rasterization stage

Responsibilities include:
- Texture sampling and filtering
- Normal mapping and parallax mapping
- Lighting calculations (per-pixel lighting is more accurate than per-vertex Gouraud shading)
- Specular highlights, reflections, roughness
- Output to multiple render targets (MRT) for deferred rendering

Example fragment shader:

```glsl
#version 460 core

in VS_OUT {
    vec3 fragPos;
    vec3 normal;
    vec2 texCoord;
    vec4 fragPosLightSpace;
} fs_in;

uniform sampler2D uDiffuseTexture;
uniform sampler2D uNormalMap;
uniform sampler2D uShadowMap;
uniform vec3 uLightPos;
uniform vec3 uViewPos;

out vec4 FragColor;

void main()
{
    // Sample textures
    vec3 diffuse = texture(uDiffuseTexture, fs_in.texCoord).rgb;
    vec3 sampledNormal = texture(uNormalMap, fs_in.texCoord).rgb;
    
    // Normalize interpolated normal from rasterization
    vec3 normal = normalize(sampledNormal * 2.0 - 1.0); // Unpack from [0,1] to [-1,1]
    
    // Simple Blinn-Phong lighting
    vec3 lightDir = normalize(uLightPos - fs_in.fragPos);
    vec3 viewDir = normalize(uViewPos - fs_in.fragPos);
    vec3 halfDir = normalize(lightDir + viewDir);
    
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
    
    vec3 result = diffuse * (0.2 + 0.8 * diff) + vec3(1.0) * spec;
    FragColor = vec4(result, 1.0);
}
```

**Performance Note**: Fragment shaders are executed billions of times per frame. Optimization priorities are:
1. Minimize texture lookups and use MIP levels appropriately
2. Avoid expensive operations like division, square root, inverse square root
3. Use lower precision when possible (mediump on mobile)
4. Cache computed values when used multiple times

## Per-Fragment Operations (Back-End)

After the fragment shader, fixed-function operations process fragments before writing to the framebuffer:

### Depth Test
Compares fragment depth (z) against the depth buffer. Common functions:
- `GL_LESS`: Accept if fragment z < stored z (default, most common)
- `GL_LEQUAL`: Accept if z ≤ stored z
- `GL_GREATER`: For reverse z-buffers (preferred in modern engines for floating-point precision)

Early depth testing (often called **Z-prepass** or **depth pre-pass**):
- Rasterize scene once to populate depth buffer without running fragment shaders
- Rasterize again, where fragment shader only runs for visible fragments
- Saves fragment shader cost for occluded triangles
- Critical optimization for complex shaders

### Blending
Combines fragment output with existing framebuffer color using a blend function:

```
final_color = source_color * SrcFactor + dest_color * DstFactor
```

Common factors:
- `GL_ONE`: Use color as-is
- `GL_SRC_ALPHA`: Weight by fragment's alpha
- `GL_ONE_MINUS_SRC_ALPHA`: Standard alpha compositing

### Stencil Test
An optional per-pixel test using an 8-bit stencil buffer. Enables:
- Masking (only update pixels matching stencil criteria)
- Outlining objects (render back faces to stencil, then outlines over front faces)
- Planar shadows
- Portal rendering (stencil-based visibility)

### Framebuffer Write
Final write to render target(s). Can target:
- Color buffer
- Multiple color attachments simultaneously (MRT)
- Depth/stencil attachment

## Programmable vs Fixed-Function Architecture

Modern APIs provide a hybrid:

**Programmable Stages**:
- Vertex Shader: Always runs
- Tessellation Shaders: Optional, advanced LOD
- Geometry Shader: Optional, rarely used (performance concerns)
- Fragment Shader: Always runs

**Fixed-Function Stages**:
- Primitive Assembly
- Clipping
- Rasterization (scan conversion)
- Depth/Stencil/Blend operations

The programmability of vertex and fragment shaders gives developers enormous flexibility, while fixed-function stages ensure efficiency and standardized behavior.

## GAMES101 Perspective

In the context of curriculum like GAMES101, the rasterization pipeline is understood as:

1. **3D to 2D Projection**: Homogeneous coordinates and perspective projection transform 3D world coordinates to 2D screen space
2. **Triangle Setup**: For each triangle, compute edge equations and bounding boxes
3. **Fragment Generation**: Determine which pixels are inside the triangle using edge functions
4. **Attribute Interpolation**: Use barycentric coordinates for perspective-correct interpolation
5. **Fragment Coloring**: Execute fragment shader to determine final color
6. **Visibility Determination**: Depth testing and occlusion resolution

This conceptual pipeline maps directly to the hardware implementation, making it an excellent teaching foundation for understanding modern GPU architecture.

## Pipeline Characteristics and Tradeoffs

**Advantages**:
- Highly parallel: Millions of vertices and fragments processed simultaneously
- Hardware-optimized: Fixed-function stages are extremely fast
- Predictable performance: Relatively low variance in execution time
- Depth complexity doesn't impact performance (unlike ray tracing)
- Excellent for forward rendering of many small objects

**Disadvantages**:
- Difficult to handle complex visibility (transparent surfaces, many lights)
- Requires multiple passes for many effects (deferred rendering required for 100+ lights)
- Hard shadows and reflections require special techniques (shadow maps, planar reflections)
- Aliasing and shimmering from sampling single point per pixel (requires anti-aliasing)

## Modern Extensions

Contemporary graphics incorporate enhancements:
- **Compute Shaders**: Arbitrary GPU computation outside the rasterization pipeline
- **Mesh Shaders**: Modern replacement for tessellation and geometry shaders (NVIDIA, HLSL)
- **Variable Rate Shading**: Run fragment shaders at different rates per region
- **Sampler Feedback**: Texture streaming feedback to CPU based on actual sampling patterns

The rasterization pipeline remains the core of real-time graphics, and understanding its stages, data flow, and constraints is essential for optimizing modern graphics applications.
