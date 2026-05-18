/**
 * Platform guidelines and presets for custom iframe embed layouts.
 */
function getIframesGuidelines() {
  return {
    WEBSITES: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 640,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: true
    },
    FACEBOOK: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    "FACEBOOK.reel": {
      containerWidth: 339,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1137,
      iframeScale: 0.526,
      iframeLeft: 1,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    WARPCAST: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: true
    },
    SNAPCHAT: {
      containerWidth: 396,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1111,
      iframeScale: 0.615,
      iframeLeft: 0,
      iframeTop: 44,
      disableIframeInteraction: true
    },
    YOUTUBE: {
      containerWidth: 640,
      containerHeight: 367,
      iframeWidth: 1270,
      iframeHeight: 730,
      iframeScale: 0.5,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: false
    },
    TIKTOK: {
      containerWidth: 340,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 0.92,
      iframeLeft: -124,
      iframeTop: -8,
      disableIframeInteraction: false
    },
    REDDIT: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 600,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: true
    },
    LINKEDIN: {
      containerWidth: 640,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 600,
      iframeScale: 1,
      iframeLeft: 0,
      iframeTop: 0,
      disableIframeInteraction: true
    },
    "YOUTUBE.shorts": {
      containerWidth: 333,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 666,
      iframeScale: 1.04,
      iframeLeft: -155,
      iframeTop: -42,
      disableIframeInteraction: true
    },
    INSTAGRAM: {
      containerWidth: 338,
      containerHeight: 600,
      iframeWidth: 640,
      iframeHeight: 1333,
      iframeScale: 0.537,
      iframeLeft: 0,
      iframeTop: -69,
      disableIframeInteraction: false
    }
  };
}

module.exports = { getIframesGuidelines };
return { getIframesGuidelines };
