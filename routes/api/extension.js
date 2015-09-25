"use strict";
var fmt = require('util').format,
	router = require('express-promise-router')(),
	models = require('../../models'),
	Extension = models.Extension;

module.exports = router;

router.get('/extension/:extid', function(req, res) {
	return Extension.findByExtid(req.params.extid)
		.then(function(ext) {
			if ( ext ) {
				res.json(ext.data);
			} else {
				res.status(404);
				res.json({
					error: {
						message: fmt('The extension %s does not exist.', req.params.extid),
						code: 'EXT:NOT_EXIST'
					}
				});
			}
		});
});
