---
title: Lightroom Classic Workflow
category: photo-editing
tags: [lightroom, workflow, editing, RAW, catalog]
description: Master Lightroom Classic's catalog management, import strategies, rating systems, and develop module techniques for efficient photo editing workflows.
related: [photo-editing/raw-processing, photo-editing/color-grading, photography/exposure-fundamentals]
order: 1
---

# Lightroom Classic Workflow

Lightroom Classic is fundamentally a database-driven application designed around the concept of non-destructive editing. Understanding the workflow means understanding how to leverage this architecture for efficiency and scalability, whether you're processing 100 images or 100,000.

## Catalog Architecture and Management

The Lightroom catalog is an SQLite database that stores all metadata—ratings, flags, keywords, edit adjustments, and file references—separate from your image files. This separation is critical: your original pixels remain untouched.

### Catalog Setup Strategy

Begin each project with a deliberate catalog decision. Large photographers often maintain:

1. **Project-based catalogs** - One catalog per assignment/client for isolation
2. **Master catalog** - Single unified database for personal work (requires discipline)
3. **Hybrid approach** - Master catalog with regular backups and archival sub-catalogs

Catalog size impacts performance. A catalog containing 500,000 images requires careful optimization. Use Library filters and collections to segment work logically. The Smart Collection feature allows dynamic grouping—for instance, creating a collection that automatically includes all RAW files with ratings 3+ stars taken in the past 30 days.

### Import Strategy

Importing establishes the foundation. Configure these settings before importing:

**File Handling:**
- Use "Copy as DNG" for universal format compatibility, but standard RAW import is more space-efficient
- "Copy" duplicates files to a managed location; "Reference" keeps originals elsewhere
- Smart Previews should be generated during import for offline work capability

**Metadata Template:**
Create an import preset that applies:
- Creator name and copyright
- ISO country code and state/province
- GPS coordinates (if applicable)
- IPTC Keywords hierarchy

This metadata stamps everything at import, preventing later omissions. For on-location shooting, use a preset that applies the correct location tag automatically.

**Organization During Import:**
Lightroom's folder structure doesn't match disk organization perfectly. Import into dated folders (YYYY/YYYY-MM-DD structure) on fast storage. This creates predictability: finding images from March 15, 2024 requires navigating one path consistently.

## Rating, Flagging, and Culling Workflow

Professional culling requires a systematic approach. Most photographers use this hierarchy:

- **Flag system**: Pick (white), Unflagged (gray), Reject (black)
- **Star ratings**: 1-5 stars for subjective quality
- **Color labels**: Green/Yellow/Red/Purple for custom status (client approval, export state, etc.)

### Efficient Culling Process

First pass: Flag only obvious rejects (out of focus, closed eyes, lighting failures). Use `U` (unflag), `P` (pick), and `]` (reject) as keyboard shortcuts during full-screen preview mode.

Second pass: Rate picks 1-5 stars. Use the Library panel's Filter Bar to show only picks, then cycle through stars. The most productive photographers use a simple system: 1 star (decent), 2 stars (good), 3 stars (strong), 4-5 stars (exceptional). This avoids ambiguity.

Collection building: Create a "Selects" collection containing all 3+ star images. Create "Client Review" collections that feed from these, allowing clients to select from pre-culled work.

## Develop Module Mastery

The Develop module is where artistic intent translates to pixels. Understanding the module's organization prevents getting lost in dozens of sliders.

### Tone Curve Advanced Techniques

The tone curve maps input tones to output tones. Beyond the basic "S-curve" contrast boost, consider these approaches:

**Lift-and-crush method:**
- Lift shadows slightly (raise the lower-left point)
- Add a point in the midtones and raise it
- Slightly crush blacks (lower the lower-left)
- This creates a faded, film-like aesthetic with crushed blacks

**Zone-based targeting:**
Add individual points for:
- Shadows (0-25% tones)
- Dark midtones (25-50%)
- Light midtones (50-75%)
- Highlights (75-100%)

This allows per-zone adjustments without affecting the whole image. A landscape might need lifted shadows but deepened highlights to preserve sky detail.

### HSL Panel: Surgical Color Control

The HSL (Hue, Saturation, Luminance) panel operates on specific color ranges. This is more precise than overall saturation adjustment.

**Practical application:**
- Isolate reds and pull saturation down 20-30 points to prevent oversaturation in skin tones
- Shift reds slightly toward orange (+5 to +10) for warmer portraiture
- Reduce yellows' luminance by 10-15 points to darken foliage and prevent blown highlights in nature photography
- Boost cyans' saturation for striking sky enhancement

The panel respects color range boundaries intelligently, though there's overlap between adjacent ranges. Adjusting reds affects some orange tones.

