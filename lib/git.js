"use strict";
var _ = require('lodash'),
	Promise = require('bluebird'),
	fs = Promise.promisifyAll(require('graceful-fs')),
	path = require('path'),
	fmt = require('util').format,
	chalk = require('chalk'),
	child_process = require('child_process'),
	LineWrapper = require('stream-line-wrapper'),
	LineStream = require('byline').LineStream,
	es = require('event-stream'),
	streamToArray = Promise.promisify(require('stream-to-array')),
	getRawBody = Promise.promisify(require('raw-body'));

function getPath(name) {
	return path.join(process.env.STORAGE_DIR, name + '.git');
}

exports.getPath = getPath;

function git() {
	var args = _.toArray(arguments),
		opts = {},
		_pipes = [],
		_captureArray = false;

	if ( _.isObject(_.last(args)) ) {
		opts = args.pop();
	}

	function run(o) {
		o = o || {};
		return new Promise(function(resolve, reject) {
			var child = child_process.spawn(process.env.GIT_BIN || 'git', args, {
					cwd: opts.cwd,
					stdio: ['ignore', o.output === 'ignore' ? 'ignore' : 'pipe', o.output === 'ignore' ? 'ignore' : 'pipe']
				}),
				_capturePromise;

			if ( o.output === 'capture' ) {
				var stream = child.stdout;

				if ( _captureArray ) {
					stream.setEncoding('utf8');
				}

				_.each(_pipes, function(pipe) {
					stream = stream.pipe(pipe);
				});

				if ( _captureArray ) {
					_capturePromise = streamToArray(stream);
				} else {
					_capturePromise = getRawBody(stream, {encoding: o.encoding});
				}
			} else if ( o.output === 'pass' ) {
				child.stdout
					.pipe(new LineWrapper({ prefix: o.prefix || '' }))
					.pipe(process.stdout);
			}

			if ( o.output !== 'ignore' ) {
				child.stderr
					.pipe(new LineWrapper({ prefix: o.prefix || '' }))
					.pipe(process.stderr);
			}

			child.on('error', function(err) {
				reject(err);
			});

			child.on('close', function(code) {
				if ( _capturePromise ) {
					_capturePromise
						.then(function(output) {
							return {
								proc: child,
								code: code,
								output: output
							};
						})
						.then(resolve, reject);
				} else {
					resolve({
						proc: child,
						code: code
					});
				}
			});
		});
	}

	return {
		push: function(arg) {
			args.push(arg);
		},
		ok: function(opts) {
			opts = opts || {};
			return run({output: 'ignore', prefix: opts.prefix})
				.then(function(c) {
					return c.code === 0;
				});
		},
		pass: function(opts) {
			opts = opts || {};
			opts.prefix = opts.prefix || '';
			return run({output: 'pass', prefix: opts.prefix})
				.then(function(c) {
					if ( c.code === 0 ) {
						return true;
					} else {
						return Promise.reject(new Error(opts.prefix + fmt('git returned exit code %d', c.code)));
					}
				});
		},
		capture: function(opts) {
			opts = opts || {};
			opts.prefix = opts.prefix || '';
			return run({output: 'capture', prefix: opts.prefix})
				.then(function(c) {
					if ( c.code === 0 ) {
						return c.output;
					} else {
						return Promise.reject(new Error(opts.prefix + fmt('git returned exit code %d', c.code)));
					}
				});
		},
		streamCapture: function(opts) {
			opts = opts || {};
			opts.prefix = opts.prefix || '';
			return {
				pipe: function(stream) {
					_pipes.push(stream);
					return this;
				},
				array: function() {
					_captureArray = true;
					return this.run();
				},
				run: function() {
					return run({output: 'capture', prefix: opts.prefix})
						.then(function(c) {
							if ( c.code === 0 ) {
								return c.output;
							} else {
								return Promise.reject(new Error(opts.prefix + fmt('git returned exit code %d', c.code)));
							}
						});
				},
				then: function() {
					var p = this.run();
					return p.then.apply(p, arguments);
				}
			};
		},
		oneline: function(opts) {
			opts = opts || {};
			return this.capture({encoding: 'utf8'})
				.then(function(text) {
					return String(text).replace(/\n+$/, '');
				});
		}
	};
}

