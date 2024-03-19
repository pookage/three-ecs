import { Scene, WebGLRenderer, PCFSoftShadowMap, SRGBColorSpace } from "three";

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
	#isConnected  = false;
	#systems      = new Map(); // (Map) containing every System instance attached to this entity
	#components   = new Map(); // (Map) containing every Component instance attached to this entity
	#dependencies = new Map(); // (Map) which components rely on which other components on this entity


	// INTERFACE
	// -------------------------------------
	// STATIC PROPERTIES
	static get mappings(){ return {}; }

	// PUBLIC PROPERTIES
	// ~~ getters ~~
	get canvas()       { return this.#renderer.domElement; }
	get systems()      { return this.#systems;             }
	get components()   { return this.#components;          }
	get dependencies() { return this.#dependencies;        }
	get isPlaying()    { return this.#isPlaying;           }
	get isConnected()  { return this.#isConnected;         }
	get isAdded()      { return true;                      }

	// ~~ setters ~~
	set isConnected(isConnected){ this.#isConnected = isConnected; }

	// PUBLIC METHODS
	// ~~ lifecycle jazz ~~
	constructor(
		children   = [], 
		systems    = [], 
		components = [], 
		properties = {}
	){
		super();

		ECSObject.init.call(this, children, systems, components, properties);

		const {
			samplerate    = 1,        // (number) how much to upsample / downsample the user's resolution (below 1 is downsampling)
			clearColor    = 0xffffff, // (Color) what colour to clear the canvas with between frames
			opacity       = 1.0,      // (number)[0-1] what opacity to apply to the clearColor
			enableShadows = true      // (boolean) whether or not to use the THREE.js shadows in the scene
		} = properties;

		// adopt properties
		this.#samplerate = samplerate;

		// initialise required instances
		const renderer = this.#renderer = new WebGLRenderer({ 
			antialias: true
		});
		this.#camera = findFirstInstanceWithProperty.call(this, "isCamera");

		// configure core instances
		renderer.setClearColor(clearColor, opacity);
		renderer.shadowMap.enabled = enableShadows;
		renderer.shadowMap.type    = PCFSoftShadowMap;
		renderer.outputColorSpace = SRGBColorSpace;

		// add event listeners
		window.addEventListener("resize", this.#handleResize);
		this.addEventListener(CAMERA_ADDED, this.#updatePrimaryCamera);
		this.addEventListener(CAMERA_REMOVED, this.#updatePrimaryCamera);
	}// constructor

	connected(){
		this.#updateStateDimensions();

		// apply any shared connected functionality
		ECSObject.connected.call(this);
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
		ECSObject.disconnected.call(this);
		this.traverse(entity => {
			if(entity.isEntity) entity.disconnected();
		});
	}// disconnected

	play(){
		const canPlay = !!this.#camera;

		if(canPlay){
			if(!this.#isPlaying){
				this.#isPlaying = true;
				
				ECSObject.play.call(this);
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
			cancelAnimationFrame(this.#frame);

			this.#isPlaying = false;
			
			ECSObject.pause.call(this);
			this.traverse(entity => {
				if(entity.isEntity) entity.pause();
			});
		} else {
			console.warn("[WARNING](World) You called .pause() on an world that was already paused: call to pause ignored.", this);
		}
	}// pause

	add(entity)   { 
		super.add(entity);
		ECSObject.add.call(this, entity);
	}// add
	remove(entity){
		ECSObject.remove.call(this, entity);
		super.remove(entity);
	}// remove

	addSystem(system){
		ECSObject.addSystem.call(this, system);
	}// addSystem
	removeSystem(system){
		ECSObject.removeSystem.call(this, system);
	}// removeSystem

	addComponent(component){
		ECSObject.addComponent.call(this, component);
	}// addComponent
	removeComponent(component){
		ECSObject.removeComponent.call(this, component);
	}// removeComponent

	dispatchEvent(event, ...otherArgs){
		ECSObject.dispatchEvent.call(this, event, ...otherArgs);
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

		// apply tick to all components on the scene
		ECSObject.tick.call(this, time, this.#deltaTime);
		
		// render the new scene
		this.#renderer.render(this, this.#camera);
		
		// apply any calculations that need to happen AFTER the animation frame
		this.#tock(time, this.#deltaTime);
		
		// store the time for the next deltaTime calculation
		this.#lastTickTime = time;
	}// #tick

	#tock = (time, deltaTime) => {
		// apply tock to all components on the scene
		ECSObject.tock.call(this, time, deltaTime);

		// apply tock to all entities in the scene
		this.traverse(entity => {
			if(entity.isEntity){
				entity.tock(time, deltaTime);
			}
		});
	}// #tock


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
		this.#camera = findFirstInstanceWithProperty.call(this, "isCamera");
	}// #updatePrimaryCamera
}// World
