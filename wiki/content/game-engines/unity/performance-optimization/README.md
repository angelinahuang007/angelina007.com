---
title: Unity Performance Optimization
category: game-engines/unity
tags: [unity, performance, optimization, profiling]
description: Deep dive into Unity performance profiling and optimization techniques including profiler usage, draw call batching, GPU instancing, LOD systems, occlusion culling, object pooling, async operations, memory management, IL2CPP, Burst compiler, and the Jobs system.
related: [algorithms/gpu-parallel-computing, graphics-fundamentals/anti-aliasing]
order: 4
---

# Unity Performance Optimization

## Profiler Fundamentals

The Unity Profiler is essential for identifying performance bottlenecks. Profiling without data leads to wrong optimizations.

### Setting Up Profiler

```csharp
// Access via Window > Analysis > Profiler
// Key categories:

// CPU Usage
// - Shows CPU time by system (Physics, Rendering, Scripting, etc)
// - Frame time visualization
// - Identifies expensive frames

// GPU Usage
// - GPU render time breakdown
// - Memory allocations
// - Draw call count

// Memory
// - Managed heap usage
// - Native memory
// - GC allocations per frame

// Frame Debugger
// - Render pass breakdown
// - Draw call order
// - Shader variant usage
```

### Profiler Usage Best Practices

```csharp
using UnityEngine.Profiling;

public class PerformanceMonitor : MonoBehaviour
{
    void Update()
    {
        // Mark custom sections
        Profiler.BeginSample("MyExpensiveOperation");
        
        ExpensiveOperation();
        
        Profiler.EndSample();
        
        // Check memory allocations
        float totalMemory = Profiler.GetTotalMemoryUsed() / (1024f * 1024f);
        Debug.Log($"Total Memory: {totalMemory} MB");
    }

    void ExpensiveOperation()
    {
        // Code to profile
    }
}
```

### Identifying Bottlenecks

1. **CPU Bound:** Profiler shows high CPU time, low GPU usage
   - Reduce script complexity
   - Optimize physics
   - Use Jobs/Burst

2. **GPU Bound:** High GPU time, low CPU time
   - Reduce shader complexity
   - Lower resolution
   - Use LOD
   - Reduce draw calls

3. **Bandwidth Bound:** Both CPU and GPU waiting on memory
   - Reduce texture resolutions
   - Use compression
   - Cache vertex data

## Draw Call Optimization

Draw calls are expensive GPU commands. Batching reduces draw calls significantly.

### Static Batching

Groups static geometry into single mesh at build time.

```csharp
// Mark objects as static for automatic batching
gameObject.isStatic = true;
GameObjectUtility.SetStaticEditorFlags(gameObject, 
    StaticEditorFlags.BatchingStatic);

// Static batching requirements
// - Objects must use same material
// - Objects must be static (never move)
// - No LOD groups
// - Limited vertex count per batch (65K)
```

### Dynamic Batching

Groups dynamic objects sharing same material.

```csharp
// Enable in rendering settings
QualitySettings.maximumLODLevel = 0;

// Requirements for dynamic batching
// - Same material and shader
// - Limited vertex attributes (position, normal, UV only)
// - Max 900 vertex positions per batch
// - Avoid normal maps, specular maps

// Dynamic batching works best with:
Mesh simpleMesh = CreateSimpleMesh(); // Minimal vertex attributes
Material sharedMaterial = new Material(Shader.Find("Standard"));
```

### GPU Instancing

Renders same mesh multiple times with different material properties efficiently.

```csharp
// Material must support instancing
Material instancedMaterial = new Material(Shader.Find("Standard"));
instancedMaterial.enableInstancing = true;

// Render thousands of objects
Matrix4x4[] matrices = new Matrix4x4[10000];
Mesh mesh = GetComponent<MeshFilter>().mesh;
Material material = instancedMaterial;

for (int i = 0; i < 10000; i++)
{
    matrices[i] = Matrix4x4.TRS(
        GetPosition(i),
        Quaternion.identity,
        Vector3.one
    );
}

// Draw instanced
Graphics.DrawMeshInstanced(mesh, 0, material, matrices);
```

### SRP Batcher

Superior to traditional batching, reduces CPU overhead dramatically.

