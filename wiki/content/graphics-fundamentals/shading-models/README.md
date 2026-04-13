---
title: Shading Models and BRDFs
category: graphics-fundamentals
tags: [shading, brdf, pbr, lighting, blinn-phong, cook-torrance, microfacet]
description: Comprehensive coverage from Lambert to PBR, including Blinn-Phong, Cook-Torrance BRDF, Fresnel equations, and microfacet theory with mathematical foundations.
related: [graphics-fundamentals/pbr-rendering, graphics-fundamentals/global-illumination, photography/lighting-theory]
order: 3
---

# Shading Models and BRDFs

A shading model determines how light interacts with a surface. It is the answer to a fundamental question: given incident light from direction ωᵢ, what proportion is reflected toward the viewer in direction ωₒ? The Bidirectional Reflectance Distribution Function (BRDF) formalizes this relationship mathematically.

## The Rendering Equation and BRDF

The fundamental rendering equation describes outgoing radiance Lₒ:

```
Lₒ(ωₒ) = ∫ fᵣ(ωᵢ, ωₒ) Lᵢ(ωᵢ) |cos(θᵢ)| dωᵢ
         Ω
```

Where:
- **fᵣ(ωᵢ, ωₒ)**: The BRDF—fraction of light reflected from ωᵢ toward ωₒ
- **Lᵢ(ωᵢ)**: Incoming radiance from direction ωᵢ
- **|cos(θᵢ)|**: Lambert's law—light hitting surface at grazing angle contributes less
- **Ω**: Hemisphere of possible light directions

The BRDF must satisfy:
- **Reciprocity**: fᵣ(ωᵢ, ωₒ) = fᵣ(ωₒ, ωᵢ)
- **Energy Conservation**: ∫ fᵣ(ωᵢ, ωₒ) |cos(θᵢ)| dωᵢ ≤ 1 for all ωₒ
- **Positivity**: fᵣ(ωᵢ, ωₒ) ≥ 0

## Lambertian (Diffuse) Model

The simplest and most intuitive model. A perfectly matte surface scatters light equally in all directions.

```
fᵣ_diffuse = c_diffuse / π
```

Where c_diffuse is the surface's diffuse color (albedo). The 1/π normalization factor ensures energy conservation.

**In practice (per light)**:
```glsl
vec3 diffuseContribution = albedo * lightColor * max(0.0, dot(normal, lightDir)) / 3.14159;
```

**Characteristics**:
- Surface appears same brightness from any viewing angle
- No specular highlights
- Used for matte surfaces (soil, fabric, paper)
- Extremely fast to compute

**Physical Basis**: Lambertian surfaces have rough microscopic structure. Light penetrates, bounces around, and exits randomly—rough enough to randomize exit angle but uniform across the surface.

## Phong Model

The Phong model adds specular highlights by tracking the reflection of the light direction about the surface normal.

```
fᵣ_specular = ks * ((max(0, dot(reflection, viewDir)))^n) / (4 * max(dot(normal, lightDir), 0))

where reflection = 2 * dot(normal, lightDir) * normal - lightDir
```

**Full Phong BRDF**:
```
fᵣ = (kd / π) + ks * ((max(0, dot(R, V)))^n) / (4 * max(dot(N, L), 0))
```

**Parameters**:
- **kd**: Diffuse reflectance (0 to 1)
- **ks**: Specular reflectance
- **n**: Shininess exponent (higher = sharper, smaller highlight)

**Implementation**:
```glsl
vec3 viewDir = normalize(viewPos - fragPos);
vec3 reflectDir = reflect(-lightDir, normal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
vec3 specularContribution = ks * spec * lightColor;
```

**Issues with Phong**:
- Specular highlight disappears at grazing angles (unrealistic)
- Not physically based—energy not conserved
- Exponent n doesn't correlate directly to material properties

## Blinn-Phong Model

An improvement over Phong using the half-vector between light and view directions:

```
h = normalize(lightDir + viewDir)

fᵣ_specular = ks * ((max(0, dot(h, normal)))^n)

Full BRDF:
fᵣ = (kd / π) + ks * ((max(0, dot(h, normal)))^n)
```

**Why half-vector is better**:
- More intuitive (easier to match observed highlights)
- Slightly faster (one normalize vs reflection)
- More consistent with microfacet theory
- Highlight shape changes naturally with viewing angle

