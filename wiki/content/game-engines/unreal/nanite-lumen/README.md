---
title: Unreal Lumen Global Illumination and Ray Tracing
category: game-engines/unreal
tags: [unreal, lumen, nanite, global-illumination]
description: In-depth exploration of Lumen GI system, screen-space ray tracing, mesh signed distance fields, voxel lighting, hardware ray tracing fallback, Nanite integration, performance characteristics, quality settings, and practical lighting workflows.
related: [graphics-fundamentals/global-illumination, frontier/realtime-gi, graphics-fundamentals/ray-tracing-fundamentals]
order: 3
---

# Unreal Lumen Global Illumination and Ray Tracing

## Lumen System Overview

Lumen is Unreal's real-time global illumination and reflection system, enabling dynamic lighting without pre-baking.

### Lumen Architecture

```
Lumen System Components:

1. Screen Traces
   - Start from camera
   - Trace rays per pixel
   - Hit scene geometry
   
2. Mesh SDFs (Signed Distance Fields)
   - Pre-computed distance fields
   - Used for ray-scene intersection
   - Coarse representation
   
3. Voxel Lighting
   - Voxelize scene globally
   - Accumulate lighting in 3D grid
   - Indirect illumination from any direction
   
4. Feedback Loop
   - Screen traces query voxels
   - Voxels updated from screen
   - Continuous refinement
   
5. Hardware RT Fallback
   - Uses GPU ray tracing if available
   - Replaces screen traces
   - Better quality, higher cost
```

## Screen Traces

### Ray Tracing Algorithm

```cpp
// Simplified Lumen screen trace process:

struct ScreenTrace
{
    float3 RayOrigin;           // Camera position
    float3 RayDirection;        // Trace direction
    float MaxDistance = 5000.0; // Max trace distance
    
    uint NumSteps = 64;         // Refinement steps
    uint NumSamples = 4;        // Samples per step
};

// Trace implementation (conceptual):
HitResult TraceRay(ScreenTrace Trace)
{
    float CurrentDistance = 0;
    
    // Coarse intersection (using voxels)
    for (uint Step = 0; Step < Trace.NumSteps; ++Step)
    {
        float3 SamplePos = Trace.RayOrigin + 
            Trace.RayDirection * CurrentDistance;
        
        // Query SDF at position
        float SignedDistance = QuerySDF(SamplePos);
        
        if (SignedDistance < 1.0) // Hit
        {
            // Refine with finer SDF
            HitResult Result;
            Result.HitPos = SamplePos;
            Result.Distance = CurrentDistance;
            return Result;
        }
        
        // Step forward
        CurrentDistance += max(SignedDistance, MinStepSize);
    }
    
    // No hit
    return HitResult::Miss();
}

// Advantages:
// - Deterministic (same result each frame)
// - No ray noise (unlike stochastic RT)
// - Smooth indirect lighting
// - Fast feedback loop
```

### Screen Trace Quality

```
Trace Budget:
- Full Resolution: All pixels traced
- Half Resolution: Every other pixel
- Quarter Resolution: Every fourth pixel
- Eighth Resolution: Every eighth pixel

Default: Half resolution + temporal reconstruction

Temporal Reprojection:
- Previous frame trace results
- Reproject to current frame
- Blend with new traces
- Smooths over missed rays
```

## Mesh Signed Distance Fields

SDF provides coarse geometry representation for fast ray intersection.

### SDF Generation

```cpp
// SDF Creation Process:

1. Voxelization
   - Build 3D grid around mesh
   - Mark voxels inside/outside
   - Typical resolution: 256³, 512³
   
2. Distance Computation
   - Calculate distance per voxel
   - Positive inside, negative outside
   - Distance to nearest surface
   
3. Compression
   - Store in volume texture
   - BC6H or BC7 compression
   - Streaming for large meshes

// C++: Check if mesh has SDF
UStaticMesh* Mesh = GetMesh();
bool bHasSDF = Mesh->GetRenderData()->LODResources[0]
    .DistanceFieldData.IsValid();

// Material: Query SDF
float SignedDistance = ComputeMeshSignedDistanceField(
    WorldPosition,
    Mesh);
```

### SDF Limitations

```
Accuracy:
- Coarse representation
- Resolution limits detail
- Works best for solid objects
- Problems with thin geometry

Best practices:
- Increase SDF resolution for small objects
- Simplify geometry for SDFs
- Disable SDFs for very small objects (cost vs benefit)
- Test SDF quality in visualizer

Visualization:
- Show > Visualize > Mesh Distance Fields
- Green = Valid SDF
- Red = Invalid/problematic SDF
```

## Voxel Global Illumination

