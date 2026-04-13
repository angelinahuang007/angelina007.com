---
title: Texture Mapping and Filtering
category: graphics-fundamentals
tags: [texture, uv-mapping, filtering, mipmaps, normal-mapping, compression]
description: UV mapping, texture filtering strategies (nearest, bilinear, trilinear, anisotropic), mipmaps, and advanced mapping techniques (normal, bump, parallax, displacement).
related: [graphics-fundamentals/shading-models, blender/shader-nodes, game-engines/unity/shader-programming]
order: 4
---

# Texture Mapping and Filtering

Textures provide surface detail without modeling every geometric feature. A 4K texture applied to a sphere with a few triangles delivers vastly more visual information than subdividing the geometry. Modern graphics relies heavily on texture sampling, and doing it efficiently without artifacts requires careful filtering and memory management.

## UV Mapping Fundamentals

UV coordinates map 2D texture space to 3D mesh surfaces. Each vertex contains (u, v) coordinates typically in the range [0, 1], where u increases rightward and v increases downward in texture space.

### UV Space Layout
```
v (vertical)
1.0 +-------+
    | Image |
0.0 +-------+ → u (horizontal)
    0.0   1.0
```

### Common Mapping Techniques

**Planar Projection**: Project all geometry onto a plane. Fast but causes stretching on curved surfaces.

```glsl
uv = vec2(position.x, position.y);  // Ignore Z
```

**Cylindrical Mapping**: Wrap around a cylinder. Good for cylindrical objects (tree trunks, poles).

```glsl
uv.x = atan(position.z, position.x) / (2.0 * 3.14159) + 0.5;
uv.y = position.y;
```

**Spherical Mapping**: Project onto a sphere from center. Causes pole singularities.

```glsl
uv.x = atan(position.z, position.x) / (2.0 * 3.14159) + 0.5;
uv.y = acos(position.y / length(position)) / 3.14159;
```

**Cubic/Cubemap**: Six square textures covering a cube around the object. Avoids pole issues, used for environment maps.

**Triplanar Mapping**: Blend three orthogonal planar projections based on surface normal. No UV seams, minimal distortion:

```glsl
vec3 blendWeights = abs(normal);
blendWeights = blendWeights / (blendWeights.x + blendWeights.y + blendWeights.z);

vec3 texX = texture(tex, position.yz).rgb * blendWeights.x;
vec3 texY = texture(tex, position.xz).rgb * blendWeights.y;
vec3 texZ = texture(tex, position.xy).rgb * blendWeights.z;

vec3 result = texX + texY + texZ;
```

### UV Unwrapping Issues

In modeling software, artists must "unwrap" 3D geometry to 2D like unfolding paper. Common problems:

- **Stretching**: Areas with high UV curvature appear warped
- **Seams**: Discontinuities where different UV islands connect (requires careful blending)
- **Overlapping UVs**: Multiple parts of mesh use same texture area (for mirrored symmetry, but breaks some techniques)
- **Distortion**: Planar maps distort curved geometry

High-quality assets spend significant effort on UV layout.

## Texture Filtering

When a texture is sampled at arbitrary positions, the sampling point usually doesn't align exactly with texture pixels. **Filtering** determines how nearby texels are combined.

### Nearest Neighbor

Sample the closest texel only.

```glsl
vec3 color = texture(sampler, uv).rgb;  // Hardware does this implicitly with GL_NEAREST
```

**Characteristics**:
- Fastest (zero computation)
- Blocky appearance (visible pixels/texels)
- Used in pixel art, retro styles
- Can hide texture compression artifacts

### Bilinear Filtering

Interpolate between the four nearest texels based on fractional UV coordinates:

```
Texels: A--B
        |  |
        C--D

t = fractionalPart(u)
s = fractionalPart(v)

result = (1-t)(1-s)*A + t(1-s)*B + (1-t)s*C + t*s*D
       = lerp(lerp(A,B,t), lerp(C,D,t), s)
```

**Characteristics**:
- Smooth appearance
- Mild blur from interpolation
- 4 texel lookups per sample
- Standard for most graphics
- Hardware-accelerated (GL_LINEAR)

**In GLSL**:
```glsl
sampler2D tex;  // Created with GL_LINEAR filtering
vec3 color = texture(tex, uv).rgb;  // Hardware does bilinear automatically
```

### Trilinear Filtering

When geometry is far from camera, a single texel corresponds to many pixels. Sampling the full-resolution texture causes aliasing (flickering, shimmering). **Mipmaps** solve this.

A mipmap is a series of pre-filtered copies of the texture, each half the resolution:

```
Level 0: 512x512
Level 1: 256x256
Level 2: 128x128
...
Level 9: 1x1
```

Each level is created by averaging 2x2 blocks of the previous level (box filter).

**Trilinear filtering**:
1. Compute required mipmap level based on texture coordinate derivatives (∂u/∂x, ∂u/∂y)
2. Sample from two adjacent mipmap levels using bilinear interpolation
3. Interpolate between the two levels

