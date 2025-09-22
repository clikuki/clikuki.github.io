export class Vector {
	constructor(public x: number, public y: number) {}
	static from(rad: number, mag = 1) { return { x: mag * Math.cos(rad), y: mag * Math.sin(rad) } }
	static copy(one: Vector) { return { x: one.x, y: one.y } }
	static add(one: Vector, two: Vector) { return { x: one.x + two.x, y: one.y + two.y } }
	static sub(one: Vector, two: Vector) { return { x: one.x - two.x, y: one.y - two.y } }
	static addScalar(one: Vector, scalar: number) { return { x: one.x + scalar, y: one.y + scalar } }
	static subScalar(one: Vector, scalar: number) { return { x: one.x - scalar, y: one.y - scalar } }
	static mult(one: Vector, scalar: number) { return { x: one.x * scalar, y: one.y * scalar } }
	static div(one: Vector, scalar: number) { return { x: one.x / scalar, y: one.y / scalar } }
	static mag(one: Vector) { return Math.hypot(one.x, one.y) }
	static magSqr(one: Vector) { return one.x*one.x + one.y*one.y }
	static normalize(one: Vector) { return this.div(one, this.mag(one)) }
	static dot(one: Vector, two: Vector) { return one.x * two.x + one.y * two.y }
	static project(one: Vector, two: Vector) {
		const dot = this.dot(one, two);
		const magSqr = this.magSqr(two);
		return {
			x: dot / magSqr * two.x,
			y: dot / magSqr * two.y,
		}
	}
}

export class PhysicsObject {
	public isDead = false;
	public netForces: Vector = { x: 0, y: 0 };
	public netTorque = 0;
	
	public prevPosition: Vector;
	public prevRotation: number;

	public readonly id = generateID();
	public readonly maxHealth = 1000;
	public health = this.maxHealth;
	public isBeingDragged = false;
	public age = 0;
	

	constructor(
		public position: Vector,
		public velocity: Vector,
		public rotation: number,
		public angularVelocity: number,
		public radius: number,
		public mass: number,
	) {
		this.prevPosition = Vector.sub(position, velocity);
		this.prevRotation = rotation - angularVelocity;
	}
}

export interface Collider {
	getInfo(): ColliderInfo
}
export interface ColliderInfo {
	x: number;
	y: number;

	w: number;
	h: number;
	hw: number;
	hh: number;
	
	center: Vector;
};

class RectCollider implements Collider {
	constructor(
		private rect: () => {
			x: number;
			y: number;
			w: number;
			h: number;
		}
	) {}

	getInfo(): ColliderInfo {
		const { x, y, w, h } = this.rect()

		return {
			x,
			y,

			w: w,
			h: h,
			hw: w / 2,
			hh: h / 2,

			center: {
				x: x + w / 2,
				y: y + h / 2,
			},
		}
	}
}

interface CollisionData {
	object: PhysicsObject;
	collider: Collider;
	colliderInfo: ColliderInfo;
	closest: Vector;
	distVec: Vector;
	distMag: number;
}

const generateID = (() => {
	let cnt = 0;
	return (() => String(cnt++))
})()

export class Physics {
	public objects = new Map<string, PhysicsObject>();
	// public colliders: Collider[];
	public t = 0;
	private dt = 0.05;
	private dtSqr = this.dt * this.dt;
	private currentTime = performance.now();
	private accumulator = 0;
	private halfPI = Math.PI / 2;
	
	private gravity = { x: 0, y: 10 };
	private dragCoefficient = .01;
	private restitutionCoefficient = .7;
	private rollingCoefficient = .02;

	// Stops jittering, set somewhere between 0.002 and 0.0001
	private minSpeed = 0.0005;
	private minSpin = 0.00001;

	private speedThreshold = 1;
	private damageFactor = 20;

	constructor(
		public colliders: Collider[],
		public mouse: () => Vector,
	){
		this.colliders.push(
			// The four screen edges
			new RectCollider(() => ({ x: -20, y: -20, w: innerWidth + 40, h: 20 })),
			new RectCollider(() => ({ x: -20, y: innerHeight, w: innerWidth + 40, h: 20 })),
			new RectCollider(() => ({ x: -20, y: -20, w: 20, h: innerHeight + 40 })),
			new RectCollider(() => ({ x: innerWidth, y: -20, w: 20, h: innerHeight + 40 })),
		);
	}

