export interface Vector {
	x: number,
	y: number,
};
export class Vector {
	private constructor() {}
	static copy(one: Vector) { return { x: one.x, y: one.y } }
	static add(one: Vector, two: Vector) { return { x: one.x + two.x, y: one.y + two.y } }
	static sub(one: Vector, two: Vector) { return { x: one.x - two.x, y: one.y - two.y } }
	static addScalar(one: Vector, scalar: number) { return { x: one.x + scalar, y: one.y + scalar } }
	static subScalar(one: Vector, scalar: number) { return { x: one.x - scalar, y: one.y - scalar } }
	static mult(one: Vector, scalar: number) { return { x: one.x * scalar, y: one.y * scalar } }
	static div(one: Vector, scalar: number) { return { x: one.x / scalar, y: one.y / scalar } }
}

export class PhysicsObject {
	public isDead = false;
	public netForces: Vector = { x: 0, y: 0 };
	public netTorque = 0;
	
	public prevPosition: Vector;
	public prevRotation: number

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

export class Physics {
	public objects: PhysicsObject[] = []
	public t = 0;
	private dt = 0.01;
	private dtSqr = this.dt * this.dt;
	private currentTime = performance.now();
	private accumulator = 0;
	
	private gravity = { x: 0, y: 10 };
	private dragCoefficient = .01;
	private restitutionCoefficient = .7;
	private rollingCoefficient = .01;

	// Stops jittering, set somewhere between 0.002 and 0.0001
	private minLinearVelocity = 0.0005;
	private minAngularVelocity = 0.00001;

	public spawn(x: number, y: number): PhysicsObject {
		const minRadius = 20;
		const maxRadius = 40;
		const radius = Math.random() * (maxRadius - minRadius) + minRadius;
		const mass = Math.PI * radius * radius;

		const velLength = Math.random() + .1;
		const velAngle = Math.random() * -Math.PI;
		const velocity = {
			x: velLength * Math.cos(velAngle),
			y: velLength * Math.sin(velAngle),
		}

		const rotation = Math.random() * 2 * Math.PI - Math.PI;
		const maxAngularVelocity = .05;
		const angularVelocity = Math.random() * maxAngularVelocity * 2 - maxAngularVelocity;

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
		obj.prevPosition = Vector.sub(position, {
			x: 1,
			y: 1,
		});

		this.objects.push(obj);

		return obj;
	}

	public applyForce(obj: PhysicsObject, force: Vector): void {
    obj.netForces = Vector.add(obj.netForces, Vector.div(force, obj.mass));
	}
	private solvePositionAndRotation(obj: PhysicsObject) {
		const prevPos = Vector.copy(obj.position);
		const prevRot = obj.rotation;
		const speed = Math.hypot(obj.velocity.x, obj.velocity.y);

		// pos_next = (2)(pos) - p_prev + (forces)(dt)(dt)
		if(speed > this.minLinearVelocity) {
			obj.position = Vector.add(Vector.sub(Vector.mult(obj.position, 2), obj.prevPosition), Vector.mult(obj.netForces, this.dtSqr));
		}
		
		if(Math.abs(obj.angularVelocity) > this.minAngularVelocity) {
			obj.rotation = 2 * obj.rotation - obj.prevRotation + obj.netTorque * this.dtSqr;
		}

		console.table(obj);
		this.debug_logIfNaN(obj, () => {
			console.log(
				obj.netForces,
				this.dtSqr,
				Vector.mult(obj.netForces, this.dtSqr)
			);

			obj.isDead = true;
		})
		
		obj.prevPosition = prevPos;
		obj.prevRotation = prevRot;
		obj.netForces = { x: 0, y: 0 };
	}
	private updateVelocities(obj: PhysicsObject) {
		obj.velocity = Vector.div(Vector.sub(obj.position, obj.prevPosition), 1);
		obj.angularVelocity = (obj.rotation - obj.prevRotation) / 1;
	}
	private applyGravity(obj: PhysicsObject): void {
		const force = Vector.mult(this.gravity, obj.mass);
		this.applyForce(obj, force);
	}
	private applyDrag(obj: PhysicsObject) {
		if(Math.abs(obj.velocity.x) < .01 && Math.abs(obj.velocity.y) < .01) return;

		const speed = Math.hypot(obj.velocity.x, obj.velocity.y);
		const dir = Vector.div(obj.velocity, speed);
		const surface = obj.radius * 2;

		// force = dir * -1 * speed^2 * surface * dragCoeffiencnt
		const scalarPart = -speed * speed * surface * this.dragCoefficient;
		const force = Vector.mult(dir, scalarPart);
		console.debug("DRAG");
		console.table({ vel: obj.velocity, dir, surface, speed, scalarPart, force })
		this.applyForce(obj, force);
	}

