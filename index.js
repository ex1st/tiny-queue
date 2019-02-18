"use strict";

const { EventEmitter } = require('events');

const _storage = Symbol("storage"),
	_worker = Symbol("worker"),
	_paused = Symbol("paused"),
	_execute = Symbol("execute"),
	_next = Symbol("next"),
	_running = Symbol("running");

class Queue extends EventEmitter {
	/**
	 * Create a queue
	 * @param {Function} worker
	 * @param {Object} [params]
	 * @param {number} [params.timeout]
	 */
	constructor (worker, { timeout = 0 } = { }) {
		super();

		Object.defineProperties(this, {
			[_storage]: {
				enumerable: false,
				configurable: false,
				writable: false,
				value: new Set()
			},
			[_worker]: {
				enumerable: false,
				configurable: false,
				writable: false,
				value: worker
			},
			[_paused]: {
				enumerable: false,
				configurable: false,
				writable: true,
				value: false
			},
			[_running]: {
				enumerable: false,
				configurable: false,
				writable: true,
				value: false
			}
		});

		this.timeout = timeout;
	}

	/**
	 * a function that pauses the processing of tasks
	 */
	pause () {
		this[_paused] = true;
	}

	/**
	 * a function that resumes the processing of the queued tasks
	 */
	resume () {
		if (!this[_paused])
			return;

		this[_paused] = false;
		this[_next]();
	}

	/**
	 * add new task(s) to the queue
	 * @param {...any} tasks
	 */
	push (...args) {
		for (const task of args) {
			this[_storage].add(task);
			this[_next]();
		}
	}

	/**
	 * a function that empties
	 * remaining tasks from the queue
	 */
	kill () {
		this[_storage].clear();
	}

	/**
	 * a function returning execution state of the queue
	 * @return {Boolean} is running
	 */
	running () {
		return this[_running];
	}
}

Object.defineProperties(Queue.prototype, {
	[_next]: {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function () {
			if (this[_paused] || this[_running] || this[_storage].size === 0) {
				return;
			}

			this[_running] = true;
			const task = this[_storage].values().next().value;
			this[_storage].delete(task);

			if (this[_storage].size === 0) {
				this.emit('empty');
			}

			this[_execute](task);
		}
	},
	[_execute]: {
		enumerable: false,
		configurable: false,
		writable: false,
		value: async function (task) {
			let r, timeout;

			try {
				if (this.timeout) {
					await Promise.race([
						new Promise(resolve => {
							r = resolve;
							timeout = setTimeout(() => {
								this.emit('timeout', task);
								r = null;
								resolve();
							}, this.timeout);
						}),
						(async () => {
							const res = await this[_worker](task);
							this.emit('done', res, task);
						})()
					]);
				} else {
					const res = await this[_worker](task);
					this.emit('done', res, task);
				}
			} catch (error) {
				this.emit('error', error, task);
			} finally {
				this[_running] = false;

				if (r) {
					clearTimeout(timeout);
					r();
				}

				if (this[_storage].size === 0) {
					this.emit('drain');
				} else {
					this[_next]();
				}
			}
		}
	}
});

module.exports.Queue = Queue;