---
title: Unreal Materials and Nanite Virtualized Geometry
category: game-engines/unreal
tags: [unreal, materials, nanite, virtualized-geometry]
description: Deep dive into Unreal material system, material editor, material instances, material functions, Nanite virtualized geometry internals including cluster hierarchy and software rasterizer, visibility buffers, and virtual textures for next-generation rendering.
related: [graphics-fundamentals/mesh-operations, graphics-fundamentals/pbr-rendering]
order: 2
---

# Unreal Materials and Nanite Virtualized Geometry

## Material System Overview

Unreal's material system provides physically-based rendering (PBR) foundation with powerful node-based editing.

### Material Properties

```cpp
// Key material attributes
struct FMaterialAttributes
{
    // Surface properties
    float3 BaseColor;      // Albedo/Diffuse
    float Metallic;        // 0-1, metal vs dielectric
    float Specular;        // 0-1, specular intensity
    float Roughness;       // 0-1, surface roughness
    
    // Normal/Surface detail
    float3 Normal;         // Normal map
    float3 Tangent;        // Tangent space
    
    // Emission
    float3 Emissive;       // Self-emitted light
    
    // Opacity and masking
    float Opacity;         // Transparency (alpha)
    float OpacityMask;     // For masked materials
    
    // Advanced
    float AmbientOcclusion;     // Darkens crevices
    float Subsurface;           // Subsurface scattering
    float MaterialAttributes;   // Custom attributes
};
```

### Material Blend Modes

```
Opaque           - Fully solid, fastest
Masked           - Binary transparency (clip)
Translucent      - Full transparency with blending
Additive         - Additive blending (light/particles)
Modulate         - Multiplicative blending
AlphaComposite   - Premultiplied alpha
AlphaHoldout     - Inverse transparency
```

## Material Editor

### Node Graph Structure

```
Material Editor combines nodes into shader network:

Input Nodes:
  - Texture Sample
  - Scalar Parameter
  - Vector Parameter
  - Time
  - Camera Position
  - Vertex Normal

Math Nodes:
  - Add, Subtract, Multiply, Divide
  - Clamp, Lerp, Saturate
  - Abs, Ceil, Floor, Frac
  - Sine, Cosine, Sqrt

Texture Nodes:
  - Texture Sample
  - Texel Size
  - Texture Object
  - Unique Texture Object

Final Output:
  - Base Color
  - Metallic
  - Specular
  - Roughness
  - Normal
  - Emissive Color
  - Opacity (Translucent)
  - World Position Offset
  - Customized UV
```

### Basic PBR Material Network

```
Material layout example:

Texture Sample (Diffuse)
  → Base Color Output

Texture Sample (Normal)
  → Normal Output (unpacked)

Scalar Parameter (Metallic) 
  → Metallic Output

Scalar Parameter (Roughness)
  → Roughness Output

Scalar Parameter (Ambient Occlusion)
  → Multiply with Base Color
  → Base Color Output
```

## Material Instances

Create variations of materials without recompiling.

```cpp
// C++ Code: Create Material Instance
ACharacter* Character = GetCharacter();

// Create dynamic material instance
UMaterialInstanceDynamic* DynamicMaterial = 
    UMaterialInstanceDynamic::Create(
        BaseMaterial, 
        Character->GetMesh());

// Set scalar parameter
DynamicMaterial->SetScalarParameterValue(
    FName(TEXT("Roughness")), 
    0.8f);

// Set vector parameter
DynamicMaterial->SetVectorParameterValue(
    FName(TEXT("BaseColor")), 
    FLinearColor::Red);

// Set texture parameter
DynamicMaterial->SetTextureParameterValue(
    FName(TEXT("DiffuseTexture")), 
    NewTexture);

// Apply to mesh
Character->GetMesh()->SetMaterial(0, DynamicMaterial);
```

### Instance Hierarchy

```
Parent Material (Master)
  ↓ (provides defaults and base network)
Material Instance (static, editor-only)
  ↓ (overrides selected parameters)
Material Instance Dynamic (runtime)
  ↓ (can be modified at runtime)
```

## Material Functions

Reusable material node networks.

