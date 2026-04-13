---
title: Unity Architecture and Workflow
category: game-engines/unity
tags: [unity, architecture, ECS, MonoBehaviour]
description: Comprehensive guide to Unity's architecture paradigms, including traditional GameObject/Component patterns, modern ECS systems, MonoBehaviour lifecycle, ScriptableObjects, Addressables, and best practices for organizing large projects.
related: [game-engines/unreal/architecture-blueprints, concepts/engine-architecture]
order: 1
---

# Unity Architecture and Workflow

## Introduction to Unity's Dual Architecture

Unity supports two fundamentally different architectural approaches: the traditional GameObject/Component (GO/C) pattern and the modern Entity Component System (ECS). Understanding both and knowing when to use each is critical for building scalable game systems.

### Traditional GameObject/Component Architecture

The GO/C pattern has been Unity's foundation since its inception. GameObjects serve as containers, and Components attach behavior and data. This object-oriented approach is intuitive but can lead to performance issues at scale.

```csharp
// Traditional MonoBehaviour-based architecture
public class PlayerController : MonoBehaviour
{
    private Rigidbody rb;
    private float moveSpeed = 5f;
    private InputManager inputManager;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        inputManager = GetComponent<InputManager>();
    }

    private void Update()
    {
        Vector3 input = inputManager.GetMovementInput();
        rb.velocity = input * moveSpeed;
    }

    private void OnDestroy()
    {
        // Cleanup resources
    }
}
```

### Modern ECS Architecture

The Unity ECS (Entity Component System) paradigm separates data from logic, enabling data-oriented design with superior cache locality and parallelization opportunities.

```csharp
// ECS approach with DOTS (Data-Oriented Tech Stack)
[BurstCompile]
public partial struct MoveSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        foreach (var (velocity, transform) in 
                 SystemAPI.Query<RefRW<LocalTransform>, RefRO<Velocity>>())
        {
            transform.ValueRW.Position += velocity.ValueRO.Value * SystemAPI.Time.DeltaTime;
        }
    }
}

public struct Velocity : IComponentData
{
    public float3 Value;
}
```

## MonoBehaviour Lifecycle

Understanding the precise order of MonoBehaviour callbacks is essential for avoiding bugs and structuring code efficiently.

### Complete Lifecycle Order

1. **Initialization Phase** (happens once when script instance loads)
   - `Awake()` - Called even if script component is disabled
   - `OnEnable()` - Called when object/component becomes enabled

2. **First Frame** (first Update cycle)
   - `Start()` - Called only if component enabled
   - Physics calculations and collider checks

3. **Every Frame**
   - `Update()` - Called once per frame
   - Physics simulation (fixed timestep)
   - `LateUpdate()` - Called after all Update calls

4. **Physics Timeline**
   - `FixedUpdate()` - Called at fixed timestep (default 0.02s)
   - Physics engine runs here
   - Rigidbody movements applied

5. **Shutdown Phase**
   - `OnDisable()` - Called when object/component disabled
   - `OnDestroy()` - Called when scene unloads or object destroyed

### Lifecycle Best Practices

```csharp
public class LifecycleExample : MonoBehaviour
{
    private void Awake()
    {
        // Initialize references, set up object state
        // Call this instead of constructor
    }

    private void OnEnable()
    {
        // Register event listeners
        EventManager.OnGameEvent += HandleGameEvent;
    }

    private void Start()
    {
        // Safe to reference other initialized objects
    }

    private void Update()
    {
        // Input handling, non-physics logic
    }

    private void FixedUpdate()
    {
        // Physics-related logic only
    }

    private void LateUpdate()
    {
        // Camera following, final transforms
    }

    private void OnDisable()
    {
        // Unregister event listeners
        EventManager.OnGameEvent -= HandleGameEvent;
    }

    private void OnDestroy()
    {
        // Clean up unmanaged resources
    }

    private void HandleGameEvent()
    {
        // Event handler
    }
}
```

## ScriptableObjects: Data-Driven Design

ScriptableObjects decouple configuration from code, enabling non-programmers to modify game parameters and designers to create content without recompilation.

