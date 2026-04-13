---
title: Unity Shader Programming
category: game-engines/unity
tags: [unity, shaders, HLSL, URP, HDRP]
description: Deep dive into Unity shader programming, covering ShaderLab syntax, URP and HDRP shader graphs, writing custom HLSL, lit shaders, shader variants, SRP batcher compatibility, and practical rendering examples.
related: [graphics-fundamentals/shading-models, graphics-fundamentals/pbr-rendering, blender/shader-nodes]
order: 2
---

# Unity Shader Programming

## ShaderLab Fundamentals

ShaderLab is Unity's declarative shader language that wraps HLSL/GLSL code. Understanding its structure is fundamental to all Unity shading.

### Complete ShaderLab Structure

```glsl
Shader "Custom/MyShader"
{
    Properties
    {
        _MainTex ("Main Texture", 2D) = "white" {}
        _Color ("Tint Color", Color) = (1, 1, 1, 1)
        _Metallic ("Metallic", Range(0, 1)) = 0.0
        _Smoothness ("Smoothness", Range(0, 1)) = 0.5
        [HDR] _EmissionColor ("Emission", Color) = (0, 0, 0, 1)
        [Enum(UnityEngine.Rendering.CullMode)] _Cull ("Cull Mode", Int) = 2
    }

    SubShader
    {
        Tags 
        { 
            "RenderType" = "Opaque"
            "RenderPipeline" = "UniversalPipeline"
            "IgnoreProjector" = "True"
        }

        Pass
        {
            Name "ForwardLit"
            Tags { "LightMode" = "UniversalForward" }

            Cull [_Cull]
            ZWrite On
            ZTest LEqual

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS_CASCADE
            #pragma multi_compile _ _SHADOWS_SOFT

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            CBUFFER_START(UnityPerMaterial)
                float4 _MainTex_ST;
                float4 _Color;
                float _Metallic;
                float _Smoothness;
            CBUFFER_END

            TEXTURE2D(_MainTex);
            SAMPLER(sampler_MainTex);

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS : NORMAL;
                float4 tangentOS : TANGENT;
                float2 uv : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 normalWS : TEXCOORD1;
                float3 worldPos : TEXCOORD2;
            };

            Varyings vert(Attributes input)
            {
                Varyings output;
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                output.worldPos = TransformObjectToWorld(input.positionOS.xyz);
                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                output.uv = TRANSFORM_TEX(input.uv, _MainTex);
                return output;
            }

            float4 frag(Varyings input) : SV_Target
            {
                float4 texColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, input.uv);
                float4 baseColor = texColor * _Color;

                Light mainLight = GetMainLight();
                float3 normal = normalize(input.normalWS);
                float3 viewDir = normalize(_WorldSpaceCameraPos - input.worldPos);

                float3 lighting = mainLight.color * max(dot(normal, mainLight.direction), 0.0);
                float3 finalColor = baseColor.rgb * lighting;

                return float4(finalColor, baseColor.a);
            }
            ENDHLSL
        }

        Pass
        {
            Name "ShadowCaster"
            Tags { "LightMode" = "ShadowCaster" }

            ColorMask 0
            Cull Back

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Shadows.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
            };

            Varyings vert(Attributes input)
            {
                Varyings output;
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                return output;
            }

            half4 frag(Varyings input) : SV_Target
            {
                return 0;
            }
            ENDHLSL
        }
    }

    FallBack "Universal Render Pipeline/Lit"
}
```

## URP vs HDRP Shaders

### Universal Render Pipeline (URP)

URP is optimized for mobile and scalable rendering across platforms.

**Key Characteristics:**
- Single forward pass rendering
- Baked lighting preferred
- Limited post-processing
- Per-object light limit
- Best for mobile/VR

### High Definition Render Pipeline (HDRP)

HDRP targets high-end PC/console with advanced features.

**Key Characteristics:**
- Deferred + Forward hybrid
- Real-time GI with Enlighten
- Advanced post-processing
- Dynamic lights
- HDR rendering with tone mapping

### Code Differences

```hlsl
// URP - Simple approach
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
Light light = GetMainLight();

// HDRP - More control
#include "Packages/com.unity.render-pipelines.high-definition/Runtime/ShaderLibrary/ShaderVariables.hlsl"
DirectionalLightData light = _DirectionalLightDatas[0];
```

