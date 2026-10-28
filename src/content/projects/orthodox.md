---
title: "ORTHODOX"
summary: "A 60-key ortholinear keyboard with a two-layer KiCad PCB, FreeCAD case and parametric OpenSCAD keycaps."
status: "prototype"
year: 2022
role: "PCB, case and keycap design"
tech: ["KiCad", "FreeCAD", "OpenSCAD", "Python"]
tags: ["hardware", "keyboard", "pcb", "3d-printing"]
cover: "../../assets/projects/orthodox/cover.webp"
coverAlt: "Orthodox keyboard render showing the ortholinear layout, coloured modifier keys and half-size key cluster."
gallery:
  - src: "../../assets/projects/orthodox/keyboard-layout.webp"
    alt: "Orthodox keyboard PCB layout."
    caption: "PCB layout with the key matrix and coil footprints."
  - src: "../../assets/projects/orthodox/keyboard-motherboard.webp"
    alt: "Orthodox keyboard schematic."
    caption: "Schematic capture in KiCad."
  - src: "../../assets/projects/orthodox/keyswitch-matrix.webp"
    alt: "Key matrix schematic."
    caption: "Key matrix with one diode per switch."
  - src: "../../assets/projects/orthodox/case.webp"
    alt: "Orthodox keyboard case model."
    caption: "Case design in FreeCAD."
  - src: "../../assets/projects/orthodox/buttons.webp"
    alt: "Parametric keycap layout."
    caption: "Parametric KeyV2 keycap layout."
repo: "https://github.com/BenjaminJAnderson/Orthodox"
featured: true
order: 2
draft: false
---

## Overview

Orthodox is a design archive for a compact, 60-key ortholinear keyboard. Its grid layout removes the row offsets of a conventional staggered keyboard, simplifying both the keycap geometry and the electrical matrix. The repository contains the KiCad schematic and PCB, manufacturing exports, a FreeCAD case model and a parametric keycap generator.

The archive covers the hardware and mechanical design. Firmware is not included, the LDC1614 inductive-sensing circuit is planned but not present on the current PCB revision, and no fabrication, assembly or measurement results are recorded. The files are a reference design and starting point for further work rather than a verified build guide.

## Design

The board uses thirteen column nets, `COL0` to `COL12`, and five row nets, `ROW0` to `ROW4`, with one 1206 diode in series with each of the sixty switch positions. The controller is an ATmega32U4-A in a TQFP-44 package, with a four-pad crystal, reset circuit and decoupling. USB-C is provided by a GCT USB4055-30-A receptacle wired for USB 2.0, with 22 Ω series resistors on the data lines, a crystal with 22 pF load capacitors, a reset switch and a 10 kΩ pull-up on the reset line.

The switch footprints cover 1u, 2u and 6u positions using Kailh Choc V1 footprints, plus compact 58-series footprints for the smallest keys. The board is a two-layer, 1.6 mm FR4 design measuring approximately 253.15 × 100.75 mm. The routed board contains 467 track segments and 23 vias.

[image: Orthodox PCB layout](/project-images/orthodox/keyboard-layout.webp)

### Inductive coil footprints

Eight switch positions, covering W, A, S, D and the four arrow keys, use footprints containing a copper spiral around the switch centre. The spiral is drawn on both copper layers and uses 0.15 mm tracks with 0.30 mm spacing over eight turns. Each footprint adds two small SMD pads, numbered 3 and 4, for the coil terminals.

`Software/spiral.py` generates the spiral as individual KiCad segment entries and prints them to standard output. The radius, number of sides, track width, track spacing, turn count and layer can be changed at the bottom of the script. The design stops at the coil footprint: the schematic includes a two-pin `Coil` connector (`J2`), but no LDC1614 or other inductive-sensing IC is placed on the board.

[image: Key matrix with one diode per switch](/project-images/orthodox/keyswitch-matrix.webp)

## Case and keycaps

`Hardware/Model/Keyboard/Keyboard.FCStd` contains a FreeCAD Part Design body with a sketch, pad, pocket and chamfer. Its outer envelope is approximately 259.26 × 107 × 20 mm. The repository does not include separate fabrication drawings or fit measurements for the case.

[image: FreeCAD case model](/project-images/orthodox/case.webp)

`Hardware/Model/Keycaps/OrthodoxLayout.scad` is built on [KeyV2](https://github.com/rsheldiii/openSCAD-projects). It defines the position, width, height and legend of every key using explicit arrays, including the 2u keys, 6u spacebar and 0.5u keys. Five nested `legend()` calls place primary, function-key, symbol and shift legends at different positions on each keycap.

The layout uses the low-profile transformation, bar supports, an 18.16 mm base width and a nominal 11.5 mm total depth before the low-profile transformation. The included `OrthodoxLayout.stl` is a pre-exported model spanning approximately 247 × 94 × 8 mm. The layout file contains a commented `$stem_type = "choc"` setting; it must be uncommented before export to generate stems for the Choc switches.

[image: Parametric KeyV2 keycap layout](/project-images/orthodox/buttons.webp)

## Challenges and solutions

### Integrating coils into switch footprints

The analogue keys need a planar coil under each switch, but the switch cutout, central hole and electrical pads occupy the middle of the footprint. `spiral.py` generates the coil as many short KiCad track segments, which are embedded directly in a modified Kailh Choc footprint using a larger pad arrangement and a spiral that surrounds the switch centre on both copper layers. Eight coil-enabled footprints exist in the PCB layout, but the sensing IC and its supporting circuit remain unbuilt, so the coil geometry has not been electrically validated.

### Placing multiple legends on small keycaps

KeyV2's `legend()` module is designed around a single legend per keycap, while the Orthodox layout needs several legends on many keys. The layout nests five `legend()` calls with separate arrays for the centre, bottom-left, bottom-right, top-left and top-right positions. Font sizes and offsets are defined per key, including the smaller 0.5u keys. The commit history records an attempt to add Font Awesome glyphs and notes that multiple-font rendering still needed investigation.

### Mixing key sizes in a regular grid

An ortholinear grid is regular, but the design mixes 1u, 2u, 6u and 0.5u keys, so a single uniform array cannot describe the layout. The keycap generator stores explicit x/y positions, widths and heights for every key, with separate arrays for legends and font sizes. The PCB uses matching switch footprints and positions for the 2u, 6u and compact keys. The layout and STL include the mixed key sizes, but no physical fit test is recorded in the repository.

## Validation status

No fabricated board, assembly photographs, bill of materials or electrical measurements are included. A design rule check (DRC) run using KiCad 10.0.7 on `Hardware/PCB/Orthodox.kicad_pcb` reports 10 unconnected items and additional clearance, footprint, solder-mask and other violations, so the design should be reviewed and cleaned up before manufacture. The case and keycap models have not been physically validated for fit in this repository.

The remaining roadmap item is to integrate the LDC1614 sensing circuit and connect the eight coil footprints.
