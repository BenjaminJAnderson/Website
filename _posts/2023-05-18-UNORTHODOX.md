---
layout: post
title: UNORTHODOX
date: 2023-05-18 17:40:18 +0200
image: orthodox.webp
description: A project to test my ability to make a reliable, robust, sleek and unique device.
tags: [kicad, pcb, blender, freecad, orthodox, openSCAD] 
categories: kicad blender freecad openSCAD
---

## Introduction

In this post, I'll be sharing the journey of building my custom ortholinear keyboard. From initial design to final assembly, I will walk you through each step of the process.

I wanted to do something different by incorporating **analog switches** for the **WASD and arrow keys**. This allows for more precise control, making the keyboard ideal for gaming and other applications requiring nuanced input. Additionally, I've included **quarter-size switches** that fit four buttons into a single key cap. These coloUr-coordinated buttons act as another version of the shift key, allowing for many more characters to be incorporated into a single keyboard. This innovative approach significantly expands the functionality and versatility of the keyboard, whilst giving a custom flare that separates it from off the shelf, hence the name UNORTHODOX.

## Why Ortholinear?

The decision to build an ortholinear keyboard stems from both aesthetic and functional considerations. Ortholinear keyboards feature a grid-like layout where keys are aligned in straight columns and rows, creating a clean and simple look. This simplicity in design not only makes the keyboard visually appealing but also streamlines the process of arranging the circuit board.

### Simplicity and Efficiency

The uniform arrangement of keys in an ortholinear keyboard simplifies the design and manufacturing process. With keys neatly aligned in a grid, designing the PCB (printed circuit board) becomes more straightforward, as the traces and connections can follow a logical and organized pattern. This can reduce the complexity of the circuit design and potentially lower production costs. Moreover, the consistent alignment of keys can improve typing accuracy and speed for some users, as fingers move in a more natural, linear fashion.

### Historical Context

To understand the appeal of the ortholinear layout, it's useful to look back at the history of keyboard design. The staggered layout of traditional keyboards dates back to the era of mechanical typewriters. In early typewriters, the keys were arranged in a staggered pattern to prevent the levers from jamming together when typing quickly. This design was a practical solution to a mechanical problem.

### Modern Relevance

However, with the advent of electronic keyboards, the staggered layout no longer serves a functional purpose. Modern keyboards do not have the same mechanical constraints, and the staggered arrangement persists largely out of convention rather than necessity. As a result, the ortholinear layout presents an opportunity to reimagine keyboard design without being bound by outdated mechanical requirements.

In summary, the ortholinear layout offers a sleek, efficient, and historically informed alternative to the traditional staggered keyboard design. By embracing this modern approach, we can create keyboards that are not only more visually appealing but also potentially more ergonomic and easier to manufacture.

## Project Overview

In this project, I opted to use **KICAD** for designing the motherboard and **OpenSCAD** for creating custom keycaps. Both of these tools offer robust features and flexibility, making them ideal for my custom ortholinear keyboard build.

### KICAD for Motherboard Design

KICAD is a powerful, open-source electronic design automation (EDA) software suite that I chose for designing the keyboard's PCB (printed circuit board). Its comprehensive set of tools allows for intricate and precise design, making it perfect for handling the unique layout and requirements of an ortholinear keyboard. 

Using KICAD, I was able to:

- **Schematic Capture**: Create detailed and organized schematic diagrams that represent the electrical connections between components.
- **PCB Layout**: Design the physical layout of the PCB with precision, ensuring that all components are placed optimally and that the electrical traces are routed efficiently.
- **3D Visualization**: Preview the design in 3D to get a better understanding of how the final product will look and to check for any potential issues with component placement or interference.
- **Gerber File Generation**: Produce the necessary files for manufacturing the PCB, ensuring that everything is ready for fabrication.

KICAD's open-source nature and extensive community support also provided valuable resources and tutorials throughout the design process.

### OpenSCAD for Custom Keycaps

For creating custom keycaps, I chose **OpenSCAD**, a script-based 3D CAD modeler. OpenSCAD is particularly well-suited for parametric design, allowing for precise control over the dimensions and features of the keycaps.

With OpenSCAD, I was able to:

- **Custom Shapes**: Design keycaps with specific shapes and profiles that fit the quarter-size switches, enabling the innovative 4-buttons-in-one-keycap feature.
- **Color Coordination**: Easily incorporate different colors into the keycap design, aligning with the color-coordinated shift functionality.
- **Parametric Design**: Adjust dimensions and features quickly by changing parameters in the script, streamlining the process of tweaking and perfecting the keycaps.
- **3D Printing**: Generate STL files for 3D printing, allowing for rapid prototyping and iteration to ensure the keycaps fit perfectly and function as intended.

