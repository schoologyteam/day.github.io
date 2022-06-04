let cons = {};

cons.colours = {
	black: 30,
	red: 31,
	green: 32,
	yellow: 33,
	blue: 34,
	magenta: 35,
	cyan: 36,
	white: 37,
}



cons.colour = function(){
	let args = [];
	for(let i = 0; i < arguments.length; i++){
		args.push(arguments[i]);
	}

	for(let i = 0; i < args.length; i++){
		if(typeof args[i] === "string"){
			let text = args[i];

			let search, replacement;
			for(let colour in cons.colours){
				search = "@clear@";
				replacement = "\x1b[0m";
				text = text.replace(new RegExp(search, 'g'), replacement);
				search = "#clear#";
				text = text.replace(new RegExp(search, 'g'), replacement);


				search = "@dark-"+colour+"@";
				replacement = "\x1b["+cons.colours[colour]+"m";
				text = text.replace(new RegExp(search, 'g'), replacement);

				search = "@"+colour+"@";
				replacement = "\x1b[1;"+cons.colours[colour]+"m";
				text = text.replace(new RegExp(search, 'g'), replacement);

				search = "#dark-"+colour+"#";
				replacement = "\x1b["+(cons.colours[colour]+10)+"m";
				text = text.replace(new RegExp(search, 'g'), replacement);

				search = "#"+colour+"#";
				replacement = "\x1b[1;"+(cons.colours[colour]+10)+"m";
				text = text.replace(new RegExp(search, 'g'), replacement);



			}
			args[i] = text;
		}
	}

	args.push("\x1b[0m");


	console.log(...args);
}


for(let colour in cons.colours){
	cons[colour] = function() {
		cons.colour("@" + colour + "@", ...arguments);
	}
	cons[colour+"$"] = function() {
		cons.colour("#" + colour + "#", ...arguments);
	}

	let colourName = colour.substr(0,1).toUpperCase() + colour.substr(1);

	cons["dark"+colourName] = function(){
		cons.colour("@dark-"+colour+"@",...arguments);
	}

	cons["dark"+colourName+"$"] = function(){
		cons.colour("#dark-"+colour+"#",...arguments);
	}

}



module.exports = cons;