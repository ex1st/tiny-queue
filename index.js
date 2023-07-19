const { EventEmitter } = require('node:events');

class Queue extends EventEmitter {
	#_storage = new Set();
	#_paused = false;
	#_running = false;
	#_timeout = 0;
	#_worker = async task => task;
	// eslint-disable-next-line no-unused-vars
	#_filter = task => true;

	/**
	 * Create a queue
	 * @param {Function} worker
	 * @param {Object} [params]
	 * @param {number} [params.timeout] timeout
	 * @param {Function} [params.filter] function(task) which filters incoming tasks
	 */
	constructor(worker, { timeout = 0, filter } = { }) {
		super();

		if (typeof worker !== "function")
			throw new Error("Worker is not a function");

		if (timeout && !Number.isFinite(timeout))
			throw new Error("Timeout is not a number");

		this.#_worker = worker;

		if (timeout)
			this.#_timeout = timeout;

		if (filter)
			this.setFilter(filter);
	}

	/**
	 * a function that pauses the processing of tasks
	 */
	pause() {
		this.#_paused = true;
	}

	/**
	 * a function that resumes the processing of the queued tasks
	 */
	resume() {
		if (!this.#_paused)
			return;

		this.#_paused = false;
		this.#_next();
	}

	/**
	 * add new task(s) to the queue
	 * @param {...any} tasks
	 */
	push(...args) {
		for (const task of args) {
			if (this.#_filter(task)) {
				this.#_storage.add(task);
				this.#_next();
			}
		}
	}

	/**
	 * a function that empties
	 * remaining tasks from the queue
	 */
	kill() {
		this.#_storage.clear();
	}

	/**
	 * a function returning execution state of the queue
	 * @return {Boolean} is running
	 */
	running() {
		return this.#_running;
	}

	/**
	 * a function returning the queue's size
	 * @return {integer} count of tasks
	 */
	length() {
		return this.#_storage.size;
	}

	/**
	 * a function set a custom filter
	 * @param {Function} fn function(task) which filters incoming tasks
	 */
	setFilter(fn) {
		if (typeof fn !== "function")
			throw new Error("Filter is not a function");

		this.#_filter = fn;
	}

	/**
	 * @private
	 */
	#_next() {
		if (this.#_paused || this.#_running || this.#_storage.size === 0) {
			return;
		}

		this.#_running = true;

		const [task] = this.#_storage;
		this.#_storage.delete(task);

		if (this.#_storage.size === 0) {
			this.#_storage.clear();
			this.emit('empty');
		}

		this.#_execute(task);
	}

	/**
	 * @private
	 * @param {*} task
	 * @returns {Promise<null>}
	 */
	async #_execute(task) {
		let r, timeout;

		try {
			if (this.#_timeout) {
				await Promise.race([
					new Promise(resolve => {
						r = resolve;
						timeout = setTimeout(() => {
							this.emit('timeout', task);
							r = null;
							resolve();
						}, this.#_timeout);
					}),
					(async() => {
						const res = await this.#_worker(task);
						this.emit('done', res, task);
					})()
				]);
			} else {
				const res = await this.#_worker(task);
				this.emit('done', res, task);
			}
		} catch (error) {
			this.emit('error', error, task);
		} finally {
			this.#_running = false;

			if (r) {
				clearTimeout(timeout);
				r();
			}

			if (this.#_storage.size === 0) {
				this.emit('drain');
			} else {
				this.#_next();
			}
		}
	}
}

module.exports.Queue = Queue;