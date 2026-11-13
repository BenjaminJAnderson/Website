---
title: "AVALANCHE"
summary: "A C++ random path length model of a near-infrared InGaAs/InAlAs avalanche photodiode, used to size its layers against responsivity, noise and breakdown limits."
status: "prototype"
year: 2021
period: "2020 — 2021"
role: "Device modelling and simulation"
tech: ["C++", "MATLAB", "LaTeX", "Excel"]
tags: ["semiconductor", "photonics", "simulation", "device-physics"]
cover: "../../assets/projects/avalanche/cover.webp"
coverAlt: "Layer stack of the five-layer InGaAs/InAlAs avalanche photodiode, showing the contact, absorption, charge and multiplication regions."
gallery:
  - src: "../../assets/projects/avalanche/breakdown-width.webp"
    alt: "Breakdown voltage versus InAlAs multiplication-layer width with 20 V and 60 V limits."
    caption: "Breakdown voltage against InAlAs width; the 20–60 V window gives 0.3–1.25 µm."
  - src: "../../assets/projects/avalanche/responsivity-width.webp"
    alt: "Responsivity at 1550 nm versus InGaAs absorption-layer width."
    caption: "Responsivity against absorption width; 0.65 A/W is reached above 1.053 µm."
  - src: "../../assets/projects/avalanche/electric-field.webp"
    alt: "Electric-field profile across the five APD layers at breakdown."
    caption: "Breakdown field profile; the area under the curve gives 51 V."
  - src: "../../assets/projects/avalanche/noise-gain.webp"
    alt: "Excess noise factor versus electron multiplication for the 0.75 µm InAlAs region."
    caption: "Excess noise factor against gain; Fe is 3.5 at M = 10."
  - src: "../../assets/projects/avalanche/capacitance-voltage.webp"
    alt: "Capacitance versus reverse bias for the final APD structure."
    caption: "C–V characteristic; punch-through occurs at 34.8 V and M = 10 at 46 V."
repo: "https://github.com/BenjaminJAnderson/AVALANCHE"
featured: false
order: 5
draft: false
---

## Overview

AVALANCHE is a simulation study of a near-infrared InGaAs/InAlAs separate absorption and multiplication (SAM) avalanche photodiode. The aim was to choose epitaxial layer widths that meet a set of responsivity, noise, breakdown, dark-current and capacitance requirements before committing a design to fabrication.

The work was completed as a third-year individual project in the Department of Electronic and Electrical Engineering at the University of Sheffield. The device is a five-layer PIN structure with a 30 µm radius, designed for 1550 nm operation. A C++ implementation of the random path length model provides the multiplication, excess noise, responsivity, tunnelling current and capacitance calculations. A MATLAB electric-field solver supplied by the Sheffield Advanced Detector Centre relates the layer structure to reverse bias, breakdown voltage and capacitance.

The project was motivated by the cost and chemical burden of fabricating trial wafers. A validated simulation allows layer widths and doping concentrations to be screened before manufacture, reducing the number of fabrication iterations.

## Device specification

The target specification for the APD is:

| Parameter | Requirement | Condition |
| --- | --- | --- |
| Wavelength | 1550 nm | — |
| Breakdown voltage | 20 V to 60 V | — |
| Responsivity | > 0.65 A/W | M = 1 |
| Dark current | < 60 nA | M = 1 |
| Capacitance | < 0.3 pF | M = 10 |
| Excess noise factor | < 4 | M = 10 |

The final layer structure is:

| Layer | Material | Width | Doping |
| --- | --- | --- | --- |
| 1 | InAlAs P+ contact | 0.20 µm | 5.0 × 10^18 cm^-3 |
| 2 | InGaAs absorption | 1.50 µm | 3.0 × 10^15 cm^-3 |
| 3 | InAlAs charge | 0.10 µm | 3.0 × 10^17 cm^-3 |
| 4 | InAlAs multiplication | 0.75 µm | 2.0 × 10^15 cm^-3 |
| 5 | InAlAs N+ contact | 0.20 µm | −5.0 × 10^18 cm^-3 |

[image: APD layer stack](/project-images/avalanche/cover.webp)

## Random path length model

The model treats impact ionisation as a stochastic process rather than relying on a local ionisation coefficient. The effective ionisation coefficients follow `alpha* = beta* = A exp[-(B/F)^C] cm^-1`, where `F` is the electric field and `A`, `B` and `C` are material constants. The effective deadspace is `de* = Eth / (qF)`, the minimum distance a carrier must travel before ionisation is possible.

The probability of ionisation is zero within the deadspace and decays exponentially beyond it. A random path length is drawn from the ionisation coefficient and deadspace, and carriers are tracked until they leave the multiplication region. Repeating the process over many trials gives the multiplication distribution and the excess noise factor `Fe = <Me^2> / <Me>^2`.

