module.exports = function(grunt){
    grunt.initConfig({
	jshint:{
	    files:["*.js","./lib/*.js","./test/*.js"],
	    options:{
		esnext:true,
		globals:{
		    jQuery:true
		}
	    }
	},
	less:{
	    
	    development:{
		options:{
		    compress: true,
		    yuicompress: true,
		    optimization: 2
		},
		files:{
		    "public/css/style.css":[
			"less/*.less"
		    ],
		  
		}
	    }

	},
	autoprefixer:{
	    single_file:{
		src:"public/css/style.css",
		dest:"public/css/style.css",
	    }
	},
	browserify:{
	    client:{
		src:["app-client.js"],
		dest:"public/js/bundle.js",
		/*
		options:{
		    exclude:['lib/compute.js']
		}*/
	    }
	},
	watch:{
	    css:{
		files:["less/*.less","sass/*.scss"],
		tasks:["css"]
	    },
	    scripts:{
		files:["app-client.js","lib/*.js"],
		tasks:["jshint","browserify"]
	    }
	},
	cssmin:{
	    compress:{
		files:{
		    'public/css/style.min.css':[
			'public/css/style.css'
			
		    ]
		}
	    }

	}

    });
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks("grunt-autoprefixer");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    
    grunt.registerTask("css",["less","autoprefixer","cssmin"]);
    grunt.registerTask("js",["browserify"]);


    grunt.registerTask("default",["jshint","css","js"]);
    
};
