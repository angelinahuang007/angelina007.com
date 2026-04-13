---
title: Unity Lighting and Post-Processing
category: game-engines/unity
tags: [unity, lighting, post-processing, URP, HDRP]
description: Comprehensive guide to lighting systems in Unity, including light types, baked vs realtime lighting, light probes, reflection probes, URP/HDRP differences, post-processing effects, and advanced rendering techniques like Enlighten and Progressive Lightmapper.
related: [photography/lighting-theory, graphics-fundamentals/global-illumination, graphics-fundamentals/realtime-rendering-pipeline]
order: 3
---

# Unity Lighting and Post-Processing

## Light Types and Properties

### Directional Lights

Represent sunlight or distant light sources. Infinitely far away, parallel rays.

```csharp
// Directional Light Setup
Light directionalLight = GetComponent<Light>();
directionalLight.type = LightType.Directional;
directionalLight.intensity = 1.0f;
directionalLight.color = Color.white;
directionalLight.shadows = LightShadows.Soft;
directionalLight.shadowNormalBias = 0.4f;
directionalLight.shadowBias = 0.05f;
```

**Characteristics:**
- Only one main directional light casts shadows per light layer
- Shadow distance controlled by QualitySettings
- Affects entire scene uniformly
- Ideal for sun/moon simulation

### Point Lights

Omnidirectional lights emanating from a point in space.

```csharp
Light pointLight = gameObject.AddComponent<Light>();
pointLight.type = LightType.Point;
pointLight.range = 10f;
pointLight.intensity = 1.0f;
pointLight.shadows = LightShadows.Soft;

// Performance: Point light shadows are expensive
// Use sparingly or disable for many lights
```

**Performance Considerations:**
- Expensive for shadow casting
- Limited to 4 per-object in forward rendering
- Deferred rendering handles more efficiently
- Consider fake shadows or baked light for cheaper alternatives

### Spot Lights

Cone-shaped lights with falloff and directional focus.

```csharp
Light spotLight = gameObject.AddComponent<Light>();
spotLight.type = LightType.Spot;
spotLight.range = 20f;
spotLight.spotAngle = 45f;
spotLight.intensity = 1.5f;
```

## Baked vs Realtime Lighting

### Baked Lighting

Pre-computed and stored in lightmaps. Zero runtime cost.

```csharp
// Configure renderer for baking
MeshRenderer meshRenderer = GetComponent<MeshRenderer>();
meshRenderer.lightProbeUsage = LightProbeUsage.BlendProbes;
meshRenderer.receiveGI = ReceiveGI.Lightmaps;

// Static objects must be marked
gameObject.isStatic = true;
GameObjectUtility.SetStaticEditorFlags(gameObject, 
    StaticEditorFlags.ContributeGI | 
    StaticEditorFlags.OccluderStatic);
```

### Realtime Lighting

Computed each frame. Expensive but dynamic.

```csharp
MeshRenderer meshRenderer = GetComponent<MeshRenderer>();
meshRenderer.receiveGI = ReceiveGI.DynamicLightmaps;
meshRenderer.lightProbeUsage = LightProbeUsage.BlendProbes;

Light light = GetComponent<Light>();
light.bakingOutput.lightmapBakeType = LightBakingOutput.Realtime;
```

### Mixed Lighting

Combines baked and realtime for optimization.

```csharp
Light light = GetComponent<Light>();
light.bakingOutput.lightmapBakeType = LightBakingOutput.Mixed;
light.bakingOutput.mixedLightingMode = MixedLightingMode.Shadowmask;

// Shadowmask mode: Real-time shadows in contact distance, baked shadows beyond
// Distance shadowmask: Baked lighting, realtime shadows at distance
```

## Light Probes

Store indirect lighting at sample points, interpolated for dynamic objects.

### Setting Up Light Probes

