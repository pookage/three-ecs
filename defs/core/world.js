import { Scene, WebGLRenderer } from "three";

import ECSObject from "./ecs-object.js";
import { findFirstInstanceWithProperty } from "../../utils/index.js";
import { CAMERA_ADDED, CAMERA_REMOVED } from "../components/camera/index.js";


export default class World extends Scene {
	// PRIVATE PROPERTIES
	// -------------------------------------
	// config
	#samplerate; // (number) how much to upsample / downsample the user's resolution (below 1 is downsampling)

	// helpers
	#renderer;
	#camera;
	#frame;
	#deltaTime;
	#lastTickTime;

	// static state
	#isPlaying    = false;
	#components   = new Map(); // (Map) containing every Component instance attached to this entity
	#dependencies = new Map(); // (Map) which components rely on which other components on this entity


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get mappings(){ return {}; }

	// PUBLIC PROPERTIES
	get canvas()       { return this.#renderer.domElement; }
	get components()   { return this.#components;          }
	get dependencies() { return this.#dependencies;        }
	get isPlaying()    { return this.#isPlaying;           }

	// PUBLIC METHODS
	// ~~ lifecycle jazz ~~
	connected(){
		this.#updateStateDimensions();
		this.traverse(entity => {
			if(entity.isEntity) entity.connected();
		});
	}// connected
	disconnected(){
		// queue pending frame
		cancelAnimationFrame(this.#frame);

		// clear any event listeners
		window.removeEventListener("resize", this.#handleResize);
		this.removeEventListener(CAMERA_ADDED, this.#updatePrimaryCamera);
		this.removeEventListener(CAMERA_REMOVED, this.#updatePrimaryCamera);

		// apply any shared disconnected functionality
		this.traverse(entity => {
			if(entity.isEntity) entity.disconnected();
		});
	}// disconnected

	play(){
		const canPlay = !!this.#camera;

		if(canPlay){
			if(!this.#isPlaying){
				this.#isPlaying = true;
				this.traverse(entity => {
					if(entity.isEntity) entity.play();
				});

				this.#frame = requestAnimationFrame(this.#tick)
			} else {
				console.warn("[WARNING](World) You called .play() on an world that was already playing: call to play ignored.", this);
			}
		} else {
			console.warn("[WARNING](World) You called play() on a World without at least one camera - please add a camera to the scene and call .play() again when ready", this);
		}
	}// play
	pause(){
		if(this.#isPlaying){
			this.#isPlaying = false;
			cancelAnimationFrame(this.#frame);
			this.traverse(entity => {
				if(entity.isEntity) entity.pause();
			});
		} else {
			console.warn("[WARNING](World) You called .pause() on an world that was already paused: call to pause ignored.", this);
		}
	}// pause

	add(entity)   { 
		super.add(entity);
		ECSObject.add.apply(this, [ entity ]);
	}// add
	remove(entity){
		super.remove(entity);
		ECSObject.remove.apply(this, [ entity ]); 
	}// remove	

	addComponent(component){
		ECSObject.addComponent.apply(this, [ component ]);
	}// addComponent
	removeComponent(component){
		ECSObject.removeComponent.apply(this, [ component ]);
	}// removeComponent

	dispatchEvent(event, ...otherArgs){
		ECSObject.dispatchEvent.apply(this, [ event, ...otherArgs ]);
	}// dispatchEvent


	// PRIVATE LIFEYCLE JAZZ
	// -------------------------------------
	#tick = (time) => {
		// queue-up the next animation frame
		this.#frame = requestAnimationFrame(this.#tick);
		// calculate the time since our last tick
		this.#deltaTime = time - (this.#lastTickTime || time);
		// apply tick to all entities in the scene
		this.traverse(entity => {
			if(entity.isEntity){
				entity.tick(time, this.#deltaTime);
			}
		});
		// render the new scene
		this.#renderer.render(this, this.#camera);
		// apply any calculations that need to happen AFTER the animation frame
		this.#tock(time, this.#deltaTime);
		// store the time for the next deltaTime calculation
		this.#lastTickTime = time;
	}// #tick

	#tock = (time, deltaTime) => {
		this.traverse(entity => {
			if(entity.isEntity){
				entity.tick(time, this.#deltaTime);
			}
		});
	}// #tock


	// DEFAULT LIFECYCLE JAZZ
	// -------------------------------------
	constructor(children = [], components = [], properties = {}){
		super();

		ECSObject.init.apply(this, [ children, components, properties ]);

		const {
			samplerate = 1 // (number) how much to upsample / downsample the user's resolution (below 1 is downsampling)
		} = properties;

		// adopt properties
		this.#samplerate = samplerate;

		// initialise required instances
		this.#renderer = new WebGLRenderer({ antialias: true });
		this.#camera   = findFirstInstanceWithProperty.apply(this, [ "isCamera" ]);

		// add event listeners
		window.addEventListener("resize", this.#handleResize);
		this.addEventListener(CAMERA_ADDED, this.#updatePrimaryCamera);
		this.addEventListener(CAMERA_REMOVED, this.#updatePrimaryCamera);
	}// constructor


	// EVENT HANDLERS
	// -------------------------------------
	#handleResize = event => {
		requestAnimationFrame(this.#updateStateDimensions);
	}// #handleResize


	// UTILS
	// -------------------------------------
	#updateStateDimensions = () => {
		// get the dimensions of the parent that the <canvas> exists within
		const {
			width: newWidth,
			height: newHeight
		} = (this.canvas.getRootNode().host || this.canvas.parentElement || this.canvas).getBoundingClientRect();

		// if we don't have any dimensions yet, then assume something went wrong and to re-check ASAP
		if(newWidth === 0 || newHeight === 0) requestAnimationFrame(this.#updateStateDimensions)
		else {
			// calculate the new propteries based on the current viewport size & trigger state reactions
			const width  = parseInt(newWidth)  * this.#samplerate;
			const height = parseInt(newHeight) * this.#samplerate;

			this.#updateRendererDimensions(width, height);
			this.#updateCameraDimensions(width / height)
		}
	}// #updateStateDimensions

	#updateRendererDimensions = (width, height) => {
		if(width && height){
			this.#renderer.setSize(width, height, false);
		}
	}// #updateRendererDimensions

	#updateCameraDimensions = (aspectRatio) => {
		this.#camera.aspect = aspectRatio;
		this.#camera.updateProjectionMatrix();
	}// #updateCameraDimensions

	#updatePrimaryCamera = () => {
		this.#camera = findFirstInstanceWithProperty.apply(this, [ "isCamera" ]);
	}// #updatePrimaryCamera
}// World