	public spawn(x: number, y: number): PhysicsObject {
		const minRadius = 20;
		const maxRadius = 40;
		const radius = Math.random() * (maxRadius - minRadius) + minRadius;
		const mass = Math.PI * radius * radius;

		const velLength = (Math.random() + 50) * this.dt;
		const velAngle = Math.random()*-this.halfPI*.7 - Math.round(Math.random())*this.halfPI;
		const velocity = Vector.from(velAngle, velLength);

		const rotation = Math.random() * 2*Math.PI - Math.PI;
		const angularVelocity = (Math.random() * 2 - 1) * this.dt;

		const position = { x, y };
		const obj = new PhysicsObject(
			position,
			velocity,
			rotation,
			angularVelocity,
			radius,
			mass,
		);

		// DEBUG EDITS
		// obj.radius = 30;
		// obj.angularVelocity = 0;
		
		// const center = new Vector(innerWidth / 2, innerHeight / 2)
		// obj.velocity = Vector.mult(Vector.normalize(Vector.sub(obj.position, center)), .5);
		// obj.velocity = new Vector(0, .1);
		
		// obj.prevRotation = rotation - obj.angularVelocity;
		// obj.prevPosition = Vector.sub(position, obj.velocity);

		this.objects.set(obj.id, obj);

		return obj;
	}

	public applyForce(obj: PhysicsObject, force: Vector): void {
    obj.netForces = Vector.add(obj.netForces, Vector.div(force, obj.mass));
	}
	private solvePosition(obj: PhysicsObject) {
		const prevPos = Vector.copy(obj.position);
		const speed = Vector.mag(obj.velocity);

		// pos_next = (2)(pos) - p_prev + (forces)(dt)(dt)
		obj.position = Vector.add(Vector.sub(Vector.mult(obj.position, 2), obj.prevPosition), Vector.mult(obj.netForces, this.dtSqr));
		
		if(
			obj.position.x < -100
			|| obj.position.y < -100
			|| obj.position.x > innerWidth + 100
			|| obj.position.y > innerHeight + 100
			|| this.containsInvalid(obj)
		) {
			obj.isDead = true;
			return;
		} 

		if(speed < this.minSpeed) {
			obj.prevPosition = obj.position;
		}
		
		obj.prevPosition = prevPos;
		obj.netForces = { x: 0, y: 0 };
	}
	private solveRotation(obj: PhysicsObject) {
		const prevRot = obj.rotation;

		// rot_next = (2)(rot) - rot_prev + (torque)(dt)(dt)
		obj.rotation = 2 * obj.rotation - obj.prevRotation + obj.netTorque * this.dtSqr;

		if(Math.abs(obj.angularVelocity) < this.minSpin) {
			obj.prevRotation = obj.rotation;
		}
	
		obj.prevRotation = prevRot;
		obj.netTorque = 0;
	}
	private updateVelocities(obj: PhysicsObject) {
		obj.velocity = Vector.div(Vector.sub(obj.position, obj.prevPosition), this.dt);
		obj.angularVelocity = (obj.rotation - obj.prevRotation) / this.dt;
	}
	
	private applyGravity(obj: PhysicsObject): void {
		const force = Vector.mult(this.gravity, obj.mass);
		this.applyForce(obj, force);
	}
	private applyDrag(obj: PhysicsObject) {
		if(Math.abs(obj.velocity.x) < .01 && Math.abs(obj.velocity.y) < .01) return;

		const speed = Vector.mag(obj.velocity);
		const dir = Vector.div(obj.velocity, speed);
		const surface = obj.radius * 2;

		// force = dir * -1 * speed^2 * surface * dragCoeffiencnt
		const scalarPart = -speed * speed * surface * this.dragCoefficient;
		const force = Vector.mult(dir, scalarPart);
		this.applyForce(obj, force);
	}
	private applyMouseAttractor(obj: PhysicsObject) {
		const nearNextPos = Vector.add(obj.position, obj.velocity);
		const diff = Vector.sub(this.mouse(), nearNextPos);
		const force = Vector.mult(diff, obj.mass);
		this.applyForce(obj, force);
	}

	private computeCollisionVelocity(speed: number, obj: PhysicsObject) {
		const rollingImpulse = -obj.mass / 3 * (speed + obj.angularVelocity * obj.radius);
		const resistingImpulse = -this.rollingCoefficient * obj.radius * Math.sign(obj.angularVelocity);
		const finalImpulse = rollingImpulse + resistingImpulse;

		return {
			linear: speed + rollingImpulse / obj.mass,
			angular: obj.angularVelocity + finalImpulse * 2 / (obj.mass * obj.radius),
		}
	}