```csharp
// Light Probe Group component
LightProbeGroup probeGroup = gameObject.AddComponent<LightProbeGroup>();

Vector3[] probePositions = new Vector3[27];
int index = 0;

// Create 3x3x3 grid
for (int x = 0; x < 3; x++)
{
    for (int y = 0; y < 3; y++)
    {
        for (int z = 0; z < 3; z++)
        {
            probePositions[index++] = new Vector3(
                x * 5f, 
                y * 5f, 
                z * 5f
            );
        }
    }
}

probeGroup.probePositions = probePositions;
```

### Using Light Probes in Shaders

```hlsl
// HLSL/GLSL code
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

// In fragment shader
float3 bakedGI = SampleSH(normalWS);

// Or in C# for custom rendering
Vector3 normal = meshRenderer.transform.TransformDirection(surfaceNormal);
SphericalHarmonicsL2 sh = LightProbes.GetInterpolatedProbe(worldPosition, null);
Vector3 ambientColor = ShadowMaskByDistanceType.EvaluateByDistanceType(sh, normal);
```

### Light Probe Strategies

1. **Grid Placement:** Regular spacing for predictable results
2. **Adaptive Placement:** Dense around complex geometry
3. **Outdoor Scenes:** Place probes at multiple heights
4. **Indoor Scenes:** Dense near walls and corners

## Reflection Probes

Capture environment reflections in cubemaps, applied to reflective surfaces.

### Reflection Probe Setup

```csharp
ReflectionProbe reflectionProbe = gameObject.AddComponent<ReflectionProbe>();

reflectionProbe.size = new Vector3(10, 10, 10);
reflectionProbe.center = Vector3.zero;
reflectionProbe.nearClipPlane = 0.1f;
reflectionProbe.farClipPlane = 1000f;
reflectionProbe.resolution = 256;
reflectionProbe.mode = ReflectionProbeMode.Baked;
reflectionProbe.importance = 1;

// Bake the probe
reflectionProbe.RenderProbe();
```

### Real-time Reflection Probes

```csharp
reflectionProbe.mode = ReflectionProbeMode.Realtime;
reflectionProbe.refreshMode = ReflectionProbeRefreshMode.EveryFrame;

// For performance, use OnAwake and update manually
reflectionProbe.refreshMode = ReflectionProbeRefreshMode.OnAwake;
reflectionProbe.timeSlicingMode = ReflectionProbeTimeSlicingMode.IndividualFaces;
```

## URP vs HDRP Lighting Differences

### URP Lighting Features

```csharp
// URP limitations
// - Single main light with shadows
// - Up to 4 additional lights with limited shadows
// - Baked GI preferred
// - Forward rendering only
// - Per-vertex or per-object ambient

UniversalRenderPipelineAsset urpAsset = 
    GraphicsSettings.defaultRenderPipeline as UniversalRenderPipelineAsset;

urpAsset.mainLightShadowmapResolution = 2048;
urpAsset.additionalLightsShadowmapResolution = 1024;
urpAsset.maxAdditionalLightsCount = 4;
```

### HDRP Lighting Features

```csharp
// HDRP capabilities
// - Multiple shadow-casting lights
// - Deferred rendering for many lights
// - Real-time GI with Enlighten
// - Screen-space reflections
// - Contact shadows
// - Volumetric fog integration

HDRenderPipelineAsset hdrpAsset = 
    GraphicsSettings.defaultRenderPipeline as HDRenderPipelineAsset;

hdrpAsset.currentPlatformRenderPipelineSettings.supportShadowMask = true;
hdrpAsset.currentPlatformRenderPipelineSettings.supportSSR = true;
```

## Enlighten vs Progressive Lightmapper

### Enlighten (Legacy)

Real-time global illumination system, pre-computes light transport.

```csharp
// Enlighten settings
Lightmapping.BakeAsync();
Lightmapping.Bake();

// Enlighten prioritizes fast real-time GI updates
// GPU voxelization enables fast convergence
```