```csharp
// Enable in rendering pipeline settings
// Requirements:
// - All per-material data in CBUFFER_START(UnityPerMaterial)
// - Shaders must be compatible
// - No per-object shader keywords

// Example shader setup
// Shader "Compatible/SRPBatcher"
// {
//     CBUFFER_START(UnityPerMaterial)
//         float4 _Color;
//         float _Smoothness;
//     CBUFFER_END
// }
```

## GPU Optimization

### GPU Instancing Best Practices

```csharp
public class InstancingExample : MonoBehaviour
{
    void RenderWithInstancing()
    {
        Mesh mesh = GetComponent<MeshFilter>().mesh;
        Material material = GetComponent<MeshRenderer>().material;
        
        // Gather transform data
        int instanceCount = 1000;
        Matrix4x4[] matrices = new Matrix4x4[instanceCount];
        
        for (int i = 0; i < instanceCount; i++)
        {
            matrices[i] = Matrix4x4.TRS(
                new Vector3(i % 10 * 10, 0, i / 10 * 10),
                Quaternion.identity,
                Vector3.one
            );
        }
        
        // Render in one draw call
        Graphics.DrawMeshInstanced(mesh, 0, material, matrices);
    }
}
```

### Shader Optimization

```hlsl
// GPU-efficient shader patterns

// GOOD - Early returns reduce computation
float4 frag(v2f i) : SV_Target
{
    if (i.uv.y > 0.5)
        clip(-1); // Early exit
    
    // Rest of computation
}

// GOOD - Minimize branching
float value = lerp(a, b, step(threshold, x));

// BAD - Expensive branches
if (x > threshold)
    value = a;
else
    value = b;

// GOOD - Use precision appropriately
float roughValue; // Full precision
half colorValue; // Half precision sufficient

// GOOD - Minimize texture lookups
// Combine multiple channels in single texture
float4 packedData = tex2D(_PackedMap, uv);
float roughness = packedData.r;
float metallic = packedData.g;
```

## LOD (Level of Detail) Systems

Reduce geometry complexity based on distance from camera.

```csharp
public class LODSetup : MonoBehaviour
{
    void SetupLOD()
    {
        // Automatic LOD group
        LODGroup lodGroup = gameObject.AddComponent<LODGroup>();
        
        // Create LOD levels
        LOD[] lods = new LOD[3];
        
        // LOD 0: Closest, full detail
        lods[0] = new LOD(0.5f, new Renderer[] { GetComponent<MeshRenderer>() });
        
        // LOD 1: Medium distance, lower detail
        MeshRenderer mediumLOD = CreateLODMesh(mediumDetailMesh);
        lods[1] = new LOD(0.2f, new Renderer[] { mediumLOD });
        
        // LOD 2: Far distance, low detail
        MeshRenderer lowLOD = CreateLODMesh(lowDetailMesh);
        lods[2] = new LOD(0.05f, new Renderer[] { lowLOD });
        
        // LOD 3: Not visible
        lods[3] = new LOD(0.0f, new Renderer[] { });
        
        lodGroup.SetLODs(lods);
        lodGroup.RecalculateBounds();
    }

    MeshRenderer CreateLODMesh(Mesh mesh)
    {
        GameObject lodGO = new GameObject("LOD");
        lodGO.transform.parent = transform;
        
        var mf = lodGO.AddComponent<MeshFilter>();
        mf.mesh = mesh;
        
        return lodGO.AddComponent<MeshRenderer>();
    }
}
```

### LOD Screen Size Calculation

```csharp
// Calculate optimal LOD cross-fade distance
float screenHeight = Screen.height;
float distance = Vector3.Distance(camera.position, meshBounds.center);
float boundsSize = meshBounds.size.magnitude;

float screenSize = (screenHeight / distance) * boundsSize;
float lodThreshold = screenSize / 100f; // Adjust based on quality targets
```

## Occlusion Culling

Avoid rendering objects hidden behind other geometry.