exports.isCloned = function(name) {
	return fs.statAsync(getPath(name))
		.then(
			function(stats) {
				if ( stats.isDirectory() ) {
					return git('rev-parse', '--git-dir', {cwd: getPath(name)}).ok();
				} else {
					return false;
				}
			},
			function(err) {
				if ( err.code === 'ENOENT' ) {
					return false;
				} else {
					throw err;
				}
			});
};

// exports.hasRevs = function(name) {
// 	if ( !name ) {
// 		return Promise.reject(new Error("name: Extension name must be specified."));
// 	}

// 	return git('show-ref', {cwd: getPath(name)}).ok();
// };

exports.hasRef = function(name, ref) {
	if ( !name ) {
		return Promise.reject(new Error("name: Extension name must be specified."));
	}

	return git('rev-parse', ref, {cwd: getPath(name)}).ok();
};

exports.getSymbolicRef = function(name, ref) {
	if ( !name ) {
		return Promise.reject(new Error("name: Extension name must be specified."));
	}

	return git('symbolic-ref', ref, {cwd: getPath(name)}).oneline();
};

exports.fetch = function(name, opts) {
	opts = opts || {};

	if ( !name ) {
		return Promise.reject(new Error("name: Extension name must be specified."));
	}

	console.log(chalk.cyan(fmt('Fetching %s', name)));
	var cmd = git({cwd: getPath(name)});
	cmd.push('fetch');
	if ( opts.all ) {
		cmd.push('--all');
	}
	if ( opts.remote ) {
		cmd.push(opts.remote);
	}

	return cmd.pass({prefix: name + ': '});
};

exports.clone = function(name, opts) {
	opts = opts || {};
	if ( opts.bare === undefined ) { opts.bare = true; }

	if ( !name ) {
		return Promise.reject(new Error("name: Extension name must be specified."));
	}
	if ( !opts.url ) {
		return Promise.reject(new Error("url: Repository URL must be specified."));
	}

	console.log(chalk.cyan(fmt('Cloning %s', name)));
	var cmd = git();
	cmd.push('clone');
	if ( opts.bare ) {
		cmd.push('--bare');
	}

	cmd.push(opts.url);
	cmd.push(getPath(name));
	return cmd.pass({prefix: name + ': '});
};

exports.lsTree = function(name, opts) {
	opts = opts || {};

	if ( !name ) {
		return Promise.reject(new Error("name: Extension name must be specified."));
	}
	if ( !opts.tree ) {
		return Promise.reject(new Error("tree: Tree-ish must be specified."));
	}

	var cmd = git({cwd: getPath(name)});
	cmd.push('ls-tree');

	cmd.push(opts.tree);
	return cmd.streamCapture()
		.pipe(new LineStream())
		.pipe(es.mapSync(function(line) {
			var m = line.match(/^(\d+) ([^ ]+) ([0-9a-f]+)\t(.+)$/);
			return {
				mode: parseInt(m[1], 10),
				type: m[2],
				sha1: m[3],
				name: m[4]
			};
		}))
		.array();
};

exports.catBlob = function(name, opts) {
	opts = opts || {};

	if ( !name ) {
		return Promise.reject(new Error("name: Extension name must be specified."));
	}
	if ( !opts.sha1 ) {
		return Promise.reject(new Error("sha1: Object sha1 must be specified."));
	}

	return git('cat-file', 'blob', opts.sha1, {cwd: getPath(name)}).capture({encoding: opts.encoding});
};

exports.catFile = function(name, ref, filename, opts) {
	opts = opts || {};

	if ( !name ) {
		return Promise.reject(new Error("name: Extension name must be specified."));
	}
	if ( !ref ) {
		return Promise.reject(new Error("ref: Commit ref must be specified."));
	}
	if ( !filename ) {
		return Promise.reject(new Error("filename: Object filename must be specified."));
	}
	return git('cat-file',
		'blob',
		fmt('%s:%s', ref, filename),
		{cwd: getPath(name)})
			.capture({encoding: opts.encoding});
};

exports.showRefs = function(name, opts) {
	opts = opts || {};

	if ( !name ) {
		return Promise.reject(new Error("name: Extension name must be specified."));
	}

	return git('show-ref', {cwd: getPath(name)})
		.streamCapture()
		.pipe(new LineStream())
		.pipe(es.mapSync(function(line) {
			var m = line.match(/^([0-9a-f]+) (.+)$/);
			return {
				sha1: m[1],
				ref: m[2]
			};
		}))
		.array();
};
