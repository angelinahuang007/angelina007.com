---
title: Unreal Editor Shortcuts and Tips
category: game-engines/unreal
tags: [unreal, shortcuts, tips, productivity]
description: Comprehensive guide to Unreal Engine keyboard shortcuts, viewport navigation, content browser workflow, blueprint debugging, console commands, useful CVars, PIE testing, editor utility widgets, and productivity optimization techniques.
related: [game-engines/unity/shortcuts-tips, blender/shortcuts-tips]
order: 5
---

# Unreal Editor Shortcuts and Tips

## Viewport Navigation

### Mouse Controls

| Action | Control |
|--------|---------|
| Orbit camera | Right Mouse + Drag |
| Pan camera | Middle Mouse + Drag |
| Zoom | Scroll Wheel |
| Dolly | Right Mouse + Ctrl + Drag up/down |
| Focus on object | Double-click or F key |
| Frame all | Home key or Ctrl+Home |

### Viewport Modes

| Shortcut | Action |
|----------|--------|
| `V` | Cycle viewport view mode |
| `J` | Cycle view mode (Wireframe, Unlit, Lit, etc.) |
| `G` | Game view (hide editor UI) |
| `P` | Perspective/Orthographic toggle |
| `H` | Toggle actor display flags |
| `Ctrl+H` | Show/hide search actor |
| `Alt+Z` | Immersive mode (fullscreen viewport) |

### Camera Controls (Numpad)

| Shortcut | Action |
|----------|--------|
| `Numpad 0` | Perspective view |
| `Numpad 1` | Front view |
| `Numpad 2` | Back view |
| `Numpad 3` | Right view |
| `Numpad 4` | Left view |
| `Numpad 5` | Top view |
| `Numpad 6` | Bottom view |
| `Numpad 7` | Isometric view |

## Essential Keyboard Shortcuts

### File Operations

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New level |
| `Ctrl+O` | Open level |
| `Ctrl+S` | Save current level |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+Alt+S` | Save all |

### Editing

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+D` | Duplicate |
| `Delete` | Delete selected |
| `Ctrl+A` | Select all |
| `Ctrl+Shift+A` | Deselect all |

### Transform Gizmos

| Shortcut | Action |
|----------|--------|
| `W` | Move tool |
| `E` | Rotate tool |
| `R` | Scale tool |
| `T` | All tools |
| `Space` | Toggle between current and default tool |
| `X` | Cycle pivot (pivot/center) |
| `Ctrl+L` | Toggle pivot rotation (local/world) |

### Actor Manipulation

| Shortcut | Action |
|----------|--------|
| `Alt+G` | Toggle grid snap |
| `Alt+R` | Toggle rotation snap |
| `Alt+S` | Toggle scale snap |
| `Ctrl+Right-Click` | Attach actor |
| `Ctrl+Alt+Right-Click` | Detach actor |
| `Ctrl+L` | Lock actor to viewport |

### Outliner and Selection

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` | Find actor in outliner |
| `Shift+O` | Open outliner |
| `Shift+P` | Open details panel |
| `Shift+C` | Open content browser |
| `Ctrl+Shift+L` | Select light actor |

### Editor Windows

| Shortcut | Action |
|----------|--------|
| `Shift+F5` | Eject from play-in-editor |
| `Alt+P` | Play (PIE) |
| `Alt+S` | Simulate |
| `Ctrl+Shift+N` | New actor |

## Content Browser Productivity

### Search Filters

```
By Type:
Blueprint       - BP_* assets
Texture         - Image files
Material        - .Material assets
StaticMesh      - Static geometry
SkeletalMesh    - Rigged characters
Sound           - Audio files
Map             - Level files
Particle        - Niagara/Cascade
Animation       - .AnimSequence

By Properties:
is:dirty        - Unsaved assets
is:modified     - Recently modified
is:map          - Map/level files
size>1000       - Larger than 1KB

Example search:
"is:dirty Blueprint" finds unsaved blueprints
```

### Content Organization

```
Best Practices:
├── Content/
│   ├── Maps/
│   │   ├── Levels/
│   │   └── Cinematics/
│   ├── Art/
│   │   ├── Meshes/
│   │   ├── Materials/
│   │   ├── Textures/
│   │   └── Skeletal/
│   ├── Audio/
│   │   ├── SFX/
│   │   └── Music/
│   ├── Blueprints/
│   │   ├── Characters/
│   │   ├── Enemies/
│   │   ├── Items/
│   │   └── Gameplay/
│   ├── VFX/
│   │   ├── Niagara/
│   │   └── Cascade/
│   └── UI/
│       └── Widgets/
```

### Quick Asset Access

```cpp
// Using content browser effectively:

1. Drag assets to viewport for quick placement
2. Ctrl+drag to place multiple copies
3. Right-click for context menu (select asset, replace, etc.)
4. Star assets for quick favorites access
5. Use content browser presets to organize by type
6. Sync to folder to highlight origin location
```

## Blueprint Debugging

### Visual Debugging Tools

```cpp
// Blueprint-specific debugging:

