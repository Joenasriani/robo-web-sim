import React, { useRef, useEffect, useCallback } from 'react';
import Blockly from 'blockly';

const BlocklyWorkspace = () => {
    const containerRef = useRef(null);

    const initializeBlockly = useCallback(() => {
        console.log('Injecting Blockly...');
        const workspace = Blockly.inject(containerRef.current, { /* configurations */ });
        // Remove overflow-hidden from Blockly mount container className
        containerRef.current.className = containerRef.current.className.replace('overflow-hidden', '');

        // Override styling after inject
        containerRef.current.style.position = 'absolute';
        containerRef.current.style.inset = '0';
        containerRef.current.style.width = '100%';
        containerRef.current.style.height = '100%';
        console.log('Applied styles:', containerRef.current.style);

        const svg = document.querySelector('.blocklySvg');
        const clientRect = svg.getBoundingClientRect();
        console.log('SVG client rect:', clientRect);

        const checkpoint = {
            injectStart: new Date(),
            injectComplete: null,
            workspaceNonNull: workspace ? true : false,
            toolboxLoaded: workspace.toolbox_ !== null,
            svgPresent: !!svg,
            blockCountGtZero: workspace.getAllBlocks().length > 0
        };

        // Log checkpoint
        checkpoint.injectComplete = new Date();
        console.log(checkpoint);

        // Handling deferred svgResize retries
        if (checkpoint.svgPresent && (clientRect.width === 0 || clientRect.height === 0)) {
            let retries = 0;
            const retryResize = () => {
                if (retries < 3) {
                    console.log('Retrying svg resize:', retries);
                    requestAnimationFrame(() => {
                        const newRect = svg.getBoundingClientRect();
                        console.log('Attempt', retries + 1, 'SVG rect:', newRect);
                        retries++;
                        retryResize();
                    });
                }
            };
            retryResize();
        }
    }, [containerRef]);

    useEffect(() => {
        initializeBlockly();
        return () => {
            // Cleanup if necessary
        };
    }, [initializeBlockly]);

    return <div ref={containerRef} style={{ height: '100%', width: '100%' }}></div>;
};

export default BlocklyWorkspace;

// Temporary debug state panel
const DebugStatePanel = ({ workspace }) => {
    const blockCountGtZero = workspace.getAllBlocks().length > 0;
    const svgPresent = document.querySelector('.blocklySvg') !== null;
    return (
        <div>
            <div>Block Count > 0: {blockCountGtZero.toString()}</div>
            <div>SVG Present: {svgPresent.toString()}</div>
            {/* Existing items retained here */}
        </div>
    );
};
