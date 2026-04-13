---
title: Unity Editor Shortcuts and Tips
category: game-engines/unity
tags: [unity, shortcuts, tips, productivity]
description: Comprehensive guide to Unity Editor keyboard shortcuts, scene view navigation, content browser tips, hidden features, useful editor scripts, debugging tricks, and custom editor windows for maximizing workflow efficiency.
related: [blender/shortcuts-tips, game-engines/unreal/shortcuts-tips]
order: 5
---

# Unity Editor Shortcuts and Tips

## Scene View Navigation

### Mouse Controls

| Action | Control |
|--------|---------|
| Pan | Middle Mouse + Drag |
| Rotate | Right Mouse + Drag (or Alt + Left Mouse) |
| Zoom | Scroll Wheel or Right Mouse + Drag up/down |
| Focus on Object | Double-click object or F key |
| Orthographic Toggle | Numpad 5 |
| Perspective Zoom | Shift + Right Mouse Drag |

### Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| `1` | Front view |
| `2` | Left view |
| `3` | Top view |
| `4` | Right view |
| `5` | Isometric/Perspective toggle |
| `7` | Top down view |
| `0` | Camera view |
| `F` | Frame selected |
| `Shift + F` | Frame all |
| `G` | Toggle grid |

### Advanced Navigation

```csharp
// Programmatic camera positioning
using UnityEditor.SceneView;

[MenuItem("View/Focus Center")]
static void FocusCenter()
{
    SceneView.lastActiveSceneView.Frame(
        new Bounds(Vector3.zero, Vector3.one * 10),
        false
    );
}

// Custom view preset
[MenuItem("View/Custom Angle")]
static void CustomAngle()
{
    SceneView sv = SceneView.lastActiveSceneView;
    sv.rotation = Quaternion.Euler(30, 45, 0);
    sv.Repaint();
}
```

## Essential Keyboard Shortcuts

### Scene and GameObject

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New scene |
| `Ctrl+S` | Save scene |
| `Ctrl+Shift+S` | Save scene as |
| `Ctrl+A` | Select all |
| `Delete` | Delete selected |
| `Ctrl+D` | Duplicate |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `W` | Move tool |
| `E` | Rotate tool |
| `R` | Scale tool |
| `T` | Rect transform tool |
| `Y` | Transform tool |
| `V` | Vertex snap |
| `X` | Toggle pivot/center |
| `Z` | Toggle local/world |

### Windows and Panels

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Scene window |
| `Ctrl+2` | Game window |
| `Ctrl+3` | Inspector |
| `Ctrl+4` | Hierarchy |
| `Ctrl+5` | Project window |
| `Ctrl+6` | Animation |
| `Ctrl+9` | Asset Store |
| `Ctrl+Shift+C` | Console |

### Play and Debug

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Play/Pause |
| `Ctrl+Shift+P` | Pause |
| `Ctrl+Alt+P` | Step |
| `F11` | Maximize play window |

## Transform Gizmo Tips

### Gizmo Modes

```csharp
// Programmatically control gizmo
using UnityEditor;

// Tool modes
Tools.current = Tool.Move;      // Move tool
Tools.current = Tool.Rotate;    // Rotate tool
Tools.current = Tool.Scale;     // Scale tool
Tools.current = Tool.Rect;      // Rect transform

// Space modes (local/world)
bool isLocal = Tools.pivotRotation == PivotRotation.Local;
Tools.pivotRotation = isLocal ? 
    PivotRotation.Global : 
    PivotRotation.Local;

// Pivot modes (pivot/center)
bool isPivot = Tools.pivotMode == PivotMode.Pivot;
Tools.pivotMode = isPivot ? 
    PivotMode.Center : 
    PivotMode.Pivot;
```

### Advanced Transform

- Hold `Shift` while transforming to snap to grid
- Hold `Ctrl` while rotating for fine control
- Hold `Alt` while scaling to scale from center
- Press `V` then click for vertex snapping

## Content Browser Productivity

### Search Filters

```
t:Material          // Type filter
t:Prefab            // All prefabs
l:MyLabel          // Label filter
a:MyAuthor         // Author filter
is:Prefab          // Is in prefab
ref:ObjectName     // References ObjectName
Dependencies       // Show dependencies
size>1000          // Size filter
```

### Asset Organization

```csharp
// Label assets for organization
using UnityEditor;

[MenuItem("Assets/Label/Important")]
static void LabelAssets()
{
    foreach (Object obj in Selection.objects)
    {
        var labels = AssetDatabase.GetLabels(obj);
        System.Array.Resize(ref labels, labels.Length + 1);
        labels[labels.Length - 1] = "Important";
        
        AssetDatabase.SetLabels(obj, labels);
    }
}
```

### Quick Asset Access

