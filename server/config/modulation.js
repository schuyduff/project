var self = module.exports = {

    db: {

	
	url: process.env.MONGODB_URI || 'mongodb://username:password@ds135777.mlab.com:35777/heroku_w9stt6kn',
	collection: 'modulations',
	prefix_download: 'mongoexport -h ds135777.mlab.com:35777 -d heroku_w9stt6kn -c ',
	prefix_drop:"mongo ds135777.mlab.com:35777/heroku_w9stt6kn "
    },
    backup:false
    

};