```glsl
// No explicit control needed—GPU does this automatically with GL_LINEAR_MIPMAP_LINEAR
vec3 color = texture(sampler, uv).rgb;
```

**Level Selection Formula**:

```
δu/δx = ∂u/∂x_screen
δu/δy = ∂u/∂y_screen

ρ = max(√((δu/δx)² + (δv/δx)²), √((δu/δy)² + (δv/δy)²))

level = log₂(ρ)
```

When ρ = 1, one texel maps to one pixel (level 0). When ρ = 4, one texel maps to 4x4 pixels (level 2).

**Benefits**:
- Eliminates flickering on distant geometry
- Reduces memory bandwidth (smaller mipmap used = fewer cache misses)
- Minimal performance cost (mipmaps pre-computed at load time)

**Memory overhead**: A full mipmap pyramid uses 133% of the original texture size (sum of 1 + 1/4 + 1/16 + ...).

### Anisotropic Filtering

Trilinear filtering assumes square pixel footprints. At grazing angles, pixels project elliptically onto the texture. **Anisotropic filtering** samples more texels in the stretched direction.

Anisotropy level (typically 2x, 4x, 8x, 16x) determines the maximum axis ratio:

```
16x anisotropic: samples up to 16x more texels than standard trilinear
```

**Implementation** (vendor-specific):
```glsl
// OpenGL EXT extension
#extension GL_EXT_texture_filter_anisotropic : enable

sampler2D tex;  // Created with GL_LINEAR_MIPMAP_LINEAR
sampler2D tex_max_aniso = GL_TEXTURE_MAX_ANISOTROPY_EXT(16.0);

vec3 color = texture(tex, uv).rgb;  // Automatically uses up to 16x anisotropic sampling
```

**Characteristics**:
- Excellent quality on distant surfaces viewed at angles
- Higher cost than trilinear (proportional to anisotropy level)
- Worth the cost for terrain, roads, distant walls
- Often reduced on mobile for performance

## Advanced Mapping Techniques

### Normal Mapping

Instead of using geometric detail, a **normal map** texture encodes surface normals per pixel. Compressed format: RGB values stored as (X, Y, Z) normals.

```
Texture value [128, 200, 255] unpacked to normal:
X = (128/255) * 2 - 1 = 0.004
Y = (200/255) * 2 - 1 = -0.569
Z = (255/255) * 2 - 1 = 1.0  (always up in tangent space)

Normal = normalize([0.004, -0.569, 1.0])
```

**GLSL implementation**:
```glsl
// In fragment shader
vec3 normal = normalize(texture(normalMap, uv).rgb * 2.0 - 1.0);

// Reconstruct Z from X,Y (if normal map is DXT5, saves one channel)
// Assumes Z is always positive (pointing out of surface)
// normal.z = sqrt(1.0 - dot(normal.xy, normal.xy));

// Use in lighting calculations
float dotNL = max(dot(normal, lightDir), 0.0);
```

**Benefits**:
- Adds perceived geometric detail without additional triangles
- 4x smaller than storing height as separate geometry
- Efficient: single texture lookup vs. many triangles

