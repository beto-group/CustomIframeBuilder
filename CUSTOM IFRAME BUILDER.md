---
layout: grid
pageSize: 20
autoLoad: true
---
**
```datacorejsx
const activeFile = dc.resolvePath("CUSTOM IFRAME BUILDER");
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { getIframesGuidelines } = await dc.require(folderPath + "/src/guidelines.js");
const { View } = await dc.require(folderPath + "/src/CustomIframeBuilder.component.jsx");

return <View spawnType="fullTab" folderPath={folderPath} getIframesGuidelines={getIframesGuidelines} />;
```