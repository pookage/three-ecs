# `three-ecs`

This library defines an Entity Component System for the three.js library, and includes a small number of core component definitions to get the ball rolling.

## Installation

1. Ensure that three.js has already been added to your `importmap`
2. Clone this repo to your project folder
3. Add `three-ecs` to your `importmap`

## Usage

The main idea is that we have an `Entity`, capable of having: 
 - other entities as children
 - components to handle functionality
 - properties for core three.js functoinality

 This is handled with the footprint:

 ```
new Entity(
	children, 
	components, 
	properties
);
 ```

### Example

```html
<html>
	<head>
		<script type="importmap">
			{
				"three":           "https://unpkg.com/three@0.157.0/build/three.module.min.js",
				"three/addons/":   "https://unpkg.com/three@0.157.0/examples/jsm/",
				"three-ecs":       "./lib/three-ecs/index.js",
				"three-ecs/":      "./lib/three-ecs/",
			}
		</script>
		<script type="module">
			// import core entities
			import { World, Entity } from "three-ecs";

			// import components to be used
			import Camera       from "three-ecs/components/camera/index.js";
			import Geometry     from "three-ecs/components/geometry/index.js";
			import LookControls from "three-ecs/components/look-controls/index.js";
			import Material     from "three-ecs/components/material/index.js";
			import Mesh         from "three-ecs/components/mesh/index.js";
			import WASDControls from "three-ecs/components/wasd-controls/index.js";


			// create a new world, containing...
			const world = new World([
				// an entity with a camera and controls to navigate around with it
				new Entity([], [
					new Camera({ fov: 60 }),
					new LookControls(),
					new WASDControls()
				], {
					position: {
						z: -5
					}
				}),
				// a red box to the left
				new Entity([], [
					new Geometry({
						primitive: "box",
						height: 1,
						width:  1,
						depth:  1
					}),
					new Material({ color: 0xff0000 }),
					new Mesh()
				], {
					position: {
						x: -1
					}
				}),
				// a blue box to the right
				new Entity([], [
					new Geometry({
						primitive: "box",
						height: 1,
						width:  1,
						depth:  1
					}),
					new Material({ color: "blue" }),
					new Mesh()
				], {
					position: {
						x: 1
					}
				})
			]);

			// add the world's scene-renderer to the DOM
			document.body.appendChild(world.canvas);
		</script>
	</head>
	<body></body>
</html>
```

### Defining your own Components

This will be expanded with more robust documentation later - but, for now, here's the gist:

```javascript
import { World, Entity } from "three-ecs";
import Component from "three-ecs/component.js";

class MyComponent extends Component {
	// CONFIG
	// ---------------------------
	static get schema(){
		return {
			propertyName: {
				type: "number", // typeof this property
				default: 0,     // what value to use if none is provided
				oneOf: [ 0, 1 ] // (optional) array of finite values this property accepts
			},
			otherPropertyName: {
				// ...etc
			}
		}
	}

	// any components listed here will activate the dependency lifecycle callbacks
	static get dependencies(){
		return [ OtherComponentName, OtherComponentName ];
	}

	// LIFECYCLE
	// ----------------------------
	// called when component created
	constructor(properties){
		super(properties);
	}

	// called when component is added to an entity
	connected(entity){
		super.connected(entity);
	}

	// called when component is removed from an entity (or attached entity is removed from the scene)
	disconnected(entity){
		super.disconnected(entity);
	}

	// called when any of the properties in the component .data are modified
	update(property, previous, current){
		super.update(property, previous, current);
	}

	// called on every animation frame
	tick(time, deltaTime){
		super.tick(time, deltaTime);
	}

	// called after every animation frame
	tock(time, deltaTime){
		super.tock(time, deltaTime);
	}


	// DEPENDENCY LIFECYCLE
	// -----------------------------
	// called whenever any of the dependencies have been added to the parent entity
	depdendencyAdded(component, componentData){
		super.depdendencyAdded(component, componentData);
	}

	// called whenever any of the properties of a dependency component are updated
	dependencyUpdated(component, property, previous, current){
		super.dependencyUpdated(component, property, previous, current);
	}

	// called whenever a dependency is removed from the parent entity
	dependencyRemoved(component){
		super.dependencyRemoved(component);
	}
}

// use the component in a scene
const world = new World([
	new Entity([], [
		new MyComponent({ propertyName: 1 })
	])
]);

document.body.appendChild(world.canvas)
```
