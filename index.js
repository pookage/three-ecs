import Component from "./component.js";
import Entity from "./entity.js";
import World from "./world.js";

import components from "./components/index.js";

const componentRegistry = new Map();

// register the core definitions from three-ecs for usage in three-elements
for(const { name, definition } of components){
	componentRegistry.set(name, definition);
}

export {
	Component,
	Entity,
	World,
	components,
	componentRegistry
};
