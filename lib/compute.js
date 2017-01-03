
module.exports = {
    DLI(json, callback){

    var data = json;
    var DLI = [];
    var _DLI = data[0].PPFD;

    for (i=1;i<data.length;i++){

	if (i==data.length-1){

	    DLI.push(JSON.parse(`{"Month":${data[i].Month},"Day365":${data[i-1].Day365},"DLI":${_DLI}}`));
	    _DLI=0;
	} else if(data[i].Month === data[i-1].Month && data[i].Day === data[i-1].Day){

	_DLI+=data[i].PPFD;

	} else {

	DLI.push(JSON.parse(`{"Month":${data[i].Month},"Day365":${data[i-1].Day365},"DLI":${_DLI}}`));
	_DLI=data[i].PPFD;
	    console.log(_DLI);
	}
    }

    callback(DLI);

    },

    GHI_to_PPFD(GHI){
	return GHI * 1.9;

    },

    GHI_to_PPFD_wrapper(_json,callback){

	var data = _json;
	for (i=0;i<data.length;i++){
	    
	    data[i].PPFD = this.GHI_to_PPFD(data[i].GHI)*1800/1000000;
	}
	
	callback(data);
    }
};