```csharp
public class OcclusionCullingSetup : MonoBehaviour
{
    void SetupOcclusion()
    {
        // Mark occluders (geometry that blocks visibility)
        // - Static occluders: mark as static OccluderStatic
        // - Dynamic occluders: more expensive, use sparingly

        GameObjectUtility.SetStaticEditorFlags(gameObject,
            StaticEditorFlags.OccluderStatic);

        // In Window > Rendering > Occlusion Culling
        // - Bake occlusion culling data
        // - Set view cell size
        // - Smallest occluder size
        // - Backface threshold

        // Runtime check
        if (!renderer.isVisible)
        {
            // Object is occluded
        }
    }
}
```

## Object Pooling

Reuse objects instead of instantiating/destroying.

```csharp
public class ObjectPool<T> where T : Component
{
    private Queue<T> availableObjects = new Queue<T>();
    private HashSet<T> activeObjects = new HashSet<T>();
    private T prefab;
    private Transform parent;

    public ObjectPool(T prefab, int initialSize, Transform parent = null)
    {
        this.prefab = prefab;
        this.parent = parent;

        for (int i = 0; i < initialSize; i++)
        {
            CreateObject();
        }
    }

    public T Get()
    {
        T obj;
        
        if (availableObjects.Count > 0)
        {
            obj = availableObjects.Dequeue();
        }
        else
        {
            obj = CreateObject();
        }

        obj.gameObject.SetActive(true);
        activeObjects.Add(obj);
        return obj;
    }

    public void Return(T obj)
    {
        obj.gameObject.SetActive(false);
        activeObjects.Remove(obj);
        availableObjects.Enqueue(obj);
    }

    private T CreateObject()
    {
        T obj = Object.Instantiate(prefab, parent);
        obj.gameObject.SetActive(false);
        return obj;
    }
}

// Usage
public class BulletManager : MonoBehaviour
{
    private ObjectPool<Bullet> bulletPool;

    void Start()
    {
        bulletPool = new ObjectPool<Bullet>(
            bulletPrefab,
            initialSize: 50,
            parent: transform
        );
    }

    void Fire()
    {
        Bullet bullet = bulletPool.Get();
        bullet.Initialize(firePosition, fireDirection);
    }

    public void ReturnBullet(Bullet bullet)
    {
        bulletPool.Return(bullet);
    }
}
```

## Async Operations

Load data without stalling main thread.

```csharp
public class AsyncOperationExample : MonoBehaviour
{
    // Async asset loading
    async void LoadSceneAsync(string sceneName)
    {
        var asyncLoad = SceneManager.LoadSceneAsync(sceneName);
        
        while (!asyncLoad.isDone)
        {
            float progress = asyncLoad.progress;
            Debug.Log($"Loading: {progress * 100}%");
            await Task.Yield();
        }
    }

    // Async resource loading
    async void LoadResourcesAsync()
    {
        var request = Resources.LoadAsync<GameObject>("MyPrefab");
        
        while (!request.isDone)
        {
            await Task.Yield();
        }

        GameObject prefab = request.asset as GameObject;
        Instantiate(prefab);
    }

    // Custom async work
    async void DoAsyncWork()
    {
        // Run on thread pool
        await Task.Run(() => ExpensiveComputation());
        
        // Back on main thread
        UpdateUI();
    }
}
```

## Memory Management

### Garbage Collection

```csharp
public class GCOptimization : MonoBehaviour
{
    // BAD - Allocates garbage every frame
    void BadUpdate()
    {
        List<int> tempList = new List<int>();
        for (int i = 0; i < 100; i++)
        {
            tempList.Add(i);
        }
        ProcessList(tempList);
        // tempList garbage collected
    }

    // GOOD - Reuse collections
    private List<int> reusableList = new List<int>();
    
    void GoodUpdate()
    {
        reusableList.Clear();
        for (int i = 0; i < 100; i++)
        {
            reusableList.Add(i);
        }
        ProcessList(reusableList);
    }

    // GOOD - Use struct arrays instead of class arrays
    struct Data
    {
        public int value;
        public float time;
    }

    private Data[] dataArray = new Data[1000]; // Stack allocation

    // GOOD - Pool string allocations
    private Dictionary<string, int> stringCache = new Dictionary<string, int>();

    void CacheString(string key)
    {
        if (!stringCache.ContainsKey(key))
        {
            stringCache[key] = key.GetHashCode();
        }
    }
}
```

### Memory Profiling