By using OpenSCAD, I could achieve a high level of customization and precision, creating keycaps that not only meet the functional requirements of the keyboard but also enhance its aesthetic appeal.

Together, KICAD and OpenSCAD provided a robust and flexible foundation for designing and bringing my custom ortholinear keyboard to life. These tools enabled me to overcome the challenges of custom keyboard design and realize my vision for a unique and highly functional input device.


## Design and Development Process

### Initial Design

Discuss your initial ideas and inspirations for the keyboard design. Include sketches, drawings, or initial concepts if available.

![Initial Design Sketch](path_to_your_image)

### PCB Design

The heart of any custom keyboard project lies in the design of its PCB (printed circuit board). Below is the schematic diagram of my custom ortholinear keyboard, designed using KICAD.

![Schematic Diagram](path_to_your_image)

The schematic can be broken down into several key sections:

#### Microcontroller Unit (MCU)

At the core of the design is the **ATmega32U4** microcontroller (U1), which serves as the brain of the keyboard. This microcontroller is chosen for its compatibility with USB HID (Human Interface Device) and its ability to handle multiple input/output operations. Key connections include:
- **Power Pins**: VCC, AVCC, and GND are connected to ensure the MCU is properly powered.
- **Reset**: A reset circuit is included to restart the MCU when needed.
- **Crystal Oscillator**: The XTAL1 and XTAL2 pins are connected to a crystal oscillator (Y1) and capacitors (C2, C3) to provide the necessary clock signal for the MCU's operation.
- **USB Data Lines**: The D+ and D- lines are connected through resistors (R3, R4) for proper USB communication.

#### USB Connection

The USB interface (J1) is crucial for connecting the keyboard to a computer. This section includes:
- **USB Type-C Receptacle**: The schematic shows a USB Type-C connector (X1) wired for USB 2.0 functionality.
- **Power Lines**: VBUS and GND provide power from the USB connection.
- **Data Lines**: The D+ and D- lines are routed to the MCU for data transmission.

#### Key Matrix

The key matrix configuration is a crucial part of the schematic:
- **Rows and Columns**: The MCU's GPIO (General-Purpose Input/Output) pins are connected to the rows (ROW0, ROW1, ROW2, ROW3) and columns (COL0, COL1, COL2, etc.) of the key matrix.
- **Pull-up Resistors**: Internal or external pull-up resistors are used on the rows or columns to ensure reliable key press detection.

#### Reset and Other Components

Other essential components include:
- **Reset Button (SW1)**: Connected to the reset pin through a pull-down resistor (R1) and capacitor (C1) to debounce the reset signal.
- **Decoupling Capacitors (C4, C5, C6, C7)**: These capacitors are placed close to the power pins of the MCU to stabilize the power supply and reduce noise.

This schematic lays the foundation for the physical PCB layout, where these connections will be translated into copper traces and pads. Designing this schematic required careful planning to ensure all components interact correctly and the keyboard functions as intended.

### Case Design

Describe the case design process. Include information about the materials used and any 3D printing or machining that was involved.

![Case Design](path_to_your_image)

### Firmware Development

Explain how you developed or customized the firmware for your keyboard. Mention any specific features or functions you implemented.

## Components Used

List all the components used in your keyboard build, including:

- **Switches**: Type and brand
- **Keycaps**: Material, profile, and design
- **Microcontroller**: Model and specifications
- **Other Components**: Diodes, resistors, LEDs, etc.

## Assembly Process

### Soldering

Provide a step-by-step guide on soldering the components onto the PCB. Include tips for beginners.

![Soldering Process](path_to_your_image)

### Assembling the Case

Explain how you assembled the case, including any challenges you faced and how you overcame them.

![Case Assembly](path_to_your_image)

### Final Assembly

Show the final steps of putting everything together and performing the first test.

![Final Assembly](path_to_your_image)

## Challenges Faced

Discuss any major challenges you encountered during the project and how you solved them.

## Final Thoughts

Share your overall experience and any future plans for your keyboard or other projects. Include any lessons learned and advice for others interested in building their own custom keyboards.

![Finished Keyboard](path_to_your_image)

## Gallery

Include a gallery of images showcasing your finished keyboard from different angles.

![Keyboard Image 1](path_to_your_image)
![Keyboard Image 2](path_to_your_image)
![Keyboard Image 3](path_to_your_image)

## Conclusion

Thank your readers for following along with your project. Encourage them to leave comments or ask questions if they have any.

---
