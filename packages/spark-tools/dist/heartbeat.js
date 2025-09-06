import { E as EventType } from './heartbeat-event-types-BmKuwNhb.js';

const VERSION = "e6eaa8ced2c57c9e03fd330498e892c2e2a315d9";
async function getSourceMapConsumer(sourceMap) {
    if (window.sourceMap !== undefined) {
        return await new window.sourceMap.SourceMapConsumer(sourceMap);
    }
    // @ts-ignore
    await import('https://unpkg.com/source-map@0.7.3/dist/source-map.js');
    window.sourceMap.SourceMapConsumer.initialize({
        "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm",
    });
    return await new window.sourceMap.SourceMapConsumer(sourceMap);
}
async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Check whether the root element of the app exists.
 */
function getRootElement() {
    return document.getElementById("root");
}
/**
 * Checks if the given element is null or empty.
 */
function isEmptyElement(element) {
    if (element === null) {
        return true; // Treat missing element as empty
    }
    return element.textContent?.trim() === "";
}
async function monitorRootElement() {
    await wait(200); // Wait a bit for the root element to be rendered
    console.info("Root element monitoring enabled");
    let checkInterval = 500; // Start with 500 milliseconds
    const checkRootElement = () => {
        const rootElement = getRootElement();
        window.parent.postMessage({
            type: EventType.ROOT_ELEMENT_STATUS,
            payload: {
                timestamp: Date.now(),
                isEmpty: isEmptyElement(rootElement),
                exists: !!rootElement,
            },
        }, "*");
        clearInterval(intervalId);
        checkInterval = 3000;
        intervalId = setInterval(checkRootElement, checkInterval);
    };
    let intervalId = setInterval(checkRootElement, checkInterval);
    checkRootElement();
}
// Handle JavaScript errors
function setupErrorListener() {
    console.info("Runtime heartbeat enabled");
    window.addEventListener("error", (event) => {
        const { message, filename, lineno, colno } = event;
        fetch(filename)
            .then(async (response) => {
            if (response.ok) {
                const rawFile = await response.text();
                const base64SourceMap = rawFile.split("# sourceMappingURL=").pop();
                const rawBase64SourceMap = base64SourceMap.split("data:application/json;base64,").pop();
                const sourceMap = JSON.parse(atob(rawBase64SourceMap));
                const consumer = await getSourceMapConsumer(sourceMap);
                const originalPosition = consumer.originalPositionFor({
                    line: lineno,
                    column: colno,
                });
                const payload = {
                    line: originalPosition.line,
                    column: originalPosition.column,
                    path: new URL(filename).pathname,
                    message,
                };
                window.parent.postMessage({
                    type: EventType.SPARK_RUNTIME_ERROR,
                    payload,
                }, "*");
            }
        })
            .catch(() => {
            const payload = {
                line: lineno,
                column: colno,
                path: new URL(filename).pathname,
                message,
                sourceMap: false,
            };
            window.parent.postMessage({
                type: EventType.SPARK_RUNTIME_ERROR,
                payload,
            }, "*");
        });
    });
}
function initializeViteHeartbeat() {
    const viteServerSessionId = import.meta.env.VITE_SERVER_SESSION_ID || "unset";
    console.info("Vite heartbeat enabled. Server session ID:", viteServerSessionId);
    import.meta.hot?.on("vite:ws:connect", () => {
        window.parent.postMessage({
            type: EventType.SPARK_VITE_WS_CONNECT,
            payload: { timestamp: Date.now(), viteServerSessionId },
        }, "*");
    });
    import.meta.hot?.on("vite:ws:disconnect", () => {
        window.parent.postMessage({
            type: EventType.SPARK_VITE_WS_DISCONNECT,
            payload: { timestamp: Date.now(), viteServerSessionId },
        }, "*");
    });
    import.meta.hot?.on("vite:error", (error) => {
        window.parent.postMessage({
            type: EventType.SPARK_VITE_ERROR,
            payload: { error, timestamp: Date.now(), viteServerSessionId },
        }, "*");
    });
    import.meta.hot?.on("vite:afterUpdate", (updateInfo) => {
        window.parent.postMessage({
            type: EventType.SPARK_VITE_AFTER_UPDATE,
            payload: { updateInfo, timestamp: Date.now(), viteServerSessionId },
        }, "*");
        if (isEmptyElement(getRootElement())) {
            wait(100).then(() => {
                window.location.reload();
            });
        }
    });
}
function heartbeat() {
    console.info(`Spark Tools version: ${VERSION}`);
    setupErrorListener();
    monitorRootElement();
    // Tell parent the runtime is ready.
    window.parent.postMessage({
        type: EventType.SPARK_RUNTIME_PING,
        payload: {
            version: VERSION,
            timestamp: Date.now(),
        },
    }, "*");
}
heartbeat();
if (import.meta.hot) {
    initializeViteHeartbeat();
}

export { setupErrorListener };
//# sourceMappingURL=heartbeat.js.map
