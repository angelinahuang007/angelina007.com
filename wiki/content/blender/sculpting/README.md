---
title: Blender Sculpting and Retopology
category: blender
order: 4
tags: [blender, sculpting, multires, dyntopo, baking]
description: Comprehensive guide to Blender's sculpting tools, multires and dynamic topology workflows, masking and face sets, texture baking, and comparison with ZBrush approaches.
related: [blender/modeling-workflow, graphics-fundamentals/mesh-operations, graphics-fundamentals/texture-mapping]
---

# Blender Sculpting and Retopology

Sculpting in Blender provides a paradigm for form creation fundamentally different from discrete modeling operations. Rather than explicitly manipulating vertices and edges, sculpting enables intuitive brush-based form building mimicking traditional clay sculpting. Combined with retopology workflows, sculpting generates both organic forms and clean topology suitable for animation and game engines.

## Sculpt Mode Fundamentals

### Entering Sculpt Mode

Sculpt mode (accessible via mode selector or `Tab` then selecting Sculpt) transforms the interface:
- Viewport shows brush cursor and brush strength indicator
- Tool shelf displays brush options
- Geometry updates in real-time during brushwork

### Brush System Overview

Blender's sculpt brushes operate through several core parameters:

**Brush Strength**: Force magnitude (0-1). Higher strength = more aggressive deformation per stroke.
**Brush Size**: Radius of effect. `F` key adjusts size interactively.
**Falloff**: How the brush strength varies from center to edge. Linear falloff creates hard edges; smooth falloff creates gradual deformation.
**Autosmooth**: Automatically smooths geometry after deformation (mitigates faceted appearance).

### Essential Sculpt Brushes

**Draw**: The fundamental brush. Pushes geometry outward along surface normals. Directional variant (`Draw Sharp`) creates harder transitions.

**Draw Clay Strips**: Creates clay-like buildup, useful for adding volume without surface irregularity. Excellent for constructing organic form blocking.

**Grab**: Moves surface geometry wholesale (unlike draw, which sculpts). Enables large-scale form repositioning. Essential for adjusting overall proportions.

**Smooth**: Blurs geometry, averaging neighboring vertices. Heavy smoothing creates flowing, connected forms. Use liberally to prevent the faceted sculpting artifacts.

**Crease**: Creates sharp edges within soft forms (wrinkles, muscle definition, geometric features). High-frequency detail with hard transitions.

**Trim**: Boolean-like cutting (requires multires). Carves shapes out of geometry—useful for ear channels, eye sockets, mouth cavities.

**Flatten**: Flattens a brush-sized region to a plane (useful for creating flat panels, teeth, eyelids).

**Pinch**: Pulls geometry inward toward the brush center (sharp wrinkles, ridge formation).

**Brush Strengths and Combinations**:
- **Large brush (100px), low strength (0.3), high autosmooth**: Overall form sculpting
- **Medium brush (30px), medium strength (0.5), low autosmooth**: Detail addition
- **Small brush (10px), high strength (0.8), creasing**: Fine surface detail

## Multires Workflow: Structured Sculpting

Multires (Multiresolution) modifier enables hierarchical sculpting at increasing detail levels. This approach structures the workflow into defined stages: base form, secondary form, tertiary details.

### Multires Fundamentals

**Levels**:
- **Level 0**: Base topology (very sparse, maybe 100-500 vertices)
- **Level 1**: Subdivided with sculpted blocking (1000-5000 vertices)
- **Level 2**: Secondary details (5000-20000 vertices)
- **Level 3**: Fine surface details (20000-100000 vertices)

Each level contains both geometry and sculpting information; subdividing adds vertices but preserves previous sculpting.

### Multires Workflow Process

**Setup**:
1. Create base mesh (rough approximation of final form)
2. Apply Multires modifier (adds 1 level of subdivision)
3. Adjust display level (how many levels shown in viewport)
4. Sculpt level = edit level

**Sculpting Progression**:
1. Work at level 1 (large form, overall shape)
2. Step up to level 2 (secondary forms, muscles, features)
3. Step up to level 3+ (fine details, pores, wrinkles)

**Advantages**:
- Structured progression (large → small details)
- Low-poly export possible (bake to level 1 for game engine)
- Efficient memory usage (sculpt at resolution-appropriate level)
- Non-destructive (adjust any level; changes propagate)

### Baking and Applying Multires

**Bake Multires**: Converts subdivision + sculpting into real geometry. Result is a single unified mesh at that subdivision level.

Process:
1. Multires → Bake
2. Choose target level (1 for low-poly, 4+ for high-poly)
3. Results in new object (baked mesh)

**Use Cases**:
- Export low-poly (level 1-2) for game engine, baked at target vertex count
- Preserve original for adjustment while having usable export
- Render high-poly directly without modifier stack

## Dynamic Topology (Dyntopo)

