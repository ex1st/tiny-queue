const { Queue } = require('./index.js'),
	assert = require("assert");

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
queue.push(
  new Promise(resolve => {
    setTimeout(() => {
      resolve(3);
    }, 100);
  }),
  new Promise(resolve => {
    setTimeout(() => {
      resolve(4);
    }, 50);
  })
);

// add task to the queue
queue.push(new Promise(resolve => {
  setTimeout(() => {
    resolve(5);
  }, 5000);
}));

assert.equal(queue.length(), 4);
assert.equal(queue.running(), true);

queue.on('done', function (res, task) {
  result.push(res);
});

queue.on('timeout', function (task) {
  console.log('task timed out:', task);
});

queue.on('drain', function () {
  assert.equal(queue.running(), false);
  console.log(result); // 1,2,3,4
  assert.equal(result.join(","), [1,2,3,4].join(","));
});