---
title: "THE UGLY DUCKLING"
summary: "An ambulance being converted into a self-sustaining off-grid liveaboard, from CAD and electrical design to water, heating and fabrication."
status: "in-progress"
year: 2025
period: "2025 —"
role: "Design, CAD and electrical"
tech: ["FreeCAD", "KiCad", "Obsidian", "CNC routing"]
tags: ["conversion", "off-grid", "camper", "cad"]
cover: "../../assets/projects/the-ugly-duckling/cover.webp"
coverAlt: "Ambulance interior with two timber bench seats and an overhead plywood bed frame."
gallery:
  - src: "../../assets/projects/the-ugly-duckling/bed-frame.webp"
    alt: "CNC-cut plywood bed frame joints and lightening holes."
    caption: "Bed frame joinery and lightening holes."
  - src: "../../assets/projects/the-ugly-duckling/cnc-routing.webp"
    alt: "CNC router cutting a plywood panel on a perforated spoilboard."
    caption: "CNC routing a plywood component."
  - src: "../../assets/projects/the-ugly-duckling/herringbone-floor.webp"
    alt: "Dark-stained timber planks arranged in a herringbone pattern."
    caption: "Herringbone floor planks after staining."
  - src: "../../assets/projects/the-ugly-duckling/diesel-heater.webp"
    alt: "Diesel air heater and insulated ducting mounted high on the ambulance wall."
    caption: "Diesel air heater and duct installation."
repo: "https://github.com/BenjaminJAnderson/TheUglyDuckling"
featured: true
order: 4
draft: false
---

## Overview

The Ugly Duckling is an ambulance being converted into a self-sustaining, off-grid liveaboard. It is a full-time home rather than a weekend camper: the existing body, roof and services provide the platform, while the interior is designed around limited space, finite water and energy, and winter conditions.

