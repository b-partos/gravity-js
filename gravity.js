

function checkIfNumber(value, name) {
    if ( !(typeof value === 'number') || Number.isNaN(value) ) {
        throw `${name}: ${value} is not a number`
    }
}

/**
 * This class represents a 2 dimensional vector.
 * The class provides support for vector addition and multiplication by scalar.
 * Instances are intended to be immutable and the above mentioned operations return new instances.
 */
class Vector {
    constructor(xCoordinate, yCoordinate) {
        checkIfNumber(xCoordinate, "xCoordinate");
        checkIfNumber(yCoordinate, "yCoordinate");
        this._x = xCoordinate;
        this._y = yCoordinate;
    }

    get x() {
        return this._x;
    }
    
    get y() {
        return this._y;
    }

    /**
     * Returns a new Vector instance which is the product of applying vector addition to this vector instance and the otherVector.
     * @param {*} otherVector 
     * @returns 
     */
    add(otherVector) {
        Vector.checkIfVector(otherVector, "otherVector");
        return new Vector(this.x + otherVector.x, this.y + otherVector.y)
    }

    /**
     * Returns a new Vector which is the product of multiplying this vector with a scalar.
     * @param {*} scalarValue 
     * @returns 
     */
    multiplyByScalar(scalarValue) {
        checkIfNumber(scalarValue, "scalarValue");
        return new Vector(this.x*scalarValue, this.y*scalarValue);
    }

    get magnitude() {
        return Math.sqrt(this.x*this.x+this.y*this.y)
    }

    static createFromPosition(sourcePosition) {
        return new Vector(sourcePosition.x, sourcePosition.y);
    }

    static checkIfVector(value, valueName) {
        if ( ! (value instanceof Vector)) {
            throw `${valueName}: ${value} is not a Vector`;
        }
    }

}

/**
 * Represents a point like body that has a position and a velocity.
 */
class Ball {
    constructor(position, velocity, mass) {
        Vector.checkIfVector(position, "position");
        Vector.checkIfVector(velocity, "velocity");
        this.position = position;
        this.velocity = velocity;
        this._mass = mass;
    }

    /**
     * Changes the velocity of this ball according to Newton's laws.
     * @param {*} forceVector The force whose effect is to be applied.
     * @param {*} duration How long the force is applied to this bofy.
     */
    applyForce(forceVector, duration) {
        Vector.checkIfVector(forceVector, "forceVector");
        this.velocity = this.velocity.add(forceVector.multiplyByScalar(duration/this.mass));
    }

    /**
     * Changes the position of this body by applying its velocity vector for the duration.
     * @param {*} duration The amount of time the velocity acts to change the body's position.
     */
    move(duration) {
        this.position = this.position.add(this.velocity.multiplyByScalar(duration))
    }

    get mass() {
        return this._mass;
    }

    get position() {
        return this._position;
    }
    
    set position(newPosition) {
        Vector.checkIfVector(newPosition, "newPosition");
        this._position = newPosition;
    }

    get velocity() {
        return this._velocity;
    }
    
    set velocity(newVelocity) {
        Vector.checkIfVector(newVelocity, "newVelocity");
        this._velocity = newVelocity;
    }
}

/**
 * Represents the UI elements that are used for displaying the balls.
 */
class BallItem {
    constructor(drawingContext, ball, radius) {
        this._ball = ball;
        this._radius = radius;
        this._drawingContext = drawingContext;
    }

    get ball() {
        return this._ball;
    }

    get radius() {
        return this._radius;
    }

    get rectangle() {
        return {
            x: Math.round(this.ball.position.x)-this.radius,
            y: Math.round(this.ball.position.y)-this.radius,
            w: Math.round(this.ball.position.x)+this.radius,
            h: Math.round(this.ball.position.y)+this.radius
        }
    }

    get renderedRectangle() {
        return this._lastRectangle;
    }

    clearLastLocation() {
        const lastRect = this.renderedRectangle;
        this._drawingContext.clearRect(lastRect.x, lastRect.y, lastRect.w, lastRect.h);
    }

    redraw() {
        this._lastRectangle = this.rectangle;
        this._drawingContext.beginPath();
        this._drawingContext.arc(Math.round(this.ball.position.x), Math.round(this.ball.position.y), this.radius, 0, Math.PI*2);
        this._drawingContext.closePath();
        this._drawingContext.fill();
    }
}

const initialConfigurations = {
    /**
     * In this configuration the second ball remains static for a long time, 
     * while the others orbit it, but after the 3rd completed orbit one of the balls gets ejected while the other 2 remain in a close orbit.
     */
    "ejected ball" : [
        new Ball(new Vector(100,100), new Vector(0,40),100000), 
        new Ball(new Vector(200,200), new Vector(0,0), 300000), 
        new Ball(new Vector(300,300), new Vector(0,-40),100000)
    ],
    /**
     * One the balls gets ejected after a while, but first they perform an interesting dance.
     */
    "dancing balls": [
            new Ball(new Vector(100,100), new Vector(0,40),100000), 
            new Ball(new Vector(250,200), new Vector(0,0), 300000), 
            new Ball(new Vector(300,300), new Vector(0,-40),100000)
    ]
}

const balls = initialConfigurations["dancing balls"];

/**
 * Calculates the attraction experienced by ball1 as a result of the presence of ball2.
 */
function calculateAttraction(ball1, ball2) {
    const p = ball2.position;
    const distance = ball1.position.add(ball2.position.multiplyByScalar(-1));
    const forceMagnitude = (-1)*ball1.mass*ball2.mass/distance.magnitude**2;
    return distance.multiplyByScalar(forceMagnitude/distance.magnitude);
}

function moveAndApplyGravity(duration) {
    
    /**
     * The balls move based on their current velocity.
     */
    balls.forEach((ball) => {
        ball.move(duration);
    });

    
    /**
     * The gravitational force vectors exerted by the balls on each other are calculated and applied.
     */
    for (let i = 0; i < balls.length; i++) {
        const ball1 = balls[i];
        for (let j = 0; j < balls.length; j++) {
            if (j != i) {
                const ball2 = balls[j];
                ball1.applyForce(calculateAttraction(ball1, ball2), duration);
            }
        }
    }
    

}


const ballsCanvas = document.getElementById("balls");
const ballsContext = ballsCanvas.getContext("2d");
const ballItems = balls.map(b => new BallItem(ballsContext, b, 5));
/**
 * The number of redraws per second.
 */
const fps = 60;
/**
 * The number of recalculation steps per second. Determines how fine grained the simulation is.
 */
const stepsPerSecond = 100;
/**
 * Determines how fast the simulation progresses.
 */
const speed = 10;

function startSimulation() {
    setInterval(() => {
        for (let index = 0; index < speed; index++) {
            moveAndApplyGravity(1/stepsPerSecond);
        }
    }, 1000/stepsPerSecond);
}


function startAnimation() {
    setInterval(() => {
        window.requestAnimationFrame( (timeStamp) => {
            ballsContext.clearRect(0,0,ballsCanvas.width, ballsCanvas.height);
            ballItems.forEach(b => {
                b.redraw();
            });
        });
    }, 1000/fps);
}

startSimulation();
startAnimation();