	private constrainToView(obj: PhysicsObject): void {
		// const velocity = Vector.sub(obj.pos, obj.prevPos);
		const newVelocities = this.velocitiesAfterCollision(obj);

		const rightSide = obj.position.x + obj.radius > innerWidth;
		const leftSide = obj.position.x - obj.radius < 0;
		const bottomSide = obj.position.y + obj.radius > innerHeight;
		const topSide = obj.position.y - obj.radius < 0;

		if(rightSide) {
			obj.position.x = innerWidth - obj.radius;
		}
		else if(leftSide) {
			obj.position.x = obj.radius;
		}
		
		if(bottomSide) {
			obj.position.y = innerHeight - obj.radius;
		}
		else if(topSide) {
			obj.position.y = obj.radius;
		}

		if(leftSide || rightSide || topSide || bottomSide) {
			console.warn("COLLIDED");
			const newVel = Vector.sub(obj.position, obj.prevPosition);
			console.table({
				prev: {...obj.velocity, spd: Math.hypot(obj.velocity.x, obj.velocity.y)},
				cur: {...newVel, spd: Math.hypot(newVel.x, newVel.y)},
			})
			console.table(newVelocities);
			console.table(obj);
			console.log("collide log fin");
		}

		if(leftSide || rightSide) {
			obj.prevPosition.x = obj.position.x + obj.velocity.x * this.restitutionCoefficient;
			obj.prevPosition.y = obj.position.y - newVelocities.linear.y;
			obj.prevRotation = obj.rotation - newVelocities.angular.y;
		}
		else if (topSide || bottomSide) {
			obj.prevPosition.y = obj.position.y + obj.velocity.y * this.restitutionCoefficient;
			obj.prevPosition.x = obj.position.x - newVelocities.linear.x;
			obj.prevRotation = obj.rotation - newVelocities.angular.x;
		}
	}
	private velocitiesAfterCollision(obj: PhysicsObject) {
		// TODO: solve issue causing velocities to explode out of control
		const rollingImpulse = {
			x: -obj.mass / 3 * (obj.velocity.x + obj.angularVelocity * obj.radius),
			y: -obj.mass / 3 * (obj.velocity.y + obj.angularVelocity * obj.radius),
		}

		const resistingImpulse = -this.rollingCoefficient * obj.radius * Math.sign(obj.angularVelocity);
		const finalImpulse = Vector.addScalar(rollingImpulse, resistingImpulse);
		return {
			linear: Vector.add(obj.velocity, Vector.div(rollingImpulse, obj.mass)),
			angular: Vector.addScalar(Vector.mult(finalImpulse, 2 / obj.mass / obj.radius), obj.angularVelocity),
		}
	}

	private updateObjects() {
		for(const obj of this.objects) {
			if(obj.isDead) continue;
			
			this.applyGravity(obj);
			this.applyDrag(obj);
			this.solvePositionAndRotation(obj);
			this.constrainToView(obj);
			this.updateVelocities(obj);
		}
	}

	private removeDead(): void {
		let i = 0;
		let cnt = this.objects.length;
		let curr: PhysicsObject;
		let tmp: PhysicsObject;
		while(i < cnt) {
			curr = this.objects[i];
			if(!curr.isDead) ++i;
			else {
				tmp = this.objects[cnt - 1];
				this.objects[cnt - 1] = curr;
				this.objects[i] = tmp;
				this.objects.length = --cnt;
			}
		}
	}
	
	public update(newTime: number): number {
		let frameTime = newTime - this.currentTime;
		if(frameTime > .25) frameTime = .25; // Why?
		this.currentTime = newTime;

		this.accumulator += frameTime;

		this.removeDead();
		while(this.accumulator >= this.dt) {
			if(this.objects.length) console.log(`Call #${this.t}`)

			this.updateObjects();
			this.t += this.dt;
			this.accumulator -= this.dt;
		}

		const alpha = this.accumulator / this.dt;
		return alpha;
	}

	public debug_containsInvalid(obj: PhysicsObject): boolean {
		return /null|undefined/.test(JSON.stringify(obj));
	}
	public debug_logIfNaN(
		obj: PhysicsObject,
		cb?: (obj: PhysicsObject) => void,
	) {
		if(!this.debug_containsInvalid(obj)) return;
		console.table(obj);
		cb?.(obj);
	}

	/** FOR DEBUG ONLY; FOR STEPPING THRU PHYSICS ONE BY ONE */
	public debug_update(iterCnt = 1) {
		this.removeDead();
		for(let i = 0; i < iterCnt; ++i) {
			this.updateObjects();
		}
	}
}