```csharp
// Favorite folders shortcut
[MenuItem("Assets/Add to Favorites")]
static void AddFavorite()
{
    // Right-click folder and use this
    string path = AssetDatabase.GetAssetPath(Selection.activeObject);
    // Path saved for quick access
}
```

## Useful Editor Scripts

### Quick Spawn Tool

```csharp
using UnityEditor;
using UnityEngine;

public class QuickSpawnTool
{
    [MenuItem("Tools/Spawn Cube")]
    static void SpawnCube()
    {
        GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
        cube.name = "Cube";
        Undo.RegisterCreatedObjectUndo(cube, "Spawn Cube");
    }

    [MenuItem("Tools/Spawn Sphere")]
    static void SpawnSphere()
    {
        GameObject sphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        sphere.name = "Sphere";
        Undo.RegisterCreatedObjectUndo(sphere, "Spawn Sphere");
    }
}
```

### Batch Rename Tool

```csharp
using UnityEditor;
using UnityEngine;

public class BatchRenameTool
{
    [MenuItem("Tools/Batch Rename")]
    static void BatchRename()
    {
        foreach (GameObject obj in Selection.gameObjects)
        {
            string newName = obj.name.Replace("Old", "New");
            Undo.RecordObject(obj, "Rename");
            obj.name = newName;
        }
    }
}
```

### Scene Organizer

```csharp
using UnityEditor;
using UnityEngine;

public class SceneOrganizer
{
    [MenuItem("Tools/Organize Scene")]
    static void OrganizeScene()
    {
        // Group objects by type
        var rootObjects = FindObjectsByType<Transform>(
            FindObjectsSortMode.None
        ).Where(t => t.parent == null).GroupBy(t => t.GetComponent<Renderer>() != null);

        foreach (var group in rootObjects)
        {
            GameObject folderGO = new GameObject(group.Key ? "Renderers" : "Others");
            Undo.RegisterCreatedObjectUndo(folderGO, "Organize");

            foreach (Transform t in group)
            {
                Undo.SetTransformParent(t, folderGO.transform, "Reparent");
            }
        }
    }
}
```

### Material Finder

```csharp
using UnityEditor;
using UnityEngine;

public class MaterialFinder
{
    [MenuItem("Tools/Find Materials Used")]
    static void FindMaterials()
    {
        var renderers = FindObjectsByType<Renderer>(FindObjectsSortMode.None);
        var materialSet = new HashSet<Material>();

        foreach (var renderer in renderers)
        {
            foreach (var material in renderer.sharedMaterials)
            {
                if (material != null)
                {
                    materialSet.Add(material);
                }
            }
        }

        Debug.Log($"Found {materialSet.Count} unique materials");
        foreach (var mat in materialSet)
        {
            Debug.Log($"  - {mat.name}", mat);
        }
    }
}
```

## Debugging Tricks

### Console Filtering

- Click icon dropdown to filter by type
- Use search box for message filtering
- Right-click message for more info
- Stack trace provides exact code location

### Debug Visualization

```csharp
using UnityEngine;

public class DebugVisualization
{
    void Update()
    {
        // Draw raycast
        Vector3 origin = transform.position;
        Vector3 direction = transform.forward;
        Debug.DrawRay(origin, direction * 10, Color.red);

        // Draw line
        Debug.DrawLine(Vector3.zero, Vector3.one * 5, Color.green);

        // Draw box
        Debug.DrawLine(Vector3.zero, Vector3.one);
        Debug.DrawLine(Vector3.zero, new Vector3(1, 0, 0));
        Debug.DrawLine(Vector3.zero, new Vector3(0, 1, 0));
        Debug.DrawLine(Vector3.zero, new Vector3(0, 0, 1));
    }

    void OnDrawGizmos()
    {
        // Persistent debug visualization
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(transform.position, 1f);

        Gizmos.color = Color.green;
        Gizmos.DrawLine(transform.position, transform.position + transform.forward * 5);
    }
}
```

### Conditional Compilation

```csharp
using UnityEngine;

public class ConditionalDebug
{
    [SerializeField] private bool showDebug = true;

    void Update()
    {
        #if UNITY_EDITOR
        if (showDebug)
        {
            Debug.Log("This only appears in editor");
        }
        #endif

        #if DEBUG
        Assert.IsNotNull(someObject);
        #endif

        // Development only
        #if DEVELOPMENT_BUILD || UNITY_EDITOR
        if (Input.GetKeyDown(KeyCode.F1))
        {
            ShowDebugInfo();
        }
        #endif
    }

    void ShowDebugInfo()
    {
        Debug.Log($"Time: {Time.time}");
        Debug.Log($"Frame: {Time.frameCount}");
    }
}
```

## Custom Editor Windows

### Simple Data Inspector

