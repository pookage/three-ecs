import { component as Camera       } from "./camera/index.js";
import { component as Geometry     } from "./geometry/index.js";
import { component as LookControls } from "./look-controls/index.js";
import { component as Material     } from "./material/index.js";
import { component as Mesh         } from "./mesh/index.js";
import { component as WASDControls } from "./wasd-controls/index.js";

const components = [
	Camera,
	Geometry,
	LookControls,
	Material,
	Mesh,
	WASDControls
];

export default components;
