import { componentRegistry } from "../../../utils/index.js";
import { CAMERA_ADDED, CAMERA_REMOVED } from "./events.js";
import definition from "./component.js";

// define how the component should be stored in the registry
const component = {
	name: "camera",
	definition
};

// automatically add this component to the registry to be used
componentRegistry.set(component.name, definition);

export { component, CAMERA_ADDED, CAMERA_REMOVED };
export default definition;