```csharp
using UnityEditor;
using UnityEngine;

public class DataInspectorWindow : EditorWindow
{
    private Vector2 scrollPos;
    private GameObject selectedObject;

    [MenuItem("Window/Data Inspector")]
    public static void ShowWindow()
    {
        GetWindow<DataInspectorWindow>("Data Inspector");
    }

    void OnGUI()
    {
        selectedObject = EditorGUILayout.ObjectField(
            "Target Object",
            selectedObject,
            typeof(GameObject),
            true
        ) as GameObject;

        if (selectedObject == null) return;

        scrollPos = GUILayout.BeginScrollView(scrollPos);

        // Display all components
        foreach (Component comp in selectedObject.GetComponents<Component>())
        {
            EditorGUILayout.LabelField(comp.GetType().Name, EditorStyles.boldLabel);
            
            var serialized = new SerializedObject(comp);
            SerializedProperty prop = serialized.GetIterator();

            while (prop.NextVisible(true))
            {
                EditorGUILayout.PropertyField(prop);
            }
        }

        GUILayout.EndScrollView();
    }
}
```

### Scene Setup Helper

```csharp
using UnityEditor;
using UnityEngine;

public class SceneSetupWindow : EditorWindow
{
    [MenuItem("Window/Scene Setup")]
    public static void ShowWindow()
    {
        GetWindow<SceneSetupWindow>("Scene Setup");
    }

    void OnGUI()
    {
        GUILayout.Label("Quick Scene Setup", EditorStyles.boldLabel);

        if (GUILayout.Button("Create Main Camera", GUILayout.Height(30)))
        {
            CreateMainCamera();
        }

        if (GUILayout.Button("Create Directional Light", GUILayout.Height(30)))
        {
            CreateDirectionalLight();
        }

        if (GUILayout.Button("Create Ground Plane", GUILayout.Height(30)))
        {
            CreateGroundPlane();
        }
    }

    static void CreateMainCamera()
    {
        GameObject camGO = new GameObject("Main Camera");
        var camera = camGO.AddComponent<Camera>();
        camGO.AddComponent<AudioListener>();
        camGO.tag = "MainCamera";
    }

    static void CreateDirectionalLight()
    {
        GameObject lightGO = new GameObject("Directional Light");
        var light = lightGO.AddComponent<Light>();
        light.type = LightType.Directional;
        lightGO.transform.eulerAngles = new Vector3(50, -30, 0);
    }

    static void CreateGroundPlane()
    {
        GameObject planeGO = GameObject.CreatePrimitive(PrimitiveType.Plane);
        planeGO.name = "Ground";
        planeGO.transform.scale = new Vector3(10, 1, 10);
    }
}
```

## Performance Tips

### Faster Iteration

- Use `Play Mode` with `Domain Reload` disabled for faster play-testing
- Use `Editor Links` to quickly jump between code and scene
- Enable `Auto Save` in preferences
- Use hot reload to avoid full reimports

### Code Compilation

```csharp
// Use [ExecuteAlways] for real-time preview
[ExecuteAlways]
public class RealTimePreview : MonoBehaviour
{
    void Update()
    {
        // This runs in edit mode too
        transform.Rotate(Vector3.up, 10 * Time.deltaTime);
    }
}

// Use [MenuItem] for quick testing
[MenuItem("Debug/Test Function")]
static void TestFunction()
{
    Debug.Log("Quick test");
}
```

## Hidden Features

### Instant Search

- Press `Ctrl + K` for instant search across assets
- Search for scenes, prefabs, scripts quickly
- Navigate to any asset in one keystroke

### Nested Prefabs

- Drag prefab into another prefab to create nesting
- Double-click to edit nested prefab in context
- Overrides automatically propagate

### Preview Window

- Select asset and hover over to preview
- Works for models, textures, audio, scenes
- Right-click for additional options

### Multi-Object Editing

- Select multiple objects in Hierarchy
- Edit multiple at once in Inspector
- Batch operations on selection

## Workflow Optimization

### Code Snippets

```csharp
// Quick MonoBehaviour template
public class Template : MonoBehaviour
{
    void Awake() { }
    void Start() { }
    void Update() { }
    void OnDestroy() { }
}

// Quick coroutine template
IEnumerator MyCoroutine()
{
    yield return new WaitForSeconds(1f);
    yield return WaitUntil(() => someCondition);
}

// Quick property template
[SerializeField] private int _value;
public int Value => _value;
```

### Common Editor Shortcuts Quick Reference

- `Ctrl+Alt+Q` - Quick search
- `Middle Mouse Drag` - Pan scene
- `Shift + Right Mouse Drag` - Perspective zoom
- `Shift + V` - Vertex snap
- `Ctrl + D` - Duplicate
- `Alt + Click` - Expand all children in hierarchy

## Conclusion

Mastering the Unity Editor dramatically speeds up development. Focus on keyboard shortcuts and navigation first, then gradually adopt custom tools for your specific workflow. Regular profiling and debugging practices prevent problems before they become major issues.
