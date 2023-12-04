# Thermo - 24 Hour Project to Upgrade My Thermostat

- Jump to see the final results here: [Final Results](#final-results)

My thermostat currently a problem: it is outdated, clunky and not connected to the internet. This project's aim is to develop a way to make it wifi controllable, making it easily accessible from anywhere.

![The problem thermostat](./images/before-after.png)

To keep things as modular as possible, the plan is to develop an easily attachable mount which connects to my thermostat dial using a simple gear system. A servo will control the positioning of the gears, and since the system is stationed in-place only through the use of double-sided tape, it will be trivial to remove when necessary. 

In order to make it a smart machine, we will use Viam's platform along with their TypeScript SDK, allowing for a peer-to-peer connection with the Raspberry Pi.

## First Steps - 3D Modeling

![Gear Design](./images/gear-gen.png)

It's important to be able to test the viability early on, so I started off by prototyping the gears and validating whether the servo is capable of overcoming the inherent stiffness in the dial.

Since the thermostat dial can be difficult to turn at times, a gear ratio of 1.3 provides some extra torque to hopefully ensure that our small servo doesn't struggle.

However, since the servo turns a maximum of 180 degrees, we can only rotate the dial itself about $180/1.33=135$ degrees. Ultimately, this translates to a selectable temperature range of 24°F, which is totally fine with me! I don't plan on selecting anything outside 60 to 84 °F.

(Future improvements could have a multi-turn servo or another servo with a wider range that enables selecting any temperature on the thermostat.)

![Gear 3D Slice](./images/sliced.png)

After measuring out the dimensions and doing some 3D modeling work, we have some gears ready to print. These do usually take a few attempts as the plastic shrinks when it cools, but fortunately, only one failed attempt later, we have a perfect fit around the thermostat!

<p align="center">
  <img src="./images/dial-gear.png" width="400">
</p>

## Viam Integration

My next step was getting the Raspberry Pi set up with `viam-server` and attempting to control the servo's angle.

<p align="center">
  <img src="./images/viam-setup.png" width="400">
</p>

In this case, I called my robot 'thermo' and initialized components for the board itself as well as the servo. Doing so required specifying a maximum range for the servo angle in addition to the gpio pin number it was connected to. 

https://github.com/agavram/thermo/assets/17835438/e837d71f-5ea1-4bc8-aed6-06a8654917c7

Above demonstrates testing the servo moving between different angles. Furthermore, I was able to verify the servo's strength by holding it against the dial to test whether the servo would in fact cause it to spin. Although the servo appears small, fortunately it's more than powerful enough. 

## Enclosure Construction

Encouraged by the servo's movement, it was time to build an enclosure to mount my smart machine, consisting of the Raspberry Pi and servo, alongside the thermostat. This would be the final construction step, and afterward the only remaining piece is the web application.

A few more hours of 3D modeling work later, and we have a simple yet functional enclosure to hold everything together. 

![3D Model of enclosure](./images/enclosure.png)

## Putting It All Together

The following morning, with the 3D print complete and time ticking down, I placed the components inside the enclosure and mounted it beside my thermostat. The robot was now ready to power on, and hopefully I would never need to manually adjust the dial again!

<p align="center">
  <img src="./images/assembled.png" width="400">
</p>

https://github.com/agavram/thermo/assets/17835438/45e27d12-bc98-4dfd-9537-5ba1e0d9ddbb

Through the Viam web interface, I can debug to adjust the servo angle, however, I wanted to integrate with the SDK, and develop my own site customized to control this thermostat robot. 

## Thermo Web App

The website code is all contained in this repository. It was built on top of React, Next.js, and Tailwind

My initial brainstorm for the UI was to create a digital representation of the thermostat dial, reflecting its real-world state. In addition, I'll add some buttons for sending commands to adjust the temperature in my room by adjusting the servo angle.

<p align="center">
  <img src="./images/config.png" width="400">
</p>

Upon opening the site, we are greeted with a page asking for your API Key and API Key ID. With the valid credentials provided, we see a virtual representation of the physical thermostat in my room!

<p align="center">
  <img src="./images/virtual-thermo.png" width="400">
</p>

The currently set temperature and the dial's current position are visible, all based on the servo angle data fetched through the SDK. As we press the buttons to select a new temperature, we can see the animation as it spins to our desired position. All of this happens instantly, reflecting the actual thermostat's position in my room.

https://github.com/agavram/thermo/assets/17835438/192c04e7-7e2f-4bf3-a26f-d1b6fad8c4ff

This is made possible by Viam, which creates a low-latency WebRTC connection directly to the Raspberry Pi. The commands are encoded using protobuf then sent through gRPC to call the necessary functions to move the servo at the desired angle. 

## Final Results

Here is the final result and a full side-by-side of my actual thermostat being controlled by the web application. The clicks on the UI are nearly instantaneously sent to the servo. No more needing to get out of bed on a cold night to dial up the temperature!

https://github.com/agavram/thermo/assets/17835438/660da684-6cd4-413e-8f42-ffb2f3f8f5d7

## Future Directions

Another flaw in my thermostat is the inadequate temperature sensor. It is incorrect to within a few degrees, which is enough to make the room uncomfortably hot / cold. Integrating a more accurate sensor with thermo will allow it to autonomously dial the thermostat up when the room needs to be heated and otherwise set the thermostat off.

### Links to Software Used

- [Viam - Software platform for smart machines](https://www.viam.com/)
- [Next.js - React Framework for the Web](https://nextjs.org/)
- [Gear Generator](https://geargenerator.com/)
- [Fusion 360 (Modeling)](https://www.autodesk.com/products/fusion-360/personal)
- [PrusaSlicer (Printing)](https://www.prusa3d.com/page/prusaslicer_424/)