1. Execution Trace
   - Right-click node
   - Select "Enable Breakpoint"
   - Play game, pauses at breakpoint
   - Step through blueprint execution

2. Print Debugging
   - Add "Print String" node
   - Connect to execution flow
   - Message prints to console
   - Easy quick debugging

3. Draw Debug
   - Draw Debug Sphere
   - Draw Debug Line
   - Draw Debug Circle
   - Visualize algorithmic flow
   
4. On-Screen Debug Message
   - Display text on screen
   - Useful for gameplay debugging
   - Shows real-time values
```

### Advanced Debugging

```cpp
// C++ debugging in Blueprint-called functions:

1. Set execution breakpoint in C++
2. Call blueprint from game
3. Breakpoint halts execution
4. Step through C++ code in Visual Studio
5. Inspect variables at break

// Blueprint debugging:
FString DebugMessage = FString::Printf(
    TEXT("Actor: %s, Health: %f"), 
    *ActorName, 
    Health);

if (GEngine)
{
    GEngine->AddOnScreenDebugMessage(
        -1,
        5.0f,
        FColor::Green,
        DebugMessage);
}
```

## Console Commands

Essential debugging and development commands.

### Performance Commands

| Command | Effect |
|---------|--------|
| `Stat Unit` | Overall frame time |
| `Stat FPS` | Frames per second |
| `Stat RHI` | GPU metrics |
| `Stat Memory` | Memory usage |
| `Stat Game` | Game thread time |
| `Stat Render` | Render time breakdown |
| `Stat Unit None` | Turn off stats |

### Rendering Commands

| Command | Effect |
|---------|--------|
| `r.ShowUnitGraph 1` | Graph frame time |
| `r.Lumen 0` | Disable Lumen GI |
| `r.RayTracing 0` | Disable ray tracing |
| `r.Nanite 0` | Disable Nanite |
| `r.Shadow 0` | Disable shadows |
| `r.AmbientOcclusion 0` | Disable AO |
| `r.MotionBlur 0` | Disable motion blur |

### Gameplay Commands

| Command | Effect |
|---------|--------|
| `UE.PauseGame` | Pause/unpause game |
| `Quit` | Close editor |
| `Exit` | Close PIE |
| `ListAll` | List all actors/props |
| `GetAll` | Get all instances of class |

### Debug Drawing

| Command | Effect |
|---------|--------|
| `Show Collision` | Show collision shapes |
| `Show Bounds` | Show actor bounds |
| `Show NavMesh` | Show navigation mesh |
| `Show Volumes` | Show volume bounds |
| `ShowDebug AI` | AI debugging info |
| `ShowDebug Physics` | Physics data |

## CVars (Console Variables)

Persistent settings controlling engine behavior.

### Common CVars

```
// Engine settings
DefaultEngine.ini:

[/Script/Engine.Engine]
bUseFixedFrameRate=True
FixedFrameRate=60.0

// Rendering
r.DefaultFeature.AntiAliasing=1
r.AntiAliasingMethod=1    (0=None, 1=FXAA, 2=MSAA, 3=SMAA, 4=TAA)
r.TextureStreamingPoolSize=1000
r.LandscapeMaxLODLevel=1

// Lumen quality
r.Lumen.Reflections.ResolutionScale=0.5
r.Lumen.GlobalIllumination.ResolutionScale=0.5

// Performance
t.MaxFrameRate=60
r.VSync=0                 (Disable VSync for benchmarking)

// Development
r.ShowMaterialDrawEvents=1
r.DisplayInternalEngineStat=1
r.ProfileGPU=1            (GPU profiling)
```

### Setting CVars

```cpp
// Temporary (session only)
r.VSync 0
r.DefaultFeature.AntiAliasing 0

// Permanent (DefaultEngine.ini)
[/Script/Engine.Engine]
bUseFixedFrameRate=True
FixedFrameRate=30

// C++
IConsoleVariable* CVarMaxFPS = 
    IConsoleManager::Get().FindConsoleVariable(TEXT("t.MaxFrameRate"));
if (CVarMaxFPS)
{
    CVarMaxFPS->Set(60, ECVF_SetByGameMode);
}
```

## PIE (Play In Editor) vs Standalone

### PIE Configuration

```cpp
// Editor Preferences > Play > Play In Editor

Default Player Start Location:
- Camera Location: Use camera position
- Spawn Player Start: Use designated PlayerStart
- Last Successful: Remember previous location

Keyboard Shortcuts:
- Alt+P: Play
- Alt+S: Simulate
- Shift+F5: Eject from play
- F8: Pause/resume
- F10: Single frame advance

Network Emulation:
- Simulate network latency
- Packet loss simulation
- Connection dropouts
- Useful for multiplayer testing
```

### Play In Standalone

```cpp
// Standalone game session