**Advantages:**
- Real-time GI updates
- Works well with moving lights
- Lower baking times

**Disadvantages:**
- Lower quality indirect lighting
- Requires GPU with compute support
- Deprecated in favor of Progressive Lightmapper

### Progressive Lightmapper (Modern)

CPU-based photon tracing, produces higher quality results.

```csharp
// Progressive Lightmapper settings in Lighting window
// Bake type: Progressive (CPU-based)
// Samples: Higher values = better quality, longer bake

// Override bake settings
LightmapSettings.lightmapper = LightmapperType.ProgressiveGPU;

// For custom control
LightBakingOutput lightOutput = new LightBakingOutput();
lightOutput.lightmapBakeType = LightBakingOutput.Baked;
lightOutput.mixedLightingMode = MixedLightingMode.IndirectOnly;
```

**Advantages:**
- Superior quality
- Handles complex geometry well
- Ray-traced accuracy

**Disadvantages:**
- Longer bake times
- No real-time updates
- Higher memory usage

## Post-Processing Stack

### Core Post-Process Effects

#### Bloom

Simulates camera imperfections and bright light bloom.

```csharp
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

public class PostProcessSetup : MonoBehaviour
{
    void Setup()
    {
        var volume = gameObject.AddComponent<Volume>();
        volume.isGlobal = true;

        var bloom = ScriptableObject.CreateInstance<Bloom>();
        bloom.intensity.value = 1.0f;
        bloom.threshold.value = 1.0f;
        bloom.scatter.value = 0.7f;

        var profile = ScriptableObject.CreateInstance<VolumeProfile>();
        profile.components.Add(bloom);
        volume.profile = profile;
    }
}
```

#### Color Grading

Adjust color, saturation, contrast.

```csharp
var colorGrading = ScriptableObject.CreateInstance<ColorGrading>();
colorGrading.contrast.value = 1.2f;
colorGrading.saturation.value = 1.0f;

// Apply LUT for cinematic look
colorGrading.lut.value = cinematicLUT;
colorGrading.lut.overrideState = true;
```

#### Depth of Field

Focus on specific depth range, blur rest.

```csharp
var dof = ScriptableObject.CreateInstance<DepthOfField>();
dof.mode.value = DepthOfFieldMode.Gaussian;
dof.focusDistance.value = 10f;
dof.aperture.value = 16f; // Lower = more blur

// Physics-based aperture
dof.aperture.value = 2.8f; // f/2.8 equivalent
```

#### Screen Space Ambient Occlusion (SSAO)

Darken crevices and contact areas.

```csharp
var ssao = ScriptableObject.CreateInstance<ScreenSpaceAmbientOcclusion>();
ssao.intensity.value = 2.0f;
ssao.radius.value = 0.25f;
ssao.samples.value = AmbientOcclusionQuality.High;
```

#### Vignette

Darken screen edges.

```csharp
var vignette = ScriptableObject.CreateInstance<Vignette>();
vignette.intensity.value = 0.3f;
vignette.smoothness.value = 0.5f;
vignette.rounded.value = false;
```

### Volumetric Fog

Creates depth and atmosphere.

```csharp
// HDRP specific
var fog = ScriptableObject.CreateInstance<Fog>();
fog.enabled.value = true;
fog.meanFreePath.value = 50f;
fog.baseHeight.value = 0f;
fog.maximumHeight.value = 100f;
```

## Advanced Lighting Techniques

### Screen Space Reflections (HDRP)

Reflections from screen-space depth.

```csharp
var ssr = ScriptableObject.CreateInstance<ScreenSpaceReflection>();
ssr.enabled.value = true;
ssr.screenEdgeFadeDistance.value = 0.1f;
ssr.rayMaxRaySteps.value = 32;
ssr.rayMinimumSmoothness.value = 0.1f;
```

### Contact Shadows

Shadows where surfaces meet, adding realism.

