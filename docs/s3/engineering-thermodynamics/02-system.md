---
title: System
sidebar:
  order: 2
slug: s3/engineering-thermodynamics/system
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.703Z
lastUpdatedOn: 2026-04-22T07:15:36.798Z
---

Region of space, enclosed by a boundary.

- Open system: Mass, energy transfer is possible. Aka. control volume.
- Closed system: Energy transfer is possible, mass transfer is not possible
- Isolated system: Energy and mass transfer are not possible

### Boundary

Can be imaginary or physical. Boundary can be flexible.

### Surroundings

Everything outside the system.

## Properties

Aka. point functions. Explains the state of the system. Does not depend on the path taken to reach the state.

### Intrinsic properties

Do not depend on the size of the system.

Examples:

- temperature
- pressure
- specific heat capacity

### Extensive properties

Depend on the size of the system.

Examples:

- mass
- volume
- internal energy
- entropy
- enthalpy
- heat capacity

### Specific properties

Mass-normalized properties. Intrinsic properties. Prefixed with "specific". Lowercase alphabets are used to denote these.

Examples:

- specific heat capacity
- specific entropy
- specific enthalpy
- specific volume
- specific internal energy
- specific entropy
- specific enthalpy
- specific heat capacity

## State

An instance of the system. Defined by its properties.

If a system is free from gravitational, magnetic, surface tension effects, etc, only 2 independent properties are needed to define the state.

## Thermodynamic equilibrium

A state of a system that experiences no change.

Mechanical, phase, chemical, thermal equilibriums are required for thermodynamic equilibrium.

## Thermodynamic process

A change in the state of a system.

A thermodynamic cycle is series of thermodynamic processes that returns the system to its initial state.

### Isothermal process

Process in which the system temperature remains constant throughout.

### Adiabatic process

Process with no heat transfer.

### Isobaric process

System pressure remains constant.

### Isochoric process

System volume remains constant.

### Polytropic process

System pressure and volume are related by a power law.

### Quasi-equilibrium process

System is in equilibrium throughout the process.

### Reversible process

A thermodynamic process that can be reversed without any trace on the system and the surrounding. The process follows the same path, in the opposite direction. Ideal case.

Impossible in the environment because of:

- Turbulance
- Friction
- Heat losses
- Resistance
- Finite temperature difference

### Internally reversible process

A thermodynamic process that can be reversed without any trace on the system only. Weaker version of reverisble process.

### Irreversible process

A thermodynamic process that cannot be reversed without any trace on the surrounding.

### Isentropic process

Reversible adiaatic process. [Entropy](/engineering-thermodynamics/entropy) doesn't change.

### Steady flow process

A thermodynamic process in which, at any fixed point, they remain the same during the entire process.

## Point function

A property that depends only on the state of the system.

Examples:
- temperature
- pressure
- volume
- internal energy

## Path function

A property that depends on the specific path taken to reach a particular state.

Examples:
- Heat transfer
- Work transfer 

Any boundary transfer that depends on the process history is a path function.

## Thermodynamic Cycle

A series of thermodynamic processes that returns the system to its initial state.

:::note

Both reversible processes and thermodynamic cycles bring the system back to its initial state. Reversible process follow the same path in the opposite direction, while thermodynamic cycles may involve different paths to return to the initial state.

:::
