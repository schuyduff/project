
module.exports = function computeDLI(json, callback){

    var data = json;
    var DLI = [];
    var _DLI = data[0].GHI;

    for (i=1;i<data.length;i++){

	if (i==data.length-1){

	    DLI.push(JSON.parse(`{"Month":${data[i].Month},"Day365":${data[i-1].Day365},"DLI":${_DLI}}`));
 
	} else if(data[i].Month === data[i-1].Month && data[i].Day === data[i-1].Day){

	_DLI+=data[i].GHI;

	} else {

	DLI.push(JSON.parse(`{"Month":${data[i].Month},"Day365":${data[i-1].Day365},"DLI":${_DLI}}`));
	_DLI=data[i].GHI;
	}
    }

    callback(DLI);
};
