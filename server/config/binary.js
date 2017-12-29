var self = module.exports = {

    db: {
	
	url: process.env.MONGODB_URI || 'mongodb://username:password@ds135777.mlab.com:35777/heroku_g2ltclsl',
	collection: 'bins',
	prefix_download: 'mongoimport -h ds135777.mlab.com:35777 -d heroku_g2ltclsl -c ',
	prefix_drop:"mongo ds135777.mlab.com:35777/heroku_g2ltclsl "
    },
    backup:false
    

};
