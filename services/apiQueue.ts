// services/apiQueue.ts

interface QueuedTask {
  task: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

const queue: QueuedTask[] = [];
let activeRequests = 0;
const MAX_CONCURRENCY = 2;

let onQueueChangeCallback: (active: number, waiting: number) => void = () => {};

/**
 * Notifies the UI listener about the current queue status.
 */
function notifyQueueChange() {
  onQueueChangeCallback(activeRequests, queue.length);
}

/**
 * Processes the next task in the queue if concurrency limit is not reached.
 */
async function processQueue() {
  if (activeRequests >= MAX_CONCURRENCY || queue.length === 0) {
    return;
  }

  activeRequests++;
  notifyQueueChange();
  
  const { task, resolve, reject } = queue.shift()!;
  
  try {
    const result = await task();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    activeRequests--;
    notifyQueueChange();
    processQueue(); // Process the next item
  }
}

/**
 * Adds a task to the API queue.
 * @param task The async function to execute.
 * @returns A promise that resolves or rejects when the task is completed.
 */
export function enqueue<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ task, resolve, reject });
    notifyQueueChange();
    processQueue();
  });
}

/**
 * Sets a callback function to be invoked when the queue status changes.
 * @param callback The function to call with active and waiting counts.
 */
export function onQueueChange(callback: (active: number, waiting: number) => void) {
    onQueueChangeCallback = callback;
}
