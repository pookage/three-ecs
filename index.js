// core definitions
import World     from "./defs/core/world.js";
import Entity    from "./defs/core/entity.js";
import Component from "./defs/core/component/index.js";
import System    from "./defs/core/system.js";
import Shader    from "./defs/core/shader.glsl.js";

// component definitions
import Camera   from "./defs/components/camera/index.js";
import Geometry from "./defs/components/geometry/index.js";
import Material from "./defs/components/material/index.js";
import Mesh     from "./defs/components/mesh/index.js";

// useful utils for other libraries
import { parseUnverifiedConfig } from "./utils/index.js";

export { 
	World, Entity, Component, System, Shader,
	Camera,
	Geometry, Material, Mesh,
	parseUnverifiedConfig
};
