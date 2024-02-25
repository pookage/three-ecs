import { Mesh as THREEMesh } from "three";

import Component from "../../core/component/index.js";


export default class Mesh extends Component {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// helpers
	#mesh;


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get dependencies(){
		return [ "Geometry", "Material" ];
	}// dependencies

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
		const geometry        = entity.components.get("Geometry")?.geometry;
		const material        = entity.components.get("Material")?.material;
		const geometryChanged = this.#mesh?.geometry !== geometry;
		const materialChanged = this.#mesh?.material !== material;

		// generate and add the new mesh
		if(geometryChanged || materialChanged){
			// remove any existing meshes
			if(this.#mesh) entity.remove(this.#mesh)

			// build a new mesh with the new data
			const mesh = this.#mesh = this.#createMesh(geometry, material);

			// add the new mesh to the scene
			entity.add(mesh);
		}
	}// #replaceMesh
	#createMesh = (geometry, material) => {
		// add the newly-modified mesh
		return new THREEMesh(geometry, material)	
	}// #createMesh
}// Mesh
