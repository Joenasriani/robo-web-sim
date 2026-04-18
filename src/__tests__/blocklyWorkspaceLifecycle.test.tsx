import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import BlocklyWorkspace from '@/components/BlocklyWorkspace';

type Rect = { width: number; height: number };

let rectByElement = new WeakMap<Element, Rect>();
const observerInstances: Array<{
  callback: ResizeObserverCallback;
  observed: Set<Element>;
}> = [];

const mockWorkspace = {
  dispose: jest.fn(),
  resizeContents: jest.fn(),
  render: jest.fn(),
  addChangeListener: jest.fn(),
  getTopBlocks: jest.fn(() => []),
  getAllBlocks: jest.fn(() => []),
  clear: jest.fn(),
  newBlock: jest.fn(() => ({
    initSvg: jest.fn(),
    render: jest.fn(),
    moveBy: jest.fn(),
  })),
};

const mockBlocklyModule = {
  Blocks: {} as Record<string, unknown>,
  inject: jest.fn(() => mockWorkspace),
  svgResize: jest.fn(),
  Xml: {
    domToWorkspace: jest.fn(),
    workspaceToDom: jest.fn(() => document.createElement('xml')),
  },
  utils: {
    xml: {
      textToDom: jest.fn(() => document.createElement('xml')),
      domToText: jest.fn(() => '<xml/>'),
    },
  },
};

jest.mock('blockly', () => mockBlocklyModule);

describe('BlocklyWorkspace lifecycle', () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalGetBoundingClientRect: typeof Element.prototype.getBoundingClientRect;
  let originalResizeObserver: typeof ResizeObserver | undefined;
  let originalRequestAnimationFrame: typeof requestAnimationFrame;
  let originalCancelAnimationFrame: typeof cancelAnimationFrame;

  const flushMicrotasks = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  const setSize = (element: Element, width: number, height: number) => {
    rectByElement.set(element, { width, height });
  };

  const triggerResizeObservers = () => {
    observerInstances.forEach((instance) => {
      const entries = [...instance.observed].map((element) => {
        const rect = rectByElement.get(element) ?? { width: 0, height: 0 };
        return {
          target: element,
          contentRect: {
            width: rect.width,
            height: rect.height,
          },
        } as ResizeObserverEntry;
      });
      instance.callback(entries, {} as ResizeObserver);
    });
  };

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    jest.clearAllMocks();
    observerInstances.length = 0;
    rectByElement = new WeakMap<Element, Rect>();

    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function getBoundingClientRectMock() {
      const rect = rectByElement.get(this) ?? { width: 0, height: 0 };
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: rect.width,
        bottom: rect.height,
        width: rect.width,
        height: rect.height,
        toJSON() {
          return this;
        },
      } as DOMRect;
    };

    originalResizeObserver = global.ResizeObserver;
    class ResizeObserverMock {
      private readonly callback: ResizeObserverCallback;

      private readonly observed = new Set<Element>();

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        observerInstances.push({ callback: this.callback, observed: this.observed });
      }

      observe(target: Element) {
        this.observed.add(target);
      }

      disconnect() {
        this.observed.clear();
      }
    }
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

    originalRequestAnimationFrame = global.requestAnimationFrame;
    originalCancelAnimationFrame = global.cancelAnimationFrame;
    global.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as typeof requestAnimationFrame;
    global.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    if (originalResizeObserver) {
      global.ResizeObserver = originalResizeObserver;
    } else {
      (global as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = undefined;
    }
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    localStorage.clear();
  });

  it('waits for non-zero container size before injection, then resizes and adds starter block', async () => {
    const onReady = jest.fn();

    act(() => {
      root.render(<BlocklyWorkspace onWorkspaceReadyChange={onReady} />);
    });
    await flushMicrotasks();

    expect(mockBlocklyModule.inject).not.toHaveBeenCalled();

    const workspaceContainer = container.querySelector('[aria-label="Block programming workspace"]');
    expect(workspaceContainer).not.toBeNull();
    setSize(workspaceContainer as Element, 360, 240);
    triggerResizeObservers();
    await flushMicrotasks();

    expect(mockBlocklyModule.inject).toHaveBeenCalledTimes(1);
    expect(mockBlocklyModule.inject).toHaveBeenCalledWith(
      workspaceContainer,
      expect.objectContaining({
        toolbox: expect.objectContaining({
          kind: 'flyoutToolbox',
          contents: expect.arrayContaining([
            expect.objectContaining({ type: 'robot_forward' }),
          ]),
        }),
      }),
    );
    expect(mockWorkspace.getAllBlocks).toHaveBeenCalledWith(false);
    expect(mockWorkspace.newBlock).toHaveBeenCalledWith('robot_forward');
    expect(mockBlocklyModule.svgResize).toHaveBeenCalled();
    expect(mockWorkspace.resizeContents).toHaveBeenCalled();
    expect(onReady).toHaveBeenCalledWith(true);
  });

  it('keeps a single workspace instance and disposes on unmount', async () => {
    act(() => {
      root.render(<BlocklyWorkspace />);
    });

    const workspaceContainer = container.querySelector('[aria-label="Block programming workspace"]');
    expect(workspaceContainer).not.toBeNull();
    setSize(workspaceContainer as Element, 420, 300);

    triggerResizeObservers();
    await flushMicrotasks();
    triggerResizeObservers();
    await flushMicrotasks();

    expect(mockBlocklyModule.inject).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    expect(mockWorkspace.dispose).toHaveBeenCalledTimes(1);
    root = createRoot(container);
  });

  it('initializes only when container is visible', async () => {
    act(() => {
      root.render(<BlocklyWorkspace />);
    });

    const workspaceContainer = container.querySelector('[aria-label="Block programming workspace"]');
    expect(workspaceContainer).not.toBeNull();

    const element = workspaceContainer as HTMLElement;
    element.style.display = 'none';
    setSize(element, 420, 300);
    triggerResizeObservers();
    await flushMicrotasks();
    expect(mockBlocklyModule.inject).not.toHaveBeenCalled();

    element.style.display = 'block';
    triggerResizeObservers();
    await flushMicrotasks();
    expect(mockBlocklyModule.inject).toHaveBeenCalledTimes(1);
  });
});
