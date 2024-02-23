import { componentRegistry } from "../../../utils/index.js";
import definition from "./component.js";

// define how the component should be stored in the registry
const component = {
	name: "geometry",
	definition
};

// automatically add this component to the registry to be used
componentRegistry.set(component.name, definition);

export { component };
export default definition;
