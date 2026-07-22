// Registers a global Chart.js plugin that rewrites tick labels from binary to decimal
// units. This is necessary because Pterodactyl's CPU/Memory/Network usage graphs
// (resources/scripts/components/server/console/StatGraphs.tsx) render onto a <canvas>
// via react-chartjs-2 - DOM text-node scanning can never see canvas-drawn text.
//
// Since this component is bundled into the same webpack graph as the panel itself,
// `chart.js` resolves to the exact same singleton module Pterodactyl imports, so
// registering a plugin here applies to every chart instance in the app, including
// ones Pterodactyl's own code creates.
//
// Chart.js's per-scale `afterTickToLabelConversion` hook looks like the obvious place to
// post-process generated tick labels, but it is NOT dispatched through the plugin system
// (Scale.prototype.afterTickToLabelConversion only calls `this.options.afterTickToLabelConversion`
// directly - see chart.js/src/core/core.scale.js). A globally registered plugin never sees it.
//
// The chart-level `afterUpdate` hook *is* dispatched via `chart.notifyPlugins()`, and
// `Chart.prototype.update()` calls `this._updateScales()` (which builds ticks and runs
// `generateTickLabels()`, populating `tick.label`) before it notifies 'afterUpdate' - so by
// the time this hook runs, every scale's tick labels already exist and can be rewritten
// in place before the chart is drawn.

import { Chart } from 'chart.js';
import { convertBinaryUnitsInText } from './units';

interface TickLike {
    label?: unknown;
}

interface ScaleLike {
    ticks?: TickLike[];
}

// Cast to `any`: the plugin's actual shape matches Chart.js's runtime Plugin contract
// fine, but typing it against the full generic `Plugin<ChartType>` union isn't worth
// the friction here since this file has no other consumers to type-check against.
Chart.register({
    id: 'blueprint-decimalunits-tick-converter',
    afterUpdate(chart: { scales: Record<string, ScaleLike> }) {
        Object.values(chart.scales).forEach((scale) => {
            scale.ticks?.forEach((tick) => {
                if (typeof tick.label === 'string') {
                    tick.label = convertBinaryUnitsInText(tick.label);
                }
            });
        });
    },
} as any);
