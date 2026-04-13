---
title: Physically Based Rendering (PBR) Pipeline
category: graphics-fundamentals
tags: [pbr, ibl, environment-mapping, metallic-roughness, energy-conservation]
description: PBR pipeline including metallic-roughness workflow, energy conservation, IBL, HDR environment maps, split-sum approximation, and material authoring principles.
related: [graphics-fundamentals/shading-models, graphics-fundamentals/global-illumination, blender/shader-nodes, photography/lighting-theory]
order: 11
---

# Physically Based Rendering (PBR)

PBR is a rendering philosophy: materials should be defined by physical properties directly measured from real-world surfaces, and rendering equations should conserve energy. This approach ensures consistency across different lighting conditions and enables intuitive material authoring.

## PBR Philosophy

Three core principles:

1. **Physical accuracy**: BRDF and light transport follow physics
2. **Consistency**: Material appearance independent of lighting
3. **Measurability**: Parameters come from real-world measurements

Benefits:
- Artists can use same material in different scenes
- Lighting adjustments don't break materials
- Renders match photography naturally
- Predictable results

## Metallic-Roughness Workflow

The industry standard material model. Each surface point has:

- **Albedo (Base Color)**: RGB diffuse color for non-metals, or F₀ reflectance for metals
- **Metallic**: 0-1 value indicating metal (1) vs dielectric (0)
- **Roughness**: 0-1 value for surface smoothness (0=mirror, 1=diffuse)

### Metallic vs Dielectric

**Dielectric (Metallic=0)**:
```
F₀ = 0.04 (standard plastic/concrete)
      0.02 (water)
      0.05 (fabric)
Diffuse component = albedo * (1 - F₀)
Specular component = F₀ + (1 - F₀) * (1 - cos(θ))^5
```

**Metal (Metallic=1)**:
```
F₀ = albedo  (measured from real metal, e.g., gold ≈ [0.83, 0.69, 0.22])
Diffuse component = 0 (pure specular, no subsurface)
Specular component = F₀ + (1 - F₀) * (1 - cos(θ))^5
```

**Blend (0 < Metallic < 1)**:
```
F₀ = mix(0.04, albedo, metallic)
kd = albedo * (1.0 - metallic)  // Diffuse mask
ks = 1.0  // Specular always 1
```

### Material Textures

Standard PBR texture maps:

1. **Base Color/Albedo**: RGB, sRGB space (gamma corrected)
   - For metals: reflectance values (linear, not gamma corrected)
   - For dielectrics: diffuse color

2. **Roughness**: Grayscale, linear
   - Typically remapped: `α = roughness² / 2` or `α = roughness²` depending on convention
   - Clamped to avoid extremely sharp highlights: `max(roughness, 0.04)`

3. **Metallic**: Grayscale, linear
   - Usually binary (fully metal or fully dielectric)
   - Blended values create unusual materials (rust on metal)

4. **Normal Map**: RGB, tangent space
   - Blue channel strongest (pointing out)
   - XY channels: surface perturbation

5. **Ambient Occlusion (AO)**: Grayscale, baked
   - Multiplies diffuse indirect lighting
   - Darker in crevices/folds

### PBR Shading Implementation

