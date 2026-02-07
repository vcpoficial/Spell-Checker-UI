// Show UI
figma.showUI(__html__, { width: 380, height: 800, themeColors: true });

// Helper to find text nodes recursively
function findTextNodes(nodes: readonly SceneNode[]): { id: string, text: string, name: string }[] {
  let textNodes: { id: string, text: string, name: string }[] = [];
  for (const node of nodes) {
    if (node.type === 'TEXT') {
      textNodes.push({ id: node.id, text: node.characters, name: node.name });
    } else if ('children' in node) {
      textNodes = textNodes.concat(findTextNodes(node.children));
    }
  }
  return textNodes;
}

// Load settings on startup
(async () => {
  try {
    const settings = await figma.clientStorage.getAsync('settings');
    if (settings) {
      figma.ui.postMessage({ type: 'load-settings', settings });
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
})();

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'resize') {
    figma.ui.resize(msg.width, msg.height);
  } else if (msg.type === 'notify') {
    figma.notify(msg.message);
  } else if (msg.type === 'save-settings') {
    try {
        await figma.clientStorage.setAsync('settings', msg.settings);
        figma.notify('Settings saved successfully!');
    } catch (err) {
        figma.notify('Failed to save settings.');
        console.error(err);
    }
  } else if (msg.type === 'scan-selection') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.notify('Please select a frame or text nodes.');
        figma.ui.postMessage({ type: 'scan-result', nodes: [] });
        return;
    }
    const textNodes = findTextNodes(selection);
    figma.ui.postMessage({ type: 'scan-result', nodes: textNodes });

  } else if (msg.type === 'apply-correction') {
    const node = figma.getNodeById(msg.id) as TextNode;
    if (node && node.type === 'TEXT') {
        try {
            await figma.loadFontAsync(node.fontName as FontName);
            node.characters = msg.newText;
            figma.notify('Correction applied!');
        } catch (e) {
            figma.notify('Error applying correction: ' + e);
        }
    }
  } else if (msg.type === 'apply-batch-correction') {
    const corrections = msg.corrections;
    let count = 0;
    for (const item of corrections) {
      const node = figma.getNodeById(item.id) as TextNode;
      if (node && node.type === 'TEXT') {
        try {
          await figma.loadFontAsync(node.fontName as FontName);
          node.characters = item.newText;
          count++;
        } catch (e) {
          console.error('Error applying correction:', e);
        }
      }
    }
    if (count > 0) {
      figma.notify(`Applied ${count} corrections.`);
    }
  } else if (msg.type === 'focus-node') {
    try {
      const node = figma.getNodeById(msg.id);
      if (node) {
        figma.currentPage.selection = [node as SceneNode];
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      }
    } catch (error) {
      console.error('Failed to focus node:', error);
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};