Dyntopo automatically adds/removes vertices as you sculpt, maintaining reasonable topology density without manual subdivision management.

### Dyntopo Operation

**Dynamic Topology Toggle**: Sculpt toolbar or `Ctrl+D`

When enabled:
- Brush strokes add vertices at detail-appropriate density
- Unused vertices are removed automatically
- No explicit level management

### Dyntopo Characteristics

**Advantages**:
- No pre-planning of subdivision levels
- Intuitive—sculpt freely without topology concerns
- Fast feedback (auto-density adjustment)
- Ideal for exploratory concept sculpting

**Disadvantages**:
- Unpredictable topology (unsuitable for animation/rigging)
- Difficult to retopologize from (non-uniform vertex distribution)
- No level control (can't easily simplify)
- Memory grows with sculpting (harder to manage large models)

### Dyntopo vs. Multires

| Aspect | Dyntopo | Multires |
|--------|---------|----------|
| Topology | Automatic, unpredictable | Structured, predictable |
| Levels | Single continuous | Discrete levels |
| Retopo-friendly | Poor | Excellent (exportable levels) |
| Animation-suitable | No | Yes (low levels) |
| Exploration | Fast | Requires planning |
| Performance | Good until very dense | Scalable per level |

**Hybrid Workflow**: Dyntopo for concepting; Multires for production (retopology, animation).

## Masking and Face Sets: Selective Sculpting

### Masking

Masks prevent sculpting in masked regions. Paint masks (`Shift+F`) to isolate areas:

1. Hold `Shift`, use brush to paint mask
2. Masked areas become protected (gray, transparent)
3. Any sculpt brush respects the mask

**Use Cases**:
- Sculpt face while protecting ears (mask ears)
- Detail one side without disturbing the other (mask one half)
- Protect specific details while refining surroundings

**Mask Editing**:
- `Alt+A`: Invert mask (unmasked → masked, vice versa)
- `Alt+B`: Clear mask
- Mask threshold: Partially masked areas based on value

### Face Sets

Face Sets are colored regions defining sculpt boundaries. Unlike masks, face sets are permanent and define distinct geometric regions.

**Creating Face Sets**:
- `W` opens Face Set menu
- **Draw Face Set**: Paint region, creates new face set
- **Select Face Set**: Select all faces in a set
- **Grow/Shrink Face Set**: Expand or contract set boundary

**Applications**:
- Ear sculpting (separate face set for each ear)
- Character parts (body, arms, legs each as separate set)
- Detail isolation (sculpt facial features while keeping head face set)

**Masking from Face Sets**:
Right-click face set → **Mask Outside** (masks all faces except selected set)

## Texture Baking: From High-Poly to Low-Poly

Baking transfers high-poly surface detail to texture maps, enabling low-poly game-ready geometry without geometry density penalties.

### Bake Types

**Normal Map Baking**:
- Source: High-poly geometry detail
- Target: Normal texture map
- Result: Low-poly with detailed normal map appears highly detailed

Process:
1. Create high-poly (sculpted at levels 3-4)
2. Create low-poly (same base, baked at level 1)
3. Blender setup:
   - High-poly object (hidden from render in layers)
   - Low-poly object (in render layers)
   - Low-poly has material with Normal Map node
4. Bake → Normal Map (cycles engine)
5. Normal map bakes to texture file

**Displacement Map Baking**:
- Source: High-poly height variation
- Target: Grayscale displacement texture
- Use: Displaces low-poly with displacement modifier or material displacement

**Ambient Occlusion Baking**:
- Source: High-poly crevices and contact areas
- Target: Grayscale AO map (white=exposed, black=occluded)
- Use: Darken crevices in material without additional lighting

**Combined Baking**:
Bake all maps simultaneously:
1. Set up low-poly with multiple texture outputs
2. Create image textures for normal, roughness, AO, metallic
3. Bake → Bake All Maps

Result: Complete texture set from sculpted geometry.

### Baking Best Practices

**Cage Mesh**: Define an offset mesh preventing self-intersection during baking. Without a cage, small geometry undercuts cause bake artifacts.

**Bake Margin**: Padding around texture islands preventing edge artifacts (set to 16-32 pixels).

**Ray Distance**: Maximum distance to search for high-poly geometry. Increase if details are far from surface (deeply sculpted features).

**Offset**: Push cage away from surface (prevents surface self-intersection).

## Comparison with ZBrush

Blender's sculpting differs from ZBrush in philosophy and capabilities:

| Aspect | Blender | ZBrush |
|--------|---------|--------|
| Paradigm | Integrated 3D suite | Specialized sculpting |
| Brush Strength | Local deformation | Global deformation (often) |
| Topology Approach | Multires or Dyntopo | PolyGroups + decimation |
| Workflow | Sculpt within modeling | Export/import for topology |
| Integration | Seamless (rigging, materials, rendering) | Requires pipeline plugins |
| Learning Curve | Moderate | Steep (ZBrush conventions) |
| Market Position | Free, open-source | Professional ($995) |

**ZBrush Comparison Details**:

ZBrush's subdivision surface approach differs:
- **PolyGroups**: Manual region definition (Blender's Face Sets equivalent)
- **DynaMesh**: ZBrush's dyntopo (voxel-based, different topology result)
- **Decimation Master**: Reduces geometry (Blender's baking alternative)
- **Polypaint**: Vertex color painting (Blender uses UV textures)

**Common Workflow**:
- ZBrush: Sculpt at ultra-high density (millions of polygons)
- Decimate to 100k polygons
- Export decimated high-poly
- Retopologize in separate tool (Maya, 3DS Max, Topogun, Blender)

**Blender Advantage**: Retopology in the same application eliminates export/import friction.

## Retopology: Creating Animation-Friendly Topology

Retopology creates clean, animation-suitable topology (quads, predictable flow) over high-poly sculpted geometry.

### Manual Retopology Workflow

**Setup**:
1. Hide high-poly geometry (or reduce opacity)
2. Create new mesh object
3. Enable Snap to Faces (Snap element = Face)
4. Optionally: Enable Face Snapping with Project option (snaps to surface)

**Retopology Process**:
1. Select low-poly base mesh vertices
2. Use Extrude + immediate snap to surface
3. Manually trace desired topology
4. Focus on:
   - Quads only (for proper deformation)
   - Edge loops perpendicular to deformation axes
   - Circular flows around joints
   - Sparse topology in flat regions

**Topology Priorities by Region**:

- **Face**: Edge loops from mouth corners, eye sockets, nose edges; circular flow defines facial structure
- **Spine**: Vertical edge loops along spine centerline; perpendicular loops at joints
- **Limbs**: Perpendicular loops at knees, elbows; circular flow around limbs
- **Hands**: Individual bones require edge loops between knuckles

**Timeline**: Character retopology takes 2-6 hours depending on detail and familiarity.

### Semi-Automatic Retopology Tools

**Quadriflow**: Built-in retopology tool generating automatic quads from high-poly.

Process:
1. Select high-poly
2. Mesh → Quadriflow
3. Set target face count (determines density)
4. Generate

Result: Automatic all-quad topology, often requiring manual cleanup but eliminating manual tracing.

Limitations:
- May produce poor topology for animation (not optimized for deformation)
- Requires refinement (manual retopo is often superior for characters)
- Better for hard-surface retopology than organic

### Polymodel: Alternative Retopology

Polymodel addon provides topological shape optimization:
1. Select high-poly
2. Create target low-poly cage mesh
3. Polymodel deforms cage to match surface
4. Exports retopologized result

Useful when manual retopo topology is defined but geometry placement needs refinement.

## Advanced Sculpting Techniques

### Symmetrical Sculpting

Enable symmetry to sculpt both sides simultaneously:

**Symmetry Toggle**: `X` (or sculpt toolbar)

Axis options:
- **X-Axis**: Mirror across center (bilateral symmetry)
- **Y-Axis**: Mirror top/bottom
- **Z-Axis**: Mirror front/back

Sculpting one side automatically sculpts the mirrored side, maintaining character symmetry.

### Voxel Remeshing

Voxel remesh converts existing geometry to a voxel grid, enabling:
- Topology cleanup
- Merging of separate objects
- Smoothing without normal map loss

Voxel Remesher (addon or built-in) processes geometry:
1. Select mesh
2. Voxel Remesh (set voxel size)
3. Result: Clean, voxel-based topology

### Multi-Object Sculpting

Sculpt across multiple selected objects simultaneously:
1. Select primary object
2. `Shift+Click` additional objects
3. Sculpt affects all selected objects

Useful for sculpting complete characters across separate body parts.

## Performance Optimization

### Viewport Performance During Sculpting

- **Reduce Subdivision Levels**: Sculpt at lower multires levels during blockout
- **Viewport Shading**: Switch to Solid shading (faster than Material Preview)
- **Disable Modifiers**: Hide non-essential modifiers during sculpting
- **Optimize Brush Size**: Large brushes are faster than small detailed brushes

### Large Model Sculpting

- **Separate Objects**: Sculpt body parts as separate objects; join when complete
- **Progressive Remeshing**: Periodically remesh to optimize density
- **Mask Unused Regions**: Mask areas not being sculpted; reduces calculation load

## Conclusion

Sculpting in Blender provides an intuitive, integrated approach to organic form creation. Multires enables structured progression from blocking to detailing; Dyntopo offers exploratory freedom. Retopology transforms sculpted forms into animation-ready topology. When combined with texture baking, the workflow enables high-fidelity assets optimized for game engines and rendering. Whether approaching Blender from a ZBrush background or discovering sculpting for the first time, Blender's sculpting system provides professional-grade tools within a comprehensive 3D suite.
