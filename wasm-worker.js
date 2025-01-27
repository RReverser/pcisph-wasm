import * as Comlink from 'comlink';

const initHandlers = async () => {
    const rust_wasm = await import('./pkg');
    await rust_wasm.default();
    // must be included to init rayon thread pool with web workers
    const numThreads = navigator.hardwareConcurrency;
    await rust_wasm.initThreadPool(numThreads);
    return Comlink.proxy({
        sim: null,
        numThreads: numThreads,
        init(canvas, stats) {
            this.sim = new rust_wasm.Simulation(canvas);
            const step = () => {
                stats.begin(); // collect perf data for stats.js
                this.sim.step(); // update and redraw to canvas
                stats.end();
                requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
            return this.sim.get_num_particles();
        },
        addBlock() {
            this.sim.add_block();
            return this.sim.get_num_particles();
        },
        reset() {
            this.sim.reset();
            return this.sim.get_num_particles();
        },
    });
};

Comlink.expose({ handlers: initHandlers() });