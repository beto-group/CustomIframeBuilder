function View({ spawnType = "fullTab", folderPath, getIframesGuidelines }) {
  const { useState, useEffect, useRef } = dc;
  
  /**
   * Parse spawnType to determine initial display mode and toggle button visibility
   * Options:
   * - "fullTab" (default): Starts in full-tab mode with toggle enabled
   * - "compact": Starts in compact mode with toggle enabled
   * - "fullTab.locked": Starts in full-tab mode, toggle hidden
   * - "compact.locked": Starts in compact mode, toggle hidden
   * - "disabled"/"disable": Disables full-tab mode entirely
   */
  const lowerSpawnType = (spawnType || "").toLowerCase();
  const isDisabled = lowerSpawnType === "disabled" || lowerSpawnType === "disable";
  const isLocked = lowerSpawnType.includes(".locked");
  const baseSpawnType = lowerSpawnType.replace(".locked", "");
  const showFullTabToggle = !isLocked && !isDisabled;
  const initialFullTab = !isDisabled && baseSpawnType === "fulltab";
  
  // Container dimensions
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  
  /**
   * Manual mode flag: when true, disables automatic container resizing
   * Set to true when user manually adjusts dimensions or applies URL guidelines
   */
  const [isContainerManual, setIsContainerManual] = useState(false);
  const isContainerManualRef = useRef(isContainerManual);
  
  // ResizeObserver reference for cleanup
  const observerRef = useRef(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    isContainerManualRef.current = isContainerManual;
  }, [isContainerManual]);
  
  // iFrame configuration state
  const [iframeSrc, setIframeSrc] = useState("");
  const [iframeWidth, setIframeWidth] = useState(800);
  const [iframeHeight, setIframeHeight] = useState(666);
  const [iframeScale, setIframeScale] = useState(1);
  const [iframeLeft, setIframeLeft] = useState(10);
  const [iframeTop, setIframeTop] = useState(10);
  
  /**
   * Interaction mode: when true, disables direct iframe interaction
   * Useful for positioning and scaling without triggering iframe content
   */
  const [disableIframeInteraction, setDisableIframeInteraction] = useState(true);
  
  // DOM references
  const containerRef = useRef(null);
  const iframeWrapperRef = useRef(null);
  
  /**
   * Full-Tab Mode
   * Allows the component to expand and fill the entire Obsidian pane
   * Uses DOM reparenting to position the container absolutely within the workspace
   */
  const [isFullTab, setIsFullTab] = useState(initialFullTab);
  
  /**
   * Traverses up the DOM tree to find an ancestor with the specified class name
   * Used to locate Obsidian's workspace-leaf-content container
   */
  function findNearestAncestorWithClass(element, className) {
    let current = element;
    while (current && current !== document.body) {
      if (current.classList && current.classList.contains(className)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Finds a direct child element with the specified class name
   * Used to locate the view-content wrapper within workspace-leaf-content
   */
  function findDirectChildByClass(parent, className) {
    if (!parent) return null;
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i];
      if (child.classList && child.classList.contains(className)) {
        return child;
      }
    }
    return null;
  }
  
  /**
   * Transforms URLs to their embeddable equivalents
   * Currently supports YouTube watch URLs and short URLs
   */
  function transformUrl(url) {
    if (!url) return "";
    const lower = url.toLowerCase();
    try {
      if (lower.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get("v");
        if (videoId) {
          return "https://www.youtube.com/embed/" + videoId;
        }
      } else if (lower.includes("youtu.be/")) {
        const parts = url.split("/");
        const videoId = parts[parts.length - 1];
        if (videoId) {
          return "https://www.youtube.com/embed/" + videoId;
        }
      }
    } catch (e) {
      console.error("URL transformation error:", e);
    }
    return url;
  }
  
  /**
   * Detects the platform from the URL and returns appropriate display guidelines
   * Guidelines include optimal container size, iframe dimensions, scale, and positioning
   */
  function applyGuidelines(url) {
    const guidelines = getIframesGuidelines();
    const lowerUrl = url.toLowerCase();
    let key = "WEBSITES"; // default guideline
    
    if (
      lowerUrl.includes("facebook.com/reel") ||
      lowerUrl.includes("facebook.com/plugins/vid")
    ) {
      key = "FACEBOOK.reel";
    } else if (lowerUrl.includes("facebook.com")) {
      key = "FACEBOOK";
    } else if (lowerUrl.includes("warpcast")) {
      key = "WARPCAST";
    } else if (lowerUrl.includes("snapchat.com")) {
      key = "SNAPCHAT";
    } else if (
      (lowerUrl.includes("youtube.com") && lowerUrl.includes("/shorts")) ||
      (lowerUrl.includes("youtu.be") && lowerUrl.includes("shorts"))
    ) {
      key = "YOUTUBE.shorts";
    } else if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      key = "YOUTUBE";
    } else if (lowerUrl.includes("tiktok.com")) {
      key = "TIKTOK";
    } else if (lowerUrl.includes("reddit.com")) {
      key = "REDDIT";
    } else if (lowerUrl.includes("linkedin.com")) {
      key = "LINKEDIN";
    } else if (lowerUrl.includes("instagram.com")) {
      key = "INSTAGRAM";
    }
    
    return guidelines[key];
  }
  
  /**
   * Full-Tab Mode Effect
   * Reparents the container to fill the entire Obsidian workspace pane
   * Uses a placeholder technique to preserve original position for cleanup
   */
  const stateRefs = useRef({});
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isFullTab) return;

    // Locate Obsidian's workspace structure
    const targetPaneContent = findNearestAncestorWithClass(
      container,
      "workspace-leaf-content"
    );
    if (!targetPaneContent) return;

    const contentWrapper =
      findDirectChildByClass(targetPaneContent, "view-content") ||
      targetPaneContent;

    // Store original parent and create placeholder
    stateRefs.current.originalParent = container.parentNode;
    stateRefs.current.placeholder = document.createElement("div");
    stateRefs.current.placeholder.style.display = "none";
    container.parentNode.insertBefore(stateRefs.current.placeholder, container);

    // Inject impeccable status bar suppression stylesheet
    const styleId = "impeccable-status-iframe-builder";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        /* Hide global status bar and view footers */
        .status-bar, .view-footer, .workspace-leaf-content-footer { 
            display: none !important; 
        }
        
        /* Expand workspace-leaf-content to edge-to-edge container */
        .workspace-leaf-content { 
            padding: 0 !important; 
            margin: 0 !important; 
            border-radius: 0 !important; 
        }
      `;
      document.head.appendChild(styleEl);
    }

    // Ensure parent has positioning context
    stateRefs.current.parentPositionInfo = {
      element: contentWrapper,
      original: window.getComputedStyle(contentWrapper).position,
    };
    if (stateRefs.current.parentPositionInfo.original === "static") {
      contentWrapper.style.position = "relative";
    }

    // Reparent and apply full-tab styles
    contentWrapper.appendChild(container);
    Object.assign(container.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "9998",
      overflow: "auto",
    });

    // Cleanup: restore original DOM structure and remove styles
    return () => {
      if (stateRefs.current.placeholder?.parentNode) {
        stateRefs.current.placeholder.parentNode.replaceChild(
          container,
          stateRefs.current.placeholder
        );
      }
      
      const el = document.getElementById(styleId);
      if (el) el.remove();

      if (stateRefs.current.parentPositionInfo?.element) {
        stateRefs.current.parentPositionInfo.element.style.position =
          stateRefs.current.parentPositionInfo.original === "static"
            ? ""
            : stateRefs.current.parentPositionInfo.original;
      }
      container.removeAttribute("style");
      Object.keys(stateRefs.current).forEach((key) => (stateRefs.current[key] = null));
    };
  }, [isFullTab]);
  
  /**
   * Automatic Container Resizing
   * Observes container size changes and syncs iframe width when not in manual mode
   */
  useEffect(() => {
    if (!isContainerManual && containerRef.current && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
          const newWidth = entry.contentRect.width;
          if (!isContainerManualRef.current) {
            setWidth(newWidth);
            setIframeWidth(newWidth);
          }
        }
      });
      observer.observe(containerRef.current);
      observerRef.current = observer;
      return () => {
        observer.disconnect();
        observerRef.current = null;
      };
    }
  }, [isContainerManual]);
  
  /**
   * Fallback Window Resize Handler
   * Used when ResizeObserver is not available
   */
  useEffect(() => {
    if (!isContainerManual) {
      const handleResize = () => {
        const newWidth = window.innerWidth;
        setWidth(newWidth);
        setIframeWidth(newWidth);
      };
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isContainerManual]);
  
  /**
   * Exports current settings to clipboard as JSON
   * Includes all container and iframe parameters
   */
  const copySettings = () => {
    const settings = {
      containerWidth: width,
      containerHeight: height,
      iframeSrc,
      iframeWidth,
      iframeHeight,
      iframeScale,
      iframeLeft,
      iframeTop,
      disableIframeInteraction
    };
    const settingsJson = JSON.stringify(settings, null, 2);
    navigator.clipboard.writeText(settingsJson)
      .then(() => alert("Settings copied to clipboard!"))
      .catch((err) => alert("Failed to copy settings: " + err));
  };
  
  /**
   * Imports settings from clipboard JSON
   * Switches to manual mode when container dimensions are loaded
   */
  const pasteSettings = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const settings = JSON.parse(text);
      if (settings.containerWidth !== undefined) {
        setWidth(settings.containerWidth);
        setIsContainerManual(true);
        isContainerManualRef.current = true;
      }
      if (settings.containerHeight !== undefined) {
        setHeight(settings.containerHeight);
        setIsContainerManual(true);
        isContainerManualRef.current = true;
      }
      if (settings.iframeSrc !== undefined) setIframeSrc(settings.iframeSrc);
      if (settings.iframeWidth !== undefined) setIframeWidth(settings.iframeWidth);
      if (settings.iframeHeight !== undefined) setIframeHeight(settings.iframeHeight);
      if (settings.iframeScale !== undefined) setIframeScale(settings.iframeScale);
      if (settings.iframeLeft !== undefined) setIframeLeft(settings.iframeLeft);
      if (settings.iframeTop !== undefined) setIframeTop(settings.iframeTop);
      if (settings.disableIframeInteraction !== undefined) setDisableIframeInteraction(settings.disableIframeInteraction);
      alert("Settings loaded from clipboard!");
    } catch (error) {
      alert("Failed to load settings from clipboard: " + error);
    }
  };
  
  /**
   * Container Click Handler
   * Simulates clicks within the iframe when interaction is disabled
   * Useful for testing iframe responsiveness without direct interaction
   */
  const handleContainerClick = (e) => {
    if (!disableIframeInteraction) return;
    if (!e.currentTarget) return;
    
    window.requestAnimationFrame(() => {
      if (!e.currentTarget) return;
      
      const containerRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;
      const clickY = e.clientY - containerRect.top;
      
      if (
        clickX >= iframeLeft &&
        clickX <= iframeLeft + iframeWidth &&
        clickY >= iframeTop &&
        clickY <= iframeTop + iframeHeight
      ) {
        const relativeX = (clickX - iframeLeft) / iframeScale;
        const relativeY = (clickY - iframeTop) / iframeScale;
        
        if (iframeWrapperRef.current) {
          const iframe = iframeWrapperRef.current.querySelector("iframe");
          if (iframe) {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              const targetElement = iframeDoc.elementFromPoint(relativeX, relativeY);
              if (targetElement) {
                const simulatedClick = new MouseEvent("click", {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: relativeX,
                  clientY: relativeY
                });
                targetElement.dispatchEvent(simulatedClick);
              }
            } catch (error) {
              console.error("Unable to simulate click in iframe:", error);
            }
          }
        }
      }
    });
  };
  
  return (
    <div 
      ref={containerRef} 
      onClick={handleContainerClick}
      className="custom-iframe-builder-container"
      style={{ 
        width: "100%", 
        height: "100%", 
        overflow: "auto",
        backgroundColor: "var(--background-primary, #050505)",
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}
    >
      <dc.Stack style={{ padding: "24px", gap: "24px" }}>
        {/* Header - Glassmorphic Header */}
        <div style={{
          padding: "20px 24px",
          background: "radial-gradient(circle at top right, rgba(122, 70, 241, 0.08), rgba(255, 255, 255, 0.01))",
          backgroundColor: "var(--background-secondary, rgba(255, 255, 255, 0.02))",
          borderRadius: "12px",
          border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(8px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              color: "var(--interactive-accent, #7a46f1)", 
              fontSize: "1.35em",
              fontWeight: "900",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              letterSpacing: "1px"
            }}>
              <dc.Icon icon="layout" style={{ fontSize: "1em" }} />
              CUSTOM IFRAME BUILDER
            </h2>
            <div style={{ 
              fontSize: "11px", 
              color: "var(--text-muted, #888)", 
              marginTop: "4px",
              letterSpacing: "0.5px"
            }}>
              BetoOS Standardized Responsive Embed Designer
            </div>
          </div>
          
          {/* Full-Tab Toggle Button in Header */}
          {showFullTabToggle && (
            <button
              onClick={() => setIsFullTab(!isFullTab)}
              style={{
                padding: "8px 16px",
                backgroundColor: isFullTab ? "var(--interactive-accent, #7a46f1)" : "var(--interactive-normal, rgba(255, 255, 255, 0.05))",
                color: "#ffffff",
                border: "1px solid " + (isFullTab ? "var(--interactive-accent, #7a46f1)" : "var(--background-modifier-border, rgba(255, 255, 255, 0.1))"),
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "900",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isFullTab ? "0 0 15px rgba(122, 70, 241, 0.4)" : "none"
              }}
              title={isFullTab ? "Exit full-tab workspace" : "Enter full-tab workspace"}
            >
              <dc.Icon icon={isFullTab ? "minimize-2" : "maximize-2"} style={{ fontSize: "14px" }} />
              {isFullTab ? "EXIT FULL-TAB" : "FULL-TAB WORKSPACE"}
            </button>
          )}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: "20px",
          backgroundColor: "var(--background-secondary, rgba(255, 255, 255, 0.01))",
          borderRadius: "12px",
          border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.06))",
          backdropFilter: "blur(4px)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
        }}>
          <h3 style={{ 
            margin: "0 0 12px 0", 
            color: "var(--text-normal, #e0e0e0)", 
            fontSize: "12px",
            fontWeight: "900",
            letterSpacing: "1.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textTransform: "uppercase"
          }}>
            <dc.Icon icon="link" style={{ fontSize: "1em", color: "var(--interactive-accent, #7a46f1)" }} />
            Embed Source URL
          </h3>
          <input
            type="text"
            value={iframeSrc}
            onChange={(e) => {
              const url = e.target.value;
              setIframeSrc(url);
              if (url) {
                const guidelines = applyGuidelines(url);
                if (guidelines) {
                  setIsContainerManual(true);
                  isContainerManualRef.current = true;
                  if (observerRef.current) {
                    observerRef.current.disconnect();
                    observerRef.current = null;
                  }
                  setWidth(guidelines.containerWidth);
                  setHeight(guidelines.containerHeight);
                  setIframeWidth(guidelines.iframeWidth);
                  setIframeHeight(guidelines.iframeHeight);
                  setIframeScale(guidelines.iframeScale);
                  setIframeLeft(guidelines.iframeLeft);
                  setIframeTop(guidelines.iframeTop);
                  setDisableIframeInteraction(guidelines.disableIframeInteraction);
                }
              }
            }}
            placeholder="Paste YouTube, TikTok, Instagram Reel, or any iframe website URL..."
            className="builder-input-field"
            style={{ 
              padding: "12px 16px",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              color: "var(--text-normal, #e0e0e0)",
              border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "8px",
              width: "100%",
              fontSize: "13px",
              outline: "none",
              transition: "all 0.3s ease"
            }}
          />
        </div>

        {/* Configurations grid - Two Columns */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "24px" 
        }}>
          {/* Column 1: Container Dimensions */}
          <div style={{
            padding: "20px",
            backgroundColor: "var(--background-secondary, rgba(255, 255, 255, 0.01))",
            borderRadius: "12px",
            border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.06))",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
          }}>
            <h3 style={{ 
              margin: "0 0 16px 0", 
              color: "var(--text-normal, #e0e0e0)", 
              fontSize: "12px",
              fontWeight: "900",
              letterSpacing: "1.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textTransform: "uppercase"
            }}>
              <dc.Icon icon="maximize-2" style={{ fontSize: "1em", color: "var(--interactive-accent, #7a46f1)" }} />
              Canvas Dimensions
            </h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "8px",
                color: "var(--text-muted, #a0a0a0)",
                fontSize: "12px",
                fontWeight: "600",
                flex: "1"
              }}>
                Width (px)
                <input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    const newWidth = Number(e.target.value);
                    setWidth(newWidth);
                    setIsContainerManual(true);
                    isContainerManualRef.current = true;
                  }}
                  className="dimension-number-input"
                  style={{ 
                    padding: "10px 14px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "var(--text-normal, #e0e0e0)",
                    border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "8px",
                    width: "100%",
                    fontSize: "13px",
                    outline: "none",
                    transition: "all 0.3s ease"
                  }}
                />
              </label>
              
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "8px",
                color: "var(--text-muted, #a0a0a0)",
                fontSize: "12px",
                fontWeight: "600",
                flex: "1"
              }}>
                Height (px)
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    const newHeight = Number(e.target.value);
                    setHeight(newHeight);
                    setIsContainerManual(true);
                    isContainerManualRef.current = true;
                  }}
                  className="dimension-number-input"
                  style={{ 
                    padding: "10px 14px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "var(--text-normal, #e0e0e0)",
                    border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "8px",
                    width: "100%",
                    fontSize: "13px",
                    outline: "none",
                    transition: "all 0.3s ease"
                  }}
                />
              </label>
            </div>
            
            <div style={{ 
              fontSize: "11px", 
              color: "var(--text-muted, #666)", 
              marginTop: "12px",
              lineHeight: "1.4"
            }}>
              Canvas represents the active display bounding box. Adjust to preview crop factor safely.
            </div>
          </div>
          
          {/* Column 2: iFrame Parameters */}
          <div style={{
            padding: "20px",
            backgroundColor: "var(--background-secondary, rgba(255, 255, 255, 0.01))",
            borderRadius: "12px",
            border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.06))",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
          }}>
            <h3 style={{ 
              margin: "0 0 16px 0", 
              color: "var(--text-normal, #e0e0e0)", 
              fontSize: "12px",
              fontWeight: "900",
              letterSpacing: "1.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textTransform: "uppercase"
            }}>
              <dc.Icon icon="settings" style={{ fontSize: "1em", color: "var(--interactive-accent, #7a46f1)" }} />
              Iframe Transforms
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", 
              gap: "12px" 
            }}>
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "var(--text-muted, #a0a0a0)",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                Width (px)
                <input
                  type="number"
                  value={iframeWidth}
                  onChange={(e) => setIframeWidth(Number(e.target.value))}
                  className="dimension-number-input"
                  style={{ 
                    padding: "8px 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "var(--text-normal, #e0e0e0)",
                    border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "6px",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </label>
              
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "var(--text-muted, #a0a0a0)",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                Height (px)
                <input
                  type="number"
                  value={iframeHeight}
                  onChange={(e) => setIframeHeight(Number(e.target.value))}
                  className="dimension-number-input"
                  style={{ 
                    padding: "8px 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "var(--text-normal, #e0e0e0)",
                    border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "6px",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </label>
              
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "var(--text-muted, #a0a0a0)",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                Scale Factor
                <input
                  type="number"
                  value={iframeScale}
                  onChange={(e) => setIframeScale(Number(e.target.value))}
                  step="0.001"
                  className="dimension-number-input"
                  style={{ 
                    padding: "8px 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "var(--text-normal, #e0e0e0)",
                    border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "6px",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </label>
              
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "var(--text-muted, #a0a0a0)",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                Offset Left
                <input
                  type="number"
                  value={iframeLeft}
                  onChange={(e) => setIframeLeft(Number(e.target.value))}
                  className="dimension-number-input"
                  style={{ 
                    padding: "8px 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "var(--text-normal, #e0e0e0)",
                    border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "6px",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </label>
              
              <label style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "6px",
                color: "var(--text-muted, #a0a0a0)",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                Offset Top
                <input
                  type="number"
                  value={iframeTop}
                  onChange={(e) => setIframeTop(Number(e.target.value))}
                  className="dimension-number-input"
                  style={{ 
                    padding: "8px 12px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "var(--text-normal, #e0e0e0)",
                    border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
                    borderRadius: "6px",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        
        {/* Actions Bar */}
        <div style={{
          padding: "16px 20px",
          backgroundColor: "var(--background-secondary, rgba(255, 255, 255, 0.01))",
          borderRadius: "12px",
          border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.06))",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)"
        }}>
          {/* Interaction Switcher */}
          <button 
            onClick={() => setDisableIframeInteraction(!disableIframeInteraction)}
            className="action-button-layout"
            style={{
              padding: "10px 18px",
              backgroundColor: disableIframeInteraction ? "var(--interactive-accent, #7a46f1)" : "var(--interactive-normal, rgba(255, 255, 255, 0.05))",
              color: "#ffffff",
              border: "1px solid " + (disableIframeInteraction ? "var(--interactive-accent, #7a46f1)" : "var(--background-modifier-border, rgba(255, 255, 255, 0.1))"),
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "900",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: disableIframeInteraction ? "0 0 15px rgba(122, 70, 241, 0.3)" : "none"
            }}
          >
            <dc.Icon icon={disableIframeInteraction ? "lock" : "unlock"} style={{ fontSize: "14px" }} />
            {disableIframeInteraction ? "INTERACTION LOCKED" : "INTERACTION UNLOCKED"}
          </button>
          
          <button 
            onClick={copySettings}
            className="action-button-layout"
            style={{
              padding: "10px 18px",
              backgroundColor: "var(--interactive-normal, rgba(255, 255, 255, 0.04))",
              color: "var(--text-normal, #e0e0e0)",
              border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "900",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)"; }}
          >
            <dc.Icon icon="copy" style={{ fontSize: "14px", color: "var(--interactive-accent, #7a46f1)" }} />
            EXPORT CONFIG
          </button>
          
          <button 
            onClick={pasteSettings}
            className="action-button-layout"
            style={{
              padding: "10px 18px",
              backgroundColor: "var(--interactive-normal, rgba(255, 255, 255, 0.04))",
              color: "var(--text-normal, #e0e0e0)",
              border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "900",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)"; }}
          >
            <dc.Icon icon="clipboard" style={{ fontSize: "14px", color: "var(--interactive-accent, #7a46f1)" }} />
            IMPORT CONFIG
          </button>
        </div>
        
        {/* Preview Frame */}
        <div style={{
          padding: "24px",
          backgroundColor: "var(--background-secondary, rgba(255, 255, 255, 0.01))",
          borderRadius: "12px",
          border: "1px solid var(--background-modifier-border, rgba(255, 255, 255, 0.06))",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <h3 style={{ 
            margin: "0", 
            color: "var(--text-normal, #e0e0e0)", 
            fontSize: "12px",
            fontWeight: "900",
            letterSpacing: "1.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textTransform: "uppercase"
          }}>
            <dc.Icon icon="eye" style={{ fontSize: "1em", color: "var(--interactive-accent, #7a46f1)" }} />
            Active Design Canvas
          </h3>
          
          {/* Main viewport frame */}
          <div
            style={{
              position: "relative",
              width: width + "px",
              height: height + "px",
              border: "2px dashed var(--background-modifier-border, rgba(255, 255, 255, 0.12))",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              margin: "0 auto",
              borderRadius: "12px",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.8)"
            }}
          >
            {!iframeSrc && (
              <p style={{ color: "var(--text-muted, #555)", fontSize: "12px", letterSpacing: "1px", fontWeight: "900", textTransform: "uppercase" }}>
                Waiting for Embed Source URL
              </p>
            )}
          
            {/* Embedded Iframe Container wrapper */}
            {iframeSrc && (
              <div
                ref={iframeWrapperRef}
                style={{
                  position: "absolute",
                  left: iframeLeft + "px",
                  top: iframeTop + "px",
                  width: iframeWidth + "px",
                  height: iframeHeight + "px",
                  overflow: "hidden",
                  pointerEvents: disableIframeInteraction ? "none" : "auto",
                  transition: "all 0.15s ease-out"
                }}
              >
                <iframe
                  src={transformUrl(iframeSrc)}
                  title="Controlled iFrame"
                  width={iframeWidth}
                  height={iframeHeight}
                  loading="lazy"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  style={{
                    border: "none",
                    transform: `scale(${iframeScale})`,
                    transformOrigin: "top left"
                  }}
                ></iframe>
              </div>
            )}
          </div>
        </div>
      </dc.Stack>

      {/* Styled Outlays */}
      <style>{`
        .builder-input-field:focus {
          border-color: var(--interactive-accent, #7a46f1) !important;
          box-shadow: 0 0 10px rgba(122, 70, 241, 0.2) !important;
          background-color: rgba(0, 0, 0, 0.6) !important;
        }
        .dimension-number-input:focus {
          border-color: var(--interactive-accent, #7a46f1) !important;
          box-shadow: 0 0 8px rgba(122, 70, 241, 0.15) !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
        .action-button-layout:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
}

return { View };