	private findCollisions(obj: PhysicsObject): CollisionData[] {
		const hits: CollisionData[] = [];
		for(const collider of this.colliders) {
			const info =  collider.getInfo();
			const diff = Vector.sub(obj.position, info.center);
			const closest = {
				x: Math.max(Math.min(diff.x, info.hw), -info.hw),
				y: Math.max(Math.min(diff.y, info.hh), -info.hh),
			}

			const distVec = Vector.sub(diff, closest);
			const distMag = Vector.mag(distVec);
			if(distMag < obj.radius) hits.push({
				object: obj,
				collider,
				colliderInfo: info,
				closest,
				distVec,
				distMag,
			});
		}
		return hits;
	}
	private solveCollision(collisionData: CollisionData): void {
		const { object, distVec, distMag } = collisionData;

		// Push out of collider
		const penetrationDepth = object.radius - distMag;
		const penetrationVector = Vector.mult(distVec, penetrationDepth / distMag);
		object.position = Vector.add(object.position, penetrationVector);

		// Update velocities
		const normalVec = Vector.from(Math.atan2(distVec.y, distVec.x));
		const tangentVec = { x: -normalVec.y, y: normalVec.x };

		const startVel = object.velocity;
		const normalVel = Vector.mult(
			Vector.project(startVel, normalVec), -this.restitutionCoefficient
		);
		
		const signedTangentSpeed = Vector.dot(startVel, tangentVec)
		const collisionVelocity = this.computeCollisionVelocity(signedTangentSpeed, object);
		const tangentVel = Vector.mult(tangentVec, collisionVelocity.linear);

		const finalLinearVel = Vector.mult(Vector.add(normalVel,tangentVel), this.dt);
		const finalAngularVel = collisionVelocity.angular * this.dt;
		object.prevPosition = Vector.sub(object.position, finalLinearVel);
		object.prevRotation = object.rotation - finalAngularVel;
	}

	private updateObjects() {
		for(const [, obj] of this.objects) {
			if(obj.isDead) continue;
			
			this.applyDrag(obj);
			if(obj.isBeingDragged) this.applyMouseAttractor(obj);
			else this.applyGravity(obj);

			this.solvePosition(obj);
			this.solveRotation(obj);

			const hitColliders = this.findCollisions(obj);
			for(const collisionData of hitColliders) {
				this.solveCollision(collisionData);
			}

			this.updateVelocities(obj);
			this.updateHealth(obj);
			obj.age += this.dt;
		}
	}

	private updateHealth(obj: PhysicsObject) {
		// Kill on low y speed, heal on high speed
		const ySpeed = obj.velocity.y;
		if(!obj.isBeingDragged && ySpeed < this.speedThreshold) {
			const safeYSpeed = Math.max(Math.abs(ySpeed), 1);
			const damage = this.dt * this.damageFactor / safeYSpeed;
			obj.health = Math.max(0, obj.health - damage);
			if(obj.health === 0) obj.isDead = true;
		} else if(obj.health < obj.maxHealth) {
			const speedSqr = Vector.magSqr(obj.velocity)
			obj.health = Math.min(obj.maxHealth, obj.health + this.dt * speedSqr);
		}
	}

	private removeDead(): void {
		for(const [id, obj] of this.objects) {
			if(obj.isDead) this.objects.delete(id);
		}
	}
	
	public update(newTime: number): number {
		let frameTime = newTime - this.currentTime;
		if(frameTime > .25) frameTime = .25; // Why?
		this.currentTime = newTime;

		this.accumulator += frameTime;

		this.removeDead();
		while(this.accumulator >= this.dt) {
			this.updateObjects();
			this.t += this.dt;
			this.accumulator -= this.dt;
		}

		const alpha = this.accumulator / this.dt;
		return alpha;
	}

	// Not ideal solution, ideally prevent invalid states in the first place
	private containsInvalid(obj: PhysicsObject): boolean {
		if(Number.isNaN(obj.netForces.x)) return true;
		if(Number.isNaN(obj.netForces.y)) return true;
		if(Number.isNaN(obj.netTorque)) return true;
		if(Number.isNaN(obj.position.x)) return true;
		if(Number.isNaN(obj.position.y)) return true;
		if(Number.isNaN(obj.rotation)) return true;
		return false;

		return /null|undefined/.test(JSON.stringify(obj));
	}

	/** FOR DEBUG ONLY; FOR STEPPING THRU PHYSICS ONE BY ONE */
	public debug_update(iterCnt = 1) {
		this.removeDead();
		for(let i = 0; i < iterCnt; ++i) {
			this.updateObjects();
		}
	}
}