The [repository](https://github.com/BenjaminJAnderson/TheUglyDuckling) is the working design record rather than a finished build log. It holds requirements, bills of materials, supplier links, open questions, a decision log and a Kanban board, alongside FreeCAD models, CNC toolpaths and a KiCad wiring project. Significant choices are recorded with their context and consequences before fabrication so that dimensions, power budgets and safety constraints can be checked as the build progresses.

The project deliberately separates installed equipment from equipment that is only shortlisted or researched. The solar array, diesel heater and CNC-cut table are real; most of the wet-area systems are still at design stage.

## The platform

The ambulance's existing structure and services do the heavy lifting. The installed energy system is an 800 W solar array made from four 200 W black monocrystalline panels wired in a 2-series, 2-parallel configuration, feeding a 60 A MPPT controller through black anodised aluminium mounting extrusion.

The diesel air heater is an Eberspächer Airtronic D4 12 V Mk1 with an 802 digital controller, already mounted. The table has been modelled in FreeCAD, toolpathed, cut on a CNC router and fitted with its legs and stiffener.

[image: Diesel air heater and duct installation](/project-images/the-ugly-duckling/diesel-heater.webp)

## Wet-area concept

The current phase centres on the kitchen, shower and toilet. The shower compartment is designed to double as a drying room, with the Hamwells Loopz Plus base forming the compartment floor at a 1° fall towards the drain and a threshold or ramp for its 10 cm base height.

The walls are built around 3×2 CLS battens at 300 mm centres, fixed to the ambulance's structural ribs with rivnuts, plus nuts or structural rivets. Noggins support panel edges, joints, curtain rails and fixtures. The planned wall surface is 6 mm solid PVC or compact laminate, mechanically fixed with stainless screws and sealing washers. Panel joints use H-trims, and penetrations and joints are sealed with neutral-cure silicone. Insulation sits behind the panels to reduce condensation, with a heat shield planned near the diesel-heater outlet.

The Loopz base is intended to slide into place and seal around its perimeter with a removable rubber trim. A removable bead or clamp retains the base without permanent silicone, so the unit can be removed for servicing or storage. The composting toilet is portable and moves out of the compartment when the shower is in use; its fixed vent is planned for the lower section of the back wall.

## Water and waste

Fresh water is stored in a 75 L underslung tank and delivered by a 12 V diaphragm pump through an accumulator and a sediment and carbon filter to the cold kitchen tap. Grey water from the sink and the shower drain is collected in a 45 L underslung tank with a vent, level sensing and a drain valve. The kitchen drain includes a trap and an air-admittance valve.

There is no hot-water system, no calorifier and no black-water tank. Hot water comes from a kettle, and the kitchen is cold-water only. If preheated water is used for the shower, it must be mixed down to 45 °C or below before filling the Loopz. The composting toilet separates urine into a portable container and solids into a removable container with cover material.

Because the tanks and pipework are underslung, insulation, a heating method, low-point drains and a winterising procedure are required. Candidate measures include thermostatically controlled 12 V heater pads and insulated pipework. The final choice and its effect on the power budget remain open.

## Electrical architecture

The installed solar array feeds the 60 A MPPT controller. A Sterling Pro Charge Ultra 12 V / 60 A charger is planned for shore power, while alternator or DC-DC charging remains an open question. The planned 12 V bank supplies DC loads through a fuse panel and a Victron BatteryProtect BP-65, with the inverter bypassing the BatteryProtect on its own fuse. A Xantrex PROwatt SW 2000i provides 230 V pure-sine power through an RCD/RCBO-protected consumer unit.

The induction hob and kettle are limited to 1.5 kW each and must not run together: either load is already close to the inverter's continuous rating, and both together would overload it. The final battery chemistry and capacity are unresolved. The component notes compare the Fullriver DC115-12 and Lucas LSLC125-12 AGM batteries, warn against mixing different models in one permanent parallel bank, and set out the case for a matched pair or a LiFePO4 bank.

## Heating and ventilation

The Eberspächer Airtronic D4 is rated at 4 kW nominal and is controlled by an 802 digital controller. Its 89 mm hot-air outlet is intended to feed either the living space or the shower through a changeover damper, while the 76 mm return draws from the dry living space rather than the shower. The 24 mm combustion-air intake and exhaust terminate outside.

The main heater outlet must remain open so the unit is never dead-ended. A CO alarm, high-temperature ducting, a closable diffuser and a heat shield are required. A new 12 V shower extractor with a humidity sensor or timer will duct to a new roof vent with a cowl, insect mesh and backdraught shutter. The old black roof extractor is not reused. A passive air inlet is needed so the extractor can move air, and the kitchen and toilet require their own extraction.

The drying sequence is to squeegee the surfaces, extract for 10–15 minutes, direct heater air into the compartment with ventilation open, then finish with a short extract to remove the moist air.

## CAD and fabrication

FreeCAD holds the master models for the van, bed, bed mount, kitchen and shower, roof, sofa, table and electrical layout. Exports include STL, STEP, DXF and SVG files for the bed mount and other parts. G-code exists for the table legs, stiffener and table, and the legs and stiffener have been cut and fitted. The KiCad project contains the wiring schematic, PCB layout, project files and a custom symbol library.

[image: CNC routing a plywood component](/project-images/the-ugly-duckling/cnc-routing.webp)

These are working models rather than as-built records. Dimensions, mounting points and cable routes should be checked against the vehicle before cutting or drilling.

[image: Bed frame joinery and lightening holes](/project-images/the-ugly-duckling/bed-frame.webp)

[image: Herringbone floor planks after staining](/project-images/the-ugly-duckling/herringbone-floor.webp)

## Challenges and open questions

1. **Conflicting Loopz specifications.** Public material and the safety sheet disagree on power, weight, maximum water temperature and connector rating. The design adopts a conservative envelope of 60 W / 5 A, a 10 kg unit plus 6 kg of water, a 45 °C maximum water temperature and a 100 kg maximum deck load until Hamwells confirms otherwise.
2. **A shower and toilet sharing one small compartment.** A fixed toilet would obstruct showering, while a completely portable toilet still needs odour control. The chosen approach keeps the composting toilet portable and provides a fixed vent at the lower back wall with a removable hose or docking connection.
3. **No hot water and a shower that does not heat it.** A calorifier would add plumbing, weight, freeze risk and cost. The project instead uses a kettle for hot water and keeps the kitchen cold-water only. Shower temperature therefore depends on careful preheating.
4. **A 2 kW inverter against an undecided battery bank.** The inverter can deliver 2 kW continuously, but a small AGM bank would suffer voltage sag and rapid depletion under that load. The load rules are settled; the bank itself is not.
5. **Moisture behind waterproof panels near a diesel heater.** Plastic panels are vapour-tight, so moisture can form behind them if the wall is cold. The design uses battens, insulation, sealed penetrations and a heat shield, with the panel fire rating still to be confirmed.
6. **Underslung tanks in freezing weather.** Below-floor tanks are exposed to road conditions and low temperatures. Insulation and a heating method are required, with no antifreeze in the fresh tank. The heating hardware remains unresolved.

## Current status

The project has produced installed hardware and a substantial design record, but the wet-area systems have not yet been built or tested. The solar array is installed, the heater and controller are mounted, and the table legs and stiffener have been cut and fitted. The shower, toilet, water system and electrical distribution exist as requirements, bills of materials and decision records rather than finished installations.

No automated test suite exists because this is a documentation and fabrication project. The Loopz specifications and the final battery bank remain the most significant unverified assumptions.