```csharp
// In HDRP light settings
Light contactLight = GetComponent<Light>();
contactLight.shadowRadius = 1.5f;

// Or in post-process volume
var contactShadow = ScriptableObject.CreateInstance<ContactShadows>();
contactShadow.enabled.value = true;
contactShadow.length.value = 0.4f;
contactShadow.distanceScaleFactor.value = 0.5f;
```

### Ambient Occlusion Integration

```csharp
// Combine SSAO with baked AO
// In shader: multiply base color by AO
float3 aoedColor = baseColor * ambientOcclusion * lighting;
```

## Performance Optimization

### Light Setup Best Practices

```csharp
// Minimize shadow-casting lights
int shadowCasters = Physics.OverlapSphere(transform.position, 50f)
    .Count(c => c.GetComponent<Light>()?.shadows != LightShadows.None);

if (shadowCasters > 2)
{
    Debug.LogWarning("Too many shadow-casting lights");
}

// Use light ranges efficiently
light.range = Vector3.Distance(light.transform.position, targetPosition) * 1.5f;

// Batch similar lights
Light[] lights = FindObjectsOfType<Light>();
// Group by type, shadow settings for optimal batching
```

### Lightmap Optimization

1. **Atlasing:** Combine multiple models' UVs into single lightmap
2. **Resolution:** Use lowest acceptable resolution
3. **Compression:** Apply compression in lighting settings
4. **Caching:** Store baked data efficiently

### Post-Process Optimization

```csharp
// Only apply expensive effects on high-end devices
if (SystemInfo.graphicsMemorySize > 2048)
{
    EnableExpensiveEffects();
}

// Use lower resolution for SSAO/bloom on mobile
ssao.samples.value = AmbientOcclusionQuality.Low;
bloom.highQualityFiltering.value = false;
```

## Complete Scene Lighting Example

```csharp
public class SceneLightingSetup : MonoBehaviour
{
    public void SetupOutdoorScene()
    {
        // Directional sun
        var sunGO = new GameObject("Sun");
        var sunLight = sunGO.AddComponent<Light>();
        sunLight.type = LightType.Directional;
        sunLight.intensity = 1.0f;
        sunLight.shadows = LightShadows.Soft;
        sunLight.transform.eulerAngles = new Vector3(50, -30, 0);

        // Light probes grid
        var probeGO = new GameObject("Light Probes");
        var probeGroup = probeGO.AddComponent<LightProbeGroup>();
        
        Vector3[] positions = new Vector3[8];
        for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
        for (int k = 0; k < 2; k++)
            positions[i * 4 + j * 2 + k] = new Vector3(i * 100, j * 50 + 2, k * 100);
        
        probeGroup.probePositions = positions;

        // Reflection probes at key locations
        var reflectGO = new GameObject("Reflection Probe");
        var reflectProbe = reflectGO.AddComponent<ReflectionProbe>();
        reflectProbe.size = new Vector3(200, 200, 200);
        reflectProbe.mode = ReflectionProbeMode.Baked;

        // Post-processing
        var postGO = new GameObject("Post-Process Volume");
        var volume = postGO.AddComponent<Volume>();
        volume.isGlobal = true;
        
        var profile = ScriptableObject.CreateInstance<VolumeProfile>();
        
        var bloom = ScriptableObject.CreateInstance<Bloom>();
        bloom.intensity.value = 0.8f;
        profile.components.Add(bloom);
        
        var colorGrading = ScriptableObject.CreateInstance<ColorGrading>();
        colorGrading.saturation.value = 1.1f;
        profile.components.Add(colorGrading);
        
        volume.profile = profile;
    }
}
```

## Conclusion

Effective lighting and post-processing dramatically elevate visual quality. Balance between performance and fidelity based on target platform. Use baked lighting for static environments, realtime for dynamic, and hybrid for flexibility. Post-processing should enhance, not dominate the visual experience.