### Split Toning for Cinematic Color

Split toning applies different color grades to shadows and highlights—a technique from analog color grading.

**Shadows (cool):**
- Add cyan at saturation 25-35
- This creates a mysterious quality in dark areas

**Highlights (warm):**
- Add yellow-orange at saturation 20-30
- Creates dreamy, warm bright areas

The balance of shadow/highlight saturation determines the look's intensity. Film emulation often uses split toning: magenta shadows with yellow highlights mimics classic Kodachrome stock.

### Lens Corrections

Lens distortion, vignetting, and chromatic aberration correction dramatically improves raw image quality.

**Distortion:** Most modern lenses are profiled. Barrel distortion (curves outward) is common in wide-angle lenses; pincushion (curves inward) in telephotos. Correcting this maintains straight lines critical in architecture.

**Vignetting:** Apply the vignetting correction slider to counteract the darkening at image edges inherent to many lens designs.

**Chromatic Aberration:** Red/cyan and blue/yellow color fringing at contrast edges corrects automatically if lens profile exists. For lens profiles missing from Lightroom's library, use the Manual tab's chromatic aberration sliders.

### Masking: Selective Adjustments

Lightroom's masking tools (introduced in 2022) enable non-destructive selective editing:

**Select Subject:** AI-powered tool that selects people/objects with surprising accuracy. Adjust a portrait's clarity and vibrance only on the subject's face and clothing while leaving the background unaffected.

**Select Sky:** Automatically isolates sky regions, allowing independent color grading. Darken a washed-out sky, increase saturation, and warm overall tone without touching the landscape below.

**Brush mask:** Paint selections directly for surgical control. Brighten a specific eye while leaving the other untouched.

**Range mask:** Select by luminance or color range. "Highlights only" allows boosting exposure purely in bright areas without touching midtones.

## Export Presets and Delivery Workflows

Export presets embed all delivery specifications: format, quality, metadata stripping, sRGB/Adobe RGB color space.

### Creating Presets

**Web delivery:**
- Format: JPEG, quality 75-85
- Color space: sRGB
- Resize: 1920px longest edge
- Include: Copyright only (strip location data)

**Print (8x10 for lab):**
- Format: TIFF or ProPhoto JPEG
- Color space: ProPhoto RGB
- Resize: None (preserve full resolution)
- Include: No metadata

**Archive master:**
- Format: TIFF, lossless
- Color space: Adobe RGB
- No resize
- Include: All metadata

Batch export entire collections using a single preset, automating delivery workflows. Organize presets by client or project for quick access.

## Smart Previews and Offline Work

Smart Previews create a smaller, lossy DNG file that contains all adjustment data. This enables full editing capability on laptops without access to original files—critical for travel or remote work.

Generate Smart Previews during import (adds 20% to catalog size) or later via Library > Previews > Build Smart Previews. They're also essential for using Lightroom Classic offline; without them, edit history is inaccessible.

## Performance Optimization

Large catalogs demand optimization:

1. **Optimize catalog:** File > Optimize Catalog monthly. Defrags the SQLite database, improving responsiveness.

2. **Preview strategy:** Build 1:1 previews only for current working set. Minimal previews for historical work reduce storage and improve UI performance.

3. **Backup routine:** Automatic backups (File > Backup Catalog) should run weekly with verification. Test restore procedures quarterly.

4. **Storage:** Store catalog and previews on fast SSD storage. Network drives introduce latency that multiplies across 100K+ images.

5. **RAM allocation:** Lightroom benefits from 16GB+ RAM. With less, the Filmstrip scrolls sluggishly when navigating large collections.

## Lightroom CC vs Lightroom Classic

Cloud-based Lightroom CC offers mobile and web access, automatic syncing, and scalability beyond a single machine. However, Classic excels in professional workflows:

- **Offline-first:** Edit anywhere, sync later
- **Performance:** Faster on large catalogs (500K+ images)
- **Flexibility:** Custom presets and plugins via community scripts
- **Long-form organization:** Complex collection structures and smart collections
- **Batch operations:** Powerful Find and Replace for metadata

CC suits traveling photographers who need real-time cloud sync. Classic suits studios with established workflows and large archives. Many professionals maintain both: Classic for archival work and detailed editing, CC for mobile proofing and client presentations.

## Advanced Workflow: Tethered Shooting Integration

In studio, tethered shooting to Lightroom enables real-time review. Configure:

1. Camera tethered via USB to Lightroom on same computer
2. Auto-import into dedicated session folder
3. Pair with an auto-apply preset (basic exposure correction, copyright)
4. Client or assistant rates images in real-time
5. Selects feed directly into a collection for batch processing

This creates immediate feedback loops during expensive shoots, preventing reshoots when issues surface in editing.
