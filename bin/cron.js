#!/usr/bin/env node
"use strict";
process.bin = process.title = 'mediawiki-extensionservice-cron';
require('../lib/check-env');
var Promise = require('bluebird');
Promise.longStackTraces();

// We'll be piping multiple streams into stdout and stderr in parallel so bump up the max listeners
process.setMaxListeners(20);
process.stdout._maxListeners = 20;
process.stderr._maxListeners = 20;

var params = require('nomnom')()
		.script('bin/cron.js')
		.help("Service script intended to be run by cron which fetches all extensions and extracts their metadata.")
		.option('fetch', {
			flag: true,
			default: false,
			help: "Pass as --no-fetch to run without updating extension data (unknown extensions will still be cloned)"
		})
		.option('debug', {
			flag: true,
			default: false,
			help: "Print extension scan errors right away instead of collecting them."
		})
		.parse(),
	_ = require('lodash'),
	fmt = require('util').format,
	path = require('path'),
	chalk = require('chalk'),
	moment = require('moment'),
	gerrit = require('../lib/gerrit'),
	git = require('../lib/git'),
	models = require('../models'),
	Extension = models.Extension,
	ExtensionFailure = models.ExtensionFailure,
	ExtensionScanJob = models.ExtensionScanJob;

ExtensionScanJob.create({ startedAt: moment().toDate() })
	.then(function(scanJob) {
		// Fetch extensions
		return gerrit.getExtensions()
			.map(
				function(ext) {
					var extension = {
							id: ext.name,
							versionHint: undefined,
							sources: [],
							preferedSource: undefined
						},
						isCloned = git.isCloned(ext.name),
						cloned = isCloned.then(function(exists) {
								if ( !exists ) {
									return git.clone(ext.name, {
										url: fmt('https://git.wikimedia.org/git/%s.git', ext.path)
									});
								}
							});

					return Promise.join(isCloned, cloned)
						.spread(function(newRepo) {
							if ( params.fetch !== false || newRepo ) {
								return git.fetch(ext.name, {remote: 'origin'});
							}
						})
						.then(function() {
							var HEAD = git.hasRef(ext.name, 'HEAD')
									.then(function(ok) {
										// Some extension repositories do not have a HEAD so fall back to master on these repositories.
										return ok ? 'HEAD' : 'master';
									}),
								files = HEAD.then(function(HEAD) {
										return git.lsTree(ext.name, {tree: HEAD});
									})
									.then(function(tree) {
										function readJSON(name) {
											var object = _.find(tree, {type: 'blob', name: name});
											if ( object ) {
												return git.catBlob(ext.name, {sha1: object.sha1, encoding: 'utf8'})
													.then(JSON.parse);
											} else {
												return Promise.resolve();
											}
										}

										return {
											'composer.json': readJSON('composer.json'),
											'extension.json': readJSON('extension.json')
										};
									}),
								composerData = files.get('composer.json'),
								extensionData = files.get('extension.json'),
								refs = git.showRefs(ext.name).then(_).call('pluck', 'ref').call('value'),
								heads = refs.then(function(refs) {
										return _(refs)
											.filter(function(ref) {
												return /^refs\/heads\//.test(ref);
											})
											.map(function(ref) {
												return ref.replace(/^refs\/heads\//, '');
											})
											.value();
									}),
								tags = refs.then(function(refs) {
										return _(refs)
											.filter(function(ref) {
												return /^refs\/tags\//.test(ref);
											})
											.map(function(ref) {
												return ref.replace(/^refs\/tags\//, '');
											})
											.value();
									}),
								i18n = Promise.join(extensionData, HEAD)
									.spread(function(extensionData, HEAD) {
										if ( !extensionData ) { return; }
										if ( !extensionData.MessagesDirs ) { return; }
										// Skip i18n if it's not even used
										if ( !extensionData.namemsg && !extensionData.descriptionmsg ) { return; }

										return Promise.resolve(_(extensionData.MessagesDirs).values().flatten().value())
											.map(function(dir) {
												return git.catFile(ext.name, HEAD, path.join(dir, 'en.json'))
													.then(JSON.parse)
													.catch(function() {
														// If there's any trouble with the file (doesn't exist, it's part of a submodule, it's invalid, etc...)
														// then just return {} to pass over the data.
														return {};
													});
											}, {concurrency: 5})
											.reduce(function(a, b) {
												return _.merge(a, b);
											}, {});
									});

							return Promise.join(i18n, composerData, extensionData, heads, tags, git.getSymbolicRef(ext.name, 'HEAD'), git.hasRef(ext.name, 'master'))
								.spread(function(i18n, composerData, extensionData, heads, tags, HEAD, master) {
									extension.name = extension.id;

									extension.repository = fmt('https://git.wikimedia.org/git/%s.git', ext.path);

									if ( extensionData ) {
										// Extract some data from the extension.json
										extension.name = extensionData.name || extension.name;
										extension.description = extensionData.description;
										extension.versionHint = extensionData.version;
										// extensionData.author could be examined for authors in the future if we find a use for them.

										// If we managed to read the i18n support {name,description}msg
										if ( i18n ) {
											if ( extensionData.namemsg && i18n[extensionData.namemsg] ) {
												extension.name = i18n[extensionData.namemsg];
											}
											if ( extensionData.descriptionmsg && i18n[extensionData.descriptionmsg] ) {
												extension.description = i18n[extensionData.descriptionmsg];
											}
										}
									}

									if ( composerData && composerData.name ) {
										// Add composer support
										extension.composerName = composerData.name;
										extension.sources.push('composer');
									}

									// composerData && console.log(composerData);
									// extensionData && console.log(extensionData);

									var releaseBranches = _(heads)
											.filter(function(ref) {
												return /^REL\d+_\d+$/.test(ref);
											})
											.value(),
										versionTags = _(tags)
											.filter(function(ref) {
												return /^v?\d+\.\d+(\.\d+)?$/.test(ref);
											})
											.value();

									if ( versionTags.length > 0 ) {
										// Add support for v#.#.# or #.#.# style version tags.
										extension.sources.push('git-tag');
									}

									if ( HEAD && /^refs\/heads\//.test(HEAD) && HEAD !== 'refs/heads/master' ) {
										// Add support for a custom stable branch
										extension.stableBranch = HEAD.replace(/^refs\/heads\//, '');
										extension.sources.push('git-stable');
									}

									if ( master ) {
										// Add git master branch support
										extension.sources.push('git-master');
									}

									if ( releaseBranches.length > 0 ) {
										// Add support for REL#_## branches
										extension.sources.push('git-rel');
									}

									function findOrInitialize(opts) {
										// Sequelize's findOrInitialize currently runs validation which causes problems so we have to implement our own for now
										// Once a fix has been released for (https://github.com/sequelize/sequelize/issues/3175) we can upgrade Sequelize and drop this code
										return Extension.find({ where: opts.where })
											.then(function(instance) {
												if ( instance ) {
													return [instance, false];
												} else {
													return [Extension.build(opts.defaults), true];
												}
											});
									}

									return /*Extension.*/findOrInitialize({ where: { extid: extension.id }, defaults: { extid: extension.id } })
										.spread(function(ext, initialized) {
											ext.composerName = extension.composerName;
											ext.data = JSON.stringify(extension);

											return ext.save(initialized ? undefined : ['composerName', 'data']);
										})
										.then(extension);
								});
						})
						.catch(function(err) {
							console.error(err);
							throw err;
						})
						.reflect()
						.then(function(promise) {
							return {
								promise: promise,
								extension: extension
							};
						});
				},
				{concurrency: 5})
			.then(function(results) {
				var fulfilled = _.filter(results, function(result) { return result.promise.isFulfilled(); }),
					rejected = _.filter(results, function(result) { return result.promise.isRejected(); });

				if ( fulfilled.length ) {
					console.log(chalk.green(fmt('%d extensions scanned.', fulfilled.length)));
				}

				if ( rejected.length ) {
					console.error(chalk.red(fmt('Failed to scan %d extensions.', rejected.length)));

					// Print up to 5 results
					console.log('');
					_.take(rejected, 5)
						.forEach(function(result) {
							var err = result.promise.reason();
							console.log(chalk.red(String(err.stack || err).replace(/^/mg, result.extension.id + ': ')));
							console.log('');
						});

					// @todo Should we log extension errors to the database?
					return Promise.all(rejected)
						.map(function(result) {
							var err = result.promise.reason();
							return ExtensionFailure.create({
								ScanId: scanJob.id,
								extid: result.extension.id,
								error: String(err.stack || err)
							});
						}, { concurrency: 2 })
						.finally(function() {
							scanJob.extensions = fulfilled.length;
							scanJob.failures = rejected.length;

							return scanJob.save(['extensions', 'failures']);
						});
				}
			})
			.finally(function() {
				scanJob.endedAt = moment().toDate();

				return scanJob.save(['endedAt']);
			});
	});