**Shiny plastic example** (n=256):
```glsl
vec3 lightDir = normalize(lightPos - fragPos);
vec3 viewDir = normalize(viewPos - fragPos);
vec3 halfDir = normalize(lightDir + viewDir);

float kd = 0.5;  // Diffuse amount
float ks = 0.8;  // Specular amount
float n = 256.0; // Shininess

vec3 diffuse = albedo * kd * max(0.0, dot(normal, lightDir));
vec3 specular = ks * pow(max(0.0, dot(normal, halfDir)), n) * lightColor;

vec3 result = diffuse + specular;
```

**Blinn-Phong remains popular** in real-time graphics despite being non-physical because:
- Computationally cheap
- Produces visually plausible results
- Easy to tune
- Works well with deferred rendering

## Fresnel Effect

As light hits a surface at grazing angles, reflection increases. A glass sphere reflects only slightly in the center but becomes mirror-like at edges. This is the **Fresnel effect**.

### Fresnel-Schlick Approximation

The most common GPU-friendly formula:

```
F(θ) = F₀ + (1 - F₀) * (1 - cos(θ))^5

where θ = angle between half-vector and light direction
      F₀ = base reflectance at 0° (normal incidence)
```

**Physical basis**: F₀ depends on refractive index:
```
F₀ = ((n - 1) / (n + 1))²

Examples:
  Air to glass (n=1.5): F₀ ≈ 0.04
  Air to water (n=1.33): F₀ ≈ 0.02
  Air to metal (n=varies): F₀ ≈ 0.7-1.0
```

**Implementation**:
```glsl
vec3 F0 = mix(vec3(0.04), albedo, metallic);  // Dielectric or metallic
vec3 fresnel = F0 + (1.0 - F0) * pow(clamp(1.0 - dot(h, v), 0.0, 1.0), 5.0);
```

For metals, albedo itself becomes F₀. For dielectrics, F₀ is a small constant (typically 0.04 for most surfaces).

## Microfacet Theory and Cook-Torrance BRDF

Real surfaces are microscopically rough, composed of tiny facets oriented in different directions. The **Cook-Torrance BRDF** is the industry standard physically-based model:

```
fᵣ = kd * (c/π) + ks * (D(h) * F(h,l) * G(l,v,h)) / (4 * (n·l) * (n·v))
```

Breaking down each component:

### Distribution Function D(h)
Models the concentration of microfacets oriented toward the half-vector. **GGX/Trowbridge-Reitz** is most common:

```
D(h) = α² / (π * ((n·h)² * (α² - 1) + 1)²)

where α = roughness²
```

For α=0 (smooth): D becomes a delta function (all facets aligned)
For α=1 (rough): D is spread out (facets random)

```glsl
float D_GGX(float dotNH, float roughness) {
    float alpha = roughness * roughness;
    float alphaSq = alpha * alpha;
    float denom = dotNH * dotNH * (alphaSq - 1.0) + 1.0;
    return alphaSq / (3.14159 * denom * denom);
}
```

### Fresnel F(h,l)
Already covered above. Schlick approximation:

```glsl
vec3 F_Schlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}
```

### Geometry Function G(l,v,h)
Models self-shadowing and masking: microfacets block light before it reaches other microfacets. The **Smith** method is standard:

```
G(l,v,h) = G₁(l) * G₁(v)

where G₁(v) = 1 / (1 + Λ(v))
      Λ(v) = (√(1 + α²tan²θ) - 1) / 2

For GGX, the k parameter varies:
  Direct lighting: k = (roughness + 1)² / 8
  IBL: k = roughness² / 2
```

This accounts for the fact that rough surfaces have shadowing from both the light and view directions.

```glsl
float G1_SmithGGX(float dotNV, float k) {
    return dotNV / (dotNV * (1.0 - k) + k);
}

float G_SmithGGX(float dotNL, float dotNV, float roughness, bool iblLight) {
    float k = iblLight ? (roughness * roughness) / 2.0 : 
                         pow(roughness + 1.0, 2.0) / 8.0;
    return G1_SmithGGX(dotNL, k) * G1_SmithGGX(dotNV, k);
}
```

### Complete Cook-Torrance Example

