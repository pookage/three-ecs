import { Mesh as THREEMesh } from "three";
import Component from "./../../component.js";

export default class Mesh extends Component {
	// CONFIG
	// -------------------------------------
	static get dependencies(){
		return [ "Geometry", "Material" ];
	}// dependencies


	// INTERFACE
	// -------------------------------------
	get mesh(){ return this.#mesh }


	// PROPERTIES
	// -------------------------------------
	#mesh;


	// LIFECYCLE JAZZ
	// -------------------------------------
	connected(entity){
		super.connected(entity);

		this.#createMesh(entity);
	}// connected

	disconnected(entity){
		super.disconnected(entity);

		entity.remove(this.#mesh);
	}// disconnected


	// DEPENDENCY LIFECYCLE
	// ---------------------------------
	dependencyAdded(component, data){
		this.#createMesh(this.entity);
	}// dependencyAdded
	dependencyUpdated(component, property, previous, current){
		this.#createMesh(this.entity);
	}// dependencyUpdated
	dependencyRemoved(component){
		this.#createMesh(this.entity);
	}// dependencyRemoved


	// UTILS
	// ---------------------------------
	#createMesh = (entity) => {
		const geometry = entity.components.get("Geometry")?.geometry;
		const material = entity.components.get("Material")?.material;

		// remove any existing meshes
		if(this.#mesh) entity.remove(this.#mesh)

		// generate and add the new mesh
		if(geometry && material){
			const mesh = this.#mesh = new THREEMesh(geometry, material)	
			entity.add(mesh);
		}
	}// #createMesh
}// Mesh