```csharp
using UnityEngine.Profiling;

public class MemoryMonitor : MonoBehaviour
{
    void Update()
    {
        // Managed memory
        long managedMemory = Profiler.GetMonoUsedSizeLong();
        
        // Native memory
        long nativeMemory = Profiler.GetNativeObjectsCount();
        
        // Total
        long totalMemory = Profiler.GetTotalMemoryUsed();
        
        Debug.Log($"Managed: {managedMemory / 1024 / 1024} MB");
        Debug.Log($"Total: {totalMemory / 1024 / 1024} MB");
    }
}
```

## IL2CPP vs Mono

### IL2CPP (Recommended)

Ahead-of-time compilation to native C++, faster runtime.

```csharp
// IL2CPP advantages
// - Faster runtime performance
// - Better code stripping
// - Smaller binary size
// - Required for iOS/consoles

// IL2CPP considerations
// - Longer build times
// - Reflection limitations
// - Generic code explosion
```

### Mono Backend

Just-in-time compilation, slower but easier debugging.

```csharp
// Mono advantages
// - Faster iteration in editor
// - Full reflection support
// - Easier debugging

// Mono disadvantages
// - Slower runtime
// - Larger binary
// - More memory usage
```

## Burst Compiler

JIT compilation to native code for performance-critical code.

```csharp
using Unity.Burst;
using Unity.Mathematics;

[BurstCompile]
public static class MathPerformance
{
    // Bursts to native code
    [BurstCompile]
    public static float3 TransformPoint(float4x4 matrix, float3 point)
    {
        float4 transformed = math.mul(matrix, new float4(point, 1));
        return transformed.xyz / transformed.w;
    }

    // Burst can optimize math operations
    [BurstCompile]
    public static float FastInverse(float x)
    {
        return 1.0f / x; // Burst optimizes this
    }
}

// Burst Jobs
[BurstCompile]
public struct TransformJob : IJobParallelFor
{
    [ReadOnly] public NativeArray<float3> positions;
    [WriteOnly] public NativeArray<float3> outputs;
    public float4x4 matrix;

    public void Execute(int index)
    {
        outputs[index] = math.transform(matrix, positions[index]);
    }
}
```

## Jobs System

Parallelize CPU work across cores safely.

```csharp
using Unity.Jobs;
using Unity.Collections;
using Unity.Burst;

[BurstCompile]
public struct CalculatePositionsJob : IJobParallelFor
{
    [ReadOnly] public float deltaTime;
    [ReadOnly] public float gravity;
    [ReadOnly] public NativeArray<Vector3> velocities;

    [WriteOnly] public NativeArray<Vector3> positions;

    public void Execute(int index)
    {
        Vector3 pos = positions[index];
        Vector3 vel = velocities[index];

        // Simulate physics
        vel.y -= gravity * deltaTime;
        pos += vel * deltaTime;

        positions[index] = pos;
    }
}

public class JobSystemExample : MonoBehaviour
{
    private NativeArray<Vector3> positions;
    private NativeArray<Vector3> velocities;

    void Start()
    {
        int count = 10000;
        positions = new NativeArray<Vector3>(count, Allocator.Persistent);
        velocities = new NativeArray<Vector3>(count, Allocator.Persistent);
    }

    void Update()
    {
        var job = new CalculatePositionsJob
        {
            deltaTime = Time.deltaTime,
            gravity = 9.81f,
            velocities = velocities,
            positions = positions
        };

        JobHandle handle = job.Schedule(positions.Length, 64);
        handle.Complete();
    }

    void OnDestroy()
    {
        positions.Dispose();
        velocities.Dispose();
    }
}
```

## Optimization Checklist

- [ ] Profile to identify bottlenecks
- [ ] Reduce draw calls (batching, instancing)
- [ ] Implement LOD systems
- [ ] Use occlusion culling
- [ ] Optimize shaders (avoid branches, minimize texture lookups)
- [ ] Implement object pooling
- [ ] Reduce GC allocations (reuse collections, cache strings)
- [ ] Use async loading for large assets
- [ ] Enable GPU instancing on materials
- [ ] Use Burst compiler for hot paths
- [ ] Parallelize with Jobs system
- [ ] Test on target hardware early
