import React, { useRef, useEffect } from 'react';

interface WaveformSignal {
    name: string;
    values: { time: number; value: number }[];
}

interface WaveformViewerProps {
    rawLines: string[];
}

/**
 * Parse #WAVE|time|sig1=val1,sig2=val2,... lines into structured signal data.
 */
function parseWaveformData(lines: string[]): WaveformSignal[] {
    if (!lines || lines.length === 0) return [];

    const signalMap = new Map<string, { time: number; value: number }[]>();
    const signalOrder: string[] = [];

    for (const line of lines) {
        // Format: #WAVE|<time>|sig1=val1,sig2=val2,...
        const parts = line.replace('#WAVE|', '').split('|');
        if (parts.length < 2) continue;

        const time = parseInt(parts[0], 10);
        if (isNaN(time)) continue;

        const pairs = parts[1].split(',');
        for (const pair of pairs) {
            const [name, valStr] = pair.split('=');
            if (!name || valStr === undefined) continue;

            const value = parseInt(valStr.trim(), 10);
            if (isNaN(value)) continue;

            if (!signalMap.has(name)) {
                signalMap.set(name, []);
                signalOrder.push(name);
            }
            signalMap.get(name)!.push({ time, value });
        }
    }

    // Deduplicate: keep only entries where value actually changed
    return signalOrder.map(name => {
        const raw = signalMap.get(name)!;
        const deduped: { time: number; value: number }[] = [];
        for (const entry of raw) {
            if (deduped.length === 0 || deduped[deduped.length - 1].value !== entry.value) {
                deduped.push(entry);
            }
        }
        return { name, values: deduped };
    });
}

const COLORS = [
    '#4fc3f7', // light blue
    '#81c784', // green
    '#ffb74d', // orange
    '#e57373', // red
    '#ba68c8', // purple
    '#4dd0e1', // cyan
    '#aed581', // lime
    '#f06292', // pink
];

const WaveformViewer: React.FC<WaveformViewerProps> = ({ rawLines }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const signals = parseWaveformData(rawLines);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || signals.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match canvas to container size
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = rect.height;

        // Layout config
        const labelWidth = 100;
        const topPadding = 30;
        const bottomPadding = 30;
        const signalHeight = Math.min(50, (H - topPadding - bottomPadding) / signals.length);
        const waveAreaWidth = W - labelWidth - 20;

        // Find time range
        let maxTime = 0;
        for (const sig of signals) {
            for (const v of sig.values) {
                if (v.time > maxTime) maxTime = v.time;
            }
        }
        // Add a bit of padding to the end
        maxTime = maxTime + 10;

        const timeScale = waveAreaWidth / maxTime;

        // Clear background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, W, H);

        // Draw time axis at top
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(labelWidth, topPadding);
        ctx.lineTo(W - 10, topPadding);
        ctx.stroke();

        // Time tick marks
        const tickInterval = maxTime <= 50 ? 5 : maxTime <= 200 ? 10 : maxTime <= 500 ? 50 : 100;
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        for (let t = 0; t <= maxTime; t += tickInterval) {
            const x = labelWidth + t * timeScale;
            ctx.beginPath();
            ctx.moveTo(x, topPadding - 5);
            ctx.lineTo(x, topPadding);
            ctx.stroke();
            ctx.fillText(`${t}`, x, topPadding - 8);
        }

        // Draw each signal
        signals.forEach((sig, idx) => {
            const y = topPadding + idx * signalHeight;
            const midY = y + signalHeight / 2;
            const highY = y + 8;
            const lowY = y + signalHeight - 8;
            const color = COLORS[idx % COLORS.length];

            // Signal name label
            ctx.fillStyle = '#aaa';
            ctx.font = '12px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(sig.name, labelWidth - 10, midY + 4);

            // Horizontal grid line (subtle)
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(labelWidth, lowY);
            ctx.lineTo(W - 10, lowY);
            ctx.stroke();

            // Check if this is a multi-bit signal (value > 1)
            const isMultiBit = sig.values.some(v => v.value > 1);

            // Draw waveform
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            if (isMultiBit) {
                // Multi-bit: draw bus-style (crossed transitions with value labels)
                for (let i = 0; i < sig.values.length; i++) {
                    const entry = sig.values[i];
                    const x = labelWidth + entry.time * timeScale;
                    const nextTime = i + 1 < sig.values.length ? sig.values[i + 1].time : maxTime;
                    const nextX = labelWidth + nextTime * timeScale;

                    // Draw diamond transition marker
                    const transWidth = 4;
                    ctx.beginPath();
                    ctx.strokeStyle = color;
                    ctx.moveTo(x, midY - (signalHeight / 2 - 8));
                    ctx.lineTo(x + transWidth, midY);
                    ctx.lineTo(x, midY + (signalHeight / 2 - 8));
                    ctx.stroke();

                    // Draw horizontal lines (top and bottom of bus)
                    ctx.beginPath();
                    ctx.moveTo(x + transWidth, highY);
                    ctx.lineTo(nextX - (i + 1 < sig.values.length ? transWidth : 0), highY);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x + transWidth, lowY);
                    ctx.lineTo(nextX - (i + 1 < sig.values.length ? transWidth : 0), lowY);
                    ctx.stroke();

                    // Draw value label inside the bus
                    ctx.fillStyle = color;
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    const labelX = (x + transWidth + nextX) / 2;
                    if (nextX - x > 20) {
                        ctx.fillText(`${entry.value}`, labelX, midY + 4);
                    }
                }
            } else {
                // Single bit: draw square wave
                for (let i = 0; i < sig.values.length; i++) {
                    const entry = sig.values[i];
                    const x = labelWidth + entry.time * timeScale;
                    const yPos = entry.value ? highY : lowY;

                    if (i === 0) {
                        ctx.moveTo(x, yPos);
                    } else {
                        // Vertical transition
                        ctx.lineTo(x, yPos);
                    }

                    // Horizontal line to next change or end
                    const nextTime = i + 1 < sig.values.length ? sig.values[i + 1].time : maxTime;
                    const nextX = labelWidth + nextTime * timeScale;
                    ctx.lineTo(nextX, yPos);
                }
                ctx.stroke();
            }
        });

    }, [signals]);

    if (!rawLines || rawLines.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-600 italic">
                <div className="text-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-gray-700">
                        <path d="M2 12h4l2-8 4 16 4-12 2 4h4" />
                    </svg>
                    <p>Run your code to see waveforms...</p>
                </div>
            </div>
        );
    }

    if (signals.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500 italic">
                <p>No signal data found in output</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex-1 relative" style={{ minHeight: '100px' }}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
            />
        </div>
    );
};

export default WaveformViewer;