Benefits:
- Actual game executable
- Real networking
- Full memory usage
- Closer to shipping build
- Better testing environment

Launch:
- File > Package Project > Build > Launch
- Or use Play Standalone option
- Compiled binary, no editor memory

Performance testing:
- Use standalone for accurate metrics
- PIE includes editor overhead
- Always verify on standalone
```

## Editor Utility Widgets

Extend editor with custom tools.

### Creating Custom Tools

```cpp
// Create Editor Utility Widget

class AMyEditorTool : public AEditorUtilityActor
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintImplementableEvent)
    void OnExecute();

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "Tools")
    int32 ToolValue = 100;
};

// Blueprint implementation:
// 1. Create Editor Utility Widget Blueprint
// 2. Add UI elements (buttons, sliders)
// 3. Connect to editor functions
// 4. Access via Window > Editor Utilities
```

### Common Editor Tools

```cpp
// Batch Rename Tool
void BatchRenameActors()
{
    for (TActorIterator<AActor> It(GetWorld()); It; ++It)
    {
        AActor* Actor = *It;
        FString OldName = Actor->GetName();
        FString NewName = OldName.Replace(
            TEXT("Old"), 
            TEXT("New"), 
            ESearchCase::IgnoreCase);
        
        Actor->Rename(*NewName);
    }
}

// Material Batch Update
void UpdateMaterialProperty()
{
    for (TObjectIterator<UMaterial> It; It; ++It)
    {
        UMaterial* Material = *It;
        // Update material properties
    }
}

// Lightmap Optimization
void OptimizeLightmaps()
{
    for (TObjectIterator<ALight> It; It; ++It)
    {
        ALight* Light = *It;
        if (Light->GetLightComponent()->CastShadows)
        {
            Light->GetLightComponent()->
                SetShadowmapChannel(0);
        }
    }
}
```

## Productivity Tips

### Viewport Tricks

```
1. Gizmo alignment
   - Align rotation gizmo to object or world space
   - Ctrl+L toggles local/world space

2. Viewport overlays
   - V for view mode cycle
   - Shows grid, guides, coordinates
   - Wireframe, unlit, lit modes

3. Camera speed
   - Scroll wheel to adjust speed
   - Hold Shift to boost speed
   - Hold Ctrl to reduce speed

4. Selection shortcuts
   - Ctrl+Click: Add to selection
   - Alt+Click: Remove from selection
   - Drag selection box: Marquee select
```

### Blueprint Productivity

```
1. Reroute nodes
   - Right-click connection
   - "Reroute" to organize spaghetti blueprint
   - Keeps visual hierarchy clean

2. Collapse nodes
   - Select nodes
   - Ctrl+K to collapse to macro
   - Reusable logic blocks

3. Comment boxes
   - C to add comment box
   - Organize related nodes visually
   - Improves readability

4. Blueprint find/replace
   - Ctrl+F in blueprint
   - Find node types or properties
   - Replace values across blueprint
```

### Performance Workflow

```cpp
// Quick performance iteration:

1. Enable stat display
   Stat Unit          // See real-time costs

2. Use session backend
   r.IsEditor = 0    // Editor mode off
   
3. Profile bottleneck
   Stat RHI / Stat Game

4. Make targeted change
   
5. Verify improvement
   Stat shows new cost

6. Test on target hardware
   Ship build or console
```

## Hidden Features

### Quick Settings

```
Common shortcuts:
- Ctrl+L: Lock to viewport
- Alt+Shift+C: Clear all
- F11: Toggle fullscreen
- Ctrl+G: Go to actor location

Asset browser:
- Drag assets directly into level
- Hold Shift to place rotated
- Ctrl+drag multiple copies
- Right-click for placement options
```

### Advanced Techniques

```cpp
// Developer mode revealing advanced features

Enable in Editor Preferences:
- Show Plugin Content
- Show Engine Content
- Show Tutorial Content

Access to internal assets:
- Engine materials and meshes
- Development textures
- Debug geometry

Useful for:
- Reference implementations
- Understanding engine behavior
- Fast prototyping with built-in assets
```

## Performance Optimization Workflow

```
Profile → Identify Bottleneck → Optimize → Verify

1. Run Stat Unit
   - Find which category is slow

2. Deep dive with target stat
   - Stat Game for gameplay/physics
   - Stat Render for rendering
   - Stat RHI for GPU

3. Make one change
   - One variable, one optimization

4. Verify with stat
   - Confirm improvement
   - Document findings

5. Test on hardware
   - Always verify on target device
   - PIE vs Standalone differences
   - Editor overhead affects measurements
```

## Conclusion

Mastering Unreal's editor shortcuts and tools dramatically accelerates development. Focus on viewport navigation and essential shortcuts first. Gradually adopt console commands for profiling, and build custom tools for your specific workflow. Regular profiling prevents performance issues before they become major problems. The investment in learning these tools pays dividends in faster iteration and higher quality results.
