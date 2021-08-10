class JoystickController
{
    // stickID: ID of HTML element (representing joystick) that will be dragged.
    // maxDistance: Maximum amount joystick can move in any direction.
    // deadzone: Joystick must move at least this amount from origin to register value change.
    constructor(stickID, maxDistance, deadzone)
    {
        this.id = stickID;
        let stick = document.getElementById(stickID);

        // Location from which drag begins, used to calculate offsets.
        this.dragStart = null;
        // Touch identifier in case multiple joysticks present.
        this.touchId = null;

        this.active = false;
        this.value = { x: 0, y: 0 };

        let self = this;

        function handleDown(event)
        {
            self.active = true;

            // Drag movement delay.
            stick.style.transition = "0s";

            // Touch event fired before mouse event; prevent redundant mouse event from firing.
            event.preventDefault();

            if(event.changedTouches)
                self.dragStart = {
                    x: event.changedTouches[0].clientX,
                    y: event.changedTouches[0].clientY,
                };
            else
                self.dragStart = {
                    x: event.clientX,
                    y: event.clientY,
                };

            // If this is a touch event, keep track of which one.
            if(event.changedTouches)
                self.touchId = event.changedTouches[0].identifier;
        }

        function handleMove(event) {
            if(!self.active) return;

            // If this is a touch event, make sure it is the right one.
            // Also handle multiple simultaneous touchmove events.
            let touchmoveId = null;
            if(event.changedTouches)
            {
                for(let i = 0; i < event.changedTouches.length; i++)
                {
                    if(self.touchId == event.changedTouches[i].identifier)
                    {
                        touchmoveId = i;
                        event.clientX = event.changedTouches[i].clientX;
                        event.clientY = event.changedTouches[i].clientY;
                    }
                }

                if(touchmoveId == null) return;
            }

            const xDiff = event.clientX - self.dragStart.x;
            const yDiff = event.clientY - self.dragStart.y;

            const angle = Math.atan2(yDiff, xDiff);
            const distance = Math.min(maxDistance, Math.hypot(xDiff, yDiff));

            const xPosition = distance * Math.cos(angle);
            const yPosition = distance * Math.sin(angle);

            // Move stick image to new position.
            stick.style.transform = `translate3d(${xPosition}px, ${yPosition}px, 0px)`;

            // Deadzone adjustment.
            const distance2 =
                distance < deadzone
                    ? 0
                    : (maxDistance / (maxDistance - deadzone)) *
                      (distance - deadzone);

            const xPosition2 = distance2 * Math.cos(angle);
            const yPosition2 = distance2 * Math.sin(angle);

            const xPercent = parseFloat((xPosition2 / maxDistance).toFixed(4));
            const yPercent = parseFloat((yPosition2 / maxDistance).toFixed(4));
            self.value = { x: xPercent, y: yPercent };
        }

        function handleUp(event)
        {
            if(!self.active) return;

            // If this is a touch event, make sure it is the right one.
            if(event.changedTouches && self.touchId != event.changedTouches[0].identifier) return;

            // Transition the joystick position back to center.
            stick.style.transition = ".2s";
            stick.style.transform = `translate3d(0px, 0px, 0px)`;

            // Reset everything.
            self.value = { x: 0, y: 0 };
            self.touchId = null;
            self.active = false;
        }

        function getData()
        {
        }

        stick.addEventListener("mousedown", handleDown);
        stick.addEventListener("touchstart", handleDown);

        document.addEventListener("mousemove", handleMove, {passive: false,});
        document.addEventListener("touchmove", handleMove, {passive: false,});

        document.addEventListener("mouseup", handleUp);
        document.addEventListener("touchend", handleUp);
    }
}

let joystick1 = new JoystickController("stick1", 64, 8);
let joystick2 = new JoystickController("stick2", 64, 8);

var controllerJSON = {
    joystick1: { x: 0, y: 0 },
    joystick2: { x: 0, y: 0 },
};

var currentValue = "";
var previousValue = "";

function update()
{
    document.getElementById("status1").innerText = "Joystick 1: " + JSON.stringify(joystick1.value);
    document.getElementById("status2").innerText = "Joystick 2: " + JSON.stringify(joystick2.value);
}

function loop()
{
    requestAnimationFrame(loop);
    update();

    controllerJSON.joystick1 = joystick1.value;
    controllerJSON.joystick2 = joystick2.value;

    currentValue = JSON.stringify(controllerJSON);
    
    // Socket Send
    if(currentValue != previousValue)
    {
        socket.emit("joystickData", controllerJSON);
    }

    previousValue = currentValue;
}

loop(); 