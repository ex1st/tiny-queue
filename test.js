/* eslint-disable no-unused-vars */
"use strict";

const { Queue } = require('./index.js');
const assert = require('node:assert');
const { setTimeout } = require('node:timers/promises');

const queue = new Queue(async (task) => task(), { timeout: 2000 });
const tracker = new assert.CallTracker();

let i = 0;
const result = [];

// add task to the queue
queue.push(async () => {
	await setTimeout(1000);
	return 1;
});

// add task to the queue
queue.push(async () => {
	await setTimeout(500);
	return 2;
});

// add task to the queue
queue.push(
	async () => {
		await setTimeout(100);
		return 3;
	},
	async () => {
		await setTimeout(50);
		return 4;
	}
);

// add task to the queue
queue.push(async () => {
	await setTimeout(2500);
	return 5;
});

assert.strictEqual(queue.length(), 4);
assert.strictEqual(queue.running(), true);

queue.on('done', function (res, task) {
	console.log('done', res);
	result.push(res);

	assert.strictEqual(res, ++i);
});

queue.on('timeout', tracker.calls(async function (task) {
	console.log('timeout');
}, 1));

queue.on('drain', function () {
	assert.strictEqual(queue.running(), false);
	console.log('drain', result); // [ 1, 2, 3, 4 ]
	assert.deepStrictEqual(result, [1, 2, 3, 4]);
});

process.on('exit', () => {
	tracker.verify();
});

/* should be printed:
    done 1
    done 2
    done 3
    done 4
    timeout
    drain [ 1, 2, 3, 4 ]
    done 5
*/