**Limitations**:
- Silhouettes still appear flat (can't add actual geometry)
- Doesn't affect shadows (unless combined with displacement mapping)
- Requires tangent space consistency across seams

### Bump Mapping

Similar to normal mapping but stores height directly. The shader numerically differentiates height to compute normals:

```glsl
float heightScale = 0.02;
float h_center = texture(heightMap, uv).r;
float h_right = texture(heightMap, uv + vec2(texelSize.x, 0.0)).r;
float h_up = texture(heightMap, uv + vec2(0.0, texelSize.y)).r;

vec3 normal = normalize(vec3(
    heightScale * (h_center - h_right),
    heightScale * (h_center - h_up),
    1.0
));
```

**Comparison to Normal Mapping**:
- Normal maps: Pre-baked derivatives, faster
- Bump maps: Computed per-frame, more flexible (easy to adjust scale)

Modern graphics typically uses normal maps for performance.

### Parallax Mapping

Enhances perception of depth by offsetting UV coordinates based on view direction and height:

```glsl
float height = texture(heightMap, uv).r;
vec3 viewDir_tangent = normalize(viewDir * tangentBasis);

// Offset UV based on height and view angle
vec2 parallaxMapping(vec2 uv, vec3 viewDir, sampler2D heightMap, 
                     float heightScale) {
    float h = texture(heightMap, uv).r;
    vec2 p = viewDir.xy / viewDir.z * (h * heightScale);
    return uv - p;
}

vec2 parallaxUV = parallaxMapping(uv, viewDir, heightMap, 0.05);
vec3 color = texture(diffuse, parallaxUV).rgb;
```

**Characteristics**:
- Single height sample (faster than complex algorithms)
- Works well for shallow relief
- Falls apart at extreme viewing angles

**Steep Parallax Mapping**: Multiple samples for better depth:

```glsl
const int numLayers = 32;
float layerHeight = 1.0 / numLayers;
vec2 deltaUV = viewDir.xy / viewDir.z * heightScale / numLayers;

vec2 currentUV = uv;
float currentLayerHeight = 0.0;
float currentHeight = texture(heightMap, currentUV).r;

while(currentLayerHeight < currentHeight) {
    currentUV -= deltaUV;
    currentHeight = texture(heightMap, currentUV).r;
    currentLayerHeight += layerHeight;
}

return currentUV;
```

### Displacement Mapping

Actually deforms geometry based on a height texture. Requires tessellation or high polygon count.

```glsl
// In tessellation evaluation shader
vec4 displacementPos = baseVertex;
float height = texture(heightMap, uv).r;
displacementPos += height * heightScale * normal;
gl_Position = projection * view * displacementPos;
```

**Comparison with normal/bump mapping**:
- Normal/bump: Fake depth, cheap, shadows not affected
- Displacement: Real geometry, expensive, proper shadows

Modern approach: Use high-res normal maps at typical distances, displacement maps only on close-up camera work.

## Texture Compression

Raw textures are massive. A 4K RGBA texture uses 64 MB. Compression is essential.

### DXT/BC Formats (NVIDIA/AMD/Intel)

**BC1 (DXT1)**: 6:1 compression
```
Per 4x4 block:
- 2 RGB colors (32-bit total)
- 4x4 lookup table (16x2 bits = 32 bits)
- Total: 64 bits per 16 pixels = 0.5 bits per pixel
```

Good for opaque textures. Poor quality for gradients or normals.

**BC3 (DXT5)**: 4:1 compression (BC1 + separate alpha)
```
BC1 block + BC4 alpha block = 128 bits per 16 pixels
```

**BC4**: Single-channel compression (for normals, height maps)
**BC5**: Two-channel (for compressed normal maps, storing only XY)
```
Normal map compressed to BC5:
- X channel (8:1 compressed)
- Y channel (8:1 compressed)
- Z reconstructed: sqrt(1 - X² - Y²)
- Total: 4:1 compression vs uncompressed
```

**BC6H/BC7**: Modern HDR and high-quality compression (slower decode)

### ASTC (Adaptive Scalable Texture Compression)

Mobile-friendly, variable block sizes (4x4 to 12x12):

```
- 4x4 blocks: High quality, smaller file (8:1 for 4K)
- 6x6 blocks: Medium quality (12:1 for 4K)
- 12x12 blocks: Lower quality (48:1 for 4K)
```

One encoder produces file compatible with any decoder at any block size (with quality tradeoff).

### ETC (Ericsson Texture Compression)

OpenGL ES standard, now mostly superceded by ASTC.

**ETC2**: 4:1 compression, better quality than ETC1
**ETC2-EAC**: Separate alpha channel

### Format Selection by Use

| Format | Albedo | Normal Map | HDR | Mobile |
|--------|--------|-----------|-----|--------|
| BC1/BC3 | ✓ | ✗ | ✗ | ✗ |
| BC4/BC5 | ✗ | ✓ | ✗ | ✗ |
| BC6H | ✗ | ✗ | ✓ | ✗ |
| ASTC | ✓ | ✓ | ✓ | ✓ |
| ETC2 | ✓ | ~ | ✗ | ✓ |

## Streaming and Virtual Texturing

For open-world games, a single texture may be too large to fit in VRAM. **Virtual texturing** (megatexturing) solves this:

1. Physical texture cache: Fixed-size VRAM allocation (e.g., 512x512)
2. Virtual texture space: Conceptual unlimited size (e.g., 8192x8192)
3. GPU generates feedback texture: Which virtual regions were sampled?
4. CPU streaming: Load required tiles into physical cache each frame
5. Indirection lookup: Shader translates virtual UV to physical cache location

High-end technique, used in AAA games (Sparse Texturing in Direct3D 12).

## Texture Coordinates in Practice

```glsl
// Vertex shader
out vec2 uv;

void main() {
    uv = vertexUV;
    gl_Position = projectionViewMatrix * modelMatrix * vec4(vertexPos, 1.0);
}

// Fragment shader
in vec2 uv;
uniform sampler2D diffuseMap;
uniform sampler2D normalMap;
uniform sampler2D roughnessMap;

void main() {
    // Parallax offset
    vec3 viewDir_tangent = normalize(tangentSpaceViewDir);
    vec2 parallaxUV = uv - viewDir_tangent.xy * (texture(heightMap, uv).r * 0.05);
    
    // Sample all textures with offset
    vec3 albedo = texture(diffuseMap, parallaxUV).rgb;
    vec3 normal = normalize(texture(normalMap, parallaxUV).rgb * 2.0 - 1.0);
    float roughness = texture(roughnessMap, parallaxUV).r;
    
    // Proceed with shading...
}
```

Texture mapping transforms simple geometry into rich, detailed surfaces. Mastering UV unwrapping, filtering strategies, compression, and advanced mapping techniques is essential for modern graphics work.