```csharp
[CreateAssetMenu(fileName = "New Weapon", menuName = "Game/Weapon")]
public class WeaponData : ScriptableObject
{
    [SerializeField] public string weaponName;
    [SerializeField] public float damage;
    [SerializeField] public float fireRate;
    [SerializeField] public Sprite icon;
    [SerializeField] public AudioClip fireSound;
}

public class Weapon : MonoBehaviour
{
    [SerializeField] private WeaponData weaponData;
    private float nextFireTime;

    public void Fire()
    {
        if (Time.time >= nextFireTime)
        {
            // Deal damage based on weaponData.damage
            AudioSource.PlayClipAtPoint(weaponData.fireSound, transform.position);
            nextFireTime = Time.time + 1f / weaponData.fireRate;
        }
    }
}
```

## Addressables System

Addressables decouple asset loading from asset location, enabling dynamic asset management, streaming, and easy content updates without rebuilding.

```csharp
using UnityEngine.AddressableAssets;

public class AssetLoader : MonoBehaviour
{
    public async void LoadAssetAsync(string address)
    {
        var handle = Addressables.LoadAssetAsync<GameObject>(address);
        
        // Wait for completion with timeout
        await handle.Task;
        
        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            Instantiate(handle.Result);
        }
        else
        {
            Debug.LogError($"Failed to load asset: {address}");
        }
        
        // Release handle when done
        Addressables.Release(handle);
    }

    public async void PreloadAssets(IList<string> addresses)
    {
        var handles = new List<AsyncOperationHandle>();
        
        foreach (var address in addresses)
        {
            handles.Add(Addressables.LoadAssetAsync<GameObject>(address));
        }
        
        await Addressables.InitializeAsync().Task;
    }
}
```

## Assembly Definitions: Project Organization

Assembly Definitions (.asmdef) enforce dependency boundaries, reduce compilation time, and organize code into logical modules.

```json
{
    "name": "Game.Gameplay",
    "rootNamespace": "Game.Gameplay",
    "references": [
        "Game.Core",
        "Game.UI"
    ],
    "includePlatforms": [],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": false,
    "precompiledReferences": [],
    "defineConstraints": []
}
```

### Project Structure with Assemblies

```
Assets/
├── Game.Core/           (Core systems - no dependencies)
│   ├── Events/
│   ├── Managers/
│   └── Game.Core.asmdef
├── Game.Gameplay/       (Game logic - depends on Core)
│   ├── Player/
│   ├── Enemy/
│   └── Game.Gameplay.asmdef
├── Game.UI/             (UI systems)
│   ├── HUD/
│   └── Game.UI.asmdef
├── Game.Physics/        (Physics-specific code)
│   └── Game.Physics.asmdef
└── Game.Editor/         (Editor-only tools)
    └── Game.Editor.asmdef
```

## Addressables in Practice

Combining Addressables with ScriptableObjects creates powerful, flexible systems:

```csharp
[CreateAssetMenu(fileName = "New Level", menuName = "Game/Level")]
public class LevelData : ScriptableObject
{
    [SerializeField] public string levelName;
    [SerializeField] public string sceneAddress; // Addressable address
    [SerializeField] public int targetScore;
    [SerializeField] public List<AssetReference> enemyPrefabs;
}

public class LevelManager : MonoBehaviour
{
    [SerializeField] private LevelData levelData;

    public async Task LoadLevel()
    {
        // Load scene via Addressables
        var sceneHandle = Addressables.LoadSceneAsync(
            levelData.sceneAddress, 
            LoadSceneMode.Additive
        );
        
        await sceneHandle.Task;
        
        // Preload enemy prefabs
        foreach (var enemyRef in levelData.enemyPrefabs)
        {
            await enemyRef.LoadAssetAsync<GameObject>().Task;
        }
    }
}
```

## Large Project Organization Best Practices

### Folder Structure
- **Assets/Scripts/** - C# code organized by feature/system
- **Assets/Resources/** - Only for small, frequently-accessed assets
- **Assets/Prefabs/** - Reusable prefab templates
- **Assets/Scenes/** - Scene files
- **Assets/Art/** - Textures, models, sprites
- **Assets/Audio/** - Sound effects and music
- **Assets/StreamingAssets/** - External data files

### Dependency Management
- High-level systems depend on low-level systems
- Never create circular dependencies
- Use Addressables for optional/dynamic content
- Use assembly definitions to enforce boundaries

### Performance Considerations
- Profile memory usage (Window > Analysis > Profiler > Memory)
- Use object pooling for frequently instantiated objects
- Lazy-load assets with Addressables
- Consider ECS for systems with hundreds of entities

## Conclusion

Unity's architecture flexibility allows both traditional and modern approaches. For small projects, MonoBehaviour-based architecture suffices. For large projects with performance requirements, ECS with DOTS provides superior scalability and cache efficiency.