```glsl
vec3 CookTorrance(vec3 albedo, vec3 lightDir, vec3 viewDir, vec3 normal, 
                  float metallic, float roughness) {
    vec3 h = normalize(lightDir + viewDir);
    
    float dotNL = max(dot(normal, lightDir), 0.0);
    float dotNV = max(dot(normal, viewDir), 0.0);
    float dotNH = max(dot(normal, h), 0.0);
    float dotVH = max(dot(viewDir, h), 0.0);
    
    // Fresnel
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 F = F_Schlick(dotVH, F0);
    
    // Normal Distribution (GGX)
    float D = D_GGX(dotNH, roughness);
    
    // Geometry (Smith)
    float G = G_SmithGGX(dotNL, dotNV, roughness, false);
    
    // Specular component
    vec3 specular = (D * F * G) / (4.0 * dotNL * dotNV + 0.001);
    
    // Diffuse component (Lambertian, but dimmed by metallic)
    vec3 diffuse = albedo / 3.14159;
    
    return (1.0 - F) * diffuse + F * specular;
}
```

## Physical Accuracy and Energy Conservation

A crucial property of Cook-Torrance is **energy conservation**: outgoing light never exceeds incoming light.

The Fresnel term F acts as a mask:
- When F is low (metallic=0, normal incidence), more diffuse light escapes
- When F is high (grazing angle or metallic), more specular light escapes
- Total (diffuse + specular) never exceeds 1.0

For metallic surfaces, there is no diffuse component—all light is specular.

## Roughness and Material Mapping

Real materials have spatially-varying roughness and metallic properties:

```glsl
// Load material parameters from textures
float roughness = texture(roughnessMap, uv).r;
float metallic = texture(metallicMap, uv).b;
vec3 albedo = texture(albedoMap, uv).rgb;

// Apply roughness remap to avoid extremely sharp highlights at low values
roughness = max(roughness, 0.01);  // Clamp to avoid division issues

// Compute shading
vec3 contribution = CookTorrance(albedo, lightDir, viewDir, normal, metallic, roughness);
```

**Typical material values**:
- Steel (metallic): albedo=[0.77, 0.77, 0.77], metallic=1.0, roughness=0.2-0.4
- Plastic: albedo=[0.2, 0.3, 0.5], metallic=0.0, roughness=0.4-0.8
- Rubber: albedo=[0.1, 0.1, 0.1], metallic=0.0, roughness=0.8-1.0
- Water: albedo=[0.02, 0.02, 0.02], metallic=0.0, roughness=0.0-0.3

## Anisotropic BRDFs

For brushed metals, fabric, and hair, surface properties vary with direction. The BRDF depends on azimuthal angle relative to surface grooves.

**Ward's Anisotropic BRDF**:
```
fᵣ = (ks / (4π√(αₓ*αᵧ))) * exp(-tan²(θₕ) * (cos²(φₕ)/αₓ² + sin²(φₕ)/αᵧ²))
```

Where αₓ and αᵧ control roughness along two perpendicular directions.

Less common in real-time but essential for:
- Brushed metal surfaces
- Fabric weaves
- Hair and fur
- Vinyl records

## Cloth Models

Textile and fabric have unique light scattering behavior—not quite diffuse, not metallic. The **Ashikhmin-Premoze cloth BRDF** is common:

```
fᵣ = c * (1 + (n·h)²cos²(θ)) / (4π * max(n·v, n·l))
```

Fabric appears more diffuse when viewed at grazing angles due to thread packing.

## Subsurface Scattering

Some materials (skin, wax, marble) transmit light through the surface, internal scattering, then exit elsewhere. A simplified approximation:

```glsl
float sss = pow(clamp(dot(-normal, lightDir) + 1.0, 0.0, 1.0), 3.0);
vec3 subsurface = sss * subsurfaceColor * diffuse;
```

More accurate methods use a precomputed SSSS (Screen-Space Subsurface Scattering) kernel or baked light transmission.

## Practical Comparison

| Model | Speed | Accuracy | Common Use |
|-------|-------|----------|-----------|
| Lambertian | Very Fast | Low | Placeholders, mobile |
| Blinn-Phong | Fast | Medium | Deferred rendering, web |
| Cook-Torrance | Moderate | High | Modern games, film |
| Anisotropic | Moderate | High | Brushed metals, fabric |
| Cloth | Moderate | High | Realistic clothing |

Modern real-time graphics predominantly use **Cook-Torrance** with GGX distribution because it balances physical plausibility, visual quality, and computational efficiency. Understanding each component of the BRDF and how materials map to parameters is essential for achieving believable rendering results.
