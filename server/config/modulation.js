var self = module.exports = {

    db: {
	
	url: process.env.MONGODB_URI || 'mongodb://username:password@ds135547.mlab.com:35547/heroku_4f0dk9pz',
	collection: 'modulations',
	prefix_download: 'mongoexport -h ds135547.mlab.com:35547 -d heroku_4f0dk9pz -c ',
	prefix_drop:"mongo ds135547.mlab.com:35547/heroku_4f0dk9pz "
    },
    backup:false
    

};
