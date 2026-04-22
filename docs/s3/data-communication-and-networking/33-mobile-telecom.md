---
title: Mobile Telecommunications
sidebar:
  order: 33
slug: s3/data-communication-and-networking/mobile-telecom
prev: true
next: true
dateCreated: 2026-04-22T07:09:10.694Z
lastUpdatedOn: 2026-04-22T07:15:36.794Z
---

First implemented in 1970s. Multiple base stations are used to provide coverage over a large area. Each base station is responsible for a specific geographic area and communicates with mobile devices within its coverage area. The base stations are connected to a central network, which manages the communication between the base stations and the mobile devices. The central network also manages the routing of data packets between different base stations and the internet.

A large number of subscribers are served in a limited amount of spectrum using multiplexing techniques.

### Base Station

A fixed point of communication for mobile devices within a specific geographic area. Consists of radio transmitters and receivers, antennas, and supporting equipment for communicating with mobile phones and other devices.

The base station connects to the central network infrastructure, facilitating the transfer of voice, data, and signaling information between mobile devices and the broader telecommunications network.

### MTSO

Short for Mobile Telephone Switching Office. A central office that manages all communication between mobile devices and the broader telecommunications network. Every mobile telecommunications provider has a MTSO.

All base stations are connected to the MTSO.

## RF Channels

2 RF channels are used for communication between base stations and mobile devices.

- Forward or Downlink
- Reverse or Uplink

## Cellular Concept

A method of dividing a geographic area into smaller _cells_. Each cell is served by a base station. Crowded areas are broken into even smaller cells. This allows for efficient use of spectrum and improved coverage.

## Cellular System Operation

### Handoff

When a base station detects low signal strength from mobile, MSC requests surrounding base stations to measure signal from mobile. MSC determines best new base station and new channel and informs present base station.

Base station momentarily interrupts the voice channel and informs mobile of the new channel. Mobile tunes to new voice channel, and continues call. The momentarily interrupt is not noticeable to the user.

### Power Control

MTSO assigns transmit power levels to base station and mobile. As mobile moves, the power level is adjusted to maintain optimal signal strength. Signal strength is measured by the base station and the mobile.
