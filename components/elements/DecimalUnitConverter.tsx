import { useEffect } from 'react';
import { convertBinaryUnitsInText } from './lib/units';

// Registering the Chart.js plugin here (module scope, not inside the component) means it
// runs once as soon as this file is evaluated - well before any server console page (and
// its canvas-based CPU/Memory/Network graphs) can mount. See ./lib/chartPlugin.ts.
import './lib/chartPlugin';

// Pterodactyl's own `bytesToString()` (resources/scripts/lib/formatters.ts) is the single
// place that formats every DOM-rendered byte value shown to users, always using binary
// units with a 1024 divisor: ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB']. There is no supported
// Components.yml hook to override that function directly, so instead we watch the rendered
// DOM and rewrite any text matching that output into decimal units (1000 divisor).
// (Canvas-rendered chart tick labels are handled separately by ./lib/chartPlugin.ts.)

function convertNode(node: Text): void {
    const { textContent } = node;
    if (!textContent) return;

    const converted = convertBinaryUnitsInText(textContent);
    if (converted !== textContent) node.textContent = converted;
}

function scan(root: Node): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];

    let current = walker.nextNode();
    while (current) {
        nodes.push(current as Text);
        current = walker.nextNode();
    }

    nodes.forEach(convertNode);
}

export default () => {
    useEffect(() => {
        scan(document.body);

        let scheduled = false;
        const observer = new MutationObserver(() => {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => {
                scheduled = false;
                scan(document.body);
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => observer.disconnect();
    }, []);

    return null;
};