The C++ implementation reports electron- and hole-initiated multiplication, excess noise, the probability distribution of path lengths, responsivity, tunnelling current and capacitance. The output is written as CSV files for plotting and analysis.

## Layer widths

Breakdown voltage increases approximately linearly with the InAlAs multiplication width. Applying the 20–60 V specification gives a width between 0.3 µm and 1.25 µm. The upper value is a theoretical maximum because it does not include the voltage dropped across the other layers.

[image: Breakdown voltage versus InAlAs width](/project-images/avalanche/breakdown-width.webp)

The absorption width is set from responsivity. The absorption coefficient of InGaAs at 1550 nm is obtained from a third-order polynomial fit to published data, giving 6979.94 cm^-1. Quantum efficiency is `QE = 1 - exp(-alpha * wA)`, and responsivity is the product of quantum efficiency and the maximum theoretical responsivity `q * lambda / (h * c)`. The 0.65 A/W requirement gives an absorption width above 1.053 µm, and the design uses 1.5 µm.

[image: Responsivity versus InGaAs width](/project-images/avalanche/responsivity-width.webp)

The excess noise curve is noisy at low trial counts but remains approximately constant at 3.5 across the InAlAs widths considered, so it does not constrain the width further. A high-trial run at the final 0.75 µm width confirms the same value at a gain of 10.

[image: Excess noise factor versus gain](/project-images/avalanche/noise-gain.webp)

## Electric field and capacitance

The MATLAB solver models the field profile across the five layers. At breakdown the peak field is approximately 530 kV/cm, and the integral of the field profile gives a reverse breakdown voltage of 51 V.

[image: Electric-field profile at breakdown](/project-images/avalanche/electric-field.webp)

The same solver gives the depletion width in each layer as the reverse bias changes. The total capacitance is the series combination of the layer capacitances. The C–V curve falls slowly until the field punches through the charge layer at 34.8 V, then drops sharply to 0.14 pF as the absorption region depletes. A multiplication factor of 10 is reached at 46 V.

[image: Capacitance versus reverse bias](/project-images/avalanche/capacitance-voltage.webp)

## Results

| Parameter | Value | Condition |
| --- | --- | --- |
| Responsivity | 0.81 A/W | M = 1, 1550 nm |
| Breakdown voltage | 51 V | — |
| Excess noise factor | 3.5 | M = 10 |
| Capacitance | 0.14 pF | M = 10, 46 V |
| Dark current | 1.16 × 10^-17 nA | M = 1 |
| Dark current | 5.43 × 10^-5 nA | M = 10 |

The responsivity and excess noise results are consistent with published InGaAs/InAlAs APDs, including responsivities around 0.8 A/W for a 1.5 µm absorption layer and excess noise factors around 3.5 at a gain of 10.

## Challenges and solutions

### Non-local avalanche modelling

A local model cannot represent the distance a carrier must travel before it gains enough energy to ionise, which becomes significant at sub-micrometre multiplication widths. The RPL model adds an effective deadspace and draws a random path length for each carrier, preserving the history of the carrier and the non-local nature of impact ionisation. The ionisation, multiplication and noise routines reproduce the trends in Goh et al., with the comparison plots in Appendices A–C of the article.

### Computational cost and noisy sweeps

The breakdown-voltage and noise-versus-width sweeps require nested loops over width, voltage and trials. The noise-versus-width figure took close to 12 hours to produce and is visibly noisy at the trial count used. The final gain and noise calculation uses 100,000 trials per field step, and the high-trial result agrees with the mean inferred from the noisy width sweep. The runtime and manual CSV analysis still make further parameter exploration slow.

### Dark current below expectation

The modelled dark current is orders of magnitude lower than expected, even though the equation and inputs were checked by hand, in Excel and against published results. The calculation approximates dark current with tunnelling current alone, which is reasonable at high fields and small widths but omits generation–recombination and shunt currents. The article records the discrepancy rather than treating the dark-current result as validated.

## Validation and limitations

The ionisation, multiplication, noise and responsivity routines were checked against Goh et al. (2007); the comparison plots are in the article appendices. The responsivity, excess noise and capacitance trends are consistent with the published InGaAs/InAlAs devices cited in the article.

There is no fabricated device, measured dark current or experimental bandwidth result in this repository. The optional bandwidth calculation was not attempted because of the project timetable. The dark-current result remains the most significant unverified part of the model.

The full IEEE-style article is available in the [AVALANCHE repository](https://github.com/BenjaminJAnderson/AVALANCHE/blob/main/Article/IEEE_ela17ba.pdf).