```glsl
#version 460 core

in VS_OUT {
    vec3 fragPos;
    vec3 normal;
    vec2 texCoord;
    mat3 tbn;  // Tangent-Bitangent-Normal matrix
} fs_in;

uniform sampler2D baseColorMap;
uniform sampler2D normalMap;
uniform sampler2D roughnessMap;
uniform sampler2D metallicMap;
uniform sampler2D aoMap;

uniform samplerCube irradianceMap;   // Baked diffuse
uniform samplerCube prefilterMap;    // Baked specular
uniform sampler2D brdfLUT;           // Lookup table

uniform vec3 lightPositions[4];
uniform vec3 lightColors[4];
uniform vec3 viewPos;

out vec4 FragColor;

const float PI = 3.14159265359;

// Fresnel-Schlick approximation
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// GGX Normal Distribution Function
float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    return nom / denom;
}

// Smith G1 Schlick-GGX
float geometrySchlickGGX(float NdotV, float roughness, bool isDirect) {
    float r = (roughness + 1.0);
    float k = isDirect ? (roughness * roughness) / 8.0 : (roughness * roughness) / 2.0;
    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;
    return nom / denom;
}

// Smith Geometry Function
float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness, true);
    float ggx1 = geometrySchlickGGX(NdotL, roughness, true);
    return ggx1 * ggx2;
}

vec3 pbr(vec3 N, vec3 V, vec3 L, vec3 radiance, vec3 F0, vec3 albedo, 
         float roughness, float metallic) {
    vec3 H = normalize(V + L);
    
    float distance = length(L);
    float attenuation = 1.0 / (distance * distance);
    vec3 lightRadiance = radiance * attenuation;
    
    // Cook-Torrance BRDF
    float D = distributionGGX(N, H, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
    float G = geometrySmith(N, V, L, roughness);
    
    vec3 numerator = D * F * G;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;
    
    // Energy conservation: diffuse and specular don't double-count
    vec3 kS = F;  // Specular is F
    vec3 kD = vec3(1.0) - kS;  // Diffuse is 1 - F
    kD *= 1.0 - metallic;  // Metals have no diffuse
    
    // Lambertian diffuse
    vec3 diffuse = kD * albedo / PI;
    
    float NdotL = max(dot(N, L), 0.0);
    return (diffuse + specular) * lightRadiance * NdotL;
}

void main() {
    // Sample textures
    vec3 baseColor = pow(texture(baseColorMap, fs_in.texCoord).rgb, vec3(2.2));
    float roughness = texture(roughnessMap, fs_in.texCoord).r;
    float metallic = texture(metallicMap, fs_in.texCoord).r;
    float ao = texture(aoMap, fs_in.texCoord).r;
    
    // Normal mapping
    vec3 normalSample = texture(normalMap, fs_in.texCoord).rgb;
    vec3 N = normalize(normalSample * 2.0 - 1.0);
    N = normalize(fs_in.tbn * N);
    
    vec3 V = normalize(viewPos - fs_in.fragPos);
    vec3 R = reflect(-V, N);
    
    // Calculate F0
    vec3 F0 = vec3(0.04);  // Dielectric
    F0 = mix(F0, baseColor, metallic);  // Metal
    
    // Direct lighting (multiple lights)
    vec3 Lo = vec3(0.0);
    for(int i = 0; i < 4; i++) {
        vec3 L = normalize(lightPositions[i] - fs_in.fragPos);
        Lo += pbr(N, V, L, lightColors[i], F0, baseColor, roughness, metallic);
    }
    
    // Indirect lighting (IBL)
    vec3 ambient = vec3(0.03) * baseColor * ao;
    ambient += imageBasedLighting(N, V, R, baseColor, roughness, metallic, F0);
    
    vec3 color = ambient + Lo;
    
    // Tone mapping (convert from HDR to LDR)
    color = color / (color + vec3(1.0));  // Reinhard
    color = pow(color, vec3(1.0 / 2.2));  // Gamma correct
    
    FragColor = vec4(color, 1.0);
}
```

## Image-Based Lighting (IBL)

Instead of discrete light sources, use environment maps (360° HDR images) for lighting.

### Environment Map Formats

**Equirectangular**:
```
2:1 aspect ratio, 360° horizontal panorama
Natural camera format (from 360° cameras)
Disadvantages: Polar distortion, more samples needed for poles
```

**Cubemap**:
```
6 square faces (±X, ±Y, ±Z)
Uniform texel density
Advantages: Even sampling, efficient filtering
Disadvantages: Seams, larger file size (6x square textures)
```

### Split-Sum Approximation

IBL requires integral over entire environment, expensive at runtime. **Split-sum** precomputes most of the work:

```
L_indirect = ∫ L_env(ωᵢ) * fᵣ(ωᵢ, ωₒ) * cos(θᵢ) dωᵢ
           = ∫ L_env * fᵣ * cos(θ) dωᵢ

Separate into diffuse and specular:

Diffuse (Lambertian):
L_diffuse = ∫ L_env * cos(θ) dωᵢ / π
         = average of environment weighted by cos(θ)
         → Precompute irradiance map (32x32 or 64x64)

Specular (Cook-Torrance):
L_specular = ∫ L_env * D(h) * F(θ) * G(...) / (4*NdotL*NdotV) dωᵢ
           ≈ ∫ L_env * D(h) dωᵢ * F(h) * G(...)
           = Prefiltered environment * BRDF lookup table

BRDF LUT(roughness, NdotV) → approximation of F*G/(4NdotLNdotV) integral
```

### Precomputation Pipeline

