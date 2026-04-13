---
title: Photography Lens Optics and Image Formation
category: photography
order: 2
tags: [photography, lens, optics, depth-of-field, bokeh, aberration]
description: Physical principles of lens design including focal length, depth of field, bokeh characteristics, aberrations, and how optical properties map to 3D camera models in rendering.
related: [photography/exposure-fundamentals, graphics-fundamentals/ray-tracing-fundamentals, photography/virtual-cinematography]
---

# Photography Lens Optics and Image Formation

Photography lenses are refined optical systems translating three-dimensional scenes into two-dimensional images. Understanding the physics of lens optics illuminates both photographic technique and virtual camera implementation in 3D graphics.

## Lens Physics: Focal Length and Image Formation

### How Lenses Focus Light

A lens is a curved optical element refracting (bending) light rays toward a common point—the focal point. The distance from lens to focal point is the focal length, measured in millimeters (35mm, 50mm, 85mm, 200mm, etc.).

**Ray Tracing Through a Lens**:
1. Light rays enter the lens from subject
2. Lens curves bend rays inward (converging)
3. Rays meet at focal point (focal plane)
4. Sensor/film at focal plane captures focused image

**Thin Lens Equation**: 1/f = 1/u + 1/v
- f = focal length
- u = object distance (subject to lens)
- v = image distance (lens to focal plane/sensor)

The lens automatically focuses rays for objects at specific distances. Objects at other distances form blurred images (out of focus).

### Focal Length and Angle of View

Focal length determines the angle of view—how wide or narrow the lens "sees":

**Angle of View Calculation**:
Angle = 2 × arctan(sensor width / 2 × focal length)

**Practical Focal Lengths and Angles**:
- **14mm**: 114° (ultra-wide, immersive, exaggerates depth)
- **24mm**: 74° (wide angle, landscape, environmental)
- **35mm**: 54° (moderate wide, documentary, near-human perspective)
- **50mm**: 47° (standard, closest to human eye, portrait-landscape balance)
- **85mm**: 29° (portrait, flattering compression)
- **135mm**: 18° (telephoto, strong compression, distant subjects)
- **200mm**: 12° (extreme telephoto, extreme compression, wildlife)

**Wide Angle Characteristics**:
- Expansive field of view
- Exaggerated depth (near objects large, distant objects small)
- Straight lines curve at image periphery (barrel distortion)
- Extensive depth of field (more area in focus)

**Telephoto Characteristics**:
- Narrow field of view
- Compressed depth (near and far objects similar size)
- Shallow depth of field (narrow in-focus zone)
- Flat, layered appearance (compression effect)

## Depth of Field: The In-Focus Region

Depth of field (DOF) is the zone of acceptable focus—the range from nearest sharp point to farthest sharp point. Objects within DOF appear acceptably sharp; objects outside DOF appear blurred (out of focus).

### Circle of Confusion

Depth of field depends on the circle of confusion—the size of a point of light rendered as a circle when out of focus. The lens renders points as circles (not infinitesimal points) when focused elsewhere.

**Circle of Confusion Threshold**: Typically 0.03mm for full-frame (viewing distance standard print sizes). Smaller sensors use proportionally smaller thresholds.

When a point's circle of confusion is smaller than this threshold, it appears acceptably sharp. Beyond the threshold, circles enlarge visibly, appearing blurred.

### Depth of Field Formula

DOF = 2 * (u² * c * f) / (f² - c * (u - f)²)

- u = object distance (subject to lens)
- c = circle of confusion
- f = focal length

Simplified relationships:
- **Wider aperture (smaller f-number)**: Shallower DOF (less depth)
- **Longer focal length**: Shallower DOF (narrower focus zone)
- **Closer focus distance**: Shallower DOF (more focus falloff)
- **Narrower aperture (larger f-number)**: Deeper DOF (more area sharp)
- **Shorter focal length**: Deeper DOF (wider focus zone)
- **Farther focus distance**: Deeper DOF (less falloff, extends to infinity)

### Practical DOF Application

**Portrait DOF** (100mm at f/2.8, subject 2 meters away):
- DOF ~8cm (narrow focus zone)
- Foreground and background completely blur
- Sharp focus isolates subject from surroundings

