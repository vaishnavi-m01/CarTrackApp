/**
 * Polyfills for React Native
 * Needed for libraries like stompjs and sockjs-client
 */

// Mock Node.js global variables expected by some libraries
if (typeof global !== 'undefined') {
    // Basic objects
    if (!(global as any).net) (global as any).net = {};
    if (!(global as any).tls) (global as any).tls = {};

    // Process mock
    if (!(global as any).process) {
        (global as any).process = {
            env: { NODE_ENV: __DEV__ ? 'development' : 'production' },
            cwd: () => '/',
            platform: 'browser',
            nextTick: (callback: any) => setTimeout(callback, 0),
        };
    }

    // Buffer polyfill (optional, but good to have)
    // If you have 'buffer' package, use it. Otherwise, this is a minimal shim.
    if (!(global as any).Buffer) {
        try {
            (global as any).Buffer = require('buffer').Buffer;
        } catch (e) {
            console.log('Buffer polyfill not available');
        }
    }

    // EventEmitter polyfill
    // This is often what sockjs-client looks for via 'events'
    if (!(global as any).EventEmitter) {
        try {
            // Try to use events if available through a shim
            const events = require('events');
            (global as any).EventEmitter = events.EventEmitter;
        } catch (e) {
            // Extremely minimal EventEmitter if everything else fails
            class EventEmitter {
                private listeners: any = {};
                on(event: string, fn: any) { this.listeners[event] = this.listeners[event] || []; this.listeners[event].push(fn); return this; }
                emit(event: string, ...args: any[]) { (this.listeners[event] || []).forEach((fn: any) => fn(...args)); return true; }
                removeListener(event: string, fn: any) { this.listeners[event] = (this.listeners[event] || []).filter((f: any) => f !== fn); return this; }
            }
            (global as any).EventEmitter = EventEmitter;
        }
    }
}
