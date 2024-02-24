// core definitions
import World from "./defs/core/world.js";
import Entity from "./defs/core/entity.js";
import Component from "./defs/core/component.js";

// component definitions
import Camera from "./defs/components/camera/index.js";
import Geometry from "./defs/components/geometry/index.js";
import Material from "./defs/components/material/index.js";
import Mesh from "./defs/components/mesh/index.js";

// useful utils for other libraries
import { parseUnverifiedConfig } from "./utils/index.js";

export { 
	World, Entity, Component, 
	Camera,
	Geometry, Material, Mesh,
	parseUnverifiedConfig
};