**Landscape DOF** (24mm at f/11, focus at 5 meters):
- DOF ~3 meters (extensive sharpness)
- Foreground and background sharp
- Hyperfocal distance (infinity focus achieved at f/11)

**Hyperfocal Distance**: The distance where, if focus is set to this point, DOF extends to infinity. For a 24mm lens at f/11, hyperfocal distance is ~2.4 meters—focus there, and everything from ~1.2m to infinity appears sharp.

## Bokeh: Out-of-Focus Quality

Bokeh (Japanese: blur quality) describes the visual character of out-of-focus areas. While aperture controls DOF extent, aperture shape controls bokeh appearance.

### Bokeh Characteristics

**Bokeh Disc Shape**:
- **Rounded (circular) aperture**: Circular bokeh discs (aesthetically pleasing, smooth)
- **Polygonal aperture** (cheap lenses): Polygonal bokeh discs (harsh, unrefined appearance)
- More aperture blades → rounder bokeh (8+ blades approx circular)

**Bokeh Smoothness**:
- Well-corrected lenses: Smooth, neutral bokeh
- Uncorrected lenses: Onion ring patterns (concentric circles within bokeh discs)

**Bokeh Size**:
Bokeh enlargement depends on lens design—longer focal lengths and wider apertures produce larger, more prominent bokeh.

### Bokeh Rendering in 3D

Virtual cameras in rendering engines approximate bokeh via:
- **Aperture Shape**: Polygonal masks simulating blade count (8-sided, 12-sided)
- **Bokeh Layers**: Multiple depth layers producing overlapping discs
- **Post-Processing**: Depth-of-field shaders simulating blur without perfect optical accuracy

## Optical Aberrations

Real lenses introduce optical aberrations—deviations from perfect imaging. Understanding aberrations guides lens selection and quality assessment.

### Chromatic Aberration

Color wavelengths refract at slightly different angles through glass, causing color fringes at high-contrast edges.

**Longitudinal Chromatic Aberration**: Red, green, blue focus at slightly different distances (focus for green, red/blue slightly out of focus).

**Lateral Chromatic Aberration**: Color channels shift sideways, visible as color fringes on edges (red right, blue left).

**In-Lens Correction**: Most modern lenses include corrective lens elements minimizing chromatic aberration. High-quality lenses show minimal aberration.

**Post-Processing Correction**: RAW processors enable chromatic aberration removal via channel shift compensation.

### Spherical Aberration

Spherical aberration occurs when rays entering the lens at different heights focus at different points—rays at the edge focus differently than rays at the center.

**Visual Effect**: Soft, non-contrasty images; reduced sharpness at maximum aperture. Closing aperture (increasing f-number) reduces spherical aberration by blocking edge rays.

**High-Quality Lenses**: Aspherical lens elements (non-spherical curved surfaces) correct spherical aberration, enabling sharp f/1.4-f/2.8 performance.

### Distortion

Distortion warps straight lines into curves due to uneven magnification across the image field.

**Barrel Distortion** (wide angles):
- Center magnified less than edges
- Straight lines bow outward
- Characteristic of wide-angle lenses (14-24mm)

**Pincushion Distortion** (telephoto):
- Center magnified more than edges
- Straight lines curve inward
- Characteristic of telephoto lenses (200mm+)

**In-Camera and Post-Processing Correction**: Modern cameras apply lens distortion correction (profile-based, specific to each lens model). Distortion profiles enabled in RAW processors apply inverse correction, straightening lines.

### Vignetting

Vignetting darkens image corners due to light falloff from lens geometry. The lens barrel physically blocks light approaching from extreme angles.

**Mechanical Vignetting**: Unavoidable for wide-angle lenses; corner falloff proportional to aperture width.

**Natural Reduction**: Stopping down (increasing f-number) reduces vignetting by minimizing extreme angles.

**Post-Processing Correction**: Lens profiles in RAW processors brighten vignetting, though extreme correction introduces noise in corners.

### Coma

Coma (off-axis aberration) causes point lights off-axis to blur into comet shapes. Visible in night sky photography when stars blur into trailing shapes away from center.

**Cause**: Asymmetric aberration for off-axis light rays.