### Voxelization

```cpp
// Lumen voxelizes scene globally for indirect lighting

struct VoxelGrid
{
    float3 GridMin;
    float3 GridMax;
    uint3 Resolution;           // e.g., 256x256x256
    float VoxelSize;            // Voxel physical size
    
    // Data per voxel
    float4 Radiance;            // RGB + intensity
    float Confidence;           // How well lit
    uint LastFrameUpdated;      // Frame counter
};

// Voxel update happens in multiple stages:

// Stage 1: Surface voxelization
// Render scene from multiple angles into voxels
// Mark surface voxels

// Stage 2: Voxel tracing
// Trace from surface voxels
// Accumulate lighting

// Stage 3: Feedback from screen
// Screen traces update voxels with final colors
// Highest quality data flows back

// Result: Smooth, global indirect illumination
```

### Voxel Grid Settings

```
Resolution:
- 128³: Mobile, minimal memory
- 256³: Standard, 256MB VRAM
- 384³: High quality, 1.3GB VRAM
- 512³: Ultra quality, 2.7GB VRAM

Update Frequency:
- Every frame: Most responsive
- Every 2 frames: Good balance
- Every 4 frames: Performance

Placement:
- Centered on camera
- Follows player camera
- Manual placement for static scenes
```

## Hardware Ray Tracing Integration

### Hardware RT Support

```cpp
// Lumen can use hardware ray tracing instead of screen traces

// C++: Check hardware RT availability
bool bSupportsHardwareRT = 
    GRHISupportsRayTracing && 
    IsFeatureLevelSupported(ERHIFeatureLevel::SM6);

// Settings:
// - RayTracedHardwareRayTracing: Enable/disable
// - RayTracingBudget: Performance budget
// - MaxHardwareRayTracingRays: Ray limit per frame

// Comparison:

Screen Traces (Default):
- Speed: Fast
- Noise: None (deterministic)
- Quality: Good
- Flexibility: Screen-space only

Hardware Ray Tracing:
- Speed: Slower
- Noise: Very low
- Quality: Excellent
- Flexibility: All directions

// Hybrid approach:
// - Use screen traces for real-time
// - Use hardware RT for offline/high-quality builds
```

## Nanite Integration

### How Lumen Works with Nanite

```
Without Nanite:
- Traditional meshes stored fully in memory
- LODs created per object
- Geometry loading expensive

With Nanite:
- Massive geometry available without memory cost
- Lumen traces against Nanite clusters
- All detail levels available seamlessly
- Streaming automatic

Integration Benefits:
- Lumen can trace against full detail
- No missing reflections due to LODs
- All geometry participates equally
- Memory-efficient combination
```

### Performance with Nanite

```cpp
// Nanite significantly improves Lumen efficiency

Example Scene:
- 10 million triangles of detailed architecture
- Traditional: 40x LODs created (memory explosion)
- Nanite: Single geometry representation
- Lumen traces: Full-resolution SDF available
- Memory: 20% of traditional approach

// Cost breakdown:
SDF generation:     Computed once at load
Screen traces:      Per-pixel ray march
Voxel update:       Once per frame
Hardware RT:        Optional, higher cost

// Result: Photorealistic lighting at 60 FPS
// With traditional LODs: Would require > 16GB VRAM
```

## Quality Settings

### Lumen Configuration

```cpp
// World Settings > Lumen

// Ray Tracing
r.Lumen.TraceMeshSDFs = 1              // Enable SDF tracing
r.Lumen.Reflections.Type = 1           // Screen traces
r.Lumen.GlobalIllumination.Type = 1    // Voxel GI

// Performance tuning
r.Lumen.ScreenTraces.MaxTraceDistance = 5000.0
r.Lumen.ScreenTraces.MaxSamples = 4
r.Lumen.ScreenTraces.RelativeStepSize = 1.0

// Voxel grid
r.Lumen.VoxelLighting.GridResolution = 256   // 256³
r.Lumen.VoxelLighting.UpdateFrequency = 1.0  // Every frame

// Hardware RT
r.Lumen.HardwareRayTracing = 0 // 0=off, 1=on
r.Lumen.HardwareRayTracing.LightingMode = 1

// Quality levels
r.Lumen.Reflections.ResolutionScale = 0.5    // 50% resolution
r.Lumen.GlobalIllumination.ResolutionScale = 0.5

// Mobile settings
r.Lumen.Reflections.Type = 2           // Surface caches
r.Lumen.GlobalIllumination.Type = 0    // Disabled/baked
```

### Performance vs Quality Trade-offs

