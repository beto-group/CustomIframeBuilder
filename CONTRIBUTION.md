# 🛠️ Contributing to Custom Iframe Builder

Welcome! This document outlines the developer standards, directory index structures, and compilation workflows required to maintain and scale the Custom Iframe Builder tool.

---

## 🏛️ Core Architecture Pillars

1.  **Zero-Dependency Design**:
    *   The component must run entirely client-side inside Obsidian with zero node-dependency compilation steps.
    *   All UI actions (rendering, URL parsing, style overlays) must be sterile and sandbox-compatible.
2.  **Platform Presets Mapping (`src/guidelines.js`)**:
    *   Default scale, dimensions, interaction lock, and offset coordinates are indexed dynamically by platform URL keys.
    *   Ensure any new platform additions define precise `iframeScale` factors and offset coordinates to keep embeds visually clean and responsive.
3.  **Dynamic Workspace Portal & Reparenting**:
    *   Full-tab scaling operates through absolute DOM reparenting to Obsidian's `.workspace-leaf-content` view wrapper, ensuring distraction-free workflows.
    *   Unmounting must safely restore elements back to their placeholder origins to prevent layout corruption.
4.  **Clipboard Presets Portability**:
    *   Settings configuration must map exactly to serializable JSON schemas for seamless exporting and importing across dashboards and canvases.

---

## 🚀 Local Compilation & Developer Loop

*   **Main Logic File**: The primary component is compiled in `src/CustomIframeBuilder.component.jsx`.
*   **Asset Guidelines**: Platform-specific presets are contained in `src/guidelines.js`.
*   **Hot-Reload Cache Invalidation**: Run the hot-rebuilding pipeline inside the Obsidian view leaf, or invoke a workspace reset command. Cache-bypassing ensures your changes render instantaneously during development.
