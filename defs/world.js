import { Scene, WebGLRenderer } from "three";

import ECSObject from "./ecs-object/js";
import { findFirstInstanceWithProperty } from "../utils/index.js";


export default class World extends Scene {
	// INSTANCE PROPERTIES
	// -------------------------------------
	// config
	#samplerate; // (number) how much to upsample / downsample the user's resolution (below 1 is downsampling)

	// helpers
	#renderer;
	#frame;
	#lastTickTime;

	// static state
	#isPlaying    = false;
	#components   = new Map(); // (Map) containing every Component instance attached to this entity
	#dependencies = new Map(); // (Map) which components rely on which other components on this entity

	// reactive state
	#state = new Proxy({
		height:      undefined,
		width:       undefined,
		aspectRatio: undefined
	}, {
		set(obj, property, value){
			const success = Reflect.set(obj, property, value);

			switch(property){
				case "height":
				case "width": {
					this.#updateRendererDimensions(obj.width, obj.height);
					break;
				}
				case "aspectRatio": {
					this.#updateCameraDimensions(value);
					break;
				}
			}
			return success;
		}
	});


	// INTERFACE
	// -------------------------------------
	// PUBLIC PROPERTIES
	get canvas()       { return this.#renderer.domElement; }
	get components()   { return this.#components;          }
	get dependencies() { return this.#dependencies;        }
	get isPlaying()    { return this.#isPlaying;           }

	// PUBLIC METHODS
	// ~~ lifecycle jazz ~~
	connected(){
		ECSObject.connected.apply(this);
	}// connected
	disconnected(){
		window.removeEventListener("resize", this.#resizeHandler);
		cancelAnimationFrame(this.#frame);

		ECSObject.disconnected.apply(this);
	}// disconnected

	play(){
		const canPlay = !!this.#camera;

		if(canPlay){
			if(!this.#isPlaying){
				this.#isPlaying = true;
				ECSObject.play.apply(this);

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
			ECSObject.pause.apply(this);
		} else {
			console.warn("[WARNING](World) You called .pause() on an world that was already paused: call to pause ignored.", this);
		}
	}// pause

	add(entity)   { 
		ECSObject.add.apply(this, entity);
	}// add
	remove(entity){
		ECSObject.remove.apply(this, entity); 
	}// remove	

	addComponent(component){
		ECSObject.addComponent.apply(this, component);
	}// addComponent
	removeComponent(component){
		ECSObject.removeComponent.apply(this, component);
	}// removeComponent

	dispatchEvent(event, ...otherArgs){
		ECSObject.dispatchEvent.apply(this, event, ...otherArgs);
	}// dispatchEvent


	// PRIVATE LIFEYCLE JAZZ
	// -------------------------------------
	#tick = (time) => {
		// queue-up the next animation frame
		this.#frame = requestAnimationFrame(this.#tick);
		// calculate the time since our last tick
		this.#deltaTime = time - (this.#lastTickTime || time);
		// apply tick to all entities in the scene
		ECSObject.tick.apply(this, time, this.#deltaTime);
		// render the new scene
		this.#renderer.render(this, this.#camera);
		// apply any calculations that need to happen AFTER the animation frame
		this.#tock(time, this.#deltaTime);
		// store the time for the next deltaTime calculation
		this.#lastTickTime = time;
	}// #tick

	#tock = (time, deltaTime) => {
		ECSObject.tock.apply(this, time, deltaTime);
	}// #tock


	// DEFAULT LIFECYCLE JAZZ
	// -------------------------------------
	constructor(children = [], components = [], properties = {}){
		super();

		ECSObject.init.apply(this, children, components, properties);

		const {
			samplerate = 1 // (number) how much to upsample / downsample the user's resolution (below 1 is downsampling)
		} = properties;

		// adopt properties
		this.#samplerate = samplerate;

		// initialise required instances
		this.#renderer = new WebGLRenderer({ antialias: true });
		this.#camera   = findFirstInstanceWithProperty.apply(this, "isCamera");

		// add event listeners
		window.addEventListener("resize", this.#handleResize);
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
		} = (this.canvas.getRootNode().host || this.canvas.parentElement).getBoundingClientRect();

		// if we don't have any dimensions yet, then assume something went wrong and to re-check ASAP
		if(newWidth === 0 || newHeight === 0) requestAnimationFrame(this.#updateStateDimensions)
		else {
			// calculate the new propteries based on the current viewport size & trigger state reactions
			const width  = this.#state.width  = parseInt(newWidth)  * this.#samplerate;
			const height = this.#state.height = parseInt(newHeight) * this.#samplerate;
			this.#state.aspectRatio = width / height;
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
}// World
