import {fred} from "./fred.js";
import {world} from "./jim/jim.js";

for (var i = 0; i < 4; ++i) {
	console.log("hello x 1 " + world + " x " + (fred + i));
}

/**
 * bob is a great function
 */
function bob() {

}

export default {
	fred: fred
};