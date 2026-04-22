---
title: Regenerative Rankine Cycle
sidebar:
  order: 19
slug: s3/engineering-thermodynamics/regenerative-rankine-cycle
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.704Z
lastUpdatedOn: 2026-04-22T07:15:36.799Z
---

Regeneration improves the thermal efficiency of a Rankine cycle by preheating the feedwater before it enters the boiler.

### Components

- Turbine with extraction points
- Feedwater heaters (open or closed)
- Pumps
- Boiler and condenser

## Preheating

Aka. regeneration. The process of heating the feedwater before it enters the boiler. Small portion of steam is extracted from the turbine at a certain pressure and used to preheat the condensed feedwater.

Increases thermal efficiency. Reduces boiler load. Reduces fuel consumption. Increases average temperature of heat addition. Reduces condensation shock in boiler tubes. The cost of power generation decreases.

- Increases average temperature of heat addition.
- Reduces condensation shock in boiler tubes.

The steam consumption is slightly increased as a consequence of extracting some of the steam halfway through the expansion process. More pumps are required.

## Feedwater Heater

The heat exchanger used in this system. Aka. regenerator.

### Open Feedwater Heater

<figure>

![Open Feedwater Heater](./images/open-feedwater-heater.jpg)

<figcaption>

Image from [Engineer's Edge](https://www.engineersedge.com/thermodynamics/steady_flow_vapor_power_cycle_15976.htm).

</figcaption>
</figure>

Simply a mixing chamber. Steam and feedwater mix directly; outlet is a single saturated liquid stream.

Extracted steam and condensed feedwater must be in the same pressure. Feedwater is compressed to match the pressure. Then the mixture has to be pumped to the boiler pressure.

Easy and cost effective for construction. Good heat transfer while mixing. Produces perfectly mixed saturated liquid. Has better heat transfer performance.

Requires all streams at same pressure, which is good in theory. But has practical implications. Requires more pumps.

Mass/Energy Balance:

```math
y h_6 + (1-y) h_2 = h_3
```

Here:

- $y$: extraction fraction
- $1-y$: main flow fraction
- $h_6$: enthalpy of extracted steam
- $h_2$: feedwater entering heater
- $h_3$: saturated liquid exiting heater

### Closed Feedwater Heater

<figure>

![Closed Feedwater Heater](./images/closed-feedwater-heater.jpg)

<figcaption>

Image from [ResearchGate](https://www.researchgate.net/post/What_is_the_role_of_Mixing_Chamber_and_Steam_Trap_in_a_Closed_Feedwater_Heater_containing_Power_Plant).

</figcaption>
</figure>

Steam does not mix with feedwater; heat transfer occurs through metal surfaces. Pressure of extracted steam and condensed feedwater need not be the same. Preheated feedwater mixes with the condensed feedwater in the mixing chamber.

Assumptions:

- $h_3 = h_9$
- $T_3 = T_9$

$y$ (output at 7) can be found using the energy balance equation:

```math
h_8 (1-y) + h_7 y = h_9 (1-y) + h_3 y
```

Allows streams of different pressures. Flexible cycle layout. Requires less number of pumps, compared to OFWH.

More complex, expensive compared to open feedwater heaters. Less ideal heat transfer compared to OFWH.

Commonly used in power plants. In practice, about 6 or 7 feed water heaters are employed at different pressures.

## Multiple Feedwater Heaters

Large thermal plants use several extraction points to optimize feedwater temperature rise.
Heaters are arranged in increasing pressure order from condenser to boiler.

High number of heaters increase average temperature of heat additino, efficiency, cost and complexity; reduce boiler superheat demand.
