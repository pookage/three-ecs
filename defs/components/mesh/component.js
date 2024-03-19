import { Mesh as THREEMesh } from "three";

import Component from "../../core/component/index.js";
import Geometry from "../geometry/index.js";
import Material from "../material/index.js";


export default class Mesh extends Component {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#mesh;


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES#
	static get dependencies(){
		return [ 
			Geometry, 
			Material 
		];
	}// dependencies

	static get schema(){
		return {
			castShadow: {
				default: true
			},
			receiveShadow: {
				default: true
			}
		}
	}// schema

	// PUBLIC PROPERTIES
	get mesh(){ return this.#mesh; }

	// PUBLIC METHODS
	// ~~ lifecycle methods ~~
	added(entity){
		super.added(entity); 
		this.#replaceMesh(entity); 
	}// added
	removed(entity){
		super.removed(entity); 
		entity.remove(this.#mesh); 
	}// removed

	update(property, previous, current){
		if(previous !== current){
			switch(property){
				case "castShadow":
				case "receiveShadow": {
					this.#mesh[property] = (/true/).test(current);
					break;
				}
			}
		}
	}// update

	// ~~ dependency lifecycle methods ~~
	dependencyAdded(component, data){
		super.dependencyAdded(component, data);
		this.#replaceMesh(this.entity);
	}// dependencyAdded
	dependencyUpdated(component, property, previous, current){
		super.dependencyUpdated(component, property, previous, current);
		this.#replaceMesh(this.entity);	
	}// dependencyUpdated
	dependencyRemoved(component){
		super.dependencyRemoved(component);
		this.#replaceMesh(this.entity);
	}// dependencyRemoved


	// UTILS
	// ---------------------------------
	#replaceMesh = entity => {
		const geometry = entity.getComponent(Geometry)?.geometry;
		const material = entity.getComponent(Material)?.material;

		const geometryChanged = this.#mesh?.geometry !== geometry;
		const materialChanged = this.#mesh?.material !== material;

		// generate and add the new mesh
		if(geometryChanged || materialChanged){
			// remove any existing meshes
			if(this.#mesh) entity.remove(this.#mesh)

			// build a new mesh with the new data
			const mesh = this.#mesh = this.#createMesh(geometry, material, this.data);

			// add the new mesh to the scene
			entity.add(mesh);
		}
	}// #replaceMesh
	#createMesh = (geometry, material, data) => {
		const {
			castShadow,
			receiveShadow
		} = data;

		// define the newly-modified mesh
		const mesh = new THREEMesh(geometry, material);

		console.log(this, {
			castShadow,
			receiveShadow
		})

		// configure it with schema properties
		mesh.castShadow    = castShadow;
		mesh.receiveShadow = receiveShadow;

		return mesh;
	}// #createMesh
}// Mesh