**Quality Indicator**: Professional fast lenses (f/1.4, f/2.8) are coma-corrected; cheaper lenses show visible coma.

## Lens Design and Construction

### Lens Groups

Complex lenses comprise multiple glass elements arranged in groups, each serving specific correction purposes:

**Telephoto Lens (200mm, f/2.8)**:
- 18+ elements in 13+ groups
- Front focusing group (moves for autofocus)
- Floating element group (maintains focus at all distances)
- Rear elements (final correction, ensure light reaches sensor)

**Prime vs. Zoom**:
- **Prime**: Fixed focal length, fewer elements, generally superior optics, lighter, faster aperture (f/1.4, f/2)
- **Zoom**: Variable focal length, more elements, compromised optics, heavier, slower aperture (f/2.8-f/4)

### Autofocus and Image Stabilization

**Autofocus Mechanism**: Motor-driven focusing elements adjust position rapidly, detecting focus by contrast analysis (phase-detect) or laser/ultrasonic rangefinding.

**Image Stabilization**: Floating element moves responsively to camera motion, counteracting hand-shake. Enables slower shutter speeds (2-4 stops slower) without blur from movement.

## 3D Camera Models and Optical Simulation

Photography's optical principles directly inform 3D camera implementation in rendering engines:

### Virtual Focal Length

3D cameras use focal length (in mm) matching photography conventions:
- 35mm in 3D = 35mm photography lens angle of view
- Sensor size (sensor gate) determines angle calculation
- Standard virtual sensor = full-frame (36x24mm)

### Virtual Aperture and Depth of Field

3D engines enable aperture simulation:
- **F-Number**: Direct mapping (f/2.8 in 3D = f/2.8 photography)
- **Focus Distance**: Virtual focus plane enables DOF simulation
- **Bokeh Rendering**: Post-process DOF shader simulates aperture blur

**Realistic DOF Simulation**:
Cycles rendering engine (Blender) implements true physical DOF:
1. Define aperture f-number and focus distance
2. Renderer calculates DOF using photographic equations
3. Out-of-focus areas render with depth-dependent blur

Result: Photorealistic depth of field matching camera photography.

### Virtual Lens Distortion

3D camera distortion correction/application:
- **Barrel/Pincushion**: Polynomial distortion coefficients warp image space
- **Vignetting**: Falloff gradient darkens corners
- **Chromatic Aberration**: Channel shift simulation (rarely used in 3D due to complexity)

### Matching 3D to Real Photography

Virtual cinematography often requires matching 3D camera properties to real lenses:

**Focal Length Matching**:
- Measure real camera focal length, sensor size
- Set 3D camera focal length identically
- Result: Identical angle of view

**DOF Matching**:
- Set 3D aperture and focus distance
- Render with identical settings
- Result: Identical depth-of-field appearance

**Distortion Matching**:
- Photograph standard grid with target camera
- Measure distortion coefficients
- Apply coefficients to 3D render
- Result: Matching visual distortion

## Lens Selection for Specific Applications

### Portrait Lenses

**Optimal Focal Length**: 85mm-200mm (compression effect flatters faces)

**Aperture**: f/1.4-f/4 (shallow DOF isolates subject)

**Why**: Compression effect (narrow DOF, distant background) is flattering for faces. Wide angles distort facial features (nose appears large, ears pushed back).

### Landscape Lenses

**Optimal Focal Length**: 14mm-35mm (expansive field of view)

**Aperture**: f/8-f/22 (deep DOF)

**Why**: Wide angles capture expansive vistas; deep DOF ensures foreground and background sharpness.

### Telephoto/Wildlife Lenses

**Optimal Focal Length**: 200mm-500mm+ (distant subjects)

**Aperture**: f/4-f/6.3 (shallow DOF isolates subject from habitat)

**Why**: Extreme magnification enables distant subject capture; compression effect simplifies background.

## Conclusion

Photographic lenses are refined optical systems whose physical properties—focal length, aperture, aberrations—directly determine image characteristics. Understanding these principles enables informed camera and lens selection, guides creative photographic decisions, and informs virtual camera implementation in 3D rendering. Whether in photography or virtual cinematography, the fundamental relationships between focal length, depth of field, and optical quality remain constant, providing a framework for photorealistic image creation across physical and virtual mediums.
