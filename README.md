Asynchronous (asyn-await/promise) function queue.

## Example
``` javascript
const { Queue } = require('@ex1st/tiny-queue');

const queue = new Queue(async function (task) {
  const r = await task;
  return r;
}, { timeout: 2000 });

const result = [];

// add task to the queue
queue.push(new Promise(resolve => {
  setTimeout(() => {
    resolve(1);
  }, 1000);
}));

// add task to the queue
queue.push(new Promise(resolve => {
  setTimeout(() => {
    resolve(2);
  }, 500);
}));

// add task to the queue
queue.push(new Promise(resolve => {
  setTimeout(() => {
    resolve(3);
  }, 100);
}), new Promise(resolve => {
  setTimeout(() => {
    resolve(4);
  }, 50);
}));

// add task to the queue
queue.push(new Promise(resolve => {
  setTimeout(() => {
    resolve(5);
  }, 5000);
}));

queue.on('done', function (res, task) {
  result.push(res);
});

queue.on('timeout', function (task) {
  console.log('task timed out:', task);
});

queue.on('drain', function () {
  console.log(result); // [1,2,3,4]
});
```

## Install
`npm install @ex1st/tiny-queue`

## API

### `const queue = new Queue(worker, { timeout })`
* `worker` function
* `timeout` is optional

## Instance methods
### `queue.push(...tasks)`
add new task(s) to the queue.

### `queue.pause()`
a function that pauses the processing of tasks.

### `queue.resume()`
a function that resumes the processing of the queued tasks.

### `queue.kill()`
a function that empties remaining tasks from the queue

## Events

### `queue.on('done', (result, task) => {})`
When a task is done.

### `queue.on('error', (error, task) => {})`
When a task throws an error.

### `queue.on('timeout', (task) => {})`
When timeout params milliseconds have elapsed.

### `queue.on('drain', () => {})`
When a last task from a `queue` has returned from a `worker`

### `queue.on('empty', () => {})`
When a last task from a `queue` is given to a `worker`