**Offline (content creation)**:
```
1. Load HDR environment map
2. Generate cubemap mips (each level lower roughness)
3. For each mip level:
   - For each texel:
     - Importance sample around normal direction
     - Weight samples by GGX distribution
     - Store averaged color
4. Output: "prefilterMap" (cubemap with mips)

5. Generate BRDF lookup table:
   - For each (roughness, NdotV) pair:
     - Integrate specular term over hemisphere
     - Store (scale, bias) factors
   - Output: 2D LUT texture (512x512)

6. Generate irradiance map:
   - For each direction:
     - Sample environment and weight by cos(θ)
     - Average nearby samples
   - Output: Low-res cubemap (32x32)
```

**Runtime (shading)**:
```glsl
vec3 imageBasedLighting(vec3 N, vec3 V, vec3 R, vec3 albedo, 
                        float roughness, float metallic, vec3 F0) {
    // Diffuse IBL
    vec3 irradiance = texture(irradianceMap, N).rgb;
    vec3 diffuse = irradiance * albedo;
    
    // Specular IBL
    float NdotV = max(dot(N, V), 0.0);
    vec3 prefilteredColor = textureLod(prefilterMap, R, roughness * maxMipLevels).rgb;
    vec2 brdf = texture(brdfLUT, vec2(NdotV, roughness)).rg;
    vec3 specular = prefilteredColor * (F0 * brdf.x + brdf.y);
    
    // Energy conservation
    vec3 kS = fresnelSchlick(NdotV, F0);
    vec3 kD = 1.0 - kS;
    kD *= 1.0 - metallic;
    
    return kD * diffuse + specular;
}
```

### BRDF Lookup Table Detail

The LUT stores precomputed values to avoid expensive integration at runtime:

```
LUT(u, v) = (scale * F₀ + bias) for F + G integral
          = (∫ F(θ) * G(...) cos(θ) dθ, ∫ (1 - F(θ)) * G(...) cos(θ) dθ)

At runtime:
fresnel_factor = F₀ * scale + bias
```

This allows reusing same LUT for all materials and lighting directions.

## Energy Conservation in PBR

Crucial property: outgoing light ≤ incoming light.

```
Outgoing = Diffuse + Specular
         = (1 - F) * diffuse + F * specular

Where F goes from F₀ (normal incidence) to 1.0 (grazing)

At grazing angles: F ≈ 1, so diffuse → 0, specular → 1 (mostly reflection)
At normal: F = F₀, so diffuse = (1 - F₀) * color, specular = F₀

For dielectrics: F₀ ≈ 0.04, so ~96% diffuse, ~4% specular at normal
For metals: F₀ is high, so mostly specular regardless of angle
```

## Material Authoring Principles

### Typical Material Values

**Plastic (Dielectric)**:
```
Base Color: [0.8, 0.8, 0.8] or specific color
Metallic: 0
Roughness: 0.5-0.8
```

**Polished Metal (Steel)**:
```
Base Color: [0.77, 0.77, 0.77] (reflectance)
Metallic: 1
Roughness: 0.1-0.3
```

**Brushed Metal (Aluminum)**:
```
Base Color: [0.91, 0.92, 0.92]
Metallic: 1
Roughness: 0.3-0.6
```

**Gold**:
```
Base Color: [0.83, 0.69, 0.22] (measured, linear space)
Metallic: 1
Roughness: 0.2-0.4
```

**Fabric**:
```
Base Color: Specific color
Metallic: 0
Roughness: 0.7-1.0
Normal Map: Subtle weave detail
```

**Water**:
```
Base Color: [0.02, 0.02, 0.08] (very dark, absorbs light)
Metallic: 0
Roughness: 0.0-0.3 (smooth to ripples)
Normal Map: Wave patterns
```

### Workflow Best Practices

1. **Use linear color space** for albedo when authoring (not gamma corrected)
2. **Clamp roughness** minimum to avoid infinitely sharp specular: `max(roughness, 0.04)`
3. **Use 16-bit or higher precision** for normal maps (8-bit has banding artifacts)
4. **Bake ambient occlusion separately** (multiply after IBL computation)
5. **Consistency check**: Verify material works under multiple lighting conditions
6. **Reference photography**: Compare against real-world surface photos

## Limitations and Alternatives

Standard PBR assumes:
- Isotropic materials (same in all directions)
- No subsurface scattering
- No atmospheric effects
- Smooth layer model (no clear coat, decals)

**Extensions**:
- **Anisotropic BRDF**: For brushed/hair/fabric (secondary roughness axis)
- **Subsurface scattering**: For skin, wax, marble (thin material translucency)
- **Coat layer**: Clear coat over base material (e.g., car paint)
- **Iridescence**: Color changing with viewing angle (oil films, beetles)

Modern engines increasingly support these extensions while maintaining PBR principle of physical accuracy and consistency.
