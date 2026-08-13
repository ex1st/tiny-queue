import { Queue } from "./index.js";
import { test } from "node:test";
import assert from "node:assert";
import { setTimeout } from "node:timers/promises";

test("processes tasks and times out slow tasks", async() => {
	const queue = new Queue(async(task) => task(), { timeout: 2000 });

	let i = 0;
	let timeoutCount = 0;
	const result = [];

	const drained = new Promise((resolve, reject) => {
		queue.on("done", function(res) {
			result.push(res);
			try {
				assert.strictEqual(res, ++i);
			} catch (error) {
				reject(error);
			}
		});

		queue.on("timeout", function() {
			timeoutCount++;
		});

		queue.on("drain", function() {
			try {
				assert.strictEqual(queue.running(), false);
				assert.deepStrictEqual(result, [1, 2, 3, 4]);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	queue.push(async() => {
		await setTimeout(1000);
		return 1;
	});

	queue.push(async() => {
		await setTimeout(500);
		return 2;
	});

	queue.push(
		async() => {
			await setTimeout(100);
			return 3;
		},
		async() => {
			await setTimeout(50);
			return 4;
		}
	);

	queue.push(async() => {
		await setTimeout(2500);
		return 5;
	});

	assert.strictEqual(queue.length(), 4);
	assert.strictEqual(queue.running(), true);

	await drained;
	assert.strictEqual(timeoutCount, 1);
});

test("continues timed-out tasks while processing the next task", async() => {
	const queue = new Queue(async(task) => task(), { timeout: 20 });
	const events = [];

	queue.on("timeout", () => events.push("timeout"));
	queue.on("done", result => events.push(`done ${result}`));

	const completed = new Promise(resolve => {
		queue.on("done", result => {
			if (result === "first") {
				resolve();
			}
		});
	});

	queue.push(
		async() => {
			await setTimeout(50);
			return "first";
		},
		async() => {
			await setTimeout(5);
			return "second";
		}
	);

	await completed;
	assert.deepStrictEqual(events, ["timeout", "done second", "done first"]);
});

test("processes distinct tasks in FIFO order", async() => {
	const results = [];
	const queue = new Queue(async(task) => task());
	queue.on("done", result => results.push(result));

	const drained = new Promise(resolve => queue.once("drain", resolve));
	queue.push(() => "first", () => "second", () => "third");

	await drained;
	assert.deepStrictEqual(results, ["first", "second", "third"]);
});

test("kill removes pending tasks without stopping the running task", async() => {
	let finishFirst;
	let runSecond = false;
	const results = [];
	const queue = new Queue(async(task) => task());
	queue.on("done", result => results.push(result));

	const firstStarted = new Promise(resolve => {
		queue.push(async() => {
			resolve();
			await new Promise(finish => {
				finishFirst = finish;
			});
			return "first";
		});
	});

	await firstStarted;
	queue.push(() => {
		runSecond = true;
		return "second";
	});
	assert.strictEqual(queue.length(), 1);

	const drained = new Promise(resolve => queue.once("drain", resolve));
	queue.kill();
	finishFirst();

	await drained;
	assert.deepStrictEqual(results, ["first"]);
	assert.strictEqual(runSecond, false);
	assert.strictEqual(queue.length(), 0);
});

test("validates constructor and filter arguments", () => {
	assert.throws(() => new Queue(), /Worker is not a function/);
	assert.throws(() => new Queue(() => {}, { timeout: Infinity }), /Timeout is not a number/);
	assert.throws(() => new Queue(() => {}, { timeout: NaN }), /Timeout is not a number/);
	assert.throws(() => new Queue(() => {}, { timeout: -1 }), /Timeout is not a number/);
	assert.throws(() => new Queue(() => {}, { timeout: 1.5 }), /Timeout is not a number/);
	assert.throws(() => new Queue(() => {}, { filter: true }), /Filter is not a function/);

	const queue = new Queue(() => {});
	assert.throws(() => queue.setFilter(null), /Filter is not a function/);
});

test("pauses, resumes, filters, and kills queued tasks", async() => {
	const queue = new Queue(async(task) => task(), {
		filter: task => typeof task === "function"
	});

	let emptyCount = 0;
	queue.on("empty", () => emptyCount++);
	queue.pause();
	queue.resume();
	queue.pause();
	queue.push("ignored", async() => 1, async() => 2);

	assert.strictEqual(queue.running(), false);
	assert.strictEqual(queue.length(), 2);

	queue.kill();
	assert.strictEqual(queue.length(), 0);
	queue.resume();
	assert.strictEqual(queue.running(), false);

	queue.pause();
	const drained = new Promise(resolve => queue.once("drain", resolve));
	queue.push(async() => 3);
	assert.strictEqual(queue.length(), 1);
	queue.resume();

	await drained;
	queue.resume();
	assert.strictEqual(emptyCount, 1);
});

test("emits empty when the last task starts", async() => {
	let finishTask;
	const events = [];
	const queue = new Queue(async(task) => task());
	queue.pause();
	queue.on("empty", () => {
		events.push("empty");
		assert.strictEqual(queue.running(), true);
		assert.strictEqual(queue.length(), 0);
	});
	queue.on("done", () => events.push("done"));
	queue.on("drain", () => events.push("drain"));

	const drained = new Promise(resolve => queue.once("drain", resolve));
	queue.push(async() => new Promise(finish => {
		finishTask = finish;
	}));
	queue.resume();

	assert.deepStrictEqual(events, ["empty"]);
	finishTask();
	await drained;
	assert.deepStrictEqual(events, ["empty", "done", "drain"]);
});

test("handles tasks without timeout and worker errors", async() => {
	const expectedError = new Error("failed task");
	const errors = [];
	const results = [];
	const queue = new Queue(async(task) => {
		if (task === "fail") {
			throw expectedError;
		}

		return task();
	});

	queue.on("done", result => results.push(result));
	queue.on("error", (error, task) => errors.push({ error, task }));

	const drained = new Promise(resolve => queue.once("drain", resolve));
	queue.push(() => 1, "fail");

	await drained;
	assert.deepStrictEqual(results, [1]);
	assert.deepStrictEqual(errors, [{ error: expectedError, task: "fail" }]);
	assert.strictEqual(queue.running(), false);
});

test("emits errors from tasks that fail after timing out", async() => {
	const expectedError = new Error("late failure");
	const queue = new Queue(async(task) => task(), { timeout: 10 });
	const errorEvent = new Promise(resolve => queue.once("error", resolve));

	queue.push(async() => {
		await setTimeout(20);
		throw expectedError;
	});

	const error = await Promise.race([
		errorEvent,
		setTimeout(100).then(() => {
			throw new Error("Timed-out task error was not emitted");
		})
	]);
	assert.strictEqual(error, expectedError);
});