```
Material Function: PBR_MetalPanel

Inputs:
  - BaseColor (Vector3)
  - Metallic (Scalar)
  - Roughness (Scalar)
  - Normal (Vector3)

Network:
  BaseColor → Clamp(0-1)
  Metallic → Clamp(0-1)
  Roughness → Add(0.2) → Clamp(0-1)
  Normal → Transform(World Space)

Outputs:
  - Final Base Color
  - Final Metallic
  - Final Roughness
  - Final Normal
```

## Nanite Virtualized Geometry

Nanite is Unreal's virtualized geometry system enabling massive, detailed geometry without traditional LOD constraints.

### Nanite Architecture

#### Cluster Hierarchy

```
Nanite internally organizes geometry as hierarchical clusters:

Level 0 (Root)
  ├── Cluster 1 (512 triangles)
  ├── Cluster 2 (512 triangles)
  └── Cluster 3 (512 triangles)

Level 1
  ├── Cluster 1.1 (128 triangles)
  ├── Cluster 1.2 (128 triangles)
  ├── Cluster 2.1 (128 triangles)
  └── ...

Level 2 (Finest detail)
  ├── Cluster 1.1.1 (32 triangles)
  └── ...

Selection based on:
  - Screen coverage
  - Pixel size
  - Distance from camera
  - Visibility testing
```

#### Software Rasterizer

```cpp
// Nanite software rasterization process:

1. Cluster Selection
   - Determine required detail level
   - Select optimal clusters for screen coverage
   
2. Vertex Fetch
   - Load selected cluster data
   - Decompress vertices (variable precision)
   
3. Software Rasterization
   - Fixed-function pipeline alternative
   - Rasterize to visibility buffer
   - 16-bit per triangle ID + depth
   
4. Triangle Visibility
   - Determine visible triangles
   - Compact visible triangle list
   
5. Material Pass (Deferred)
   - Look up material for each pixel
   - Execute material shader only for visible pixels
   - Output to G-Buffer
```

### Visibility Buffer Rendering

```cpp
// Visibility Buffer: stores triangle ID and depth

struct VisibilityBufferPixel
{
    uint16 TriangleID;     // Which triangle (cluster local)
    uint16 Depth;          // Depth information
    uint16 InstanceID;     // Which instance
};

// Advantages:
// - Reduces bandwidth (16 bytes per pixel vs 96+ for G-Buffer)
// - Single triangle rasterization pass
// - Material evaluation deferred to second pass
// - Dramatically improves cache efficiency

// Material resolve:
// for each pixel in VisibilityBuffer:
//   - Look up triangle data from TriangleID
//   - Evaluate material shader for that triangle
//   - Write to final render target
```

### Creating Nanite Assets

```cpp
// C++: Enable Nanite for static mesh

void AMyStaticMeshActor::BeginPlay()
{
    Super::BeginPlay();

    UStaticMesh* Mesh = GetStaticMeshComponent()->GetStaticMesh();
    
    // Check if mesh supports Nanite
    if (Mesh && Mesh->IsNaniteEnabled())
    {
        // Mesh uses Nanite rendering
        FString MeshName = Mesh->GetName();
        UE_LOG(LogTemp, Warning, TEXT("Mesh %s uses Nanite"), *MeshName);
    }
}

// Editor: Import Settings
// 1. Import mesh (Nanite-compatible format)
// 2. Details > Nanite > Enable Nanite
// 3. Set target cluster size (affects hierarchy)
// 4. Reimport

// Nanite supports:
// - Static Geometry
// - Skeletal meshes (limited)
// - Landscape (with plugin)
// - Foliage
```

### Performance Characteristics

```
Traditional LOD:
- 100 objects × 100K triangles = 10M triangles total
- LOD cost: memory for each LOD variant

Nanite:
- Same 100 objects × 100K triangles = 10M triangles total
- Automatic LOD: single cluster hierarchy
- Scales to billions of triangles
- Minimal memory overhead per geometry

Trade-offs:
- Slightly more expensive per-triangle (visibility buffer pass)
- Compensated by rendering dramatically fewer triangles
- Deferred material evaluation adds latency
- Reduced bandwidth from visibility buffer
```

## Virtual Textures

Efficiently manage massive texture datasets.

