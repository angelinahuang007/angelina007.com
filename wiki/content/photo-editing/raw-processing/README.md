---
title: RAW Processing and Demosaicing
category: photo-editing
tags: [RAW, demosaicing, noise-reduction, sharpening, bit-depth]
description: Technical deep-dive into RAW file structure, Bayer pattern demosaicing algorithms, noise reduction, sharpening, and RAW converter comparison.
related: [photography/exposure-fundamentals, photo-editing/lightroom-workflow, photography/color-theory-photography]
order: 4
---

# RAW Processing and Demosaicing

Understanding RAW files requires grasping the hardware and mathematics underlying digital photography. A RAW file isn't an image—it's a record of photon counts at each pixel location, requiring conversion into perceptible color and tone.

## RAW File Architecture

Digital camera sensors capture light information as voltages. These voltages are amplified (ISO), quantized to digital values (bit-depth), and stored with metadata describing how they were captured.

### Sensor Architecture: Bayer Pattern

Modern color cameras use a single-layer sensor with filter array overlaying each photosite. The Bayer pattern (most common) arranges color filters in 2x2 repeating pattern:

```
R  G  R  G  R  G
G  B  G  B  G  B
R  G  R  G  R  G
G  B  G  B  G  B
```

Critically: each pixel captures only one color. A 36-megapixel sensor records:
- 9 million red values
- 18 million green values (double quantity due to human eye's green sensitivity)
- 9 million blue values

Information is incomplete at every pixel location—demosaicing reconstructs full RGB data.

### Bit Depth and Dynamic Range

Bit-depth determines how many discrete luminance levels a sensor captures:

**12-bit cameras (Canon, Nikon, Sony):**
- 2^12 = 4,096 possible values per channel
- Allows distinguishing 4,096 brightness levels from black to white
- Ceiling on dynamic range: ~12 stops (each stop = 2x luminance, 1 bit)

**14-bit cameras (high-end DSLRs, mirrorless):**
- 2^14 = 16,384 possible values
- ~13.5 stops dynamic range

**16-bit output (post-demosaicing):**
- Converted from camera's native bit-depth during demosaicing
- Provides interpolation precision, not additional sensor capability

Practical implication: a 14-bit RAW file captures ~13 stops of data. Post-exposure (highlight recovery in shadows) restores detail only within this original capture range. No processing recovers detail beyond sensor's original capture.

### File Formats and Standardization

**DNG (Digital Negative):**
- Adobe's open-source RAW format
- Designed for long-term archival (embedded metadata prevents future obsolescence)
- Slightly larger than native formats but universally compatible
- Increasingly adopted by professional workflows

**Native formats:**
- Canon: .CR3, .CR2 (proprietary)
- Nikon: .NEF (proprietary)
- Sony: .ARW (proprietary)
- Fujifilm: .RAF (proprietary)
- Panasonic/Olympus: .RW2 (proprietary)

Native formats store manufacturer-specific metadata (white balance calibration, lens corrections) but risk obsolescence. Converting to DNG during import future-proofs archives.

## Demosaicing: From Single-Pixel Colors to Full RGB

Demosaicing reconstructs full RGB from the Bayer pattern's incomplete color information. Algorithm choice dramatically affects image sharpness and color fidelity.

### Demosaicing Algorithms

**Bilinear interpolation (basic):**
- Average neighboring pixel values of same color
- Red pixel calculated from surrounding reds: average of 4 neighboring red pixels
- Fast computation, poor detail preservation
- Causes false color artifacts (purple/green color casts)
- Rarely used in modern converters

**Gradient-based interpolation:**
- Analyzes local gradients to inform interpolation direction
- If horizontal gradient is strong, interpolate horizontally; vertical gradient favors vertical
- Preserves edges better than bilinear
- Reduces false color artifacts
- Standard in mid-tier converters

**Directional interpolation (edge-adaptive):**
- Determines dominant edge direction at each location
- Interpolates along edges, not across them
- Preserves edge definition and color accuracy
- Computational cost 2-4x higher than bilinear
- Adobe Lightroom employs sophisticated variant
- Produces noticeably sharper results with minimal false color

**Frequency-guided interpolation:**
- Separates luminance and chrominance information
- Demosaices luminance at higher frequency (preserves fine detail)
- Demosaices color at lower frequency (human eye less sensitive to fine color detail)
- Mimics human color perception
- Computationally expensive
- Used in high-end converters (Phase One, some Fujifilm models)

### Demosaicing Quality Impact

Demosaicing algorithm choice affects perceived sharpness more than many believe:

**Scenario:** Landscape with fine detail (grass texture, distant trees)

- **Poor demosaicing:** Detail appears soft, false color fringing visible on high-contrast edges, colors bleeding into adjacent regions
- **Good demosaicing:** Sharp detail, accurate color transitions, minimal artifacts
- **Excellent demosaicing:** Essentially invisible demosaicing; image appears captured at full resolution

This explains why identical RAW files processed in different converters (Lightroom vs Capture One vs Adobe Camera Raw) produce noticeably different sharpness—not from different sharpening filters, but from demosaicing precision.

## White Balance: Physics and Practice

Camera sensors are fundamentally colorblind; they record luminance without inherent color information. White balance mathematically corrects sensor response for ambient light color temperature.

### Color Temperature Fundamentals

Light color is characterized by Kelvin temperature (K):
- **Tungsten bulbs:** 2700K (warm orange)
- **Daylight:** 5500K (neutral)
- **Overcast sky:** 7000K (cool blue)
- **Open shade:** 8000-9000K (quite cool blue)

Cameras employ white balance by applying multiplier to color channels:
- Low temperature (warm light, more red): reduce red multiplier, increase blue multiplier to compensate
- High temperature (cool light, more blue): increase red multiplier, reduce blue multiplier

### White Balance Science

A camera set to Daylight (5500K) white balance assumes light is 5500K. Under tungsten (2700K) light:
- Sensor records excessive red relative to blue
- Daylight white balance reduces red and increases blue to "correct" back to 5500K equivalent
- Result: accurate white balance under tungsten

Conversely, Daylight white balance under cool overcast looks blue because the correction was wrong.

### RAW White Balance Flexibility

RAW's superpower: white balance is metadata, not baked into pixels. Changing white balance in RAW processing reapplies the correction formula without pixel data loss.

JPEG (processed in-camera) bakes white balance into pixels. Correcting miscalibrated white balance in JPEG requires color channel adjustment, causing quality loss.

### White Balance Accuracy in Practice

Professional workflow:
1. **Capture grey card:** Include neutral gray reference in first frame of scene
2. **Set custom white balance:** In RAW converter, use eyedropper on grey card to sample its RGB values
3. **Apply to session:** Apply custom white balance to entire series, correcting for consistent ambient light

Example: Studio shooting with mixed tungsten/daylight. Shoot grey card under primary light source, set custom white balance from that sample. All subsequent images in that scene inherit accurate white balance.

**Advanced:** For images with mixed light temperatures (window light + tungsten), no single white balance perfectly corrects both. In this case, set white balance to shadow light (tungsten, warmer), then selectively cool highlights to compensate.

## Noise Reduction: Spatial vs Temporal

Digital noise originates from sensor thermal activity and read-out electronics. Noise exhibits two characteristics:

**Luminance noise:** Random variation in brightness across pixels
**Chroma noise:** Random variation in color across pixels

Human eye is more sensitive to luminance noise; chroma noise is less visible and can be aggressively reduced.

### Spatial Noise Reduction

Noise reduction applied to single frame, using neighboring pixels to suppress noise:

**Luminance noise reduction (conservative approach):**
- Algorithm identifies "likely noise" (small isolated regions differing from surroundings)
- Averages noisy pixel with neighbors, reducing noise while preserving edges
- Typical settings: 30-50 points in Lightroom (file-dependent)

**Chroma noise reduction (aggressive approach):**
- Color information is redundant (human eye perceives color at lower frequency than luminance)
- Aggressively blur color information while preserving luminance
- Typical settings: 60-80 points in Lightroom (high tolerance before visible degradation)

**Trade-offs:**
- Excessive noise reduction (>70 luminance points) blurs fine detail
- Insufficient noise reduction leaves visible speckle
- ISO 6400 images require 60-70 points luminance; ISO 400 require only 15-25 points

### Temporal Noise Reduction

Averaging multiple frames of identical subject captured in rapid succession. Noise is random; averaging reduces it by sqrt(N) where N is frame count.

**Implementation:**
- Capture 3-5 identical frames (burst mode)
- Stack in post-processing (Lightroom can't do this; use Photoshop or specialized software)
- Average frames, reducing noise by ~55% (3 frames) or ~77% (5 frames)

**Applications:**
- Night sky photography (stars static, noise random, stacking improves signal-to-noise ratio)
- High-ISO studio work (capture bracketed bursts, average for cleaner result)
- Landscapes requiring maximum detail with high ISO

**Limitations:**
- Subjects must be identical (no movement, wind, camera shake)
- 3-5 frames required; more than 5 provides diminishing returns
- Post-processing workflow significantly more complex than single-frame

## Sharpening: Capture vs Output

Sharpening is fundamental RAW processing step but often misunderstood.

### Why RAW is Inherently Soft

Demosaicing is smoothing operation. Colors are interpolated; luminance edges are softened. Result: RAW files appear slightly soft compared to in-camera JPEGs (which apply in-camera sharpening).

Additionally, anti-aliasing filters in front of sensor slightly blur information to prevent aliasing artifacts. This blur is intentional—it prevents false patterns—but reduces microcontrast.

### Capture Sharpening: Correcting Lens + Demosaicing Softness

Capture sharpening restores detail lost during capture. Typically applied to all RAW files.

**Unsharp Mask (most common approach):**
```
1. Create blurred copy of image
2. Subtract blurred copy from original
3. Add back difference with controlled amount
4. Result: edges enhanced, micro-contrast increased
```

Settings vary by sensor and lens:

**For 36MP full-frame (fine sensor, resolves fine detail):**
- Amount: 0.75-1.2 (how much sharpening)
- Radius: 0.8-1.2 pixels (width of sharpening halo)
- Masking: 30-50 (limits sharpening to high-contrast edges, preventing noise sharpening)

**For 12MP APS-C sensor (coarser, less detail):**
- Amount: 1.2-1.5 (more aggressive)
- Radius: 1.2-1.5 pixels
- Masking: 50-70

Excessive sharpening creates halos (bright/dark lines along edges) visible especially in sky and large uniform areas.

### Output Sharpening: Compensating for Display Medium

After editing, final output sharpening compensates for display medium blurriness:

**Web sharpening (screen display):**
- Additional 50-100% intensity vs capture sharpening
- Larger radius (1.5-2 pixels) to restore apparent sharpness on screen
- Modern displays already sharp; light sharpening often sufficient

**Print sharpening (physical medium):**
- Heavier sharpening (150-200% intensity) to compensate for printing press dot gain and paper texture
- Radius depends on print resolution and viewing distance
- 8x10 print viewed at typical distance: 1.5-2 pixel radius
- Large prints (20x30) viewed from distance: 3-4 pixel radius

### Smart Sharpening in RAW Converters

Modern converters employ sophisticated sharpening:

**Lightroom's Detail Slider:**
- Applies edge-aware sharpening
- Amount: 50-100 standard range
- Clarity and Texture sliders fine-tune microcontrast

**Adobe Camera Raw (Photoshop):**
- Advanced Detail controls
- Masking slider prevents sharpening noise (preserves smooth areas)

**Capture One:**
- Per-frequency sharpening (fine detail vs overall sharpness controlled separately)
- Greater control but steeper learning curve

## Lens Profile Corrections

Lenses exhibit optical imperfections correctable in software.

### Optical Aberrations and Correction

**Distortion:**
- Barrel distortion: lines curve outward (especially wide-angle lenses)
- Pincushion distortion: lines curve inward (especially telephoto lenses)
- Correction: mathematically remaps pixels to straighten lines

**Vignetting:**
- Darkening toward image corners (inherent to all lenses)
- Caused by physical light path obstruction
- Correction: brightens corners back to center brightness

**Chromatic Aberration:**
- Red and blue color channels misaligned due to wavelength-dependent refraction
- Visible as red/cyan fringing on high-contrast edges
- Correction: shifts color channels relative to luminance to realign

**Lens Profiles:**
Modern converters (Lightroom, Capture One, Adobe Camera Raw) include profiles for thousands of lenses. Applying profile:

1. Camera + Lens combination identified from EXIF metadata
2. Correction model applied (distortion curve, vignetting formula, chromatic aberration shift)
3. Corrections are mathematically precise but require interpolation (pixels moved slightly during correction)

**Manual Chromatic Aberration (when profile unavailable):**
- Detail panel > Manual > Chromatic Aberration sliders
- Red/Cyan slider: corrects red-cyan fringing
- Blue/Yellow slider: corrects blue-yellow fringing
- Typical values: 5-15 points depending on severity

## RAW Converters Compared

### Lightroom Classic

**Strengths:**
- Integrated workflow (cataloging + editing)
- Efficient batch processing
- HSL panel for surgical color control
- Excellent denoise algorithm
- Fast, responsive performance
- Smart Previews enable offline work

**Limitations:**
- No per-channel curves (uses tone curve)
- Limited to built-in white balance (no custom profiles)
- Masking tools are relatively basic

**Best for:** Photographers needing end-to-end workflow from import to export

### Capture One

**Strengths:**
- Superior demosaicing (Frequency-guided approach)
- Remarkable color accuracy (used by phase One, luxury camera maker)
- Advanced sharpening with per-frequency control
- Excellent skin tone rendering
- Session-based organization (project-aware cataloging)

**Limitations:**
- Subscription cost (expensive)
- Steeper learning curve
- Smaller ecosystem (fewer presets/profiles)
- Slower performance on large catalogs

**Best for:** Professional photographers, especially those specializing in color-critical work (fashion, product)

### Adobe Camera Raw (Lightroom CC, Photoshop)

**Strengths:**
- Available in Photoshop ($55/month)
- Advanced masking capabilities
- Integration with Photoshop compositing
- Neural filters for advanced processing

**Limitations:**
- No robust cataloging (Lightroom CC exists but separate subscription)
- Slower demosaicing than Capture One
- File management less intuitive than Lightroom Classic

**Best for:** Photographers already in Photoshop workflow; those needing Photoshop integration

### Darktable (Open Source)

**Strengths:**
- Free and open-source
- Sophisticated processing engine rivaling professional converters
- No subscription costs
- Community-driven development

**Limitations:**
- Steeper learning curve than Lightroom
- Smaller community (fewer resources/tutorials)
- Performance less optimized than commercial converters

**Best for:** Technically-oriented photographers comfortable with complex interfaces; Linux users

## Practical RAW Workflow

Optimal RAW processing workflow:

1. **Import with metadata:** Lightroom import with copyright, keywords, location stamp
2. **White balance:** Set custom white balance from grey card or Daylight preset
3. **Exposure correction:** Adjust exposure, recovery (highlights), shadows (not crushed blacks)
4. **Demosaicing:** Select appropriate demosaicing algorithm (Lightroom handles automatically)
5. **Noise reduction:** 15-40 luminance points (ISO-dependent), 60-80 chroma points
6. **Lens corrections:** Apply profile (automatic) or manual distortion/vignetting/CA correction
7. **Capture sharpening:** 0.75-1.2 Amount, 0.8-1.2 Radius, 30-50 Masking (sensor-dependent)
8. **Color grading:** HSL adjustments, tone curve, split-toning
9. **Output sharpening:** Apply appropriate sharpening for intended output medium
10. **Export:** Format, color space, compression matching delivery requirements

Automation through presets (import preset + auto-apply preset) accelerates this process across hundreds of images while maintaining consistency.