## Custom Lit Shaders with Normal Maps

```glsl
Shader "Custom/NormalMappedLit"
{
    Properties
    {
        _MainTex ("Albedo", 2D) = "white" {}
        _BumpMap ("Normal Map", 2D) = "bump" {}
        _MetallicMap ("Metallic", 2D) = "black" {}
        _SmoothnessMap ("Smoothness", 2D) = "white" {}
        _Metallic ("Metallic Strength", Range(0, 1)) = 0.0
        _Smoothness ("Smoothness Strength", Range(0, 1)) = 0.5
    }

    SubShader
    {
        Tags { "RenderPipeline" = "UniversalPipeline" }

        Pass
        {
            Tags { "LightMode" = "UniversalForward" }

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ _MAIN_LIGHT_SHADOWS
            #pragma multi_compile_fragment _ _SCREEN_SPACE_OCCLUSION

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            CBUFFER_START(UnityPerMaterial)
                float4 _MainTex_ST;
                float4 _BumpMap_ST;
                float _Metallic;
                float _Smoothness;
            CBUFFER_END

            TEXTURE2D(_MainTex);
            TEXTURE2D(_BumpMap);
            TEXTURE2D(_MetallicMap);
            TEXTURE2D(_SmoothnessMap);
            SAMPLER(sampler_MainTex);

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS : NORMAL;
                float4 tangentOS : TANGENT;
                float2 uv : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 normalWS : TEXCOORD1;
                float3 tangentWS : TEXCOORD2;
                float3 bitangentWS : TEXCOORD3;
                float3 worldPos : TEXCOORD4;
            };

            Varyings vert(Attributes input)
            {
                Varyings output;
                VertexPositionInputs positionInputs = GetVertexPositionInputs(input.positionOS.xyz);
                output.positionCS = positionInputs.positionCS;
                output.worldPos = positionInputs.positionWS;
                output.uv = TRANSFORM_TEX(input.uv, _MainTex);

                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                output.tangentWS = TransformObjectToWorldDir(input.tangentOS.xyz);
                output.bitangentWS = cross(output.normalWS, output.tangentWS) * input.tangentOS.w;

                return output;
            }

            float4 frag(Varyings input) : SV_Target
            {
                float3 normal = SAMPLE_TEXTURE2D(_BumpMap, sampler_MainTex, input.uv).rgb;
                normal = UnpackNormal(normal);
                
                // Construct TBN matrix
                float3x3 tbn = float3x3(input.tangentWS, input.bitangentWS, input.normalWS);
                normal = normalize(mul(normal, tbn));

                float4 albedo = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, input.uv);
                float metallic = SAMPLE_TEXTURE2D(_MetallicMap, sampler_MainTex, input.uv).r * _Metallic;
                float smoothness = SAMPLE_TEXTURE2D(_SmoothnessMap, sampler_MainTex, input.uv).r * _Smoothness;

                Light mainLight = GetMainLight();
                float3 viewDir = normalize(_WorldSpaceCameraPos - input.worldPos);

                // Simple PBR
                float3 lightDir = normalize(mainLight.direction);
                float ndotL = saturate(dot(normal, lightDir));
                float3 diffuse = albedo.rgb * mainLight.color * ndotL;

                return float4(diffuse, albedo.a);
            }
            ENDHLSL
        }
    }
}
```

## Shader Variants and Performance

Shader variants multiply shader permutations based on preprocessor directives. Poor variant management causes shader bloat.

```glsl
Shader "Custom/VariantExample"
{
    Properties
    {
        _MainTex ("Main Texture", 2D) = "white" {}
    }

    SubShader
    {
        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            // Multi_compile creates all combinations
            #pragma multi_compile _ _NORMAL_MAPPING
            #pragma multi_compile _ _PARALLAX_MAPPING
            #pragma multi_compile _ _EMISSION

            // Shader_feature only includes used variants
            #pragma shader_feature _ _QUALITY_LOW _QUALITY_HIGH

            #include "UnityCG.cginc"

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            v2f vert(appdata_base v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = v.texcoord;
                return o;
            }

            float4 frag(v2f i) : SV_Target
            {
                float4 col = tex2D(_MainTex, i.uv);
                
                #ifdef _EMISSION
                col.rgb += float3(0.5, 0.2, 0.1);
                #endif

                return col;
            }
            ENDHLSL
        }
    }
}
```