```cpp
// Virtual Texture Setup

// 1. Create Virtual Texture Stack
//    - Content Browser > New > Virtual Texture
//    - Set size: 8K, 16K, or larger
//    - Set max physical size (cache): 2K or 4K

// 2. Create Physical Texture
//    - Pages 128x128 or 256x256
//    - Stored on disk
//    - Streamed into physical memory

// 3. Material Integration
//    - Material: Sample Virtual Texture
//    - Pass UV coordinates
//    - Engine handles streaming

// C++ access
UVirtualTexture2D* VirtualTexture = 
    Cast<UVirtualTexture2D>(Asset);

// Feedback from rendering
UMaterialInterface* Material = GetMaterial();
Material->GetVirtualTextureStack();

// Benefits:
// - Unlimited texture resolution
// - Constant memory footprint
// - Only loaded pages kept in memory
// - Reduces texture memory 10-100x
```

## Advanced Material Techniques

### Parallax Mapping

```
Creates depth perception in textures without geometry:

1. Sample height map at UV
2. Calculate view-relative offset
3. Re-sample diffuse/normal at offset UV
4. Produces heightfield appearance

Result: Cheap depth perception without more geometry
```

### Subsurface Scattering

```cpp
// SSS: Light penetrates thin translucent surfaces

Material setup:
1. Enable "Subsurface Scattering" in material
2. Set Subsurface opacity
3. Set Subsurface color (light inside material)
4. Applied in deferred shading pass

Use cases:
- Skin rendering
- Vegetation
- Wax, marble
- Ice, translucent materials
```

### Custom Depth Buffer

```cpp
// Render custom data to separate buffer

void AMyActor::BeginPlay()
{
    Super::BeginPlay();
    
    // Enable custom depth
    GetRootComponent()->SetRenderCustomDepth(true);
    
    // Set custom stencil value
    GetRootComponent()->SetCustomDepthStencilValue(255);
}

// Material usage:
// - Post-process effects can read custom depth
// - Outlines, selection highlights
// - Custom visibility passes
// - Performance: separate rendering pass
```

### World Position Offset

```
Material nodes:
  Camera Position → Subtract from World Position
  → Sine(Time × Frequency) × Amplitude
  → World Position Offset

Result:
- Animated vertex displacement
- Wave effects, flowing water
- Cloth simulation
- Runs per-vertex (cheap)

Limitations:
- Can't change silhouette significantly
- Doesn't affect shadows (unless dynamic)
- Expensive for very complex functions
```

## Material Performance Optimization

### Instruction Count

```
Guidelines:
- Simple materials: < 50 instructions
- Moderate materials: 50-200 instructions
- Complex materials: 200-400 instructions
- Expensive materials: > 400 instructions (profile!)

Optimization techniques:
1. Use fewer texture samples
2. Combine textures in single RGBA
3. Pre-compute complex functions offline
4. Use lerp instead of branching
5. Avoid expensive math (pow, exp, log)
```

### Texture Optimization

```
Strategies:
- Compress textures (BC1, BC4, BC5 for normals)
- Use atlasing to reduce draw calls
- Stream large textures
- Reuse textures across materials
- Consider virtual textures for massive datasets

BC compression:
- BC1: Color (4:1 compression)
- BC2: Color + 1-bit alpha
- BC3: Color + interpolated alpha
- BC4: Single channel (normals)
- BC5: Two channels (normal maps)
- BC6H: HDR
- BC7: High quality color
```

## Complete Material Example

```
Material: Character Skin

Nodes:
  Texture (Diffuse) × 0.9
    → + Texture (SSS Color) × 0.1
    → Base Color

  Texture (Normal)
    → Normal

  Scalar (0.0)
    → Metallic

  Texture (Roughness)
    → Clamp (0.3, 0.7)  // Skin never too glossy
    → Roughness

  0.1 (skin SSS)
    → Subsurface

  Scalar (0.5)
    → Ambient Occlusion
    → Multiply into Base Color

Parameters:
  - BlendAlbedoWithSSS: 0.1
  - RoughnessMin: 0.3
  - RoughnessMax: 0.7
  - AmbientOcclusionStrength: 0.5
```

## Conclusion

Unreal's material and rendering systems are among the most powerful in the industry. Nanite enables geometric complexity previously impossible, while Virtual Textures solve texture memory constraints. Understanding material graphs, parameter optimization, and virtualized geometry techniques enables creating visually stunning, performant games at any scale.