```
Ultra High (> 200ms):
- Full resolution ray tracing
- Hardware RT enabled
- 512³ voxel grid
- Every frame updates
- Use: Offline cinematics, still frames

High Quality (60-100ms):
- Half resolution ray tracing
- Temporal reconstruction
- 256³ voxel grid
- Standard settings

Medium Quality (30-60ms):
- Quarter resolution
- Software ray tracing
- 128³ voxel grid
- Hardware RT optional

Performance (< 30ms):
- Eighth resolution
- 64³ voxel grid
- Lumen reflections disabled
- Fallback to SSR
```

## Limitations and Workarounds

### SDF Limitations

```
Problems:
- Can't represent dynamic geometry well
- Thin geometry creates artifacts
- Transparent objects don't work
- Very small features lost

Solutions:
- Static meshes for SDFs
- Procedural/dynamic lights for moving objects
- Emissive surfaces for transparency
- Larger geometric forms for overall lighting
```

### Ray Tracing Gaps

```
Screen-space issues:
- Rays outside view are missed
- Back-facing geometry not traced
- Artifacts at screen edges

Mitigation:
- Temporal reprojection smooths artifacts
- Increase screen trace distance
- Use voxel fallback for off-screen rays
- Accept slight bias toward camera direction

Performance cliffs:
- Reflections expensive in outdoor scenes
- GI expensive with many moving lights
- Hardware RT cost scales with scene complexity
```

## Workflow Best Practices

### Lighting Setup

```cpp
// Recommended Lumen setup for typical game:

// 1. Directional light (sun)
ADirectionalLight* Sun = GetWorld()->SpawnActor<ADirectionalLight>();
Sun->GetLightComponent()->SetIntensity(1.0);
Sun->GetLightComponent()->SetLightingChannels(true, false, false);

// 2. Sky light (indirect)
ASkyLight* Sky = GetWorld()->SpawnActor<ASkyLight>();
Sky->GetLightComponent()->SetIntensity(0.5);
Sky->GetLightComponent()->SourceCubemap = SkyCubemap;

// 3. Localized detail lights (point/spot)
APointLight* Detail = GetWorld()->SpawnActor<APointLight>();
Detail->GetLightComponent()->SetRange(500.0);
Detail->GetLightComponent()->SetIntensity(1000.0);

// 4. Emissive surfaces for local illumination
Material->SetScalarParameterValue(
    FName("Emissive"), 
    5.0);  // Self-illumination

// Lumen captures all and creates coherent result
```

### Debugging Lumen

```cpp
// Visualization modes:

// Show Lumen debug info
r.Lumen.DebugVisualize = 1

// Lumen screen traces
r.Lumen.ScreenTraces.Visualize = 1

// Lumen reflections
r.Lumen.Reflections.Visualize = 1

// Mesh distance fields
Show > Visualize > Mesh Distance Fields

// Ray tracing
r.RayTracing.DebugVisualize = 1

// Voxel grid
r.Lumen.VoxelLighting.Visualize = 1
```

### Performance Profiling

```cpp
// GPU timing
Stat Unit              // Overall frame time
Stat RHI              // GPU metrics

// Lumen-specific
Stat Lumen            // Lumen system time
Stat LumenScreenTraces
Stat LumenReflections
Stat LumenGI

// Memory
Stat Memory
Stat MeshDistanceFields
```

## Advanced Techniques

### Surface Caches

```
Alternative to voxel GI for mobile:
- Pre-compute lighting on static surfaces
- Store per-texel lighting
- Update dynamically as lights move
- Lower memory than full voxel grid
- Decent quality trade-off for mobile

Cost: Depends on surface area
- 10K sq-units: ~10MB
- 100K sq-units: ~100MB
- 1M sq-units: ~1GB
```

### Emissive Surface Contribution

```cpp
// Dynamic objects don't contribute to GI by default
// Use emissive to "fake" GI contribution

AEmissiveObject* Object = GetObject();
UMaterialInstanceDynamic* MatInst = 
    UMaterialInstanceDynamic::Create(BaseMat, Object);

// Set emissive to approximate indirect effect
float3 EstimatedIndirect = ComputeIndirectLighting(Position);
MatInst->SetVectorParameterValue(
    FName("Emissive"), 
    FLinearColor(EstimatedIndirect));

// Emissive bounces through Lumen
// Creates responsive, dynamic lighting
```

## Conclusion

Lumen represents a paradigm shift in real-time rendering, enabling photorealistic global illumination without pre-baking. Understanding its architecture—screen traces, SDFs, voxel grids, and hardware RT fallback—enables optimizing for specific performance targets. Combined with Nanite, it provides a complete next-generation rendering solution capable of handling complex, dynamic scenes at high fidelity.