**Variant Management:**
- Use `shader_feature` for variants stripped from builds
- Use `multi_compile` only for required variants
- Monitor shader variant count in build
- Use `#pragma skip_variants` to exclude unused combinations

## SRP Batcher Compatibility

The SRP Batcher dramatically improves batching by reducing CPU overhead. Shaders must follow strict conventions.

### SRP Batcher Requirements

```hlsl
// GOOD - SRP Batcher compatible
CBUFFER_START(UnityPerMaterial)
    float4 _MainTex_ST;
    float _Smoothness;
    float3 _EmissionColor;
CBUFFER_END

TEXTURE2D(_MainTex);
SAMPLER(sampler_MainTex);

// BAD - Not SRP Batcher compatible
float _Smoothness; // Global property outside CBUFFER
sampler2D _MainTex; // Legacy sampler declaration

// Properties must match material property block
void SetMaterialProperties(Material mat)
{
    mat.SetFloat("_Smoothness", 0.5f);
    mat.SetVector("_Color", color);
}
```

### Verifying SRP Batcher Compatibility

1. Enable "Use SRP Batcher" in pipeline settings
2. Check Frame Debugger for SetPass calls reduction
3. All per-material data must be in `CBUFFER_START(UnityPerMaterial)`
4. Textures and samplers declared separately below CBUFFER

## Practical Example: Water Shader

```glsl
Shader "Custom/Water"
{
    Properties
    {
        _WaterColor ("Water Color", Color) = (0.2, 0.4, 0.8, 0.8)
        _WaveAmplitude ("Wave Amplitude", Float) = 0.25
        _WaveFrequency ("Wave Frequency", Float) = 4.0
        _WaveSpeed ("Wave Speed", Float) = 1.0
        _NormalMap ("Normal Map", 2D) = "bump" {}
    }

    SubShader
    {
        Tags { "RenderType" = "Transparent" }

        Pass
        {
            Tags { "LightMode" = "UniversalForward" }
            
            Blend SrcAlpha OneMinusSrcAlpha
            ZWrite Off

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            CBUFFER_START(UnityPerMaterial)
                float4 _WaterColor;
                float _WaveAmplitude;
                float _WaveFrequency;
                float _WaveSpeed;
                float4 _NormalMap_ST;
            CBUFFER_END

            TEXTURE2D(_NormalMap);
            SAMPLER(sampler_NormalMap);

            struct Attributes
            {
                float4 positionOS : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 worldPos : TEXCOORD1;
            };

            Varyings vert(Attributes input)
            {
                Varyings output;
                
                // Wave deformation
                float3 posOS = input.positionOS.xyz;
                posOS.y += sin(posOS.x * _WaveFrequency + _Time.y * _WaveSpeed) * _WaveAmplitude;
                
                output.positionCS = TransformObjectToHClip(posOS);
                output.worldPos = TransformObjectToWorld(posOS);
                output.uv = TRANSFORM_TEX(input.uv, _NormalMap);
                
                return output;
            }

            float4 frag(Varyings input) : SV_Target
            {
                float3 normal = UnpackNormal(SAMPLE_TEXTURE2D(_NormalMap, sampler_NormalMap, input.uv));
                float3 viewDir = normalize(_WorldSpaceCameraPos - input.worldPos);
                
                float fresnel = pow(1.0 - saturate(dot(normal, viewDir)), 3.0);
                
                return float4(_WaterColor.rgb, _WaterColor.a + fresnel * 0.5);
            }
            ENDHLSL
        }
    }
}
```

## Best Practices

1. **Performance:** Always use early fragment discard with `clip()`
2. **Precision:** Use `half` for mobile, `float` for PC/console
3. **Lighting:** Use surface shaders or custom lit passes for consistency
4. **Variants:** Minimize variants using shader_feature wisely
5. **Testing:** Profile shader performance on target hardware
6. **Compatibility:** Test across different GPUs and RenderPipelines
